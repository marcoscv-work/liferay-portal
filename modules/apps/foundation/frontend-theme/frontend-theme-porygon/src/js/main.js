(function() {
	AUI().ready(
		'liferay-sign-in-modal',
		function(A) {
			var signIn = A.one('.sign-in > a');

			if (signIn && signIn.getData('redirect') !== 'true') {
				signIn.plug(Liferay.SignInModal);
			}
		}
	);

	require(
		'metal-dom/src/dom',
		function(domModule) {
			var dom = domModule.default;

			var topSearch = function() {
				var instance = this;

				this.searchInput = dom.toElement('#banner .search-input');

				this.searchIcon = dom.toElement('#banner .btn-search');

				this.search = dom.toElement('#search');

				dom.addClasses(this.searchInput, 'hidden');

				if (this.searchInput && this.searchIcon) {
					dom.on(
						this.searchIcon,
						'click',
						function(event) {
							if (dom.hasClass(instance.searchInput, 'hidden')) {
								instance.showInputSearch();
							}
							else {
								instance.hideInputSearch();
							}
						}
					);

					dom.on(
						this.searchInput,
						'keydown',
						function(event) {
							if (event.keyCode === 27) {
								instance.hideInputSearch();
							}
						}
					);

					dom.on(
						this.searchInput,
						'blur',
						function(event) {
							if (!instance.searchInput.value || instance.searchInput.value === '') {
								dom.removeClasses(instance.searchInput, 'hidden');
								instance.hideInputSearch();
							}
						}
					);
				}
			};

			topSearch.prototype = {
				hideInputSearch: function() {
					dom.removeClasses(this.searchIcon, 'open');
					dom.removeClasses(document.body, 'search-opened');
					dom.removeClasses(this.search, 'focus');
					dom.addClasses(this.searchInput, 'hidden');
				},

				showInputSearch: function() {
					dom.addClasses(this.searchIcon, 'open');
					dom.addClasses(document.body, 'search-opened');
					dom.addClasses(this.search, 'focus');
					dom.removeClasses(this.searchInput, 'hidden');
				}
			};

			new topSearch();
		}
	);
})();
