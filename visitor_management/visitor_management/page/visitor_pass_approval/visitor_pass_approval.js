frappe.pages["visitor-pass-approval"].on_page_load = function (wrapper) {
	new VisitorPassApprovalPage(wrapper);
};

class VisitorPassApprovalPage {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Visitor Pass Approval"),
			single_column: true,
		});
		this.make_layout();
		this.bind_events();
		this.refresh();
		setInterval(() => this.refresh(), 45000);
	}

	make_layout() {
		$(this.page.body).html(`
			<div class="vpa-wrap">
				<style>
					.vpa-wrap{--line:#d7e2ef;--ink:#0f172a;--muted:#64748b;--brand:#b45309;font-family:"Manrope","Segoe UI",sans-serif;padding:14px;background:linear-gradient(120deg,#fff7ed,#fffbeb 45%,#fff);border-radius:16px;}
					.vpa-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;}
					.vpa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
					.vpa-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(120,53,15,.06);}
					.vpa-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;}
					.vpa-name{font-weight:800;color:var(--ink);} .vpa-sub{font-size:12px;color:var(--muted);} .vpa-b{font-size:11px;font-weight:700;padding:4px 7px;border-radius:999px;background:#fef3c7;color:#92400e;}
					.vpa-meta{margin-top:8px;font-size:13px;color:#334155;display:grid;grid-template-columns:1fr 1fr;gap:6px;}
					.vpa-actions{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;}
					@media (max-width: 900px){.vpa-grid{grid-template-columns:1fr;}}
				</style>
				<div class="vpa-head">
					<div>
						<h3 style="margin:0;font-weight:900;color:#7c2d12;">${__("Approval Queue")}</h3>
						<div class="text-muted">${__("Review pending requests, run OTP, and complete host approval.")}</div>
					</div>
					<button class="btn btn-primary" data-a="refresh">${__("Refresh Queue")}</button>
				</div>
				<div class="vpa-grid"></div>
			</div>
		`);
		this.$root = $(this.page.body).find(".vpa-wrap");
	}

	bind_events() {
		this.$root.find("[data-a='refresh']").on("click", () => this.refresh());
	}

	async refresh() {
		const r = await frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Visitor Pass Request",
				filters: [["status", "in", ["Pending OTP", "Pending Approval"]]],
				fields: ["name", "visitor_name", "visitor_email", "host_employee", "site", "status", "expected_visit_date", "expected_visit_time"],
				order_by: "modified desc",
				limit_page_length: 100,
			},
		});
		this.render(r.message || []);
	}

	render(rows) {
		const html = rows.map((r) => `
			<div class="vpa-card" data-name="${r.name}">
				<div class="vpa-top">
					<div><div class="vpa-name">${frappe.utils.escape_html(r.visitor_name || r.name)}</div><div class="vpa-sub">${frappe.utils.escape_html(r.name)}</div></div>
					<span class="vpa-b">${frappe.utils.escape_html(r.status)}</span>
				</div>
				<div class="vpa-meta">
					<div><strong>${__("Email")}</strong><br>${frappe.utils.escape_html(r.visitor_email || "-")}</div>
					<div><strong>${__("Host")}</strong><br>${frappe.utils.escape_html(r.host_employee || "-")}</div>
					<div><strong>${__("Visit")}</strong><br>${frappe.utils.escape_html(r.expected_visit_date || "")} ${frappe.utils.escape_html(r.expected_visit_time || "")}</div>
					<div><strong>${__("Site")}</strong><br>${frappe.utils.escape_html(r.site || "-")}</div>
				</div>
				<div class="vpa-actions">
					<button class="btn btn-xs btn-default" data-x="otp">${__("Send OTP")}</button>
					<button class="btn btn-xs btn-warning" data-x="verify">${__("Verify OTP")}</button>
					<button class="btn btn-xs btn-success" data-x="approve">${__("Approve")}</button>
					<button class="btn btn-xs btn-danger" data-x="reject">${__("Reject")}</button>
					<a class="btn btn-xs btn-default" href="/app/visitor-pass-request/${r.name}">${__("Open")}</a>
				</div>
			</div>
		`).join("");
		this.$root.find(".vpa-grid").html(html || `<div class="text-muted">${__("No pending requests")}</div>`);
		this.bind_row_actions();
	}

	bind_row_actions() {
		this.$root.find("[data-x='otp']").on("click", async (e) => {
			const name = this.row_name(e);
			await frappe.call({ method: "visitor_management.api.otp.send_otp", args: { request_name: name } });
			frappe.show_alert({ message: __("OTP sent"), indicator: "green" });
			this.refresh();
		});
		this.$root.find("[data-x='verify']").on("click", async (e) => {
			const name = this.row_name(e);
			const d = new frappe.ui.Dialog({
				title: __("Verify OTP"),
				fields: [{ fieldname: "otp", fieldtype: "Data", label: __("OTP"), reqd: 1 }],
				primary_action_label: __("Verify"),
				primary_action: async (values) => {
					const r = await frappe.call({ method: "visitor_management.api.otp.verify_otp", args: { request_name: name, otp_input: values.otp } });
					frappe.show_alert({ message: r.message.message || __("Done"), indicator: r.message.verified ? "green" : "orange" });
					d.hide();
					this.refresh();
				},
			});
			d.show();
		});
		this.$root.find("[data-x='approve']").on("click", async (e) => {
			const name = this.row_name(e);
			await frappe.call({ method: "visitor_management.api.otp.approve_pass", args: { request_name: name, action: "approve" } });
			frappe.show_alert({ message: __("Request approved"), indicator: "green" });
			this.refresh();
		});
		this.$root.find("[data-x='reject']").on("click", async (e) => {
			const name = this.row_name(e);
			await frappe.call({ method: "visitor_management.api.otp.approve_pass", args: { request_name: name, action: "reject" } });
			frappe.show_alert({ message: __("Request rejected"), indicator: "red" });
			this.refresh();
		});
	}

	row_name(e) {
		return $(e.currentTarget).closest(".vpa-card").attr("data-name");
	}
}
