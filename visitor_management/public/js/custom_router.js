/* visitor_management/public/js/custom_router.js */

window.VMSCustomRouter = class VMSCustomRouter {
	constructor(on_change) {
		this.on_change = on_change;
		this._last = "";
		if (frappe.router && frappe.router.on) {
			frappe.router.on("change", () => this.handle_change());
		}
		this.handle_change();
	}

	parse() {
		const route = frappe.get_route() || [];
		if (!route.length || route[0] !== "app-shell") {
			return null;
		}
		const view = route[1] || "home";
		if (view === "form") {
			return { view, doctype: route[2], name: route[3] };
		}
		if (view === "new") {
			return { view, doctype: route[2] };
		}
		if (view === "list") {
			return { view, doctype: route[2] };
		}
		return { view };
	}

	navigate(parts) {
		frappe.set_route("app-shell", ...(parts || ["home"]));
	}

	handle_change() {
		const parsed = this.parse();
		if (!parsed) return;
		const key = JSON.stringify(parsed);
		if (key === this._last) return;
		this._last = key;
		if (this.on_change) {
			this.on_change(parsed);
		}
	}
};
