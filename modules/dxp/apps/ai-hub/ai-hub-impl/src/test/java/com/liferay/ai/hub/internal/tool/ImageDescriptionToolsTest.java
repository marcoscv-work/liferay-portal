/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.ai.hub.internal.tool;

import com.liferay.document.library.kernel.service.DLAppLocalService;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.repository.model.FileEntry;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.test.rule.LiferayUnitTestRule;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

import dev.langchain4j.data.image.Image;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.Content;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.invocation.InvocationParameters;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;

import java.io.ByteArrayInputStream;
import java.io.Serializable;

import java.net.URI;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;

import org.mockito.Mockito;

/**
 * @author Marcos Castro
 */
public class ImageDescriptionToolsTest {

	@ClassRule
	@Rule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		_imageDescriptionTools = new ImageDescriptionTools(
			_chatModel, _dlAppLocalService);

		_mockModelResponse(_VALID_MODEL_RESPONSE);
	}

	@Test
	public void testDescribeImageAppendsTheContextToTheInstructions() {
		_describeImage(null, _PNG_DATA_URI, "a product page");

		TextContent textContent = _getTextContent();

		String text = textContent.text();

		Assert.assertTrue(
			text, text.endsWith("Surrounding page context: a product page"));
	}

	@Test
	public void testDescribeImageDropsInvalidAltTextOptions() {
		_mockModelResponse(
			StringBundler.concat(
				"{\"altText\": [\"\", \"", "a".repeat(126),
				"\", \"one\", \"two\", \"three\", \"four\"], \"decorative\": ",
				"false, \"rationale\": \"\"}"));

		JSONObject jsonObject = _createJSONObject(
			_describeImage(null, _PNG_DATA_URI, null));

		Assert.assertEquals(
			"[\"one\",\"two\",\"three\"]",
			String.valueOf(jsonObject.getJSONArray("altText")));
	}

	@Test
	public void testDescribeImageNormalizesADecorativeImage() {
		_mockModelResponse(
			"{\"altText\": [\"a stray option\"], \"decorative\": true, " +
				"\"rationale\": \"The image is a background ornament.\"}");

		JSONObject jsonObject = _createJSONObject(
			_describeImage(null, _PNG_DATA_URI, null));

		Assert.assertEquals(
			"[]", String.valueOf(jsonObject.getJSONArray("altText")));
		Assert.assertTrue(jsonObject.getBoolean("decorative"));
		Assert.assertEquals(
			"The image is a background ornament.",
			jsonObject.getString("rationale"));
	}

	@Test
	public void testDescribeImageRelaysTheModelError() {
		_mockModelResponse("{\"error\": \"The image is unreadable\"}");

		JSONObject jsonObject = _createJSONObject(
			_describeImage(null, _PNG_DATA_URI, null));

		Assert.assertEquals(
			"The image is unreadable", jsonObject.getString("error"));
	}

	@Test
	public void testDescribeImageReturnsAnErrorWhenTheImageIsMissing() {
		Assert.assertTrue(
			_createJSONObject(
				_describeImage(null, null, null)
			).has(
				"error"
			));
	}

	@Test
	public void testDescribeImageReturnsAnErrorWhenTheModelAnswerIsInvalid() {
		_mockModelResponse("not json");

		Assert.assertTrue(
			_createJSONObject(
				_describeImage(null, _PNG_DATA_URI, null)
			).has(
				"error"
			));

		_mockModelResponse("{\"decorative\": false}");

		Assert.assertTrue(
			_createJSONObject(
				_describeImage(null, _PNG_DATA_URI, null)
			).has(
				"error"
			));

		_mockModelResponse(
			"{\"altText\": [], \"decorative\": false, \"rationale\": \"\"}");

		Assert.assertTrue(
			_createJSONObject(
				_describeImage(null, _PNG_DATA_URI, null)
			).has(
				"error"
			));
	}

	@Test
	public void testDescribeImageWithADataURI() {
		JSONObject jsonObject = _createJSONObject(
			_describeImage(null, _PNG_DATA_URI, null));

		Assert.assertEquals(
			"[\"Reset password form\",\"Password reset form\"]",
			String.valueOf(jsonObject.getJSONArray("altText")));
		Assert.assertFalse(jsonObject.getBoolean("decorative"));
		Assert.assertEquals(
			"The image is a functional screenshot.",
			jsonObject.getString("rationale"));

		Image image = _getImage();

		Assert.assertEquals("iVBORw0KGgo=", image.base64Data());
		Assert.assertEquals("image/png", image.mimeType());
	}

	@Test
	public void testDescribeImageWithAFileEntryExternalReferenceCode()
		throws Exception {

		FileEntry fileEntry = Mockito.mock(FileEntry.class);

		Mockito.when(
			fileEntry.getContentStream()
		).thenReturn(
			new ByteArrayInputStream(new byte[] {1, 2, 3})
		);

		Mockito.when(
			fileEntry.getMimeType()
		).thenReturn(
			"image/jpeg"
		);

		Mockito.when(
			_dlAppLocalService.getFileEntryByExternalReferenceCode(
				"IMAGE_ERC", 42L)
		).thenReturn(
			fileEntry
		);

		JSONObject jsonObject = _createJSONObject(
			_describeImage(
				"IMAGE_ERC", null, null,
				HashMapBuilder.<String, Serializable>put(
					"groupId", "42"
				).build()));

		Assert.assertFalse(jsonObject.has("error"));

		Image image = _getImage();

		Assert.assertEquals("AQID", image.base64Data());
		Assert.assertEquals("image/jpeg", image.mimeType());
	}

	@Test
	public void testDescribeImageWithAURL() {
		JSONObject jsonObject = _createJSONObject(
			_describeImage(null, "https://example.com/image.png", null));

		Assert.assertFalse(jsonObject.has("error"));

		Image image = _getImage();

		Assert.assertEquals(
			URI.create("https://example.com/image.png"), image.url());
	}

	@Test
	public void testDescribeImageWithTheWorkflowContextReferences() {
		JSONObject jsonObject = _createJSONObject(
			_describeImage(
				null, null, null,
				HashMapBuilder.<String, Serializable>put(
					"context", "a product page"
				).put(
					"imageURL", _PNG_DATA_URI
				).build()));

		Assert.assertFalse(jsonObject.has("error"));

		TextContent textContent = _getTextContent();

		String text = textContent.text();

		Assert.assertTrue(
			text, text.endsWith("Surrounding page context: a product page"));
	}

	private JSONObject _createJSONObject(String json) {
		try {
			return JSONFactoryUtil.createJSONObject(json);
		}
		catch (Exception exception) {
			throw new RuntimeException(exception);
		}
	}

	private String _describeImage(
		String fileEntryExternalReferenceCode, String imageURL,
		String context) {

		return _describeImage(
			fileEntryExternalReferenceCode, imageURL, context, Map.of());
	}

	private String _describeImage(
		String fileEntryExternalReferenceCode, String imageURL, String context,
		Map<String, Serializable> workflowContext) {

		return _imageDescriptionTools.describeImage(
			InvocationParameters.from(
				Map.of(
					"executionContext",
					new ExecutionContext(
						null, workflowContext, new ServiceContext()))),
			fileEntryExternalReferenceCode, imageURL, context);
	}

	private Image _getImage() {
		ImageContent imageContent = _getImageContent();

		return imageContent.image();
	}

	private ImageContent _getImageContent() {
		UserMessage userMessage = _getUserMessage();

		List<Content> contents = userMessage.contents();

		Assert.assertEquals(contents.toString(), 2, contents.size());

		return (ImageContent)contents.get(1);
	}

	private TextContent _getTextContent() {
		UserMessage userMessage = _getUserMessage();

		List<Content> contents = userMessage.contents();

		return (TextContent)contents.get(0);
	}

	private UserMessage _getUserMessage() {
		ChatRequest chatRequest = _chatRequestAtomicReference.get();

		Assert.assertNotNull(chatRequest);

		List<ChatMessage> chatMessages = chatRequest.messages();

		return (UserMessage)chatMessages.get(chatMessages.size() - 1);
	}

	private void _mockModelResponse(String text) {
		Mockito.when(
			_chatModel.chat(Mockito.any(ChatRequest.class))
		).thenAnswer(
			invocation -> {
				_chatRequestAtomicReference.set(invocation.getArgument(0));

				return ChatResponse.builder(
				).aiMessage(
					AiMessage.from(text)
				).build();
			}
		);
	}

	private static final String _PNG_DATA_URI =
		"data:image/png;base64,iVBORw0KGgo=";

	private static final String _VALID_MODEL_RESPONSE = StringBundler.concat(
		"{\"altText\": [\"Reset password form\", \"Password reset form\"], ",
		"\"decorative\": false, \"rationale\": \"The image is a functional ",
		"screenshot.\"}");

	private final ChatModel _chatModel = Mockito.mock(ChatModel.class);
	private final AtomicReference<ChatRequest> _chatRequestAtomicReference =
		new AtomicReference<>();
	private final DLAppLocalService _dlAppLocalService = Mockito.mock(
		DLAppLocalService.class);
	private ImageDescriptionTools _imageDescriptionTools;

}