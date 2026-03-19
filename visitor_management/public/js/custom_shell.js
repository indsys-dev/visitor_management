/* visitor_management/public/js/custom_shell.js */

window.VMSAppShell = class VMSAppShell {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.menu = this.get_menu();
		this.render_shell();
		this.router = new window.VMSCustomRouter((route) => this.on_route_change(route));
	}

	get_menu() {
		return [
			{ key: "home", label: __("Dashboard"), icon: "octicon octicon-home", route: ["home"] },
			{
				key: "masters",
				label: __("Masters"),
				icon: "octicon octicon-organization",
				children: [
					{ key: "employee", label: __("Employee"), route: ["list", "Employee"] },
					{ key: "department", label: __("Department"), route: ["list", "Department"] },
				],
			},
			{
				key: "transactions",
				label: __("Transactions"),
				icon: "octicon octicon-checklist",
				children: [
					{ key: "attendance", label: __("Attendance"), route: ["list", "Attendance"] },
					{ key: "requests", label: __("Requests"), route: ["list", "Visitor Pass Request"] },
				],
			},
			{ key: "reports", label: __("Reports"), icon: "octicon octicon-graph", external: "/app/vms-dashboard" },
		];
	}

	render_shell() {
		$(this.wrapper).html(`
			<div class="vms-shell">
				<header class="vms-topnav">
					<div class="vms-brand">Visitor Management</div>
					<div class="vms-search"><input placeholder="${__("Search pages, doctypes...")}" disabled></div>
					<div class="vms-user">${frappe.session.user}</div>
				</header>
				<div class="vms-main">
					<aside class="vms-sidebar collapsed" data-role="sidebar"></aside>
					<section class="vms-content" data-role="content"></section>
				</div>
			</div>
		`);
		this.$sidebar = $(this.wrapper).find("[data-role='sidebar']");
		this.$content = $(this.wrapper).find("[data-role='content']");
		this.render_sidebar();
	}

	render_sidebar(active = null) {
		const html = this.menu
			.map((item) => {
				if (item.children) {
					const children = item.children
						.map(
							(child) => `
							<div class="vms-subitem ${active === child.key ? "active" : ""}" data-route='${JSON.stringify(child.route)}'>
								${frappe.utils.escape_html(child.label)}
							</div>
						`
						)
						.join("");
					return `
						<div class="vms-menu-group">
							<div class="vms-item ${active === item.key ? "active" : ""}">
								<i class="${item.icon}"></i><span>${frappe.utils.escape_html(item.label)}</span>
							</div>
							<div class="vms-submenu">${children}</div>
						</div>
					`;
				}
				if (item.external) {
					return `<a class="vms-item" href="${item.external}"><i class="${item.icon}"></i><span>${frappe.utils.escape_html(item.label)}</span></a>`;
				}
				return `<div class="vms-item ${active === item.key ? "active" : ""}" data-route='${JSON.stringify(item.route)}'><i class="${item.icon}"></i><span>${frappe.utils.escape_html(item.label)}</span></div>`;
			})
			.join("");
		this.$sidebar.html(html);

		this.$sidebar.find("[data-route]").on("click", (e) => {
			const route = JSON.parse($(e.currentTarget).attr("data-route"));
			this.router.navigate(route);
		});
	}

	on_route_change(route) {
		if (!route) return;
		if (route.view === "home") {
			this.render_sidebar("home");
			this.render_home();
			return;
		}
		if (route.view === "list") {
			this.render_sidebar((route.doctype || "").toLowerCase());
			this.render_list(route.doctype);
			return;
		}
		if (route.view === "form" || route.view === "new") {
			this.render_form(route.doctype, route.name || null);
			return;
		}
		this.render_home();
	}

	render_home() {
		this.$content.html(`
			<div class="vms-home">
				<h2>${__("Custom Desk Shell")}</h2>
				<p>${__("This shell keeps DocType storage and backend rules intact while providing a custom UX.")}</p>
				<div class="vms-home-cards">
					<div class="vms-home-card" data-route='["list","Employee"]'><h4>${__("Open Employee")}</h4><p>${__("Example master DocType rendering")}</p></div>
					<div class="vms-home-card" data-route='["new","Visitor Pass Request"]'><h4>${__("New Request")}</h4><p>${__("Create a Visitor Pass Request using custom renderer")}</p></div>
					<div class="vms-home-card" data-route='["list","Visitor Pass"]'><h4>${__("Pass List")}</h4><p>${__("Track statuses from custom list panel")}</p></div>
				</div>
			</div>
		`);
		this.$content.find("[data-route]").on("click", (e) => {
			this.router.navigate(JSON.parse($(e.currentTarget).attr("data-route")));
		});
	}

	async render_list(doctype) {
		this.$content.html(`<div class="vms-loading">${__("Loading list...")}</div>`);
		try {
			const meta_res = await frappe.call({ method: "visitor_management.api.shell.get_doctype_meta", args: { doctype } });
			const meta = meta_res.message;
			const base_fields = ["name", "modified"];
			const list_fields = (meta.fields || [])
				.filter((f) => f.in_list_view && f.fieldname && !["Table"].includes(f.fieldtype))
				.slice(0, 4)
				.map((f) => f.fieldname);
			const fields = Array.from(new Set([...base_fields, ...list_fields]));
			const res = await frappe.call({
				method: "visitor_management.api.shell.list_documents",
				args: {
					doctype,
					fields,
					limit_page_length: 50,
				},
			});
			const rows = res.message || [];
			const heads = fields.map((f) => `<th>${frappe.utils.escape_html(f)}</th>`).join("");
			const body = rows
				.map((row) => {
					const cols = fields.map((f) => `<td>${frappe.utils.escape_html(String(row[f] || ""))}</td>`).join("");
					return `<tr data-name="${frappe.utils.escape_html(row.name)}">${cols}</tr>`;
				})
				.join("");
			this.$content.html(`
				<div class="vms-list-head">
					<h3>${frappe.utils.escape_html(doctype)}</h3>
					<button class="btn btn-primary" data-new>${__("New")}</button>
				</div>
				<div class="vms-list-table"><table class="table table-bordered"><thead><tr>${heads}</tr></thead><tbody>${body || `<tr><td colspan="${fields.length}">${__("No records found")}</td></tr>`}</tbody></table></div>
			`);
			this.$content.find("[data-new]").on("click", () => this.router.navigate(["new", doctype]));
			this.$content.find("tbody tr[data-name]").on("click", (e) => {
				const name = $(e.currentTarget).attr("data-name");
				this.router.navigate(["form", doctype, name]);
			});
		} catch (e) {
			this.$content.html(`<div class="vms-error">${__("Failed to load list")}</div>`);
		}
	}

	render_form(doctype, name = null) {
		this.$content.html(`<div class="vms-loading">${__("Loading form...")}</div>`);
		const renderer = new window.VMSCustomFormRenderer({
			container: this.$content,
			on_saved: (doc) => {
				if (doc && doc.name) {
					this.router.navigate(["form", doctype, doc.name]);
				}
			},
		});
		renderer.load(doctype, name);
	}
};
