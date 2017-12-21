require(['views/panel'], function (Panel) {
	const panel = new Panel();
	document.body.appendChild(panel.el);
});
