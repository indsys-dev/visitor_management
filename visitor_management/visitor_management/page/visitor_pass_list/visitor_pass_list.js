frappe.pages["visitor-pass-list"].on_page_load = function (wrapper) {
	new VisitorPassListPage(wrapper);
};

class VisitorPassListPage {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Visitor Pass List"),
			single_column: true,
		});
		this.make_layout();
		this.bind_events();
		this.refresh();
	}

	make_layout() {
		$(this.page.body).html(`
			<div class="vpl-wrap">
				<style>
					.vpl-wrap { --ink:#111827;--muted:#64748b;--line:#dbe5f2; font-family:"Manrope","Segoe UI",sans-serif; padding:14px; background:linear-gradient(160deg,#f8fbff,#eef4fb); border-radius:16px; }
					.vpl-toolbar { display:grid; grid-template-columns: 1.1fr .8fr .8fr .8fr .8fr auto; gap:8px; margin-bottom:12px; }
					.vpl-cards { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; margin-bottom:12px; }
					.vpl-card { background:#fff; border:1px solid var(--line); border-radius:12px; padding:10px; }
					.vpl-card .k { font-size:12px; color:var(--muted); }
					.vpl-card .v { font-size:22px; font-weight:800; color:var(--ink); }
					.vpl-table { background:#fff; border:1px solid var(--line); border-radius:12px; overflow:auto; }
					.vpl-table table { width:100%; min-width:860px; }
					.vpl-table th,.vpl-table td { padding:10px; border-bottom:1px solid #edf2f7; }
					.vpl-badge { font-size:11px; font-weight:700; padding:4px 8px; border-radius:999px; display:inline-block; }
					.s-Active { background:#dcfce7; color:#166534; }
					.s-Completed { background:#dbeafe; color:#1d4ed8; }
					.s-Expired { background:#fee2e2; color:#991b1b; }
					.s-Draft { background:#f1f5f9; color:#334155; }
					.s-Rejected { background:#fef3c7; color:#92400e; }
					@media (max-width:960px){ .vpl-toolbar{grid-template-columns:1fr 1fr;} .vpl-cards{grid-template-columns:1fr 1fr;} }
				</style>
				<div class="vpl-toolbar">
					<input class="form-control" data-f="search" placeholder="${__("Search by name or pass")}" />
					<select class="form-control" data-f="status"><option value="">${__("All Status")}</option><option>Active</option><option>Completed</option><option>Expired</option><option>Draft</option><option>Rejected</option></select>
					<input class="form-control" data-f="from" type="date" />
					<input class="form-control" data-f="to" type="date" />
					<div data-f="site"></div>
					<button class="btn btn-primary" data-a="refresh">${__("Refresh")}</button>
				</div>
				<div class="vpl-cards"></div>
				<div class="vpl-table"><table><thead><tr><th>${__("Pass")}</th><th>${__("Visitor")}</th><th>${__("Host")}</th><th>${__("Site")}</th><th>${__("Valid Until")}</th><th>${__("Status")}</th><th>${__("Action")}</th></tr></thead><tbody></tbody></table></div>
			</div>
		`);
		this.$root = $(this.page.body).find(".vpl-wrap");
		this.site_control = frappe.ui.form.make_control({
			parent: this.$root.find("[data-f='site']").get(0),
			df: { fieldtype: "Link", fieldname: "site", options: "Visitor Site", placeholder: "Site" },
			render_input: true,
		});
		this.site_control.refresh();
	}

	bind_events() {
		this.$root.find("[data-a='refresh']").on("click", () => this.refresh());
	}

	filters() {
		const status = this.$root.find("[data-f='status']").val();
		const from = this.$root.find("[data-f='from']").val();
		const to = this.$root.find("[data-f='to']").val();
		const site = this.site_control.get_value();
		const search = (this.$root.find("[data-f='search']").val() || "").trim().toLowerCase();
		const filters = {};
		if (status) filters.pass_status = status;
		if (site) filters.site = site;
		if (from && to) filters.valid_from = ["between", [from, to]];
		return { filters, search };
	}

	async refresh() {
		const { filters, search } = this.filters();
		const r = await frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Visitor Pass",
				filters,
				fields: ["name", "visitor_name", "host_employee", "site", "valid_until", "pass_status"],
				order_by: "modified desc",
				limit_page_length: 200,
			},
		});
		let rows = r.message || [];
		if (search) {
			rows = rows.filter((x) => `${x.name} ${x.visitor_name}`.toLowerCase().includes(search));
		}
		this.render_cards(rows);
		this.render_rows(rows);
	}

	render_cards(rows) {
		const count = (s) => rows.filter((r) => r.pass_status === s).length;
		const cards = [
			[__("Total"), rows.length],
			[__("Active"), count("Active")],
			[__("Completed"), count("Completed")],
			[__("Expired"), count("Expired")],
			[__("Rejected"), count("Rejected")],
		];
		this.$root.find(".vpl-cards").html(cards.map((c) => `<div class="vpl-card"><div class="k">${c[0]}</div><div class="v">${c[1]}</div></div>`).join(""));
	}

	render_rows(rows) {
		const html = rows.map((r) => `
			<tr>
				<td><strong>${frappe.utils.escape_html(r.name)}</strong></td>
				<td>${frappe.utils.escape_html(r.visitor_name || "")}</td>
				<td>${frappe.utils.escape_html(r.host_employee || "")}</td>
				<td>${frappe.utils.escape_html(r.site || "")}</td>
				<td>${frappe.datetime.str_to_user(r.valid_until || "")}</td>
				<td><span class="vpl-badge s-${frappe.utils.escape_html(r.pass_status || "Draft")}">${frappe.utils.escape_html(r.pass_status || "Draft")}</span></td>
				<td><a href="/app/visitor-pass/${r.name}" class="btn btn-xs btn-default">${__("Open")}</a></td>
			</tr>
		`).join("");
		this.$root.find("tbody").html(html || `<tr><td colspan="7" class="text-muted">${__("No records")}</td></tr>`);
	}
}
