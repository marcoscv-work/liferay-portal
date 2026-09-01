/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.ai.hub.internal.tool;

import com.liferay.document.library.kernel.service.DLAppLocalService;
import com.liferay.petra.string.CharPool;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.repository.model.FileEntry;
import com.liferay.portal.kernel.security.auth.CompanyInheritableThreadLocalCallable;
import com.liferay.portal.kernel.util.Base64;
import com.liferay.portal.kernel.util.FileUtil;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.invocation.InvocationParameters;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;

import java.io.Serializable;

import java.util.Map;
import java.util.concurrent.Callable;

/**
 * @author Marcos Castro
 */
public class ImageDescriptionTools {

	public ImageDescriptionTools(
		ChatModel chatModel, DLAppLocalService dlAppLocalService) {

		_describeImageCallable = new CompanyInheritableThreadLocalCallable<>(
			() -> {
				ImageContent imageContent = _createImageContent(
					dlAppLocalService);

				if (imageContent == null) {
					return _getErrorJSONObjectString(
						"The image could not be resolved from the given file " +
							"entry external reference code or URL");
				}

				ChatResponse chatResponse = chatModel.chat(
					ChatRequest.builder(
					).messages(
						UserMessage.from(
							TextContent.from(_getInstructions()), imageContent)
					).build());

				return _getImageDescriptionJSONObjectString(
					chatResponse.aiMessage());
			});
	}

	@Tool(
		"Describe an image and propose WCAG 2.2 Success Criterion 1.1.1 " +
			"alternative text options for it. The result is a JSON object " +
				"with a decorative flag, up to 3 altText options, and a " +
					"rationale."
	)
	public String describeImage(
		InvocationParameters invocationParameters,
		@P(
			required = false,
			value = "External reference code of the image file entry, if any"
		)
		String fileEntryExternalReferenceCode,
		@P(required = false, value = "URL of the image, if any") String
			imageURL,
		@P(
			required = false,
			value = "Surrounding page or document context, may be empty"
		)
		String context) {

		_context = context;
		_fileEntryExternalReferenceCode = fileEntryExternalReferenceCode;
		_imageURL = imageURL;
		_invocationParameters = invocationParameters;

		try {
			return _describeImageCallable.call();
		}
		catch (Exception exception) {
			_log.error("Unable to describe the image", exception);

			return _getErrorJSONObjectString("The image could not be read");
		}
	}

	private ImageContent _createImageContent(
			DLAppLocalService dlAppLocalService)
		throws Exception {

		Map<String, Serializable> workflowContext = _getWorkflowContext();

		String fileEntryExternalReferenceCode = _getValue(
			_fileEntryExternalReferenceCode,
			"imageFileEntryExternalReferenceCode", workflowContext);

		if (Validator.isNotNull(fileEntryExternalReferenceCode)) {
			FileEntry fileEntry =
				dlAppLocalService.getFileEntryByExternalReferenceCode(
					fileEntryExternalReferenceCode,
					GetterUtil.getLong(workflowContext.get("groupId")));

			return ImageContent.from(
				Base64.encode(FileUtil.getBytes(fileEntry.getContentStream())),
				fileEntry.getMimeType());
		}

		String imageURL = _getValue(_imageURL, "imageURL", workflowContext);

		if (Validator.isNull(imageURL)) {
			return null;
		}

		imageURL = imageURL.trim();

		if (!StringUtil.startsWith(imageURL, "data:")) {
			if (imageURL.matches("\\S+")) {
				return ImageContent.from(imageURL);
			}

			return null;
		}

		int index = imageURL.indexOf(";base64,");

		if (index == -1) {
			return ImageContent.from(imageURL);
		}

		String mimeType = imageURL.substring(5, index);

		int semicolonIndex = mimeType.indexOf(CharPool.SEMICOLON);

		if (semicolonIndex != -1) {
			mimeType = mimeType.substring(0, semicolonIndex);
		}

		if (Validator.isNull(mimeType)) {
			return null;
		}

		String base64Data = imageURL.substring(index + 8);

		return ImageContent.from(base64Data.replaceAll("\\s", ""), mimeType);
	}

	private String _getErrorJSONObjectString(String message) {
		JSONObject jsonObject = JSONUtil.put("error", message);

		return jsonObject.toString();
	}

	private String _getImageDescriptionJSONObjectString(AiMessage aiMessage) {
		JSONObject jsonObject = null;

		try {
			jsonObject = JSONFactoryUtil.createJSONObject(aiMessage.text());
		}
		catch (Exception exception) {
			if (_log.isDebugEnabled()) {
				_log.debug(exception);
			}

			return _getErrorJSONObjectString(
				"The model returned an unexpected response");
		}

		if (jsonObject.has("error")) {
			return _getErrorJSONObjectString(jsonObject.getString("error"));
		}

		if (!jsonObject.has("decorative") || !jsonObject.has("altText")) {
			return _getErrorJSONObjectString(
				"The model returned an unexpected response");
		}

		boolean decorative = jsonObject.getBoolean("decorative");

		JSONArray altTextJSONArray = JSONFactoryUtil.createJSONArray();

		if (!decorative) {
			JSONArray jsonArray = jsonObject.getJSONArray("altText");

			for (int i = 0; i < jsonArray.length(); i++) {
				String altText = jsonArray.getString(i);

				if (Validator.isNull(altText) ||
					(altText.length() > _MAX_ALT_TEXT_LENGTH)) {

					continue;
				}

				altTextJSONArray.put(altText);

				if (altTextJSONArray.length() >= _MAX_ALT_TEXT_OPTIONS) {
					break;
				}
			}

			if (altTextJSONArray.length() == 0) {
				return _getErrorJSONObjectString(
					"The model returned no valid alternative text option");
			}
		}

		return JSONUtil.put(
			"altText", altTextJSONArray
		).put(
			"decorative", decorative
		).put(
			"rationale", jsonObject.getString("rationale")
		).toString();
	}

	private String _getInstructions() {
		StringBundler sb = new StringBundler(12);

		sb.append("You are a web accessibility specialist applying WCAG 2.2 ");
		sb.append("Success Criterion 1.1.1 (Non-text Content). Propose the ");
		sb.append("alternative text for the attached image. Describe the ");
		sb.append("function and the relevant information the image conveys ");
		sb.append("in its context, not its visual appearance. Provide 1 to 3 ");
		sb.append("distinct options of at most 125 characters each, best ");
		sb.append("first, never starting with phrases like \"image of\", ");
		sb.append("\"picture of\", or \"photo of\". Return ONLY a JSON ");
		sb.append("object shaped {\"altText\": [\"...\"], \"decorative\": ");
		sb.append("false, \"rationale\": \"...\"}. If the image is purely ");
		sb.append("decorative, return {\"altText\": [], \"decorative\": ");
		sb.append("true, \"rationale\": \"...\"}.");

		String context = _getValue(_context, "context", _getWorkflowContext());

		if (Validator.isNull(context)) {
			return sb.toString();
		}

		return StringBundler.concat(
			sb.toString(), " Surrounding page context: ", context);
	}

	private String _getValue(
		String value, String workflowContextKey,
		Map<String, Serializable> workflowContext) {

		if (Validator.isNotNull(value)) {
			return value;
		}

		if (workflowContext == null) {
			return null;
		}

		return GetterUtil.getString(workflowContext.get(workflowContextKey));
	}

	private Map<String, Serializable> _getWorkflowContext() {
		ExecutionContext executionContext = _invocationParameters.get(
			"executionContext");

		if (executionContext == null) {
			return null;
		}

		return executionContext.getWorkflowContext();
	}

	private static final int _MAX_ALT_TEXT_LENGTH = 125;

	private static final int _MAX_ALT_TEXT_OPTIONS = 3;

	private static final Log _log = LogFactoryUtil.getLog(
		ImageDescriptionTools.class);

	private String _context;
	private final Callable<String> _describeImageCallable;
	private String _fileEntryExternalReferenceCode;
	private String _imageURL;
	private InvocationParameters _invocationParameters;

}