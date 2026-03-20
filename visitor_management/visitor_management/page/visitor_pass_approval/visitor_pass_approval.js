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

	/* ─────────────────────────────────────────────
	   LAYOUT
	───────────────────────────────────────────── */
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

			/* Header */
			.vpa-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
			.vpa-header h2{margin:0;font-size:19px;font-weight:700;color:var(--ink);letter-spacing:-.3px}
			.vpa-header p{margin:3px 0 0;font-size:13px;color:var(--muted)}
			.vpa-header-r{display:flex;gap:10px;align-items:center}
			.vpa-count{background:var(--amber-l);color:var(--amber);font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px}
			.vpa-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
			.vpa-btn-primary{background:var(--blue);color:#fff}.vpa-btn-primary:hover{background:var(--blue-d)}
			.vpa-btn-ghost{background:transparent;color:var(--blue);border:1px solid var(--border2)}.vpa-btn-ghost:hover{background:var(--blue-l)}
			.vpa-btn-success{background:var(--green-m);color:#fff}.vpa-btn-success:hover{background:var(--green)}
			.vpa-btn-danger{background:#dc2626;color:#fff}.vpa-btn-danger:hover{background:var(--red)}
			.vpa-btn-sm{padding:6px 12px;font-size:12px}
			.vpa-btn:disabled{opacity:.5;cursor:not-allowed}

			/* Stats row */
			.vpa-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
			.vpa-stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;box-shadow:var(--sh)}
			.vpa-stat .sk{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}
			.vpa-stat .sv{font-size:24px;font-weight:800;color:var(--ink);margin-top:2px}
			.vpa-stat .sv.amber{color:var(--amber)}
			.vpa-stat .sv.green{color:var(--green-m)}
			.vpa-stat .sv.blue{color:var(--blue)}

			/* Grid */
			.vpa-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}

			/* Card */
			.vpa-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden;transition:box-shadow .15s}
			.vpa-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.10)}
			.vpa-card-head{padding:14px 16px 10px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
			.vpa-visitor-name{font-size:15px;font-weight:700;color:var(--ink)}
			.vpa-req-id{font-size:11px;color:var(--muted);margin-top:2px;font-family:"Courier New",monospace}
			.vpa-status-badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0}
			.s-Pending-OTP{background:var(--amber-l);color:var(--amber)}
			.s-Pending-Approval{background:var(--blue-l);color:var(--blue)}

			/* Meta grid */
			.vpa-meta{padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
			.vpa-meta-item .mk{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:2px}
			.vpa-meta-item .mv{font-size:13px;font-weight:500;color:var(--ink2)}

			/* Type tag */
			.vpa-type-tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-top:2px}
			.tag-self{background:var(--teal-l);color:var(--teal-d)}
			.tag-mgmt{background:#ede9fe;color:#5b21b6}

			/* Actions */
			.vpa-actions{padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;background:#fafbfc}

			/* Empty */
			.vpa-empty{text-align:center;padding:48px 20px;color:var(--muted)}
			.vpa-empty .ei{font-size:40px;margin-bottom:12px}
			.vpa-empty h3{font-size:16px;font-weight:700;color:var(--ink);margin:0 0 6px}
			.vpa-empty p{font-size:13px;margin:0}

			/* ── VISITOR PASS PRINT CARD ──────────────── */
			.vp-modal-overlay{
				position:fixed;inset:0;background:rgba(0,0,0,.55);
				z-index:9999;display:flex;align-items:center;justify-content:center;
				padding:20px;
			}
			.vp-modal{
				background:#fff;border-radius:16px;max-width:460px;width:100%;
				max-height:90vh;overflow-y:auto;
				box-shadow:0 20px 60px rgba(0,0,0,.3);
			}
			.vp-modal-actions{
				display:flex;gap:10px;justify-content:flex-end;padding:14px 20px;
				border-top:1px solid #e2e8f0;background:#fafbfc;border-radius:0 0 16px 16px;
			}

			/* Pass card design */
			.vp-pass{
				font-family:"Inter","Segoe UI",sans-serif;
				border:1px solid #d1d5db;border-radius:12px;
				overflow:hidden;background:#fff;
			}
			.vp-pass-header{
				background:linear-gradient(135deg,#0f766e 0%,#134e4a 100%);
				padding:16px 20px;display:flex;align-items:center;justify-content:space-between;
			}
			.vp-pass-header .logo-area{display:flex;align-items:center;gap:10px}
			.vp-pass-header .logo-box{
				width:40px;height:40px;background:rgba(255,255,255,.2);
				border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;
			}
			.vp-pass-header .company-name{color:rgba(255,255,255,.9);font-size:13px;font-weight:700;letter-spacing:.3px}
			.vp-pass-header h1{color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;margin:0;text-transform:uppercase}

			.vp-pass-meta{
				display:flex;justify-content:space-between;align-items:center;
				padding:10px 20px;background:#f8fafc;border-bottom:2px solid #0f766e;
				font-size:13px;color:#334155;
			}
			.vp-pass-meta strong{color:#0f172a}

			.vp-section{margin:0;padding:10px 20px}
			.vp-section-title{
				font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;
				color:#0f766e;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;
			}
			.vp-row{
				display:flex;align-items:center;gap:10px;padding:7px 0;
				border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;
			}
			.vp-row:last-child{border-bottom:none}
			.vp-row .ri{font-size:16px;width:24px;text-align:center;flex-shrink:0}
			.vp-row .rk{color:#64748b;min-width:80px;font-size:12px}
			.vp-row .rv{font-weight:700;color:#0f172a}

			.vp-grid-2row{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:10px 20px}
			.vp-grid-2row .vp-row{padding:6px 0}

			.vp-qr-section{
				display:flex;align-items:center;justify-content:space-between;
				padding:14px 20px;background:#f8fafc;border-top:1px dashed #cbd5e1;gap:16px;
			}
			.vp-qr-box{text-align:center;flex-shrink:0}
			.vp-qr-box img{width:100px;height:100px;border:2px solid #e2e8f0;border-radius:8px;display:block}
			.vp-qr-box .qr-placeholder{
				width:100px;height:100px;border:2px dashed #cbd5e1;border-radius:8px;
				display:flex;align-items:center;justify-content:center;font-size:11px;
				color:#94a3b8;text-align:center;line-height:1.3;
			}
			.vp-qr-box p{font-size:10px;font-weight:700;color:#0f766e;margin:5px 0 0;text-transform:uppercase;letter-spacing:.5px}
			.vp-items-box{flex:1;font-size:12px;color:#334155}
			.vp-items-box .ib-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#0f766e;margin-bottom:6px}
			.vp-items-box .ib-row{padding:4px 0;border-bottom:1px solid #f1f5f9;display:flex;gap:6px;align-items:center}
			.vp-items-box .ib-row:last-child{border:none}

			.vp-pass-footer{
				display:flex;justify-content:space-between;align-items:flex-end;
				padding:12px 20px;border-top:1px solid #e2e8f0;
			}
			.vp-sig{text-align:center;min-width:120px}
			.vp-sig .sig-line{border-top:1.5px solid #334155;padding-top:4px;margin-top:20px;font-size:11px;color:#64748b;font-weight:600}
			.vp-status-chip{
				font-size:12px;font-weight:700;padding:5px 14px;border-radius:999px;
				background:#dcfce7;color:#166534;border:1px solid #86efac;
			}

			@media print {
				.vp-modal-actions{display:none!important}
				.vpa-root{display:none}
				.vp-modal-overlay{position:static;background:none;padding:0}
				.vp-modal{box-shadow:none;max-height:none;border-radius:0}
			}
			@media(max-width:768px){.vpa-grid{grid-template-columns:1fr}.vpa-stats{grid-template-columns:1fr 1fr}}
		</style>

		<!-- Header -->
		<div class="vpa-header">
			<div>
				<h2>📋 ${__("Visitor Pass Approval")}</h2>
				<p>${__("Review pending requests, verify OTP, approve or reject and issue visitor passes.")}</p>
			</div>
			<div class="vpa-header-r">
				<div class="vpa-count" id="vpa-pending-count">— ${__("pending")}</div>
				<button class="vpa-btn vpa-btn-ghost" data-a="refresh">↺ ${__("Refresh")}</button>
			</div>
		</div>

		<!-- Stats -->
		<div class="vpa-stats">
			<div class="vpa-stat">
				<div class="sk">${__("Pending OTP")}</div>
				<div class="sv amber" id="st-otp">0</div>
			</div>
			<div class="vpa-stat">
				<div class="sk">${__("Pending Approval")}</div>
				<div class="sv blue" id="st-approval">0</div>
			</div>
			<div class="vpa-stat">
				<div class="sk">${__("Approved Today")}</div>
				<div class="sv green" id="st-today">—</div>
			</div>
		</div>

		<!-- Cards grid -->
		<div class="vpa-grid" id="vpa-grid"></div>

		</div>`);

		this.$r = $(this.page.body).find(".vpa-root");
	}

	bind_events() {
		this.$r.find("[data-a='refresh']").on("click", () => this.refresh());
	}

	/* ─────────────────────────────────────────────
	   DATA
	───────────────────────────────────────────── */
	async refresh() {
		const [pending, today] = await Promise.all([
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Visitor Pass Request",
					filters: [["status", "in", ["Pending OTP", "Pending Approval"]]],
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
				args: {
					doctype: "Visitor Pass",
					filters: [["creation", ">=", frappe.datetime.get_today()]],
				},
			}),
		]);

		const rows = pending.message || [];
		this.$r.find("#vpa-pending-count").text(`${rows.length} ${__("pending")}`);
		this.$r.find("#st-otp").text(rows.filter(r => r.status === "Pending OTP").length);
		this.$r.find("#st-approval").text(rows.filter(r => r.status === "Pending Approval").length);
		this.$r.find("#st-today").text(today.message || 0);
		this.render(rows);
	}

	/* ─────────────────────────────────────────────
	   RENDER
	───────────────────────────────────────────── */
	render(rows) {
		if (!rows.length) {
			this.$r.find("#vpa-grid").html(`
				<div class="vpa-empty" style="grid-column:span 2">
					<div class="ei">✅</div>
					<h3>${__("All clear!")}</h3>
					<p>${__("No pending visitor pass requests at this time.")}</p>
				</div>`);
			return;
		}

		const html = rows.map(r => {
			const status_class = r.status === "Pending OTP" ? "s-Pending-OTP" : "s-Pending-Approval";
			const status_label = r.status === "Pending OTP" ? __("Pending OTP") : __("Pending Approval");
			const type_class = r.requested_by === "Management" ? "tag-mgmt" : "tag-self";
			const type_label = r.requested_by === "Management" ? __("Management") : __("Self");
			const date_fmt = r.expected_visit_date ? frappe.datetime.str_to_user(r.expected_visit_date) : "—";

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
					${r.visitor_company ? `
					<div class="vpa-meta-item">
						<div class="mk">${__("Company")}</div>
						<div class="mv">${frappe.utils.escape_html(r.visitor_company)}</div>
					</div>` : ""}
					${r.visit_purpose ? `
					<div class="vpa-meta-item">
						<div class="mk">${__("Purpose")}</div>
						<div class="mv">${frappe.utils.escape_html(r.visit_purpose.substring(0, 60))}${r.visit_purpose.length > 60 ? "…" : ""}</div>
					</div>` : ""}
				</div>
				<div class="vpa-actions">
					${r.status === "Pending OTP" ? `
					<button class="vpa-btn vpa-btn-ghost vpa-btn-sm" data-x="otp">📨 ${__("Send OTP")}</button>
					<button class="vpa-btn vpa-btn-ghost vpa-btn-sm" data-x="verify">🔑 ${__("Verify OTP")}</button>
					` : ""}
					${r.status === "Pending Approval" ? `
					<button class="vpa-btn vpa-btn-success vpa-btn-sm" data-x="approve">✓ ${__("Approve & Issue Pass")}</button>
					<button class="vpa-btn vpa-btn-danger vpa-btn-sm" data-x="reject">✕ ${__("Reject")}</button>
					` : ""}
					<a class="vpa-btn vpa-btn-ghost vpa-btn-sm" href="/app/visitor-pass-request/${r.name}" target="_blank">↗ ${__("Open")}</a>
				</div>
			</div>`;
		}).join("");

		this.$r.find("#vpa-grid").html(html);
		this.bind_actions();
	}

	bind_actions() {
		this.$r.find("[data-x='otp']").on("click", async (e) => {
			const name = this.card_name(e);
			const btn = $(e.currentTarget).prop("disabled", true).text(__("Sending..."));
			try {
				await frappe.call({ method: "visitor_management.api.otp.send_otp", args: { request_name: name } });
				frappe.show_alert({ message: __("OTP sent to visitor"), indicator: "green" });
				this.refresh();
			} finally { btn.prop("disabled", false).html(`📨 ${__("Send OTP")}`); }
		});

		this.$r.find("[data-x='verify']").on("click", (e) => {
			const name = this.card_name(e);
			const d = new frappe.ui.Dialog({
				title: __("Verify Visitor OTP"),
				fields: [
					{ fieldname: "otp", fieldtype: "Data", label: __("Enter OTP"), reqd: 1,
					  description: __("Ask the visitor for the OTP sent to their email/phone.") },
				],
				primary_action_label: __("Verify OTP"),
				primary_action: async (vals) => {
					const r = await frappe.call({
						method: "visitor_management.api.otp.verify_otp",
						args: { request_name: name, otp_input: vals.otp },
					});
					frappe.show_alert({
						message: r.message.message || __("Done"),
						indicator: r.message.verified ? "green" : "orange",
					});
					d.hide();
					this.refresh();
				},
			});
			d.show();
		});

		this.$r.find("[data-x='approve']").on("click", async (e) => {
			const name = this.card_name(e);
			frappe.confirm(
				__("Approve this request and issue a visitor pass for {0}?", [name]),
				async () => {
					const btn = $(e.currentTarget).prop("disabled", true).text(__("Approving..."));
					try {
						const r = await frappe.call({
							method: "visitor_management.api.otp.approve_pass",
							args: { request_name: name, action: "approve" },
						});
						frappe.show_alert({ message: __("Request approved — pass issued"), indicator: "green" });
						await this.refresh();

						// Show pass card if pass was created
						const pass_name = r.message && r.message.pass_name;
						if (pass_name) {
							await this.show_pass_card(pass_name);
						} else {
							// Try fetching by request link
							const passes = await frappe.call({
								method: "frappe.client.get_list",
								args: {
									doctype: "Visitor Pass",
									filters: [["visitor_pass_request", "=", name]],
									fields: ["name"],
									limit: 1,
								},
							});
							if (passes.message && passes.message.length) {
								await this.show_pass_card(passes.message[0].name);
							}
						}
					} finally { btn.prop("disabled", false).html(`✓ ${__("Approve & Issue Pass")}`); }
				}
			);
		});

		this.$r.find("[data-x='reject']").on("click", (e) => {
			const name = this.card_name(e);
			const d = new frappe.ui.Dialog({
				title: __("Reject Request"),
				fields: [
					{ fieldname: "reason", fieldtype: "Small Text", label: __("Reason for Rejection"),
					  reqd: 1, description: __("This will be noted in the request record.") },
				],
				primary_action_label: __("Confirm Reject"),
				primary_action: async () => {
					await frappe.call({
						method: "visitor_management.api.otp.approve_pass",
						args: { request_name: name, action: "reject" },
					});
					frappe.show_alert({ message: __("Request rejected"), indicator: "red" });
					d.hide();
					this.refresh();
				},
			});
			d.show();
		});
	}

	/* ─────────────────────────────────────────────
	   VISITOR PASS CARD
	───────────────────────────────────────────── */
	async show_pass_card(pass_name) {
		// Fetch full pass doc
		const r = await frappe.call({
			method: "frappe.client.get",
			args: { doctype: "Visitor Pass", name: pass_name },
		});
		const p = r.message;
		if (!p) return;

		const date_fmt = p.valid_from
			? frappe.datetime.str_to_user(p.valid_from.split(" ")[0])
			: frappe.datetime.str_to_user(frappe.datetime.get_today());

		const valid_until_fmt = p.valid_until
			? frappe.datetime.str_to_user(p.valid_until.split(" ")[0])
			: "—";

		const time_fmt = p.valid_from
			? p.valid_from.split(" ")[1]?.substring(0, 5) || "—"
			: "—";

		const qr_html = p.qr_code
			? `<img src="${p.qr_code}" alt="QR Code">`
			: `<div class="qr-placeholder">QR<br>not<br>generated</div>`;

		const overlay = $(`
		<div class="vp-modal-overlay" id="vp-overlay">
			<div class="vp-modal">

				<div class="vp-pass">

					<!-- Header -->
					<div class="vp-pass-header">
						<div class="logo-area">
							<div class="logo-box">🏢</div>
							<div class="company-name">INDSYS</div>
						</div>
						<h1>VISITOR PASS</h1>
					</div>

					<!-- Pass meta bar -->
					<div class="vp-pass-meta">
						<div>Pass ID: <strong>${frappe.utils.escape_html(p.name)}</strong></div>
						<div>Date: <strong>${date_fmt}</strong></div>
					</div>

					<!-- Visitor info -->
					<div class="vp-section">
						<div class="vp-section-title">${__("Visitor Information")}</div>
						<div class="vp-row">
							<div class="ri">👤</div>
							<div class="rk">${__("Name")}</div>
							<div class="rv">${frappe.utils.escape_html(p.visitor_name || "—")}</div>
						</div>
						<div class="vp-row">
							<div class="ri">📞</div>
							<div class="rk">${__("Mobile")}</div>
							<div class="rv">${frappe.utils.escape_html(p.visitor_phone || "—")}</div>
						</div>
						<div class="vp-row">
							<div class="ri">🏢</div>
							<div class="rk">${__("Company")}</div>
							<div class="rv">${frappe.utils.escape_html(p.visitor_company || "—")}</div>
						</div>
					</div>

					<!-- Visit info -->
					<div class="vp-section">
						<div class="vp-section-title">${__("Visit Information")}</div>
						<div class="vp-row">
							<div class="ri">🎯</div>
							<div class="rk">${__("Purpose")}</div>
							<div class="rv">${frappe.utils.escape_html((p.visit_purpose || "—").substring(0, 50))}</div>
						</div>
						<div class="vp-row">
							<div class="ri">👔</div>
							<div class="rk">${__("Host")}</div>
							<div class="rv">${frappe.utils.escape_html(p.host_employee || "—")}</div>
						</div>
						<div class="vp-row">
							<div class="ri">📍</div>
							<div class="rk">${__("Site")}</div>
							<div class="rv">${frappe.utils.escape_html(p.site || "—")}</div>
						</div>
					</div>

					<!-- Timing -->
					<div class="vp-section">
						<div class="vp-section-title">${__("Timing")}</div>
						<div class="vp-grid-2row">
							<div class="vp-row">
								<div class="ri">📅</div>
								<div class="rk">${__("Visit Date")}</div>
								<div class="rv">${date_fmt}</div>
							</div>
							<div class="vp-row">
								<div class="ri">🕐</div>
								<div class="rk">${__("Time")}</div>
								<div class="rv">${time_fmt}</div>
							</div>
							<div class="vp-row">
								<div class="ri">✅</div>
								<div class="rk">${__("Valid Until")}</div>
								<div class="rv">${valid_until_fmt}</div>
							</div>
							<div class="vp-row">
								<div class="ri">🔖</div>
								<div class="rk">${__("Status")}</div>
								<div class="rv">${frappe.utils.escape_html(p.pass_status || "Active")}</div>
							</div>
						</div>
					</div>

					<!-- QR + ID info -->
					<div class="vp-qr-section">
						<div class="vp-items-box">
							<div class="ib-title">${__("ID Details")}</div>
							<div class="ib-row">🪪 <strong>${frappe.utils.escape_html(p.id_proof_type || "—")}</strong></div>
							<div class="ib-row"># <strong>${frappe.utils.escape_html(p.id_proof_number || "—")}</strong></div>
							<div class="ib-title" style="margin-top:10px">${__("Pass Status")}</div>
							<div><span class="vp-status-chip">${frappe.utils.escape_html(p.pass_status || "Active")}</span></div>
						</div>
						<div class="vp-qr-box">
							${qr_html}
							<p>${__("Scan for Verification")}</p>
						</div>
					</div>

					<!-- Footer -->
					<div class="vp-pass-footer">
						<div class="vp-sig">
							<div class="sig-line">${__("Authorized Signature")}</div>
						</div>
						<div style="font-size:10px;color:#94a3b8;text-align:center;line-height:1.5">
							${__("This pass is valid only for the date and time specified.")}<br>
							${__("Please surrender at exit.")}
						</div>
						<div class="vp-sig">
							<div class="sig-line">${__("Security Seal")}</div>
						</div>
					</div>

				</div>

				<!-- Modal actions -->
				<div class="vp-modal-actions">
					<button class="vpa-btn vpa-btn-ghost vpa-btn-sm" id="vp-close">✕ ${__("Close")}</button>
					<a class="vpa-btn vpa-btn-ghost vpa-btn-sm" href="/app/visitor-pass/${p.name}" target="_blank">↗ ${__("Open Pass")}</a>
					<button class="vpa-btn vpa-btn-success vpa-btn-sm" id="vp-print">🖨 ${__("Print Pass")}</button>
				</div>
			</div>
		</div>`);

		$("body").append(overlay);

		overlay.find("#vp-close").on("click", () => overlay.remove());
		overlay.find("#vp-print").on("click", () => window.print());
		overlay.on("click", (e) => { if ($(e.target).is("#vp-overlay")) overlay.remove(); });
	}

	card_name(e) {
		return $(e.currentTarget).closest(".vpa-card").attr("data-name");
	}
}