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
		<div class="vpl-root">
		<style>
			.vpl-root{font-family:"Inter","Segoe UI",sans-serif;background:#f0f4f8;min-height:100vh;padding:20px}
			.vpl-root *{box-sizing:border-box;margin:0;padding:0}
			.vpl-toolbar{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr auto auto;gap:8px;margin-bottom:14px}
			.vpl-toolbar input,.vpl-toolbar select{padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#0f172a}
			.vpl-toolbar input:focus,.vpl-toolbar select:focus{border-color:#2563eb}
			.vpl-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
			.vpl-stat{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
			.vpl-stat .k{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748b}
			.vpl-stat .v{font-size:22px;font-weight:800;color:#0f172a;margin-top:2px}
			.vpl-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)}
			.vpl-table{width:100%;border-collapse:collapse;min-width:900px}
			.vpl-table th{padding:11px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-align:left}
			.vpl-table td{padding:11px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9}
			.vpl-table tr:last-child td{border-bottom:none}
			.vpl-table tr:hover td{background:#f8fafc}
			.badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;display:inline-block}
			.b-Active{background:#dcfce7;color:#166534}
			.b-Completed{background:#dbeafe;color:#1d4ed8}
			.b-Expired{background:#fee2e2;color:#991b1b}
			.b-Draft{background:#f1f5f9;color:#334155}
			.b-Rejected{background:#fef3c7;color:#92400e}
			.b-Pending{background:#fef9c3;color:#854d0e}
			.vpl-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
			.vpl-btn-ghost{background:#fff;color:#2563eb;border:1px solid #cbd5e1;}.vpl-btn-ghost:hover{background:#eff6ff;color:#1d4ed8;}
			.vpl-btn-refresh{background:#1e3a6e;color:#fff}.vpl-btn-refresh:hover{background:#274d94}
			.vpl-btn-open{background:#1e3a6e;color:#fff;border:none;}.vpl-btn-open:hover{background:#274d94;}
			.vpl-empty{text-align:center;padding:40px;color:#64748b;font-size:14px}
			.vpl-reject-reason{font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;padding:3px 7px;margin-top:3px;display:inline-block;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
			@media(max-width:900px){.vpl-toolbar{grid-template-columns:1fr 1fr}.vpl-stats{grid-template-columns:1fr 1fr}}
		</style>

		<div class="vpl-toolbar">
			<input data-f="search" placeholder="${__("Search by name, pass or host")}">
			<select data-f="status">
				<option value="">${__("All Status")}</option>
				<option value="Active">Active</option>
				<option value="Completed">Completed</option>
				<option value="Expired">Expired</option>
				<option value="Rejected">Rejected</option>
				<option value="Draft">Draft</option>
			</select>
			<input data-f="from" type="date">
			<input data-f="to" type="date">
			<button class="vpl-btn vpl-btn-refresh" data-a="refresh">↺ ${__("Refresh")}</button>
			<button class="vpl-btn vpl-btn-ghost" data-a="clear">✖ Clear</button>
		</div>

		<div class="vpl-stats">
			<div class="vpl-stat"><div class="k">Total</div><div class="v" id="st-total">—</div></div>
			<div class="vpl-stat"><div class="k">Active</div><div class="v" id="st-active" style="color:#166534">—</div></div>
			<div class="vpl-stat"><div class="k">Completed</div><div class="v" id="st-completed" style="color:#1d4ed8">—</div></div>
			<div class="vpl-stat"><div class="k">Expired</div><div class="v" id="st-expired" style="color:#991b1b">—</div></div>
			<div class="vpl-stat"><div class="k">Rejected</div><div class="v" id="st-rejected" style="color:#92400e">—</div></div>
		</div>

		<div class="vpl-table-wrap">
			<div style="overflow-x:auto">
				<table class="vpl-table">
					<thead>
						<tr>
							<th>${__("Pass / Request")}</th>
							<th>${__("Visitor")}</th>
							<th>${__("Host")}</th>
							<th>${__("Visit Date")}</th>
							<th>${__("Valid Until")}</th>
							<th>${__("Status")}</th>
							<th>${__("Action")}</th>
						</tr>
					</thead>
					<tbody id="vpl-tbody"></tbody>
				</table>
			</div>
		</div>
		</div>`);

		this.$r = $(this.page.body).find(".vpl-root");
	}

	bind_events() {
		this.$r.find("[data-a='refresh']").on("click", () => this.refresh());

		this.$r.find("[data-f='search']").on("input", () => this.refresh());
		this.$r.find("[data-f='status']").on("change", () => this.refresh());

		// ✅ Fix for date filter
		this.$r.find("[data-f='from']").on("change", () => this.refresh());
		this.$r.find("[data-f='to']").on("change", () => this.refresh());
		this.$r.find("[data-a='clear']").on("click", () => this.clear_filters());
	}

	clear_filters() {
		// Reset all fields
		this.$r.find("[data-f='search']").val("");
		this.$r.find("[data-f='status']").val("");
		this.$r.find("[data-f='from']").val("");
		this.$r.find("[data-f='to']").val("");

		// Refresh data
		this.refresh();
	}

	async refresh() {
		const search = (this.$r.find("[data-f='search']").val() || "").trim().toLowerCase();
		const status_filter = this.$r.find("[data-f='status']").val();
		const from = this.$r.find("[data-f='from']").val();
		const to = this.$r.find("[data-f='to']").val();

		let passes = [];
		let rejected = [];

		// ✅ Case 1: Rejected only
		if (status_filter === "Rejected") {
			const r = await frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Visitor Pass Request",
					filters: {
						status: "Rejected"
					},
					fields: [
						"name", "visitor_name", "host_employee", "site",
						"expected_visit_date", "status", "rejection_reason"
					],
					order_by: "modified desc",
					limit_page_length: 200,
				},
			});

			rejected = r.message || [];
		}

		// ✅ Case 2: All OR specific pass status
		else {
			const pass_filters = {};

			if (status_filter) {
				pass_filters.pass_status = status_filter;
			}

			if (from && to) {
				pass_filters.valid_from = ["between", [from, to]];
			} else if (from) {
				pass_filters.valid_from = [">=", from];
			} else if (to) {
				pass_filters.valid_from = ["<=", to];
			}

			const r = await frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Visitor Pass",
					filters: pass_filters,
					fields: [
						"name", "visitor_name", "host_employee", "site",
						"valid_from", "valid_until", "pass_status", "visitor_pass_request"
					],
					order_by: "modified desc",
					limit_page_length: 200,
				},
			});

			passes = r.message || [];

			// 🔥 ALSO include rejected when "All"
			if (!status_filter) {
				const rej = await frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype: "Visitor Pass Request",
						filters: { status: "Rejected" },
						fields: [
							"name", "visitor_name", "host_employee", "site",
							"expected_visit_date", "status", "rejection_reason"
						],
						order_by: "modified desc",
						limit_page_length: 200,
					},
				});
				rejected = rej.message || [];
			}
		}

		// ✅ Merge
		let all_rows = [
			...passes.map(p => ({ ...p, _type: "pass" })),
			...rejected.map(r => ({ ...r, _type: "request" })),
		];

		// 🔍 Search filter (universal)
		if (search) {
			all_rows = all_rows.filter(r =>
				`${r.name} ${r.visitor_name} ${r.host_employee}`.toLowerCase().includes(search)
			);
		}

		// 📊 Stats (only from passes)
		const count = (s) => passes.filter(p => p.pass_status === s).length;

		this.$r.find("#st-total").text(all_rows.length);
		this.$r.find("#st-active").text(count("Active"));
		this.$r.find("#st-completed").text(count("Completed"));
		this.$r.find("#st-expired").text(count("Expired"));
		this.$r.find("#st-rejected").text(rejected.length);

		this.render(all_rows);
	}

	render(rows) {
		if (!rows.length) {
			this.$r.find("#vpl-tbody").html(
				`<tr><td colspan="7" class="vpl-empty">No records found</td></tr>`
			);
			return;
		}

		const html = rows.map(r => {
			const is_pass = r._type === "pass";
			const status = is_pass ? r.pass_status : "Rejected";
			const badge_class = `b-${status}`;
			const date_fmt = is_pass
				? frappe.datetime.str_to_user(r.valid_from || "")
				: frappe.datetime.str_to_user(r.expected_visit_date || "");
			const valid_until = is_pass
				? frappe.datetime.str_to_user(r.valid_until || "")
				: "—";
			const link = is_pass
				? `/app/visitor-pass/${r.name}`
				: `/app/visitor-pass-request/${r.name}`;
			const reject_reason = !is_pass && r.rejection_reason
				? `<div class="vpl-reject-reason" title="${frappe.utils.escape_html(r.rejection_reason)}">
					⚠ ${frappe.utils.escape_html(r.rejection_reason.substring(0, 40))}${r.rejection_reason.length > 40 ? "…" : ""}
				</div>`
				: "";

			return `<tr>
				<td>
					<strong>${frappe.utils.escape_html(r.name)}</strong>
					${is_pass ? "" : '<br><span style="font-size:10px;color:#64748b">Request</span>'}
				</td>
				<td>${frappe.utils.escape_html(r.visitor_name || "—")}</td>
				<td>${frappe.utils.escape_html(r.host_employee || "—")}</td>
				<td>${date_fmt}</td>
				<td>${valid_until}</td>
				<td>
					<span class="badge ${badge_class}">${status}</span>
					${reject_reason}
				</td>
				<td><a href="${link}" target="_blank" class="vpl-btn vpl-btn-open">↗ Open</a></td>
			</tr>`;
		}).join("");

		this.$r.find("#vpl-tbody").html(html);
	}
}