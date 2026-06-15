#!/bin/zsh

# Watch live traffic between the Liferay JVM and api.openai.com.
# While the Image Descriptor agent runs, the image upload and the
# streamed model response show up here in real time.

PID=$(pgrep -f 'org.apache.catalina.startup.Bootstrap' | head -1)
IPS=$(dig +short api.openai.com | tr '\n' '|' | sed 's/|$//')

echo "Liferay Tomcat PID: $PID"
echo "api.openai.com:     ${IPS//|/, }"
echo
echo "Esperando actividad del agente..."
echo

PREV_IN=-1
PREV_OUT=-1
ACTIVE=0
IDLE=0

while true; do
	read -r CUR_IN CUR_OUT <<< "$(nettop -x -L 1 -p "$PID" -J bytes_in,bytes_out 2>/dev/null | grep -E "$IPS" | awk -F, '{i += $2; o += $3} END {print i + 0, o + 0}')"

	if [[ $PREV_IN -ge 0 ]]; then
		DIN=$((CUR_IN - PREV_IN))
		DOUT=$((CUR_OUT - PREV_OUT))

		[[ $DIN -lt 0 ]] && DIN=0
		[[ $DOUT -lt 0 ]] && DOUT=0

		if [[ $DOUT -gt 2048 || $DIN -gt 512 ]]; then
			if [[ $ACTIVE -eq 0 ]]; then
				echo "$(date '+%H:%M:%S')  ⚡ AGENTE EJECUTANDO — Liferay → api.openai.com (gpt-4o-mini)"
				ACTIVE=1
			fi

			printf '%s             ↑ %7.1f KB imagen/prompt   ↓ %7.1f KB respuesta\n' "$(date '+%H:%M:%S')" $((DOUT / 1024.0)) $((DIN / 1024.0))

			IDLE=0
		elif [[ $ACTIVE -eq 1 ]]; then
			IDLE=$((IDLE + 1))

			if [[ $IDLE -ge 3 ]]; then
				echo "$(date '+%H:%M:%S')  ✓ respuesta del modelo completada"
				echo
				ACTIVE=0
				IDLE=0
			fi
		fi
	fi

	PREV_IN=$CUR_IN
	PREV_OUT=$CUR_OUT

	sleep 1
done
