const OLLAMA_BASE_URL = 'http://192.168.40.33:11434';
const OLLAMA_MODEL = 'gemma4:e4b';

const SYSTEM_PROMPT =
	'You are an accessibility agent. Propose an alt text for the attached ' +
	'image following WCAG 2.2 SC 1.1.1: concise, conveys the function and ' +
	'information of the image, no "image of" prefix. If the image is purely ' +
	'decorative, return a completely empty response with zero characters.';

const autogenerateCheckbox = fragmentElement.querySelector(
	'#localAIAutogenerate'
);
const contextInput = fragmentElement.querySelector('#localAIContext');
const dropzone = fragmentElement.querySelector('#localAIDropzone');
const fileInput = fragmentElement.querySelector('#localAIInput');
const resultsList = fragmentElement.querySelector('#localAIResults');
const selectButton = fragmentElement.querySelector('#localAISelect');

let processing = false;

const queue = [];

function setStatus(element, html) {
	element.querySelector('.local-ai-status').innerHTML = html;
}

function renderResult(element, altText, errorMessage, seconds) {
	const time = seconds
		? ' <span class="text-secondary">(' + seconds + 's)</span>'
		: '';

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
				'<code>alt="' + altText.replaceAll('"', '&quot;') + '"</code>' +
				time
		);
	}
	else {
		setStatus(
			element,
			'<span class="label label-info">Decorative</span> ' +
				'<code>alt=""</code>' + time
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
		'<span aria-hidden="true" class="loading-animation loading-animation-sm"></span> Analyzing locally…'
	);

	const startTime = Date.now();

	fetch(OLLAMA_BASE_URL + '/api/chat', {
		body: JSON.stringify({
			messages: [
				{content: SYSTEM_PROMPT, role: 'system'},
				{
					content:
						'Propose the alternative text for the attached image. ' +
						'Surrounding page context (may be empty): ' +
						(contextInput.value || ''),
					images: [item.base64],
					role: 'user',
				},
			],
			model: OLLAMA_MODEL,
			stream: false,
		}),
		headers: {'Content-Type': 'application/json'},
		method: 'POST',
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}

			return response.json();
		})
		.then((data) => {
			renderResult(
				item.element,
				((data.message || {}).content || '').trim(),
				null,
				Math.round((Date.now() - startTime) / 1000)
			);
		})
		.catch((error) => {
			renderResult(item.element, null, error.message);
		})
		.finally(() => {
			processing = false;

			processNext();
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
				'<div class="autofit-col"><img alt="" class="local-ai-thumbnail" src="' +
				URL.createObjectURL(file) +
				'" /></div>' +
				'<div class="ml-3 autofit-col autofit-col-expand">' +
				'<div class="text-weight-semi-bold local-ai-name"></div>' +
				'<div class="local-ai-status text-secondary">' +
				(autogenerate ? 'Queued…' : 'Uploaded') +
				'</div>' +
				'</div></div>';

			element.querySelector('.local-ai-name').textContent = file.name;

			resultsList.appendChild(element);

			resultsList.style.display = 'block';

			if (!autogenerate) {
				return;
			}

			const reader = new FileReader();

			reader.onload = () => {
				queue.push({
					base64: reader.result.split(',')[1],
					element,
				});

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
