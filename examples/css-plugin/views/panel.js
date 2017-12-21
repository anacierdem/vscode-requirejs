define(['css!./panel'], function (stylesheet) {
	function Panel () {
		const el = document.createElement('div');

		el.classList.add('panel');
		this.el = el;
	}

	return Panel;
});
