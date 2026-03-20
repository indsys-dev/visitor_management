frappe.pages["visitor-pass-entry-management"].on_page_load = function (wrapper) {
	new VisitorPassEntryManagement(wrapper);
};

class VisitorPassEntryManagement {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "",
			single_column: true,
		});
		$(this.page.main).find(".page-head").hide();
		this.docname = null;
		this.make_layout();
		this.make_controls();
		this.bind_events();
	}

	make_layout() {
		$(this.page.body).css({ padding: 0, background: "#f0f4f8" }).html(`
		<div class="m-root">
		<style>
			.m-root{font-family:"Inter","Segoe UI",sans-serif;background:#f0f4f8;min-height:100vh;display:flex;flex-direction:column}
			.m-root *{box-sizing:border-box;margin:0;padding:0}

			/* NAV */
			.m-nav{background:#1a3a6e;height:54px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 10px rgba(10,30,70,.3);flex-shrink:0;position:sticky;top:0;z-index:100}
			.m-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
			.m-brand-ico{width:30px;height:30px;background:rgba(255,255,255,.18);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px}
			.m-brand-name{color:#fff;font-size:14px;font-weight:700}
			.m-nav-links{display:flex;align-items:center;gap:6px}
			.m-nav-a{color:rgba(255,255,255,.75);font-size:13px;font-weight:500;padding:6px 12px;border-radius:6px;text-decoration:none;transition:all .15s;cursor:pointer}
			.m-nav-a:hover{color:#fff;background:rgba(255,255,255,.1)}
			.m-nav-user{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.85);font-size:13px;font-weight:500;cursor:pointer;padding:5px 10px;border-radius:6px}
			.m-nav-user:hover{background:rgba(255,255,255,.1)}
			.m-nav-user .av{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px}

			/* BODY */
			.m-body{flex:1;max-width:820px;margin:0 auto;width:100%;padding:28px 20px 36px}

			/* TITLE */
			.m-title{margin-bottom:20px}
			.m-title h1{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin-bottom:4px}
			.m-title p{font-size:13px;color:#64748b}

			/* HERO */
			.m-hero{
				background:linear-gradient(135deg,#0a2540 0%,#1a3f6f 55%,#1e4d8c 100%);
				border-radius:12px;height:140px;margin-bottom:22px;
				position:relative;overflow:hidden;
				display:flex;align-items:center;padding:0 28px;
				box-shadow:0 1px 4px rgba(0,0,0,.08),0 6px 18px rgba(0,0,0,.08);
			}
			.m-hero::after{content:"🏢";position:absolute;right:28px;bottom:-10px;font-size:90px;opacity:.1}
			.m-hero-text h2{font-size:17px;font-weight:800;color:#fff;margin-bottom:4px;position:relative;z-index:1}
			.m-hero-text p{font-size:12px;color:rgba(255,255,255,.7);position:relative;z-index:1}
			.m-hero-badge{margin-top:8px;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.3px;position:relative;z-index:1}
			.m-hero-badge .dot{width:5px;height:5px;border-radius:50%;background:#34d399}

			/* SUCCESS */
			.m-success{display:none;background:#fff;border:1px solid #86efac;border-radius:12px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
			.m-success.show{display:block}
			.m-success-head{background:linear-gradient(135deg,#065f46,#047857);padding:16px 20px;display:flex;align-items:center;gap:10px}
			.m-success-head .ico{width:34px;height:34px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
			.m-success-head h3{font-size:14px;font-weight:700;color:#fff;margin-bottom:1px}
			.m-success-head p{font-size:11px;color:rgba(255,255,255,.75)}
			.m-success-body{padding:16px 20px}
			.m-ref-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e2e8f0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:12px}
			.m-ref-cell{background:#fff;padding:10px 13px}
			.m-ref-cell .k{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:3px}
			.m-ref-cell .v{font-size:12px;font-weight:600;color:#0f172a}
			.m-ref-cell .v a{color:#2563eb;text-decoration:none;font-weight:700}
			.m-sact{display:flex;gap:8px;flex-wrap:wrap}

			/* CARD */
			.m-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.05);overflow:hidden;margin-bottom:14px}
			.m-card-body{padding:22px}

			/* SECTION LABEL */
			.m-sec{font-size:13px;font-weight:700;color:#1e3a8a;margin-bottom:14px;display:flex;align-items:center;gap:8px}
			.m-sec::after{content:"";flex:1;height:1px;background:#e2e8f0}

			/* GRID */
			.m-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
			.m-span2{grid-column:span 2}

			/* FIELD */
			.m-field{display:flex;flex-direction:column;gap:5px}
			.m-field label{font-size:12px;font-weight:600;color:#334155}
			.m-field label .req{color:#be123c;margin-left:2px}
			.m-field input,.m-field select,.m-field textarea{width:100%;padding:10px 13px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13.5px;color:#0f172a;background:#fff;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s}
			.m-field input::placeholder,.m-field textarea::placeholder{color:#94a3b8}
			.m-field input:focus,.m-field select:focus,.m-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
			.m-field textarea{resize:vertical;min-height:90px;line-height:1.6}

			/* LINK */
			.m-link .form-group{margin:0}
			.m-link .form-control{padding:10px 13px!important;border:1.5px solid #cbd5e1!important;border-radius:8px!important;font-size:13.5px!important;height:auto!important;font-family:inherit!important;color:#0f172a!important}
			.m-link .form-control:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.10)!important}
			.m-link .clearfix,.m-link .help-box{display:none}

			/* INFO NOTE */
			.m-note{display:flex;align-items:flex-start;gap:8px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:11px 14px;font-size:12px;color:#b45309;margin-bottom:16px;line-height:1.5}

			/* ACTIONS */
			.m-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 22px;background:#f8faff;border-top:1px solid #e2e8f0}

			/* BTN */
			.m-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
			.m-btn-primary{background:#1a3a6e;color:#fff;box-shadow:0 2px 8px rgba(26,58,110,.28)}
			.m-btn-primary:hover{background:#2351a3;box-shadow:0 4px 14px rgba(26,58,110,.32);transform:translateY(-1px)}
			.m-btn-primary:active{transform:none}
			.m-btn-secondary{background:#fff;color:#334155;border:1.5px solid #cbd5e1}
			.m-btn-secondary:hover{background:#f1f5f9}
			.m-btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important}

			@media(max-width:640px){
				.m-g2,.m-ref-grid{grid-template-columns:1fr}
				.m-span2{grid-column:span 1}
			}
		</style>

		<!-- NAV -->
		<nav class="m-nav">
			<a class="m-brand" href="/app">
				<div class="m-brand-ico">🏠</div>
				<span class="m-brand-name">Visitor Management</span>
			</a>
			<div class="m-nav-links">
				<a class="m-nav-a" href="/app/vms-dashboard">Dashboard</a>
				<a class="m-nav-a" href="/app/visitor-pass">Visitor Log</a>
				<div class="m-nav-user">
					<div class="av">👤</div>
					<span id="m-username"></span>
					<span style="opacity:.5;font-size:10px">▾</span>
				</div>
			</div>
		</nav>

		<div class="m-body">

			<!-- Title -->
			<div class="m-title">
				<h1>Visitor Pass Request</h1>
				<p>Register a pre-approved visitor on behalf of management.</p>
			</div>

			<!-- Hero -->
			<div class="m-hero">
				<div class="m-hero-text">
					<h2>Management Registration</h2>
					<p>Pre-approved visitor — no ID capture required.</p>
					<div class="m-hero-badge"><div class="dot"></div>Management Access</div>
				</div>
			</div>

			<!-- Success -->
			<div class="m-success" id="m-success">
				<div class="m-success-head">
					<div class="ico">✓</div>
					<div>
						<h3>Request Approved &amp; Pass Issued</h3>
						<p>Management requests are pre-approved automatically.</p>
					</div>
				</div>
				<div class="m-success-body">
					<div class="m-ref-grid">
						<div class="m-ref-cell"><div class="k">Request No.</div><div class="v"><a id="m-ref-no" href="#" target="_blank"></a></div></div>
						<div class="m-ref-cell"><div class="k">Visitor</div><div class="v" id="m-ref-name"></div></div>
						<div class="m-ref-cell"><div class="k">Host</div><div class="v" id="m-ref-host"></div></div>
						<div class="m-ref-cell"><div class="k">Visit Date</div><div class="v" id="m-ref-date"></div></div>
						<div class="m-ref-cell"><div class="k">Visit Time</div><div class="v" id="m-ref-time"></div></div>
						<div class="m-ref-cell"><div class="k">Status</div><div class="v" style="color:#065f46;font-weight:700">✓ Approved</div></div>
					</div>
					<div class="m-sact">
						<a id="m-open-btn" href="#" target="_blank" class="m-btn m-btn-primary" style="text-decoration:none;font-size:12px;padding:8px 16px">↗ Open Request</a>
						<button class="m-btn m-btn-secondary" data-a="reset" style="font-size:12px;padding:8px 16px">+ New Request</button>
					</div>
				</div>
			</div>

			<!-- Form card -->
			<div class="m-card">
				<div class="m-card-body">

					<!-- Visitor Info -->
					<div class="m-sec">Visitor Information</div>
					<div class="m-g2" style="margin-bottom:16px">
						<div class="m-field">
							<label>Visitor Name <span class="req">*</span></label>
							<input type="text" data-k="visitor_name" placeholder="Enter visitor's full name">
						</div>
						<div class="m-field">
							<label>Phone Number</label>
							<input type="tel" data-k="visitor_phone" placeholder="Enter phone number">
						</div>
						<div class="m-field">
							<label>Email Address <span class="req">*</span></label>
							<input type="email" data-k="visitor_email" placeholder="Enter email address">
						</div>
						<div class="m-field">
							<label>Company / Organisation</label>
							<input type="text" data-k="visitor_company" placeholder="Enter company name">
						</div>
					</div>

					<!-- Visit Details -->
					<div class="m-sec">Visit Details</div>
					<div class="m-note">
						ℹ️ Management-approved visitors do not require Aadhar, face photo or ID proof. The host employee takes responsibility for the visitor.
					</div>
					<div class="m-g2">
						<div class="m-field">
							<label>Host Name <span class="req">*</span></label>
							<div class="m-link" data-ctrl="host_employee"></div>
						</div>
						<div class="m-field">
							<label>Site</label>
							<div class="m-link" data-ctrl="site"></div>
						</div>
						<div class="m-field">
							<label>Visit Date <span class="req">*</span></label>
							<input type="date" data-k="expected_visit_date">
						</div>
						<div class="m-field">
							<label>Visit Time <span class="req">*</span></label>
							<input type="time" data-k="expected_visit_time">
						</div>
						<div class="m-field m-span2">
							<label>Reason for Visit <span class="req">*</span></label>
							<textarea data-k="visit_purpose" placeholder="Enter the purpose of the visit."></textarea>
						</div>
					</div>

				</div>

				<div class="m-actions">
					<button class="m-btn m-btn-secondary" data-a="cancel">Cancel</button>
					<button class="m-btn m-btn-primary" data-a="submit" id="m-submit">Submit Request</button>
				</div>
			</div>

		</div>
		</div>`);

		this.$r = $(this.page.body).find(".m-root");
		this.$r.find("#m-username").text(frappe.session.user_fullname || frappe.session.user);
	}

	make_controls() {
		this.host_ctrl = frappe.ui.form.make_control({
			parent: this.$r.find("[data-ctrl='host_employee']").get(0),
			df: { fieldtype: "Link", fieldname: "host_employee", options: "Host", reqd: 1, placeholder: "Select host" },
			render_input: true,
		});
		this.site_ctrl = frappe.ui.form.make_control({
			parent: this.$r.find("[data-ctrl='site']").get(0),
			df: { fieldtype: "Link", fieldname: "site", options: "Visitor Site", placeholder: "Select site" },
			render_input: true,
		});
		this.host_ctrl.refresh();
		this.site_ctrl.refresh();
		this.$r.find("[data-k='expected_visit_date']").val(frappe.datetime.get_today());
	}

	bind_events() {
		this.$r.find("[data-a='submit']").on("click", () => this.submit());
		this.$r.find("[data-a='cancel']").on("click", () => this.reset());
		this.$r.find("[data-a='reset']").on("click", () => this.reset());
	}

	validate() {
		const n = this.val("visitor_name"), e = this.val("visitor_email"),
			h = this.host_ctrl.get_value(),
			d = this.val("expected_visit_date"), t = this.val("expected_visit_time"),
			p = this.val("visit_purpose");
		if (!n || !e || !h || !d || !t || !p) {
			frappe.show_alert({ message: __("Please fill all required fields"), indicator: "red" });
			return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
			frappe.show_alert({ message: __("Enter a valid email address"), indicator: "red" });
			return false;
		}
		return true;
	}

	async submit() {
		if (this.docname) { frappe.show_alert({ message: __("Already submitted"), indicator: "orange" }); return; }
		if (!this.validate()) return;
		const btn = this.$r.find("[data-a='submit']").prop("disabled", true).text(__("Submitting..."));
		try {
			const r = await frappe.call({
				method: "visitor_management.visitor_management.page.visitor_pass_entry.visitor_pass_entry.create_visitor_pass_request",
				args: {
					payload: {
						visitor_name: this.val("visitor_name"), visitor_email: this.val("visitor_email"),
						visitor_phone: this.val("visitor_phone"), visitor_company: this.val("visitor_company"),
						host_employee: this.host_ctrl.get_value(), site: this.site_ctrl.get_value(),
						visit_purpose: this.val("visit_purpose"),
						expected_visit_date: this.val("expected_visit_date"),
						expected_visit_time: this.val("expected_visit_time"),
						requested_by: "Management",
					},
				},
			});
			this.docname = r.message.name;
			this.show_success();
			frappe.show_alert({ message: __("Request created and approved"), indicator: "green" });
		} catch (e) {
			frappe.show_alert({ message: __("Submission failed. Please try again."), indicator: "red" });
		} finally {
			btn.prop("disabled", false).text(__("Submit Request"));
		}
	}

	show_success() {
		const date = frappe.datetime.str_to_user(this.val("expected_visit_date")) || "—";
		this.$r.find("#m-success").addClass("show");
		this.$r.find("[data-a='submit']").prop("disabled", true);
		this.$r.find("#m-ref-no").attr("href", `/app/visitor-pass-request/${this.docname}`).text(this.docname);
		this.$r.find("#m-open-btn").attr("href", `/app/visitor-pass-request/${this.docname}`);
		this.$r.find("#m-ref-name").text(this.val("visitor_name"));
		this.$r.find("#m-ref-host").text(this.host_ctrl.get_value() || "—");
		this.$r.find("#m-ref-date").text(date);
		this.$r.find("#m-ref-time").text(this.val("expected_visit_time") || "—");
		this.$r.find("#m-success")[0].scrollIntoView({ behavior: "smooth", block: "start" });
	}

	val(k) { return (this.$r.find(`[data-k='${k}']`).val() || "").trim(); }

	reset() {
		this.docname = null;
		this.$r.find("input, textarea").val("");
		this.$r.find("select").prop("selectedIndex", 0);
		this.host_ctrl.set_value(""); this.site_ctrl.set_value("");
		this.$r.find("#m-success").removeClass("show");
		this.$r.find("[data-a='submit']").prop("disabled", false).text(__("Submit Request"));
		this.$r.find("[data-k='expected_visit_date']").val(frappe.datetime.get_today());
		window.scrollTo({ top: 0, behavior: "smooth" });
	}
}