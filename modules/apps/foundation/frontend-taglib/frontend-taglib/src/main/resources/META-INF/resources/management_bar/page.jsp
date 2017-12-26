<%--
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
--%>

<%@ include file="/management_bar/init.jsp" %>

<div class="management-bar-container" data-qa-id="managementBar" id="<%= namespace %>managementBarContainerId">
	<div class="management-bar management-bar-light navbar navbar-expand-md">
		<div class="container">
			<ul class="navbar-nav">
				<c:if test="<%= includeCheckBox %>">
					<li class="nav-item">
						<div class="custom-control custom-checkbox">
							<label>
								<aui:input cssClass="select-all-checkboxes" data-qa-id="selectAllCheckbox" disabled="<%= disabled %>" inline="<%= true %>" label="" name="<%= RowChecker.ALL_ROW_IDS %>" title="select-all" type="checkbox" />
							</label>
						</div>
					</li>
				</c:if>

				<c:if test="<%= Validator.isNotNull(filters) %>">
					<li class="dropdown nav-item">
						<a aria-expanded="false" aria-haspopup="true" class="dropdown-toggle nav-link nav-link-monospaced navbar-breakpoint-d-none" data-toggle="dropdown" href="#1" role="button">
							<aui:icon image="icon-filter" markupView="lexicon" />
						</a>

						<a class="dropdown-toggle nav-link navbar-breakpoint-d-block" data-toggle="collapse" href="#<%= namespace %>managementBarCollapse">
							<span class="navbar-text-truncate">
								<liferay-ui:message key="filter-order" />
							</span>

							<aui:icon image="caret-double-l" markupView="lexicon" />
						</a>
					</li>
				</c:if>
			</ul>

			<c:if test="<%= Validator.isNotNull(filters) %>">
				<ul class="navbar-nav">
					<%= filters %>
				</ul>
			</c:if>

			<div class="navbar-form navbar-form-autofit navbar-overlay navbar-overlay-sm-down">
				<div class="container">
					<form role="search">
						<div class="input-group input-group-inset">
							<div class="input-group-input">
								<input class="form-control" placeholder="Search for..." type="text">
							</div>
							<span class="input-group-inset-item">
								<button class="btn btn-unstyled navbar-breakpoint-d-none" type="button">
									<aui:icon image="icon-times" markupView="lexicon" />
								</button>

								<button class="btn btn-unstyled navbar-breakpoint-d-block" type="button">
									<aui:icon image="icon-search" markupView="lexicon" />
								</button>
							</span>
						</div>
					</form>
				</div>
			</div>

			<c:if test="<%= Validator.isNotNull(buttons) %>">
				<ul class="navbar-nav">
					<%= buttons %>
				</ul>
			</c:if>
		</div>
	</div>

	<c:if test="<%= Validator.isNotNull(actionButtons) || includeCheckBox %>">
		<div class="management-bar management-bar-primary navbar navbar-expand-md" id="<%= namespace %>actionButtons">
			<div class="container">
				<ul class="navbar-nav">
					<c:if test="<%= includeCheckBox %>">
						<li class="checkbox">
							<div class="custom-control custom-checkbox">
								<label>
									<aui:input cssClass="select-all-checkboxes" data-qa-id="selectAllCheckbox" disabled="<%= disabled %>" inline="<%= true %>" label="" name="actionsCheckBox" title="select-all" type="checkbox" />
								</label>
							</div>
						</li>
					</c:if>

					<li>
						<span class="management-bar-text">
							<span class="selected-items-count"></span> <liferay-ui:message key="items-selected" />
						</span>
					</li>
				</ul>

				<ul class="navbar-nav">
					<c:if test="<%= Validator.isNotNull(actionButtons) %>">
						<%= actionButtons %>
					</c:if>
				</ul>
			</div>
		</div>
	</c:if>
</div>

<c:if test="<%= Validator.isNotNull(actionButtons) || includeCheckBox %>">
	<aui:script use="liferay-management-bar">
		var managementBar = new Liferay.ManagementBar(
			{
				namespace: '<%= namespace %>',
				searchContainerId: '<%= namespace + searchContainerId %>',
				secondaryBar: '#actionButtons'
			}
		);

		var clearManagementBarHandles = function(event) {
			if (event.portletId === '<%= portletDisplay.getRootPortletId() %>') {
				managementBar.destroy();

				Liferay.detach('destroyPortlet', clearManagementBarHandles);
			}
		};

		Liferay.on('destroyPortlet', clearManagementBarHandles);
	</aui:script>
</c:if>