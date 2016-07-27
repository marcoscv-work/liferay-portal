AUI().ready(
	'liferay-sign-in-modal',
	function(A) {
		var BODY = A.getBody();

		var signIn = A.one('.sign-in > a');

		if (signIn && signIn.getData('redirect') !== 'true') {
			signIn.plug(Liferay.SignInModal);
		}

		var searchIcon = A.one('#banner .btn-search');

		var searchInput = A.one('#banner .search-input');

		if (searchIcon && searchInput) {
			searchIcon.on(
				'click',
				function(event) {
					this.toggleClass('open');

					BODY.toggleClass('search-opened', event.currentTarget.hasClass('open'));

					searchInput.focus();
				}
			);
		}
	}
);