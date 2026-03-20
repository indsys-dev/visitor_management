frappe.pages["visitor-pass-entry-self"].on_page_load = function (wrapper) {
	new VisitorPassEntrySelf(wrapper);
};

class VisitorPassEntrySelf {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "",
			single_column: true,
		});
		// hide default frappe page header
		$(this.page.main).find(".page-head").hide();
		this.docname = null;
		this.make_layout();
		this.make_controls();
		this.bind_events();
	}

	make_layout() {
		$(this.page.body).css({ padding: 0, background: "#f0f4f8" }).html(`
		<div class="s-root">
		<style>
			.s-root{font-family:"Inter","Segoe UI",sans-serif;background:#f0f4f8;min-height:100vh;display:flex;flex-direction:column}
			.s-root *{box-sizing:border-box;margin:0;padding:0}

			/* NAV */
			.s-nav{
				background:#1a3a6e;height:54px;padding:0 28px;
				display:flex;align-items:center;justify-content:space-between;
				box-shadow:0 2px 10px rgba(10,30,70,.3);flex-shrink:0;
			}
			.s-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
			.s-brand-ico{width:30px;height:30px;background:rgba(255,255,255,.18);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px}
			.s-brand-name{color:#fff;font-size:14px;font-weight:700;letter-spacing:.1px}
			.s-nav-links{display:flex;align-items:center;gap:6px}
			.s-nav-a{color:rgba(255,255,255,.75);font-size:13px;font-weight:500;padding:6px 12px;border-radius:6px;text-decoration:none;transition:all .15s;cursor:pointer;white-space:nowrap}
			.s-nav-a:hover{color:#fff;background:rgba(255,255,255,.1)}
			.s-nav-user{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.85);font-size:13px;font-weight:500;cursor:pointer;padding:5px 10px;border-radius:6px;transition:background .15s}
			.s-nav-user:hover{background:rgba(255,255,255,.1)}
			.s-nav-user .av{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px}

			/* BODY */
			.s-body{flex:1;max-width:820px;margin:0 auto;width:100%;padding:28px 20px 36px}

			/* TITLE */
			.s-title{margin-bottom:20px}
			.s-title h1{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin-bottom:4px}
			.s-title p{font-size:13px;color:#64748b}

			/* HERO BANNER */
			.s-hero{
				background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 55%,#93c5fd 100%);
				border-radius:12px;height:140px;margin-bottom:22px;
				position:relative;overflow:hidden;
				display:flex;align-items:center;padding:0 28px;
				box-shadow:0 1px 4px rgba(0,0,0,.06),0 6px 18px rgba(0,0,0,.06);
			}
			.s-hero-illus{
				position:absolute;left:0;top:0;height:100%;width:320px;
				background:linear-gradient(90deg,rgba(191,219,254,.9) 60%,transparent);
				display:flex;align-items:flex-end;padding-left:16px;
			}
			.s-hero-fig{font-size:72px;line-height:1;opacity:.55;margin-bottom:-8px}
			.s-hero-text{position:relative;z-index:1;margin-left:200px}
			.s-hero-text h2{font-size:17px;font-weight:800;color:#0f2347;margin-bottom:4px}
			.s-hero-text p{font-size:12px;color:#1e3a8a;opacity:.8}
			.s-hero-badge{margin-top:8px;display:inline-flex;align-items:center;gap:5px;background:#1a3a6e;color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.3px}
			.s-hero-badge .dot{width:5px;height:5px;border-radius:50%;background:#34d399}

			/* SUCCESS */
			.s-success{display:none;background:#fff;border:1px solid #86efac;border-radius:12px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
			.s-success.show{display:block}
			.s-success-head{background:linear-gradient(135deg,#065f46,#047857);padding:16px 20px;display:flex;align-items:center;gap:10px}
			.s-success-head .ico{width:34px;height:34px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
			.s-success-head h3{font-size:14px;font-weight:700;color:#fff;margin-bottom:1px}
			.s-success-head p{font-size:11px;color:rgba(255,255,255,.75)}
			.s-success-body{padding:16px 20px}
			.s-ref-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e2e8f0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:12px}
			.s-ref-cell{background:#fff;padding:10px 13px}
			.s-ref-cell .k{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:3px}
			.s-ref-cell .v{font-size:12px;font-weight:600;color:#0f172a}
			.s-ref-cell .v a{color:#2563eb;text-decoration:none;font-weight:700}
			.s-sact{display:flex;gap:8px;flex-wrap:wrap}

			/* FORM CARD */
			.s-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.05);overflow:hidden;margin-bottom:14px}
			.s-card-body{padding:22px}

			/* SECTION LABEL */
			.s-sec-label{font-size:13px;font-weight:700;color:#1e3a8a;margin-bottom:14px;display:flex;align-items:center;gap:8px}
			.s-sec-label::after{content:"";flex:1;height:1px;background:#e2e8f0}

			/* GRID */
			.s-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
			.s-span2{grid-column:span 2}

			/* FIELD */
			.s-field{display:flex;flex-direction:column;gap:5px}
			.s-field label{font-size:12px;font-weight:600;color:#334155}
			.s-field label .req{color:#be123c;margin-left:2px}
			.s-field input,.s-field select,.s-field textarea{
				width:100%;padding:10px 13px;
				border:1.5px solid #cbd5e1;border-radius:8px;
				font-size:13.5px;color:#0f172a;background:#fff;
				outline:none;font-family:inherit;
				transition:border-color .15s,box-shadow .15s;
			}
			.s-field input::placeholder,.s-field textarea::placeholder{color:#94a3b8}
			.s-field input:focus,.s-field select:focus,.s-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
			.s-field textarea{resize:vertical;min-height:90px;line-height:1.6}

			/* LINK CTRL */
			.s-link .form-group{margin:0}
			.s-link .form-control{padding:10px 13px!important;border:1.5px solid #cbd5e1!important;border-radius:8px!important;font-size:13.5px!important;height:auto!important;font-family:inherit!important;color:#0f172a!important}
			.s-link .form-control:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.10)!important}
			.s-link .clearfix,.s-link .help-box{display:none}

			/* UPLOAD */
			.s-upload{
				border:2px dashed #cbd5e1;border-radius:10px;
				padding:22px;text-align:center;background:#f8fafc;
				transition:all .15s;margin-top:4px;
			}
			.s-upload:hover{border-color:#2563eb;background:#eff6ff}
			.s-upload.done{border-style:solid;border-color:#86efac;background:#ecfdf5}
			.s-upload .ui{font-size:28px;margin-bottom:6px}
			.s-upload h4{font-size:13px;font-weight:600;color:#0f172a;margin-bottom:3px}
			.s-upload p{font-size:11px;color:#64748b;margin-bottom:10px}
			.s-upload .ubtns{display:flex;gap:6px;justify-content:center}
			.s-upload .udone{display:none;font-size:12px;font-weight:700;color:#065f46;margin-top:6px}
			.s-upload.done .udone{display:block}
			.s-upload-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}

			/* ACTIONS */
			.s-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 22px;background:#f8faff;border-top:1px solid #e2e8f0}

			/* BTN */
			.s-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
			.s-btn-primary{background:#1a3a6e;color:#fff;box-shadow:0 2px 8px rgba(26,58,110,.28)}
			.s-btn-primary:hover{background:#2351a3;box-shadow:0 4px 14px rgba(26,58,110,.32);transform:translateY(-1px)}
			.s-btn-primary:active{transform:none}
			.s-btn-secondary{background:#fff;color:#334155;border:1.5px solid #cbd5e1}
			.s-btn-secondary:hover{background:#f1f5f9}
			.s-btn-sm{padding:6px 12px;font-size:12px}
			.s-btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important}

			@media(max-width:640px){
				.s-g2,.s-upload-row,.s-ref-grid{grid-template-columns:1fr}
				.s-span2{grid-column:span 1}
				.s-hero-text{margin-left:0}
				.s-hero-illus{display:none}
			}
		</style>

		<!-- NAV -->
		<nav class="s-nav">
			<a class="s-brand" href="/app">
				<div class="s-brand-ico">🏠</div>
				<span class="s-brand-name">Visitor Management</span>
			</a>
			<div class="s-nav-links">
				<a class="s-nav-a" href="/app/vms-dashboard">Dashboard</a>
				<a class="s-nav-a" href="/app/visitor-pass">Visitor Log</a>
				<div class="s-nav-user">
					<div class="av">👤</div>
					<span id="s-username"></span>
					<span style="opacity:.5;font-size:10px">▾</span>
				</div>
			</div>
		</nav>

		<!-- BODY -->
		<div class="s-body">

			<!-- Title -->
			<div class="s-title">
				<h1>Visitor Pass Request</h1>
				<p>Submit your details to request a visitor pass for entry.</p>
			</div>

			<!-- Hero -->
			<div class="s-hero">
				<div class="s-hero-illus">
					<div class="s-hero-fig">🧑‍💼🛂</div>
				</div>
				<div class="s-hero-text">
					<h2>Self Registration</h2>
					<p>Fill in all required details to register as a visitor.</p>
					<div class="s-hero-badge"><div class="dot"></div>Self Registration</div>
				</div>
			</div>

			<!-- Success -->
			<div class="s-success" id="s-success">
				<div class="s-success-head">
					<div class="ico">✓</div>
					<div>
						<h3>Request Submitted Successfully</h3>
						<p>Awaiting host OTP verification and approval.</p>
					</div>
				</div>
				<div class="s-success-body">
					<div class="s-ref-grid">
						<div class="s-ref-cell"><div class="k">Request No.</div><div class="v"><a id="s-ref-no" href="#" target="_blank"></a></div></div>
						<div class="s-ref-cell"><div class="k">Visitor</div><div class="v" id="s-ref-name"></div></div>
						<div class="s-ref-cell"><div class="k">Host</div><div class="v" id="s-ref-host"></div></div>
						<div class="s-ref-cell"><div class="k">Visit Date</div><div class="v" id="s-ref-date"></div></div>
						<div class="s-ref-cell"><div class="k">Visit Time</div><div class="v" id="s-ref-time"></div></div>
						<div class="s-ref-cell"><div class="k">Status</div><div class="v" style="color:#b45309">Pending OTP</div></div>
					</div>
					<!-- OTP verification step -->
					<div id="s-otp-section" style="margin-bottom:14px">
						<div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:8px">
							📧 Enter the OTP sent to your email
						</div>
						<div style="font-size:12px;color:#64748b;margin-bottom:12px">
							Check your inbox for a 6-digit code and enter it below to verify your identity.
						</div>
						<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
							<input id="s-otp-input" type="text" maxlength="6"
								placeholder="Enter 6-digit OTP"
								style="padding:10px 14px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:6px;width:180px;text-align:center;outline:none;font-family:inherit">
							<button class="s-btn s-btn-primary" data-a="verify-otp" style="font-size:13px;padding:10px 18px">
								Verify OTP
							</button>
							<button class="s-btn s-btn-secondary" data-a="resend-otp" style="font-size:12px;padding:10px 14px">
								Resend OTP
							</button>
						</div>
						<div id="s-otp-msg" style="margin-top:8px;font-size:12px;display:none"></div>
					</div>

					<!-- Shown after OTP verified -->
					<div id="s-verified-section" style="display:none;margin-bottom:14px">
						<div style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:12px 16px;font-size:13px;color:#065f46;font-weight:600">
							✓ Identity verified. Your request has been sent to the host for approval. You will receive an email once approved.
						</div>
					</div>

					<div class="s-sact">
						<a id="s-open-btn" href="#" target="_blank" class="s-btn s-btn-primary" style="text-decoration:none;font-size:12px;padding:8px 16px">↗ Open Request</a>
						<button class="s-btn s-btn-secondary" data-a="reset" style="font-size:12px;padding:8px 16px">+ New Request</button>
					</div>
				</div>
			</div>

			<!-- Form card -->
			<div class="s-card">
				<div class="s-card-body">

					<!-- Visitor Info -->
					<div class="s-sec-label">Visitor Information</div>
					<div class="s-g2" style="margin-bottom:16px">
						<div class="s-field">
							<label>Visitor Name <span class="req">*</span></label>
							<input type="text" data-k="visitor_name" placeholder="Enter visitor's full name">
						</div>
						<div class="s-field">
							<label>Phone Number</label>
							<input type="tel" data-k="visitor_phone" placeholder="Enter phone number">
						</div>
						<div class="s-field">
							<label>Email Address <span class="req">*</span></label>
							<input type="email" data-k="visitor_email" placeholder="Enter email address">
						</div>
						<div class="s-field">
							<label>Host Name <span class="req">*</span></label>
							<div class="s-link" data-ctrl="host_employee"></div>
						</div>
						<div class="s-field">
							<label>Visit Date <span class="req">*</span></label>
							<input type="date" data-k="expected_visit_date">
						</div>
						<div class="s-field">
							<label>Visit Time <span class="req">*</span></label>
							<input type="time" data-k="expected_visit_time">
						</div>
						<div class="s-field">
							<label>Site</label>
							<div class="s-link" data-ctrl="site"></div>
						</div>
						<div class="s-field">
							<label>Company / Organisation</label>
							<input type="text" data-k="visitor_company" placeholder="Enter company name">
						</div>
						<div class="s-field s-span2">
							<label>Reason for Visit <span class="req">*</span></label>
							<textarea data-k="visit_purpose" placeholder="Enter the purpose of the visit."></textarea>
						</div>
					</div>

					<!-- ID Proof -->
					<div class="s-sec-label">Identity Proof</div>
					<div class="s-g2" style="margin-bottom:16px">
						<div class="s-field">
							<label>ID Proof Type <span class="req">*</span></label>
							<select data-k="id_proof_type">
								<option value="">Select ID type</option>
								<option value="Aadhar">Aadhar Card</option>
								<option value="Passport">Passport</option>
								<option value="Driving License">Driving License</option>
								<option value="Other">Other</option>
							</select>
						</div>
						<div class="s-field">
							<label>ID Proof Number <span class="req">*</span></label>
							<input type="text" data-k="id_proof_number" placeholder="Enter document number">
						</div>
					</div>

					<!-- Upload ID Proof -->
					<div class="s-sec-label">Upload ID Proof</div>
					<div class="s-upload-row">
						<div class="s-upload" id="cap-face">
							<div class="ui">🤳</div>
							<h4>Face Photo</h4>
							<p>Capture live face photo for gate verification</p>
							<div class="ubtns">
								<button class="s-btn s-btn-secondary s-btn-sm" data-a="face-web">Webcam</button>
								<button class="s-btn s-btn-secondary s-btn-sm" data-a="face-mob">Camera</button>
							</div>
							<div class="udone">✓ Face photo captured</div>
						</div>
						<div class="s-upload" id="cap-id" style="cursor:pointer" onclick="this.querySelector('[data-a=id-browse]').click()">
							<div class="ui">📤</div>
							<h4>Upload ID Document</h4>
							<p>Drag & drop files here or <strong style="color:#2563eb">Browse</strong><br><span style="font-size:10px;color:#94a3b8">Accepted file types: JPG, PNG, PDF</span></p>
							<div class="ubtns">
								<button class="s-btn s-btn-secondary s-btn-sm" data-a="id-browse" onclick="event.stopPropagation()">Browse</button>
								<button class="s-btn s-btn-secondary s-btn-sm" data-a="id-cam" onclick="event.stopPropagation()">Scan (Webcam)</button>
							</div>
							<div class="udone">✓ ID document uploaded</div>
						</div>
					</div>

				</div>

				<!-- Action bar -->
				<div class="s-actions">
					<button class="s-btn s-btn-secondary" data-a="cancel">Cancel</button>
					<button class="s-btn s-btn-primary" data-a="submit" id="s-submit">Submit Request</button>
				</div>
			</div>

		</div>
		</div>`);

		this.$r = $(this.page.body).find(".s-root");
		this.$r.find("#s-username").text(frappe.session.user_fullname || frappe.session.user);
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
		this.$r.find("[data-a='face-web']").on("click", (e) => { e.stopPropagation(); this.webcam("face_photo"); });
		this.$r.find("[data-a='face-mob']").on("click", (e) => { e.stopPropagation(); this.file_input("face_photo", "user"); });
		this.$r.find("[data-a='id-browse']").on("click", (e) => { e.stopPropagation(); this.file_input("id_proof_image", "environment"); });
		this.$r.find("[data-a='id-cam']").on("click", (e) => { e.stopPropagation(); this.webcam("id_proof_image"); });
		this.$r.find("[data-a='verify-otp']").on("click", () => this.verify_otp());
		this.$r.find("[data-a='resend-otp']").on("click", () => this.resend_otp());
	}

	validate() {
		const n = this.val("visitor_name"), e = this.val("visitor_email"),
			h = this.host_ctrl.get_value(),
			d = this.val("expected_visit_date"), t = this.val("expected_visit_time"),
			p = this.val("visit_purpose"),
			it = this.val("id_proof_type"), in_ = this.val("id_proof_number");
		if (!n || !e || !h || !d || !t || !p || !it || !in_) {
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
						id_proof_type: this.val("id_proof_type"), id_proof_number: this.val("id_proof_number"),
						host_employee: this.host_ctrl.get_value(), site: this.site_ctrl.get_value(),
						visit_purpose: this.val("visit_purpose"),
						expected_visit_date: this.val("expected_visit_date"),
						expected_visit_time: this.val("expected_visit_time"),
						requested_by: "Self",
					},
				},
			});
			this.docname = r.message.name;
			this.show_success();
			frappe.show_alert({ message: __("Request submitted"), indicator: "green" });
		} catch (e) {
			frappe.show_alert({ message: __("Submission failed. Please try again."), indicator: "red" });
		} finally {
			btn.prop("disabled", false).text(__("Submit Request"));
		}
	}

	async verify_otp() {
		const otp = this.$r.find("#s-otp-input").val().trim();
		if (!otp || otp.length < 6) {
			frappe.show_alert({ message: __("Please enter the 6-digit OTP"), indicator: "red" });
			return;
		}
		const btn = this.$r.find("[data-a='verify-otp']").prop("disabled", true).text(__("Verifying..."));
		try {
			const r = await frappe.call({
				method: "visitor_management.api.otp.verify_otp",
				args: { request_name: this.docname, otp_input: otp },
			});
			const msg = this.$r.find("#s-otp-msg").show();
			if (r.message.verified) {
				msg.css("color", "#065f46").text("✓ " + (r.message.message || __("OTP verified")));
				this.$r.find("#s-otp-section").hide();
				this.$r.find("#s-verified-section").show();
				frappe.show_alert({ message: __("OTP verified. Host notified for approval."), indicator: "green" });
			} else {
				msg.css("color", "#be123c").text("✗ " + (r.message.message || __("Invalid OTP")));
			}
		} catch (e) {
			frappe.show_alert({ message: __("Verification failed. Please try again."), indicator: "red" });
		} finally {
			btn.prop("disabled", false).text(__("Verify OTP"));
		}
	}

	async resend_otp() {
		if (!this.docname) return;
		const btn = this.$r.find("[data-a='resend-otp']").prop("disabled", true).text(__("Sending..."));
		try {
			await frappe.call({
				method: "visitor_management.api.otp.send_otp",
				args: { request_name: this.docname },
			});
			frappe.show_alert({ message: __("OTP resent to your email"), indicator: "green" });
			this.$r.find("#s-otp-msg").hide();
			this.$r.find("#s-otp-input").val("");
		} finally {
			btn.prop("disabled", false).text(__("Resend OTP"));
		}
	}

	show_success() {
		const date = frappe.datetime.str_to_user(this.val("expected_visit_date")) || "—";
		this.$r.find("#s-success").addClass("show");
		this.$r.find("[data-a='submit']").prop("disabled", true);
		this.$r.find("#s-ref-no").attr("href", `/app/visitor-pass-request/${this.docname}`).text(this.docname);
		this.$r.find("#s-open-btn").attr("href", `/app/visitor-pass-request/${this.docname}`);
		this.$r.find("#s-ref-name").text(this.val("visitor_name"));
		this.$r.find("#s-ref-host").text(this.host_ctrl.get_value() || "—");
		this.$r.find("#s-ref-date").text(date);
		this.$r.find("#s-ref-time").text(this.val("expected_visit_time") || "—");
		this.$r.find("#s-success")[0].scrollIntoView({ behavior: "smooth", block: "start" });
	}

	async webcam(fieldname) {
		if (!this.docname) { frappe.show_alert({ message: __("Submit request first"), indicator: "orange" }); return; }
		const is_face = fieldname === "face_photo";
		const d = new frappe.ui.Dialog({
			title: is_face ? __("Capture Face Photo") : __("Scan ID Document"),
			fields: [{ fieldtype: "HTML", fieldname: "cam" }],
			primary_action_label: __("Capture"),
			primary_action: async () => {
				try {
					const v = d.$wrapper.find("video")[0], c = d.$wrapper.find("canvas")[0];
					c.width = v.videoWidth; c.height = v.videoHeight;
					c.getContext("2d").drawImage(v, 0, 0);
					await this.save_img(fieldname, c.toDataURL("image/jpeg", 0.85));
					this.mark_done(fieldname);
				} finally { this.stop_stream(d); d.hide(); }
			},
		});
		d.$wrapper.on("hidden.bs.modal", () => this.stop_stream(d));
		d.show();
		d.fields_dict.cam.$wrapper.html(`
			<video autoplay playsinline style="width:100%;max-height:300px;border-radius:8px;background:#000;display:block"></video>
			<canvas style="display:none"></canvas>
			<div style="font-size:11px;color:#64748b;margin-top:6px;text-align:center">${is_face ? "Centre your face in the frame" : "Show the full document clearly"}</div>`);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: is_face ? "user" : { ideal: "environment" } } });
			d._stream = stream;
			d.$wrapper.find("video")[0].srcObject = stream;
		} catch { d.fields_dict.cam.$wrapper.html(`<div style="padding:20px;text-align:center;color:#be123c">${__("Camera unavailable. Use Browse instead.")}</div>`); }
	}

	file_input(fieldname, facing) {
		if (!this.docname) { frappe.show_alert({ message: __("Submit request first"), indicator: "orange" }); return; }
		const inp = document.createElement("input");
		inp.type = "file"; inp.accept = "image/*,application/pdf"; inp.capture = facing;
		inp.onchange = () => {
			const f = inp.files[0]; if (!f) return;
			const reader = new FileReader();
			reader.onload = async (e) => { await this.save_img(fieldname, e.target.result); this.mark_done(fieldname); };
			reader.readAsDataURL(f);
		};
		inp.click();
	}

	async save_img(fieldname, b64) {
		await frappe.call({ method: "visitor_management.api.face_capture.save_face_photo", args: { doctype: "Visitor Pass Request", docname: this.docname, image_b64: b64, field: fieldname } });
		frappe.show_alert({ message: __("Image saved"), indicator: "green" });
	}

	mark_done(fieldname) { this.$r.find(fieldname === "face_photo" ? "#cap-face" : "#cap-id").addClass("done"); }
	stop_stream(d) { if (d._stream) { d._stream.getTracks().forEach(t => t.stop()); d._stream = null; } }
	val(k) { return (this.$r.find(`[data-k='${k}']`).val() || "").trim(); }

	reset() {
		this.docname = null;
		this.$r.find("input, textarea").val("");
		this.$r.find("select").prop("selectedIndex", 0);
		this.host_ctrl.set_value(""); this.site_ctrl.set_value("");
		this.$r.find("#s-success").removeClass("show");
		this.$r.find(".s-upload").removeClass("done");
		this.$r.find("[data-a='submit']").prop("disabled", false).text(__("Submit Request"));
		this.$r.find("[data-k='expected_visit_date']").val(frappe.datetime.get_today());
		window.scrollTo({ top: 0, behavior: "smooth" });
		this.$r.find("#s-otp-input").val("");
		this.$r.find("#s-otp-msg").hide();
		this.$r.find("#s-otp-section").show();
		this.$r.find("#s-verified-section").hide();
	}
}