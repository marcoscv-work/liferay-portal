const autogenerateCheckbox = fragmentElement.querySelector(
	'#altBatchAutogenerate'
);
const contextInput = fragmentElement.querySelector('#altBatchContext');
const dropzone = fragmentElement.querySelector('#altBatchDropzone');
const fileInput = fragmentElement.querySelector('#altBatchInput');
const resultsList = fragmentElement.querySelector('#altBatchResults');
const selectButton = fragmentElement.querySelector('#altBatchSelect');

let processing = false;

const queue = [];

function setStatus(element, html) {
	element.querySelector('.alt-batch-status').innerHTML = html;
}

function renderResult(element, altText, errorMessage) {
	if (errorMessage) {
		setStatus(
			element,
			'<span class="label label-danger">Error</span> ' + errorMessage
		);
	}
	else if (altText) {
		setStatus(
			element,
			'<span class="label label-success">Informative</span> ' +
				'<code>alt="' + altText.replaceAll('"', '&quot;') + '"</code>'
		);
	}
	else {
		setStatus(
			element,
			'<span class="label label-info">Decorative</span> ' +
				'<code>alt=""</code>'
		);
	}
}

function processNext() {
	if (processing || !queue.length) {
		return;
	}

	processing = true;

	const item = queue.shift();

	setStatus(
		item.element,
		'<span aria-hidden="true" class="loading-animation loading-animation-sm"></span> Analyzing…'
	);

	const eventSource = new EventSource(
		'/o/ai-hub/v1.0/agent-instances/subscribe'
	);

	let finished = false;
	let posted = false;

	const finish = (altText, errorMessage) => {
		if (finished) {
			return;
		}

		finished = true;

		eventSource.close();

		clearTimeout(timeoutId);

		renderResult(item.element, altText, errorMessage);

		processing = false;

		processNext();
	};

	const timeoutId = setTimeout(() => {
		finish(null, 'No response from the agent.');
	}, 120000);

	eventSource.addEventListener('Subscribe', (event) => {
		if (posted) {
			return;
		}

		posted = true;

		Liferay.Util.fetch('/o/ai-hub/v1.0/agent-instances', {
			body: JSON.stringify({
				agentDefinitionExternalReferenceCode: 'L_IMAGE_DESCRIPTOR',
				context: {
					context: contextInput.value || '',
					image: item.dataURI,
				},
				sseEventSinkKey: event.data,
			}),
			headers: {'Content-Type': 'application/json'},
			method: 'POST',
		}).then((response) => {
			if (!response.ok) {
				finish(null, 'HTTP ' + response.status);
			}
		});
	});

	eventSource.addEventListener('L_IMAGE_DESCRIPTOR', (event) => {
		let altText = '';

		try {
			altText = (JSON.parse(event.data).data || '').trim();
		}
		catch (error) {
			altText = '';
		}

		finish(altText, null);
	});
}

function addFiles(files) {
	const autogenerate = autogenerateCheckbox.checked;

	Array.from(files)
		.filter((file) => file.type.startsWith('image/'))
		.forEach((file) => {
			const element = document.createElement('li');

			element.className = 'list-group-item';
			element.innerHTML =
				'<div class="autofit-row autofit-row-center">' +
				'<div class="autofit-col"><img alt="" class="alt-batch-thumbnail" src="' +
				URL.createObjectURL(file) +
				'" /></div>' +
				'<div class="ml-3 autofit-col autofit-col-expand">' +
				'<div class="text-weight-semi-bold">' + file.name + '</div>' +
				'<div class="alt-batch-status text-secondary">' +
				(autogenerate ? 'Queued…' : 'Uploaded') +
				'</div>' +
				'</div></div>';

			resultsList.appendChild(element);

			resultsList.style.display = 'block';

			if (!autogenerate) {
				return;
			}

			const reader = new FileReader();

			reader.onload = () => {
				queue.push({dataURI: reader.result, element});

				processNext();
			};

			reader.readAsDataURL(file);
		});
}

selectButton.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('click', (event) => {
	if (event.target === selectButton) {
		return;
	}

	fileInput.click();
});

fileInput.addEventListener('change', () => {
	addFiles(fileInput.files);

	fileInput.value = '';
});

['dragenter', 'dragover'].forEach((type) => {
	dropzone.addEventListener(type, (event) => {
		event.preventDefault();

		dropzone.classList.add('dragover');
	});
});

dropzone.addEventListener('dragleave', () => {
	dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (event) => {
	event.preventDefault();

	dropzone.classList.remove('dragover');

	addFiles(event.dataTransfer.files);
});
