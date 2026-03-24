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
		$(this.page.body).css({ padding: 0, background: "#eef2f7" }).html(`
		<div class="mg-root">
		<style>
			.mg-root { font-family: "Segoe UI", Arial, sans-serif; background: #eef2f7; min-height: 100vh; display: flex; flex-direction: column; }
			.mg-root * { box-sizing: border-box; margin: 0; padding: 0; }

			.mg-nav { background: #1e3a6e; height: 56px; padding: 0 28px; display: flex; align-items: center; box-shadow: 0 2px 8px rgba(10,25,60,.25); flex-shrink: 0; }
			.mg-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
			.mg-brand-ico { width: 32px; height: 32px; background: rgba(255,255,255,.18); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
			.mg-brand-name { color: #fff; font-size: 15px; font-weight: 700; }

			.mg-body { flex: 1; max-width: 860px; margin: 0 auto; width: 100%; padding: 32px 20px 48px; }

			.mg-page-title { margin-bottom: 22px; }
			.mg-page-title h1 { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -.5px; margin-bottom: 5px; }
			.mg-page-title p { font-size: 14px; color: #64748b; }

			.mg-banner {
				background: linear-gradient(120deg, #0a2540 0%, #1a3f6f 55%, #1e4d8c 100%);
				border-radius: 14px; height: 160px; margin-bottom: 28px;
				position: relative; overflow: hidden;
				box-shadow: 0 1px 4px rgba(0,0,0,.08), 0 6px 20px rgba(0,0,0,.08);
				display: flex; align-items: center; padding: 0 28px;
			}
			.mg-banner::after { content: "🏢"; position: absolute; right: 28px; bottom: -10px; font-size: 90px; opacity: .1; }
			.mg-banner-text { position: relative; z-index: 1; }
			.mg-banner-text h2 { font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 4px; }
			.mg-banner-text p { font-size: 12px; color: rgba(255,255,255,.7); }
			.mg-banner-badge { margin-top: 8px; display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); color: #fff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; letter-spacing: .3px; }
			.mg-banner-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: #34d399; }

			.mg-card { background: #fff; border: 1px solid #dde5f0; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05); overflow: hidden; }
			.mg-card-body { padding: 28px 28px 20px; }

			.mg-sec { font-size: 13px; font-weight: 700; color: #1e3a6e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
			.mg-sec::after { content: ""; flex: 1; height: 1px; background: #e5eaf2; }

			.mg-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
			.mg-span2 { grid-column: span 2; }

			.mg-field { display: flex; flex-direction: column; gap: 6px; }
			.mg-field label { font-size: 13px; font-weight: 600; color: #1e3a6e; }
			.mg-field label .req { color: #dc2626; margin-left: 2px; }
			.mg-field input, .mg-field select, .mg-field textarea {
				width: 100%; padding: 11px 14px;
				border: 1.5px solid #c8d4e8; border-radius: 8px;
				font-size: 14px; color: #0f172a; background: #fff;
				outline: none; font-family: inherit;
				transition: border-color .15s, box-shadow .15s;
			}
			.mg-field input::placeholder, .mg-field textarea::placeholder { color: #94a3b8; }
			.mg-field input:focus, .mg-field select:focus, .mg-field textarea:focus { border-color: #1e3a6e; box-shadow: 0 0 0 3px rgba(30,58,110,.10); }
			.mg-field textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

			.mg-link .form-group { margin: 0; }
			.mg-link .form-control { padding: 11px 14px !important; border: 1.5px solid #c8d4e8 !important; border-radius: 8px !important; font-size: 14px !important; height: auto !important; font-family: inherit !important; color: #0f172a !important; }
			.mg-link .form-control:focus { border-color: #1e3a6e !important; box-shadow: 0 0 0 3px rgba(30,58,110,.10) !important; }
			.mg-link .clearfix, .mg-link .help-box { display: none; }
			.mg-phone-wrap { display: flex; border: 1.5px solid #c8d4e8; border-radius: 8px; overflow: hidden; background: #fff; transition: border-color .15s, box-shadow .15s; }
			.mg-phone-wrap:focus-within { border-color: #1e3a6e; box-shadow: 0 0 0 3px rgba(30,58,110,.10); }
			.mg-phone-code { padding: 11px 10px; background: #f1f5f9; border: none; border-right: 1.5px solid #c8d4e8; font-size: 13px; color: #0f172a; font-family: inherit; cursor: pointer; outline: none; width: auto !important; min-width: 90px; flex-shrink: 0; }
			.mg-phone-num { flex: 1 !important; width: 0 !important; min-width: 0; padding: 11px 14px; border: none; font-size: 14px; color: #0f172a; background: #fff; outline: none; font-family: inherit; }
			.mg-phone-num::placeholder { color: #94a3b8; }

			.mg-note { display: flex; align-items: flex-start; gap: 10px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #b45309; margin-bottom: 20px; line-height: 1.5; }

			.mg-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 18px 28px; background: #f8faff; border-top: 1px solid #e5eaf2; }

			.mg-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 26px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all .15s; }
			.mg-btn-primary { background: #1e3a6e; color: #fff; box-shadow: 0 2px 8px rgba(30,58,110,.3); }
			.mg-btn-primary:hover { background: #274d94; transform: translateY(-1px); }
			.mg-btn-primary:active { transform: none; }
			.mg-btn-secondary { background: #fff; color: #374151; border: 1.5px solid #c8d4e8; }
			.mg-btn-secondary:hover { background: #f1f5f9; }
			.mg-btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; }

			/* SUCCESS CARD */
			.mg-success { display: none; background: #fff; border: 1px solid #86efac; border-radius: 14px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05); }
			.mg-success.show { display: block; }
			.mg-success-head { background: linear-gradient(135deg, #065f46, #047857); padding: 18px 28px; display: flex; align-items: center; gap: 12px; }
			.mg-success-head .ico { width: 38px; height: 38px; background: rgba(255,255,255,.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
			.mg-success-head h3 { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 2px; }
			.mg-success-head p { font-size: 12px; color: rgba(255,255,255,.75); }
			.mg-success-body { padding: 20px 28px; }
			.mg-sum { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: #e5eaf2; border: 1px solid #e5eaf2; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
			.mg-sum-cell { background: #fff; padding: 11px 14px; }
			.mg-sum-cell .k { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #64748b; margin-bottom: 3px; }
			.mg-sum-cell .v { font-size: 13px; font-weight: 600; color: #0f172a; }
			.mg-sum-cell .v a { color: #1d4ed8; text-decoration: none; font-weight: 700; }
			.mg-sact { display: flex; gap: 10px; flex-wrap: wrap; }

			@media (max-width: 680px) {
				.mg-g2, .mg-sum { grid-template-columns: 1fr; }
				.mg-span2 { grid-column: span 1; }
			}
		</style>

		<nav class="mg-nav">
			<a class="mg-brand" href="/app">
				<div class="mg-brand-ico">🏠</div>
				<span class="mg-brand-name">Indsys</span>
			</a>
		</nav>

		<div class="mg-body">

			<div class="mg-page-title">
				<h1>Visitor Pass Request</h1>
				<p>Register a pre-approved visitor on behalf of management.</p>
			</div>

			<div class="mg-banner">
				<div class="mg-banner-text">
					<h2>Management Registration</h2>
					<div class="mg-banner-badge"><div class="dot"></div>Management Access</div>
				</div>
			</div>

			<!-- Success card -->
			<div class="mg-success" id="mg-success">
				<div class="mg-success-head">
					<div class="ico">✓</div>
					<div>
						<h3>Request Approved &amp; Pass Issued</h3>
						<p>Management requests are pre-approved automatically.</p>
					</div>
				</div>
				<div class="mg-success-body">
					<div class="mg-sum">
						<div class="mg-sum-cell"><div class="k">Request No.</div><div class="v"><a id="mg-ref-no" href="#" target="_blank"></a></div></div>
						<div class="mg-sum-cell"><div class="k">Visitor</div><div class="v" id="mg-ref-name"></div></div>
						<div class="mg-sum-cell"><div class="k">Host</div><div class="v" id="mg-ref-host"></div></div>
						<div class="mg-sum-cell"><div class="k">Visit Date</div><div class="v" id="mg-ref-date"></div></div>
						<div class="mg-sum-cell"><div class="k">Visit Time</div><div class="v" id="mg-ref-time"></div></div>
						<div class="mg-sum-cell"><div class="k">Status</div><div class="v" style="color:#065f46;font-weight:700">✓ Approved</div></div>
					</div>
					<div class="mg-sact">
						<a id="mg-open-btn" href="#" target="_blank" class="mg-btn mg-btn-primary" style="text-decoration:none;font-size:13px;padding:10px 20px">↗ Open Request</a>
						<button class="mg-btn mg-btn-secondary" data-a="reset" style="font-size:13px;padding:10px 20px">+ New Request</button>
					</div>
				</div>
			</div>

			<!-- Form card -->
			<div class="mg-card" id="mg-form-card">
				<div class="mg-card-body">

					<div class="mg-g2" style="margin-bottom:20px">
						<div class="mg-field">
							<label>Visitor Name <span class="req">*</span></label>
							<input type="text" data-k="visitor_name" placeholder="Enter visitor's full name">
						</div>
						<div class="mg-field">
							<label>Phone Number</label>
							<div class="mg-phone-wrap">
								<select id="mg-phone-code" class="mg-phone-code">
									<option value="+91">🇮🇳 +91</option>
									<option value="+1">🇺🇸 +1</option>
									<option value="+44">🇬🇧 +44</option>
									<option value="+61">🇦🇺 +61</option>
									<option value="+971">🇦🇪 +971</option>
									<option value="+65">🇸🇬 +65</option>
									<option value="+60">🇲🇾 +60</option>
									<option value="+81">🇯🇵 +81</option>
									<option value="+49">🇩🇪 +49</option>
									<option value="+33">🇫🇷 +33</option>
									<option value="+86">🇨🇳 +86</option>
									<option value="+92">🇵🇰 +92</option>
									<option value="+880">🇧🇩 +880</option>
									<option value="+94">🇱🇰 +94</option>
									<option value="+977">🇳🇵 +977</option>
								</select>
								<input type="tel" id="mg-phone-num" class="mg-phone-num" placeholder="Enter phone number">
							</div>
						</div>
						<div class="mg-field">
							<label>Email Address <span class="req">*</span></label>
							<input type="email" data-k="visitor_email" placeholder="Enter email address">
						</div>
						<div class="mg-field">
							<label>Company / Organisation</label>
							<input type="text" data-k="visitor_company" placeholder="Enter company name">
						</div>
					</div>

					<div class="mg-sec">Visit Details</div>

					

					<div class="mg-g2">
						<div class="mg-field">
							<label>Host Name <span class="req">*</span></label>
							<div class="mg-link" data-ctrl="host_employee"></div>
						</div>
						<div class="mg-field">
							<label>Site</label>
							<div class="mg-link" data-ctrl="site"></div>
						</div>
						<div class="mg-field">
							<label>Visit Date <span class="req">*</span></label>
							<input type="date" data-k="expected_visit_date">
						</div>
						<div class="mg-field">
							<label>Visit Time <span class="req">*</span></label>
							<input type="time" data-k="expected_visit_time">
						</div>
						<div class="mg-field mg-span2">
							<label>Reason for Visit <span class="req">*</span></label>
							<textarea data-k="visit_purpose" placeholder="Enter the purpose of the visit."></textarea>
						</div>
					</div>

				</div>

				<div class="mg-actions">
					<button class="mg-btn mg-btn-secondary" data-a="cancel">Cancel</button>
					<button class="mg-btn mg-btn-primary" data-a="submit" id="mg-submit">Submit Request</button>
				</div>
			</div>

		</div>
		</div>`);

		this.$r = $(this.page.body).find(".mg-root");
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

	get_phone() {
		const code = this.$r.find("#mg-phone-code").val() || "+91";
		const num = (this.$r.find("#mg-phone-num").val() || "").trim();
		return num ? code + num : "";
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
						visitor_name: this.val("visitor_name"),
						visitor_email: this.val("visitor_email"),
						visitor_phone: this.get_phone(),
						visitor_company: this.val("visitor_company"),
						host_employee: this.host_ctrl.get_value(),
						site: this.site_ctrl.get_value(),
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
			console.error("Submit error:", e);
			frappe.show_alert({ message: __("Submission failed. Please try again."), indicator: "red" });
		} finally {
			btn.prop("disabled", false).text(__("Submit Request"));
		}
	}

	show_success() {
		const date = frappe.datetime.str_to_user(this.val("expected_visit_date")) || "—";
		this.$r.find("#mg-form-card").hide();
		this.$r.find("#mg-success").addClass("show");
		this.$r.find("#mg-ref-no").attr("href", `/app/visitor-pass-request/${this.docname}`).text(this.docname);
		this.$r.find("#mg-open-btn").attr("href", `/app/visitor-pass-request/${this.docname}`);
		this.$r.find("#mg-ref-name").text(this.val("visitor_name"));
		this.$r.find("#mg-ref-host").text(this.host_ctrl.get_value() || "—");
		this.$r.find("#mg-ref-date").text(date);
		this.$r.find("#mg-ref-time").text(this.val("expected_visit_time") || "—");
		this.$r.find("#mg-success")[0].scrollIntoView({ behavior: "smooth", block: "start" });
	}

	val(k) { return (this.$r.find(`[data-k='${k}']`).val() || "").trim(); }

	reset() {
		this.docname = null;
		this.$r.find("input[data-k], textarea").val("");
		this.$r.find("select").prop("selectedIndex", 0);
		this.host_ctrl.set_value(""); this.site_ctrl.set_value("");
		this.$r.find("#mg-success").removeClass("show");
		this.$r.find("#mg-form-card").show();
		this.$r.find("[data-a='submit']").prop("disabled", false).text(__("Submit Request"));
		this.$r.find("[data-k='expected_visit_date']").val(frappe.datetime.get_today());
		this.$r.find("#mg-phone-num").val("");
		this.$r.find("#mg-phone-code").val("+91");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}
}