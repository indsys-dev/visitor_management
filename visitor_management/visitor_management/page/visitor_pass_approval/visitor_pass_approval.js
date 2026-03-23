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
		<div class="vpa-root">
		<style>
			.vpa-root*{box-sizing:border-box}
			.vpa-root{
				--bg:#f1f5f9;--surface:#fff;--border:#e2e8f0;--border2:#cbd5e1;
				--ink:#0f172a;--ink2:#1e293b;--muted:#64748b;
				--blue:#1d4ed8;--blue-l:#dbeafe;--blue-d:#1e3a8a;
				--green:#166534;--green-l:#dcfce7;--green-m:#15803d;
				--amber:#92400e;--amber-l:#fef3c7;
				--red:#991b1b;--red-l:#fee2e2;
				--teal:#0f766e;--teal-l:#ccfbf1;--teal-d:#134e4a;
				--r:10px;--sh:0 1px 3px rgba(0,0,0,.07),0 4px 14px rgba(0,0,0,.05);
				font-family:"Inter var","Inter","Segoe UI",sans-serif;
				background:var(--bg);min-height:100vh;padding:20px 20px 48px;
			}
			.vpa-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
			.vpa-header h2{margin:0;font-size:19px;font-weight:700;color:var(--ink);letter-spacing:-.3px}
			.vpa-header p{margin:3px 0 0;font-size:13px;color:var(--muted)}
			.vpa-header-r{display:flex;gap:10px;align-items:center}
			.vpa-count{background:var(--amber-l);color:var(--amber);font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px}
			.vpa-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
			.vpa-btn-ghost{background:transparent;color:var(--blue);border:1px solid var(--border2)}.vpa-btn-ghost:hover{background:var(--blue-l)}
			.vpa-btn-success{background:var(--green-m);color:#fff}.vpa-btn-success:hover{background:var(--green)}
			.vpa-btn-danger{background:#dc2626;color:#fff}.vpa-btn-danger:hover{background:var(--red)}
			.vpa-btn-sm{padding:6px 12px;font-size:12px}
			.vpa-btn:disabled{opacity:.5;cursor:not-allowed}

			.vpa-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
			.vpa-stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;box-shadow:var(--sh)}
			.vpa-stat .sk{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}
			.vpa-stat .sv{font-size:24px;font-weight:800;color:var(--ink);margin-top:2px}
			.vpa-stat .sv.amber{color:var(--amber)}.vpa-stat .sv.green{color:var(--green-m)}.vpa-stat .sv.blue{color:var(--blue)}

			.vpa-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
			.vpa-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden;transition:box-shadow .15s}
			.vpa-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.10)}
			.vpa-card-head{padding:14px 16px 10px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
			.vpa-visitor-name{font-size:15px;font-weight:700;color:var(--ink)}
			.vpa-req-id{font-size:11px;color:var(--muted);margin-top:2px;font-family:"Courier New",monospace}
			.vpa-status-badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0}
			.s-Pending-Approval{background:var(--blue-l);color:var(--blue)}
			.vpa-type-tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-top:2px}
			.tag-self{background:var(--teal-l);color:var(--teal-d)}
			.tag-mgmt{background:#ede9fe;color:#5b21b6}

			.vpa-meta{padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
			.vpa-meta-item .mk{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:2px}
			.vpa-meta-item .mv{font-size:13px;font-weight:500;color:var(--ink2)}

			.vpa-actions{padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;background:#fafbfc}

			.vpa-empty{text-align:center;padding:48px 20px;color:var(--muted);grid-column:span 2}
			.vpa-empty .ei{font-size:40px;margin-bottom:12px}
			.vpa-empty h3{font-size:16px;font-weight:700;color:var(--ink);margin:0 0 6px}
			.vpa-empty p{font-size:13px;margin:0}

			/* ── PASS MODAL ── */
			.vp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
			.vp-modal{background:#fff;border-radius:14px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.35);overflow:hidden}
			.vp-modal-btns{display:flex;gap:10px;justify-content:flex-end;padding:12px 18px;border-top:1px solid #e2e8f0;background:#f8fafc}

			/* ── PASS CARD (matches screenshot) ── */
			.vp-pass{font-family:"Segoe UI",Arial,sans-serif;background:#fff}

			/* Green header */
			.vp-head{
				background:linear-gradient(135deg,#0d6b5e 0%,#0a5247 100%);
				display:flex;align-items:center;justify-content:space-between;
				padding:14px 18px;
			}
			.vp-head-left{display:flex;align-items:center;gap:10px}
			.vp-head-logo{width:38px;height:38px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px}
			.vp-head-company{color:rgba(255,255,255,.9);font-size:12px;font-weight:700;letter-spacing:.5px}
			.vp-head-title{color:#fff;font-size:20px;font-weight:900;letter-spacing:3px;text-transform:uppercase}

			/* Pass ID bar */
			.vp-idbar{display:flex;justify-content:space-between;padding:9px 18px;background:#f0faf8;border-bottom:2px solid #0d6b5e;font-size:12px;color:#334155}
			.vp-idbar strong{color:#0f172a;font-size:13px}

			/* Divider line */
			.vp-divider{height:1px;background:#e5eaf2;margin:0 18px}

			/* Info rows */
			.vp-section{padding:8px 18px}
			.vp-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
			.vp-row:last-child{border-bottom:none}
			.vp-row-ico{font-size:15px;width:22px;text-align:center;flex-shrink:0;color:#0d6b5e}
			.vp-row-label{color:#64748b;font-size:12px;min-width:70px}
			.vp-row-val{font-weight:700;color:#0f172a}

			/* 2-col timing grid */
			.vp-grid2{display:grid;grid-template-columns:1fr 1fr;padding:6px 18px;gap:0;border-top:1px solid #e5eaf2;border-bottom:1px solid #e5eaf2}
			.vp-grid2 .vp-row{border-bottom:none;padding:5px 0}

			/* QR section */
			.vp-qr-section{display:flex;align-items:center;justify-content:center;flex-direction:column;padding:16px 18px 10px;border-top:1px dashed #c8d4e8}
			.vp-qr-section img{width:160px;height:160px;border:2px solid #0d6b5e;border-radius:8px;display:block}
			.vp-qr-placeholder{width:160px;height:160px;border:2px dashed #c8d4e8;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#94a3b8;text-align:center}
			.vp-qr-label{font-size:11px;font-weight:700;color:#0d6b5e;margin-top:8px;text-transform:uppercase;letter-spacing:.6px}

			/* OR divider */
			.vp-or{display:flex;align-items:center;gap:10px;padding:10px 18px;font-size:13px;font-weight:700;color:#64748b}
			.vp-or::before,.vp-or::after{content:"";flex:1;height:1px;background:#e5eaf2}
			.vp-or span{font-size:20px;font-weight:900;color:#0d6b5e;letter-spacing:2px}

			@media print{
				.vp-overlay{position:static;background:none;padding:0;display:block}
				.vp-modal{box-shadow:none;max-width:100%;border-radius:0}
				.vp-modal-btns{display:none!important}
				.vpa-root{display:none!important}
			}
			@media(max-width:768px){.vpa-grid{grid-template-columns:1fr}.vpa-stats{grid-template-columns:1fr 1fr}}
		</style>

		<div class="vpa-header">
			<div>
				<h2>📋 ${__("Visitor Pass Approval")}</h2>
				<p>${__("Review pending requests, then approve or reject.")}</p>
			</div>
			<div class="vpa-header-r">
				<div class="vpa-count" id="vpa-pending-count">— ${__("pending")}</div>
				<button class="vpa-btn vpa-btn-ghost" data-a="refresh">↺ ${__("Refresh")}</button>
			</div>
		</div>

		<div class="vpa-stats">
			<div class="vpa-stat"><div class="sk">${__("Pending Approval")}</div><div class="sv blue" id="st-approval">0</div></div>
			<div class="vpa-stat"><div class="sk">${__("Approved Today")}</div><div class="sv green" id="st-today">—</div></div>
			<div class="vpa-stat"><div class="sk">${__("Total Requests")}</div><div class="sv amber" id="st-total">0</div></div>
		</div>

		<div class="vpa-grid" id="vpa-grid"></div>
		</div>`);

		this.$r = $(this.page.body).find(".vpa-root");
	}

	bind_events() {
		this.$r.find("[data-a='refresh']").on("click", () => this.refresh());
	}

	async refresh() {
		const [pending, today] = await Promise.all([
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Visitor Pass Request",
					filters: [["status", "=", "Pending Approval"]],
					fields: ["name", "visitor_name", "visitor_email", "visitor_phone",
						"visitor_company", "host_employee", "site", "status",
						"expected_visit_date", "expected_visit_time",
						"requested_by", "visit_purpose"],
					order_by: "modified desc",
					limit_page_length: 100,
				},
			}),
			frappe.call({
				method: "frappe.client.get_count",
				args: { doctype: "Visitor Pass", filters: [["creation", ">=", frappe.datetime.get_today()]] },
			}),
		]);

		const rows = pending.message || [];
		this.$r.find("#vpa-pending-count").text(`${rows.length} ${__("pending")}`);
		this.$r.find("#st-approval").text(rows.length);
		this.$r.find("#st-total").text(rows.length);
		this.$r.find("#st-today").text(today.message || 0);
		this.render(rows);
	}

	render(rows) {
		if (!rows.length) {
			this.$r.find("#vpa-grid").html(`
				<div class="vpa-empty">
					<div class="ei">✅</div>
					<h3>${__("All clear!")}</h3>
					<p>${__("No pending visitor pass requests at this time.")}</p>
				</div>`);
			return;
		}

		const html = rows.map(r => {
			const type_class = r.requested_by === "Management" ? "tag-mgmt" : "tag-self";
			const type_label = r.requested_by === "Management" ? __("Management") : __("Self");
			const date_fmt = r.expected_visit_date ? frappe.datetime.str_to_user(r.expected_visit_date) : "—";
			const status_label = __("Pending Approval");
			const status_class = "s-Pending-Approval";
			return `
			<div class="vpa-card" data-name="${r.name}">
				<div class="vpa-card-head">
					<div>
						<div class="vpa-visitor-name">${frappe.utils.escape_html(r.visitor_name || "—")}</div>
						<div class="vpa-req-id">${frappe.utils.escape_html(r.name)}</div>
						<div class="vpa-type-tag ${type_class}">${type_label}</div>
					</div>
					<span class="vpa-status-badge ${status_class}">${status_label}</span>
				</div>
				<div class="vpa-meta">
					<div class="vpa-meta-item">
						<div class="mk">${__("Email")}</div>
						<div class="mv">${frappe.utils.escape_html(r.visitor_email || "—")}</div>
					</div>
					<div class="vpa-meta-item">
						<div class="mk">${__("Host")}</div>
						<div class="mv">${frappe.utils.escape_html(r.host_employee || "—")}</div>
					</div>
					<div class="vpa-meta-item">
						<div class="mk">${__("Visit Date & Time")}</div>
						<div class="mv">${date_fmt} ${frappe.utils.escape_html(r.expected_visit_time || "")}</div>
					</div>
					<div class="vpa-meta-item">
						<div class="mk">${__("Site")}</div>
						<div class="mv">${frappe.utils.escape_html(r.site || "—")}</div>
					</div>
					${r.visitor_company ? `<div class="vpa-meta-item"><div class="mk">${__("Company")}</div><div class="mv">${frappe.utils.escape_html(r.visitor_company)}</div></div>` : ""}
					${r.visit_purpose ? `<div class="vpa-meta-item"><div class="mk">${__("Purpose")}</div><div class="mv">${frappe.utils.escape_html(r.visit_purpose.substring(0, 60))}${r.visit_purpose.length > 60 ? "…" : ""}</div></div>` : ""}
				</div>
				<div class="vpa-actions">
					<button class="vpa-btn vpa-btn-success vpa-btn-sm" data-x="approve">✓ ${__("Approve & Issue Pass")}</button>
					<button class="vpa-btn vpa-btn-danger vpa-btn-sm" data-x="reject">✕ ${__("Reject")}</button>
					<a class="vpa-btn vpa-btn-ghost vpa-btn-sm" href="/app/visitor-pass-request/${r.name}" target="_blank">↗ ${__("Open")}</a>
				</div>
			</div>`;
		}).join("");

		this.$r.find("#vpa-grid").html(html);
		this.bind_actions();
	}

	bind_actions() {
		this.$r.find("[data-x='approve']").on("click", async (e) => {
			const name = this.card_name(e);
			frappe.confirm(__("Approve request and issue visitor pass for {0}?", [name]), async () => {
				const btn = $(e.currentTarget).prop("disabled", true).text(__("Approving..."));
				try {
					const r = await frappe.call({
						method: "visitor_management.api.otp.approve_pass",
						args: { request_name: name, action: "approve" },
					});
					frappe.show_alert({ message: __("Approved — pass issued"), indicator: "green" });
					await this.refresh();

					// Find the pass and show card
					let pass_name = r.message && r.message.pass_name;
					if (!pass_name) {
						const passes = await frappe.call({
							method: "frappe.client.get_list",
							args: { doctype: "Visitor Pass", filters: [["visitor_pass_request", "=", name]], fields: ["name"], limit: 1 },
						});
						if (passes.message && passes.message.length) pass_name = passes.message[0].name;
					}
					if (pass_name) await this.show_pass_card(pass_name);
				} finally { btn.prop("disabled", false).html(`✓ ${__("Approve & Issue Pass")}`); }
			});
		});

		this.$r.find("[data-x='reject']").on("click", (e) => {
			const name = this.card_name(e);
			const d = new frappe.ui.Dialog({
				title: __("Reject Request"),
				fields: [{
					fieldname: "reason", fieldtype: "Small Text",
					label: __("Reason for Rejection"), reqd: 1,
					description: __("This reason will be sent to the visitor by email."),
				}],
				primary_action_label: __("Confirm Reject"),
				primary_action: async (vals) => {
					await frappe.call({
						method: "visitor_management.api.otp.approve_pass",
						args: { request_name: name, action: "reject", reason: vals.reason },
					});
					frappe.show_alert({ message: __("Request rejected"), indicator: "red" });
					d.hide();
					this.refresh();
				},
			});
			d.show();
		});
	}

	async show_pass_card(pass_name) {
		const r = await frappe.call({ method: "frappe.client.get", args: { doctype: "Visitor Pass", name: pass_name } });
		const p = r.message;
		if (!p) return;

		const date_fmt = p.valid_from
			? frappe.datetime.str_to_user(p.valid_from.split(" ")[0])
			: frappe.datetime.str_to_user(frappe.datetime.get_today());
		const time_fmt = p.valid_from ? (p.valid_from.split(" ")[1] || "").substring(0, 5) : "—";
		const valid_until_fmt = p.valid_until ? frappe.datetime.str_to_user(p.valid_until.split(" ")[0]) : "—";

		const qr_html = p.qr_code
			? `<img src="${p.qr_code}" alt="QR Code">`
			: `<div class="vp-qr-placeholder">QR not generated</div>`;

		const overlay = $(`
		<div class="vp-overlay" id="vp-overlay">
			<div class="vp-modal" id="vp-pass-modal">
				<div class="vp-pass" id="vp-pass-content">

					<!-- Green header -->
					<div class="vp-head">
						<div class="vp-head-left">
							<div class="vp-head-logo">🏢</div>
							<div class="vp-head-company">INDSYS</div>
						</div>
						<div class="vp-head-title">VISITOR PASS</div>
					</div>

					<!-- Pass ID bar -->
					<div class="vp-idbar">
						<div>Pass ID: <strong>${frappe.utils.escape_html(p.name)}</strong></div>
						<div>Date: <strong>${date_fmt}</strong></div>
					</div>

					<!-- Visitor info -->
					<div class="vp-section">
						<div class="vp-row">
							<div class="vp-row-ico">👤</div>
							<div class="vp-row-label">Name:</div>
							<div class="vp-row-val">${frappe.utils.escape_html(p.visitor_name || "—")}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">📞</div>
							<div class="vp-row-label">Mobile:</div>
							<div class="vp-row-val">${frappe.utils.escape_html(p.visitor_phone || "—")}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">🏢</div>
							<div class="vp-row-label">Company:</div>
							<div class="vp-row-val">${frappe.utils.escape_html(p.visitor_company || "—")}</div>
						</div>
					</div>

					<div class="vp-divider"></div>

					<!-- Visit info -->
					<div class="vp-section">
						<div class="vp-row">
							<div class="vp-row-ico">🎯</div>
							<div class="vp-row-label">Purpose:</div>
							<div class="vp-row-val">${frappe.utils.escape_html((p.visit_purpose || "—").substring(0, 40))}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">👔</div>
							<div class="vp-row-label">Host:</div>
							<div class="vp-row-val">${frappe.utils.escape_html(p.host_employee || "—")}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">📍</div>
							<div class="vp-row-label">Site:</div>
							<div class="vp-row-val">${frappe.utils.escape_html(p.site || "—")}</div>
						</div>
					</div>

					<div class="vp-divider"></div>

					<!-- Timing 2-col -->
					<div class="vp-grid2">
						<div class="vp-row">
							<div class="vp-row-ico">📅</div>
							<div class="vp-row-label">Visit Date:</div>
							<div class="vp-row-val">${date_fmt}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">🕐</div>
							<div class="vp-row-label">Time:</div>
							<div class="vp-row-val">${time_fmt}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">✅</div>
							<div class="vp-row-label">Valid Until:</div>
							<div class="vp-row-val">${valid_until_fmt}</div>
						</div>
						<div class="vp-row">
							<div class="vp-row-ico">🔖</div>
							<div class="vp-row-label">Status:</div>
							<div class="vp-row-val" style="color:#0d6b5e">${frappe.utils.escape_html(p.pass_status || "Active")}</div>
						</div>
					</div>

					<!-- OR divider -->
					<div class="vp-or"><span>OR</span></div>

					<!-- QR Code centered large -->
					<div class="vp-qr-section">
						${qr_html}
						<div class="vp-qr-label">Scan for Verification</div>
					</div>

				</div>

				<!-- Modal action buttons -->
				<div class="vp-modal-btns">
					<button class="vpa-btn vpa-btn-ghost vpa-btn-sm" id="vp-close">✕ ${__("Close")}</button>
					<a class="vpa-btn vpa-btn-ghost vpa-btn-sm" href="/app/visitor-pass/${p.name}" target="_blank">↗ ${__("Open Pass")}</a>
					<button class="vpa-btn vpa-btn-ghost vpa-btn-sm" id="vp-download">⬇ ${__("Download PDF")}</button>
					<button class="vpa-btn vpa-btn-success vpa-btn-sm" id="vp-print">🖨 ${__("Print")}</button>
				</div>
			</div>
		</div>`);

		$("body").append(overlay);

		overlay.find("#vp-close").on("click", () => overlay.remove());
		overlay.on("click", (e) => { if ($(e.target).is("#vp-overlay")) overlay.remove(); });

		overlay.find("#vp-print").on("click", () => window.print());

		overlay.find("#vp-download").on("click", async () => {
			const btn = overlay.find("#vp-download").prop("disabled", true).text(__("Generating..."));
			try {
				await this.download_pass_pdf(p);
			} finally {
				btn.prop("disabled", false).html(`⬇ ${__("Download PDF")}`);
			}
		});
	}

	async download_pass_pdf(p) {
		// Use Frappe's built-in print to PDF
		const print_url = `/api/method/frappe.utils.print_format.download_pdf?doctype=Visitor Pass&name=${encodeURIComponent(p.name)}&format=Standard&no_letterhead=1`;
		const a = document.createElement("a");
		a.href = print_url;
		a.download = `${p.name}.pdf`;
		a.target = "_blank";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	card_name(e) { return $(e.currentTarget).closest(".vpa-card").attr("data-name"); }
}