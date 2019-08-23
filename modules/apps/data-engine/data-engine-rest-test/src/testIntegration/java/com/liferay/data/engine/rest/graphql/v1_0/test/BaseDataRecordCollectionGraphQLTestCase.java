/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

package com.liferay.data.engine.rest.graphql.v1_0.test;

import com.liferay.data.engine.rest.client.dto.v1_0.DataRecordCollection;
import com.liferay.data.engine.rest.client.http.HttpInvoker;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.service.CompanyLocalServiceUtil;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.test.log.CaptureAppender;
import com.liferay.portal.test.log.Log4JLoggerTestUtil;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.annotation.Generated;

import org.apache.log4j.Level;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;

/**
 * @author Jeyvison Nascimento
 * @generated
 */
@Generated("")
public abstract class BaseDataRecordCollectionGraphQLTestCase {

	@ClassRule
	@Rule
	public static final LiferayIntegrationTestRule liferayIntegrationTestRule =
		new LiferayIntegrationTestRule();

	@Before
	public void setUp() throws Exception {
		testGroup = GroupTestUtil.addGroup();

		testCompany = CompanyLocalServiceUtil.getCompany(
			testGroup.getCompanyId());
	}

	@After
	public void tearDown() throws Exception {
		GroupTestUtil.deleteGroup(testGroup);
	}

	@Test
	public void testDeleteDataRecordCollection() throws Exception {
		DataRecordCollection dataRecordCollection =
			testDataRecordCollection_addDataRecordCollection();

		GraphQLField graphQLField = new GraphQLField(
			"mutation",
			new GraphQLField(
				"deleteDataRecordCollection",
				new HashMap<String, Object>() {
					{
						put(
							"dataRecordCollectionId",
							dataRecordCollection.getId());
					}
				}));

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(
			invoke(graphQLField.toString()));

		JSONObject dataJSONObject = jsonObject.getJSONObject("data");

		Assert.assertTrue(
			dataJSONObject.getBoolean("deleteDataRecordCollection"));

		try (CaptureAppender captureAppender =
				Log4JLoggerTestUtil.configureLog4JLogger(
					"graphql.execution.SimpleDataFetcherExceptionHandler",
					Level.WARN)) {

			graphQLField = new GraphQLField(
				"query",
				new GraphQLField(
					"dataRecordCollection",
					new HashMap<String, Object>() {
						{
							put(
								"dataRecordCollectionId",
								dataRecordCollection.getId());
						}
					},
					new GraphQLField("id")));

			jsonObject = JSONFactoryUtil.createJSONObject(
				invoke(graphQLField.toString()));

			JSONArray errorsJSONArray = jsonObject.getJSONArray("errors");

			Assert.assertTrue(errorsJSONArray.length() > 0);
		}
	}

	@Test
	public void testGetDataRecordCollection() throws Exception {
		DataRecordCollection dataRecordCollection =
			testDataRecordCollection_addDataRecordCollection();

		List<GraphQLField> graphQLFields = getGraphQLFields();

		GraphQLField graphQLField = new GraphQLField(
			"query",
			new GraphQLField(
				"dataRecordCollection",
				new HashMap<String, Object>() {
					{
						put(
							"dataRecordCollectionId",
							dataRecordCollection.getId());
					}
				},
				graphQLFields.toArray(new GraphQLField[0])));

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(
			invoke(graphQLField.toString()));

		JSONObject dataJSONObject = jsonObject.getJSONObject("data");

		Assert.assertTrue(
			equals(
				dataRecordCollection,
				dataJSONObject.getJSONObject("dataRecordCollection")));
	}

	@Test
	public void testGetSiteDataRecordCollectionsPage() throws Exception {
		List<GraphQLField> graphQLFields = new ArrayList<>();

		List<GraphQLField> itemsGraphQLFields = getGraphQLFields();

		graphQLFields.add(
			new GraphQLField(
				"items", itemsGraphQLFields.toArray(new GraphQLField[0])));

		graphQLFields.add(new GraphQLField("page"));
		graphQLFields.add(new GraphQLField("totalCount"));

		GraphQLField graphQLField = new GraphQLField(
			"query",
			new GraphQLField(
				"dataRecordCollections",
				new HashMap<String, Object>() {
					{
						put("page", 1);
						put("pageSize", 2);
						put("siteId", testGroup.getGroupId());
					}
				},
				graphQLFields.toArray(new GraphQLField[0])));

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(
			invoke(graphQLField.toString()));

		JSONObject dataJSONObject = jsonObject.getJSONObject("data");

		JSONObject dataRecordCollectionsJSONObject =
			dataJSONObject.getJSONObject("dataRecordCollections");

		Assert.assertEquals(
			0, dataRecordCollectionsJSONObject.get("totalCount"));

		DataRecordCollection dataRecordCollection1 =
			testDataRecordCollection_addDataRecordCollection();
		DataRecordCollection dataRecordCollection2 =
			testDataRecordCollection_addDataRecordCollection();

		jsonObject = JSONFactoryUtil.createJSONObject(
			invoke(graphQLField.toString()));

		dataJSONObject = jsonObject.getJSONObject("data");

		dataRecordCollectionsJSONObject = dataJSONObject.getJSONObject(
			"dataRecordCollections");

		Assert.assertEquals(
			2, dataRecordCollectionsJSONObject.get("totalCount"));

		assertEqualsIgnoringOrder(
			Arrays.asList(dataRecordCollection1, dataRecordCollection2),
			dataRecordCollectionsJSONObject.getJSONArray("items"));
	}

	@Test
	public void testGetSiteDataRecordCollection() throws Exception {
		DataRecordCollection dataRecordCollection =
			testDataRecordCollection_addDataRecordCollection();

		List<GraphQLField> graphQLFields = getGraphQLFields();

		GraphQLField graphQLField = new GraphQLField(
			"query",
			new GraphQLField(
				"dataRecordCollection",
				new HashMap<String, Object>() {
					{
						put(
							"dataRecordCollectionId",
							dataRecordCollection.getId());
					}
				},
				graphQLFields.toArray(new GraphQLField[0])));

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(
			invoke(graphQLField.toString()));

		JSONObject dataJSONObject = jsonObject.getJSONObject("data");

		Assert.assertTrue(
			equals(
				dataRecordCollection,
				dataJSONObject.getJSONObject("dataRecordCollection")));
	}

	protected void assertEqualsIgnoringOrder(
		List<DataRecordCollection> dataRecordCollections, JSONArray jsonArray) {

		for (DataRecordCollection dataRecordCollection :
				dataRecordCollections) {

			boolean contains = false;

			for (Object object : jsonArray) {
				if (equals(dataRecordCollection, (JSONObject)object)) {
					contains = true;

					break;
				}
			}

			Assert.assertTrue(
				jsonArray + " does not contain " + dataRecordCollection,
				contains);
		}
	}

	protected boolean equals(
		DataRecordCollection dataRecordCollection, JSONObject jsonObject) {

		for (String fieldName : getAdditionalAssertFieldNames()) {
			if (Objects.equals("dataDefinitionId", fieldName)) {
				if (!Objects.equals(
						dataRecordCollection.getDataDefinitionId(),
						(Long)jsonObject.getLong("dataDefinitionId"))) {

					return false;
				}

				continue;
			}

			if (Objects.equals("dataRecordCollectionKey", fieldName)) {
				if (!Objects.equals(
						dataRecordCollection.getDataRecordCollectionKey(),
						(String)jsonObject.getString(
							"dataRecordCollectionKey"))) {

					return false;
				}

				continue;
			}

			if (Objects.equals("id", fieldName)) {
				if (!Objects.equals(
						dataRecordCollection.getId(),
						(Long)jsonObject.getLong("id"))) {

					return false;
				}

				continue;
			}

			if (Objects.equals("siteId", fieldName)) {
				if (!Objects.equals(
						dataRecordCollection.getSiteId(),
						(Long)jsonObject.getLong("siteId"))) {

					return false;
				}

				continue;
			}

			throw new IllegalArgumentException(
				"Invalid field name " + fieldName);
		}

		return true;
	}

	protected String[] getAdditionalAssertFieldNames() {
		return new String[0];
	}

	protected List<GraphQLField> getGraphQLFields() {
		List<GraphQLField> graphQLFields = new ArrayList<>();

		graphQLFields.add(new GraphQLField("id"));

		for (String additionalAssertFieldName :
				getAdditionalAssertFieldNames()) {

			graphQLFields.add(new GraphQLField(additionalAssertFieldName));
		}

		return graphQLFields;
	}

	protected String invoke(String query) throws Exception {
		HttpInvoker httpInvoker = HttpInvoker.newHttpInvoker();

		httpInvoker.body(
			JSONUtil.put(
				"query", query
			).toString(),
			"application/json");
		httpInvoker.httpMethod(HttpInvoker.HttpMethod.POST);
		httpInvoker.path("http://localhost:8080/o/graphql");
		httpInvoker.userNameAndPassword("test@liferay.com:test");

		HttpInvoker.HttpResponse httpResponse = httpInvoker.invoke();

		return httpResponse.getContent();
	}

	protected DataRecordCollection randomDataRecordCollection()
		throws Exception {

		return new DataRecordCollection() {
			{
				dataDefinitionId = RandomTestUtil.randomLong();
				dataRecordCollectionKey = RandomTestUtil.randomString();
				id = RandomTestUtil.randomLong();
				siteId = testGroup.getGroupId();
			}
		};
	}

	protected DataRecordCollection
			testDataRecordCollection_addDataRecordCollection()
		throws Exception {

		throw new UnsupportedOperationException(
			"This method needs to be implemented");
	}

	protected Company testCompany;
	protected Group testGroup;

	protected class GraphQLField {

		public GraphQLField(String key, GraphQLField... graphQLFields) {
			this(key, new HashMap<>(), graphQLFields);
		}

		public GraphQLField(
			String key, Map<String, Object> parameterMap,
			GraphQLField... graphQLFields) {

			_key = key;
			_parameterMap = parameterMap;
			_graphQLFields = graphQLFields;
		}

		@Override
		public String toString() {
			StringBuilder sb = new StringBuilder(_key);

			if (!_parameterMap.isEmpty()) {
				sb.append("(");

				for (Map.Entry<String, Object> entry :
						_parameterMap.entrySet()) {

					sb.append(entry.getKey());
					sb.append(":");
					sb.append(entry.getValue());
					sb.append(",");
				}

				sb.append(")");
			}

			if (_graphQLFields.length > 0) {
				sb.append("{");

				for (GraphQLField graphQLField : _graphQLFields) {
					sb.append(graphQLField.toString());
					sb.append(",");
				}

				sb.append("}");
			}

			return sb.toString();
		}

		private final GraphQLField[] _graphQLFields;
		private final String _key;
		private final Map<String, Object> _parameterMap;

	}

}