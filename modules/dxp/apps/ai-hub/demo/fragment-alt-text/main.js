const button = fragmentElement.querySelector('#altGenerateButton');
const contextInput = fragmentElement.querySelector('#altImageContext');
const fileInput = fragmentElement.querySelector('#altImageFile');
const preview = fragmentElement.querySelector('#altImagePreview');
const previewWrapper = fragmentElement.querySelector('#altImagePreviewWrapper');
const result = fragmentElement.querySelector('#altResult');
const resultAlert = fragmentElement.querySelector('#altResultAlert');
const resultCode = fragmentElement.querySelector('#altResultCode');
const resultContent = fragmentElement.querySelector('#altResultContent');
const resultLoading = fragmentElement.querySelector('#altResultLoading');

let dataURI = null;

fileInput.addEventListener('change', () => {
	const file = fileInput.files[0];

	if (!file) {
		button.disabled = true;

		return;
	}

	const reader = new FileReader();

	reader.onload = () => {
		dataURI = reader.result;
		preview.src = dataURI;
		previewWrapper.style.display = 'block';
		button.disabled = false;
	};

	reader.readAsDataURL(file);
});

button.addEventListener('click', () => {
	if (!dataURI) {
		return;
	}

	button.disabled = true;
	result.style.display = 'block';
	resultContent.style.display = 'none';
	resultLoading.style.display = 'block';

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

		resultLoading.style.display = 'none';
		resultContent.style.display = 'block';

		if (errorMessage) {
			resultAlert.className = 'alert alert-danger';
			resultAlert.textContent = errorMessage;
			resultCode.textContent = '';
		}
		else if (altText) {
			resultAlert.className = 'alert alert-success';
			resultAlert.textContent =
				'Informative image. Proposed alt: ' + altText;
		}
		else {
			resultAlert.className = 'alert alert-info';
			resultAlert.textContent =
				'Decorative image: it conveys no relevant information, so the alt is left empty.';
		}

		if (!errorMessage) {
			resultCode.textContent =
				'<img src="' +
				(fileInput.files[0] ? fileInput.files[0].name : 'image.png') +
				'" alt="' + altText + '" />';
		}

		button.disabled = false;
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
					image: dataURI,
				},
				sseEventSinkKey: event.data,
			}),
			headers: {'Content-Type': 'application/json'},
			method: 'POST',
		}).then((response) => {
			if (!response.ok) {
				finish(null, 'Unable to invoke the agent (HTTP ' + response.status + ').');
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
});
