<style>
	.provisioning-link {
		bottom: 0;
		left: 0;
		right: 0;
		top: 0;
		display: none;
	}

	.provisioning-item:hover .provisioning-link,
	.provisioning-item:focus .provisioning-link,
	.provisioning-item.active .provisioning-link {
		background-color: rgba(255, 255, 255, 0.8);
		display: flex;
	}
</style>

<#assign count = 0
/>

<#if entries?has_content>
	<#assign
		commerceContext = request.getAttribute("COMMERCE_CONTEXT")

		commerceChannelId = commerceContext.getCommerceChannelId()

		commerceAccount = commerceContext.getCommerceAccount()

		commerceAccountId = commerceAccount.getCommerceAccountId()
	/>

	<div class="container">
		<div class="provisioning-list row">
			<#list entries as curCPCatalogEntry>
				<#assign
					image = curCPCatalogEntry.getDefaultImageFileUrl()

					friendlyURL = cpContentHelper.getFriendlyURL(curCPCatalogEntry, themeDisplay)

					name = curCPCatalogEntry.getName()

					itemID = curCPCatalogEntry.CPDefinitionId

					cpSkus = curCPCatalogEntry.getCPSkus()

					cpSku = cpSkus?first

					cpInstanceId = cpSku.getCPInstanceId()
				/>

				<div class="col-md-4 mb-5">
					<div class="mb-3 position-relative provisioning-item" tabindex="0">
						<div class="aspect-ratio aspect-ratio-16-to-9">
							<img alt="thumbnail" class="aspect-ratio-item aspect-ratio-item-center-middle aspect-ratio-item-fluid" src="${htmlUtil.escapeAttribute(image)}">
						</div>

						<div class="component-link">
							<span class="align-items-center flex-column justify-content-center position-absolute provisioning-link">
								<div class="mb-1">
									<a class="btn btn-secondary" href="${htmlUtil.escapeHREF(friendlyURL)}">
										Details
									</a>
								</div>

								<div class="mt-1">
									<a class="btn btn-primary" href="javascript:openItem(${itemID},${cpInstanceId},${commerceChannelId},${commerceAccountId})">
										Select
									</a>
								</div>
							</span>
						</div>
					</div>

					<strong>${htmlUtil.escape(name)}</strong>
				</div>

				<#assign cosunt = count + 1 />

				<#if count gte 3>
					</div>

					<div class="row">

					<#assign count = 0 />
				</#if>
			</#list>
		</div>
	</div>
<#else>
	<div class="alert alert-info">
		<@liferay_ui["message"] key="no-products-were-found" />
	</div>
</#if>

<script>
	var items = document.getElementsByClassName("provisioning-item");

	var copySaved = "";

	function addActiveClass(event) {
		event.target.classList.add("active");
	}

	for (var i = 0, len = items.length; i < len; i++) {
		items[i].addEventListener("focus", addActiveClass);
	}

	function copySiteName(event) {
		var letterNumber = /^[0-9a-zA-Z]+$/;

		copyFrom = document.getElementById("sn");
		copyTo = document.getElementById("lod");
		snGroup = document.getElementById("snGroup");
		createSite = document.getElementById("createSite");

		if (copyFrom.value.match(letterNumber)) {
			copyTo.value = copyFrom.value.toLowerCase() + ".liferay.online"
			copySaved = copyFrom.value;
		} else if (copyFrom.value === "") {
			copySaved = "";
			copyTo.value = "liferay.online"
		} else {
			copyFrom.value = copySaved;
		}

		if (copyFrom.value.length < 5) {
			snGroup.classList.add("has-error");
			createSite.disabled = true;
		} else {
			snGroup.classList.remove("has-error");
			createSite.disabled = false;
		}
	}

	function openItem(itemID, cpInstanceId, commerceChannelId, commerceAccountId) {
		Liferay.Util.openModal({
			id: 'selectStarterkit',
			title: 'Select your starterkit',
			bodyHTML: `<div class="form-group" id="snGroup">
					<label for="sn">Site name
						<small> (more than 4 characters)</small>
					</label>

					<input class="form-control" id="sn" maxlength="30" onKeyUp="copySiteName()" placeholder="Site name" type="text" />
				</div>

				<div class="form-group">
					<label for="lod">Liferay Online Domain</label>

					<input class="form-control" readonly id="lod" placeholder="liferay.online" type="text" />
				</div>

				<p class="alert alert-feedback alert-info">You can later manage custom domains from site settings.</p>
			`,
			size: 'md',
			buttons: [
				{
					displayType: 'secondary',
					label: Liferay.Language.get('Cancel'),
					onClick: function () {
						Liferay.Util.getOpener().Liferay.fire(
							'closeModal',
							{
								id: 'selectStarterkit',
							}
						);
					},
				},
				{
					label: 'Select',
					id: 'createSite',
					onClick: function () {
						Liferay.Util.getOpener().Liferay.fire(
							'closeModal',
							{
								id: 'selectStarterkit',
							}
						);

						var domainName = document.getElementById("sn").value;

						createOrder(cpInstanceId, commerceChannelId, commerceAccountId, domainName);
					},
				},
			],
			onOpen: function () {
				document.getElementById("createSite").disabled = true;
			},
		});
	}
</script>