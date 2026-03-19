/* visitor_management/visitor_management/page/app_shell/app_shell.js */

frappe.pages["app-shell"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("VMS App Shell"),
		single_column: true,
	});

	frappe.require(
		[
			"/assets/visitor_management/css/custom_shell.css",
			"/assets/visitor_management/js/custom_router.js",
			"/assets/visitor_management/js/custom_form_renderer.js",
			"/assets/visitor_management/js/custom_shell.js",
		],
		() => {
			new window.VMSAppShell(wrapper);
		}
	);
};
