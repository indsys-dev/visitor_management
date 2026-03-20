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
		$(this.page.main).find(".page-head").hide();
		this.docname = null;
		this.face_b64 = null;
		this.id_front_b64 = null;
		this.id_back_b64 = null;
		this.make_layout();
		this.make_controls();
		this.bind_events();
	}

	make_layout() {
		$(this.page.body).css({ padding: 0, background: "#eef2f7" }).html(`
		<div class="vr-root">
		<style>
			.vr-root { font-family: "Segoe UI", Arial, sans-serif; background: #eef2f7; min-height: 100vh; display: flex; flex-direction: column; }
			.vr-root * { box-sizing: border-box; margin: 0; padding: 0; }

			.vr-nav { background: #1e3a6e; height: 56px; padding: 0 28px; display: flex; align-items: center; box-shadow: 0 2px 8px rgba(10,25,60,.25); flex-shrink: 0; }
			.vr-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
			.vr-brand-ico { width: 32px; height: 32px; background: rgba(255,255,255,.18); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
			.vr-brand-name { color: #fff; font-size: 15px; font-weight: 700; }

			.vr-body { flex: 1; max-width: 860px; margin: 0 auto; width: 100%; padding: 32px 20px 48px; }

			.vr-page-title { margin-bottom: 22px; }
			.vr-page-title h1 { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -.5px; margin-bottom: 5px; }
			.vr-page-title p { font-size: 14px; color: #64748b; }

			.vr-banner { background: linear-gradient(120deg, #c7deff 0%, #d6e8ff 40%, #e8f2ff 100%); border-radius: 14px; height: 160px; margin-bottom: 28px; position: relative; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 6px 20px rgba(0,0,0,.06); display: flex; align-items: center; }
			.vr-banner-art { position: absolute; left: 0; top: 0; height: 100%; width: 55%; display: flex; align-items: flex-end; padding-left: 20px; }
			.vr-banner-art .art { font-size: 90px; line-height: 1; opacity: .45; margin-bottom: -4px; }
			.vr-banner-right { position: absolute; right: 0; top: 0; bottom: 0; width: 50%; background: linear-gradient(90deg, transparent, rgba(200,220,255,.6)); }

			.vr-card { background: #fff; border: 1px solid #dde5f0; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05); overflow: hidden; }
			.vr-card-body { padding: 28px 28px 20px; }

			.vr-sec { font-size: 13px; font-weight: 700; color: #1e3a6e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
			.vr-sec::after { content: ""; flex: 1; height: 1px; background: #e5eaf2; }

			.vr-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
			.vr-span2 { grid-column: span 2; }

			.vr-field { display: flex; flex-direction: column; gap: 6px; }
			.vr-field label { font-size: 13px; font-weight: 600; color: #1e3a6e; }
			.vr-field label .req { color: #dc2626; margin-left: 2px; }
			.vr-field input, .vr-field select, .vr-field textarea {
				width: 100%; padding: 11px 14px;
				border: 1.5px solid #c8d4e8; border-radius: 8px;
				font-size: 14px; color: #0f172a; background: #fff;
				outline: none; font-family: inherit;
				transition: border-color .15s, box-shadow .15s;
			}
			.vr-field input::placeholder, .vr-field textarea::placeholder { color: #94a3b8; }
			.vr-field input:focus, .vr-field select:focus, .vr-field textarea:focus { border-color: #1e3a6e; box-shadow: 0 0 0 3px rgba(30,58,110,.10); }
			.vr-field textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

			/* ── CUSTOM PHONE FIELD ── */
			.vr-phone-wrap { display: flex; border: 1.5px solid #c8d4e8; border-radius: 8px; overflow: hidden; background: #fff; transition: border-color .15s, box-shadow .15s; }
			.vr-phone-wrap:focus-within { border-color: #1e3a6e; box-shadow: 0 0 0 3px rgba(30,58,110,.10); }
			.vr-phone-code { padding: 11px 10px; background: #f1f5f9; border: none; border-right: 1.5px solid #c8d4e8; font-size: 13px; color: #0f172a; font-family: inherit; cursor: pointer; outline: none; width: auto !important; min-width: 90px; flex-shrink: 0; }
			.vr-phone-code:focus { background: #e8eef8; }
			.vr-phone-num { flex: 1 !important; width: 0 !important; min-width: 0; padding: 11px 14px; border: none; font-size: 14px; color: #0f172a; background: #fff; outline: none; font-family: inherit; }
			.vr-phone-num::placeholder { color: #94a3b8; }

			/* ── LINK CTRL ── */
			.vr-link .form-group { margin: 0; }
			.vr-link .form-control { padding: 11px 14px !important; border: 1.5px solid #c8d4e8 !important; border-radius: 8px !important; font-size: 14px !important; height: auto !important; font-family: inherit !important; color: #0f172a !important; }
			.vr-link .form-control:focus { border-color: #1e3a6e !important; box-shadow: 0 0 0 3px rgba(30,58,110,.10) !important; }
			.vr-link .clearfix, .vr-link .help-box { display: none; }

			/* ── UPLOAD ── */
			.vr-upload-box { border: 2px dashed #c8d4e8; border-radius: 12px; padding: 22px 16px; text-align: center; background: #f8fafc; transition: all .15s; cursor: pointer; }
			.vr-upload-box:hover { border-color: #1e3a6e; background: #eff4ff; }
			.vr-upload-box.done { border-style: solid; border-color: #22c55e; background: #f0fdf4; }
			.vr-upload-ico { font-size: 32px; margin-bottom: 8px; }
			.vr-upload-box h4 { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
			.vr-upload-box p { font-size: 12px; color: #64748b; margin-bottom: 12px; line-height: 1.4; }
			.vr-upload-box p strong { color: #1e3a6e; }
			.vr-upload-btns { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
			.vr-upload-done { display: none; font-size: 12px; font-weight: 700; color: #16a34a; margin-top: 8px; }
			.vr-upload-box.done .vr-upload-done { display: block; }
			.vr-upload-box.done .vr-upload-btns { opacity: .35; pointer-events: none; }
			.vr-upload-thumb { width: 100%; max-height: 72px; object-fit: cover; border-radius: 6px; border: 1.5px solid #86efac; display: none; margin-top: 8px; }
			.vr-upload-box.done .vr-upload-thumb { display: block; }

			.vr-doc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
			.vr-doc-label { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
			.vr-doc-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
			.vr-doc-badge.face  { background: #dbeafe; color: #1d4ed8; }
			.vr-doc-badge.front { background: #fef9c3; color: #b45309; }
			.vr-doc-badge.back  { background: #dcfce7; color: #15803d; }

			.vr-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 18px 28px; background: #f8faff; border-top: 1px solid #e5eaf2; }

			.vr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 26px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all .15s; }
			.vr-btn-primary { background: #1e3a6e; color: #fff; box-shadow: 0 2px 8px rgba(30,58,110,.3); }
			.vr-btn-primary:hover { background: #274d94; transform: translateY(-1px); }
			.vr-btn-primary:active { transform: none; }
			.vr-btn-secondary { background: #fff; color: #374151; border: 1.5px solid #c8d4e8; }
			.vr-btn-secondary:hover { background: #f1f5f9; }
			.vr-btn-sm { padding: 7px 14px; font-size: 12px; }
			.vr-btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; }

			.vr-otp-card { background: #fff; border: 1px solid #bfdbfe; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05); overflow: hidden; display: none; }
			.vr-otp-card.show { display: block; }
			.vr-otp-head { background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 20px 28px; display: flex; align-items: center; gap: 14px; }
			.vr-otp-ico { width: 42px; height: 42px; background: rgba(255,255,255,.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
			.vr-otp-head h3 { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
			.vr-otp-head p { font-size: 12px; color: rgba(255,255,255,.8); }
			.vr-otp-body { padding: 28px; }

			.vr-sum { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: #e5eaf2; border: 1px solid #e5eaf2; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
			.vr-sum-cell { background: #fff; padding: 11px 14px; }
			.vr-sum-cell .k { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #64748b; margin-bottom: 3px; }
			.vr-sum-cell .v { font-size: 13px; font-weight: 600; color: #0f172a; }
			.vr-sum-cell .v a { color: #1d4ed8; text-decoration: none; font-weight: 700; }

			.vr-otp-steps { margin-bottom: 22px; }
			.vr-otp-step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 13px; color: #374151; }
			.vr-otp-step:last-child { margin-bottom: 0; }
			.vr-otp-step .sn { width: 22px; height: 22px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }

			.vr-otp-wrap { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
			.vr-otp-input { padding: 13px 18px; border: 2px solid #bfdbfe; border-radius: 8px; font-size: 24px; font-weight: 800; letter-spacing: 10px; width: 210px; text-align: center; outline: none; font-family: "Courier New", monospace; transition: border-color .15s, box-shadow .15s; }
			.vr-otp-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
			.vr-otp-msg { font-size: 13px; padding: 10px 14px; border-radius: 8px; display: none; margin-top: 4px; }
			.vr-otp-msg.ok { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
			.vr-otp-msg.err { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

			.vr-verified { display: none; background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; font-size: 13px; color: #16a34a; font-weight: 600; align-items: center; gap: 12px; }
			.vr-verified.show { display: flex; }
			.vr-new-wrap { display: none; margin-top: 14px; }

			@media (max-width: 680px) {
				.vr-g2, .vr-doc-grid, .vr-sum { grid-template-columns: 1fr; }
				.vr-span2 { grid-column: span 1; }
				.vr-otp-input { width: 100%; }
			}
		</style>

		<nav class="vr-nav">
			<a class="vr-brand" href="/app">
				<div class="vr-brand-ico">🏠</div>
				<span class="vr-brand-name">Visitor Management</span>
			</a>
		</nav>

		<div class="vr-body">
			<div class="vr-page-title">
				<h1>Visitor Pass Request</h1>
				<p>Submit details to request a visitor pass.</p>
			</div>

			<div class="vr-banner">
				<div class="vr-banner-art"><div class="art">🧑‍💼🛡️🏢</div></div>
				<div class="vr-banner-right"></div>
			</div>

			<div class="vr-verified" id="vr-verified">
				<span style="font-size:22px">✓</span>
				<div>
					<div>Identity verified successfully.</div>
					<div style="font-weight:400;font-size:12px;color:#15803d;margin-top:3px">Your request has been sent to the host for approval. You will receive an email once approved.</div>
				</div>
			</div>

			<div class="vr-card" id="vr-form-card">
				<div class="vr-card-body">

					<div class="vr-g2" style="margin-bottom:20px">
						<div class="vr-field">
							<label>Visitor Name <span class="req">*</span></label>
							<input type="text" data-k="visitor_name" placeholder="Enter visitor's full name">
						</div>
						<div class="vr-field">
							<label>Phone Number</label>
							<div class="vr-phone-wrap">
								<select id="vr-phone-code" class="vr-phone-code">
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
								<input type="tel" id="vr-phone-num" class="vr-phone-num" placeholder="Enter phone number">
							</div>
						</div>
						<div class="vr-field">
							<label>Email Address <span class="req">*</span></label>
							<input type="email" data-k="visitor_email" placeholder="Enter email address">
						</div>
						<div class="vr-field">
							<label>Host Name <span class="req">*</span></label>
							<div class="vr-link" data-ctrl="host_employee"></div>
						</div>
						<div class="vr-field">
							<label>Visit Date <span class="req">*</span></label>
							<input type="date" data-k="expected_visit_date">
						</div>
						<div class="vr-field">
							<label>Visit Time <span class="req">*</span></label>
							<input type="time" data-k="expected_visit_time">
						</div>
						<div class="vr-field">
							<label>Site</label>
							<div class="vr-link" data-ctrl="site"></div>
						</div>
						<div class="vr-field">
							<label>Company / Organisation</label>
							<input type="text" data-k="visitor_company" placeholder="Enter company name">
						</div>
						<div class="vr-field vr-span2">
							<label>Reason for Visit <span class="req">*</span></label>
							<textarea data-k="visit_purpose" placeholder="Enter the purpose of the visit."></textarea>
						</div>
					</div>

					<div class="vr-sec">ID Proof Details</div>
					<div class="vr-g2" style="margin-bottom:22px">
						<div class="vr-field">
							<label>ID Proof Type <span class="req">*</span></label>
							<select data-k="id_proof_type">
								<option value="">Select ID type</option>
								<option value="Aadhar">Aadhar Card</option>
								<option value="Passport">Passport</option>
								<option value="Driving License">Driving License</option>
								<option value="Other">Other</option>
							</select>
						</div>
						<div class="vr-field">
							<label>ID Proof Number <span class="req">*</span></label>
							<input type="text" data-k="id_proof_number" placeholder="Enter document number">
						</div>
					</div>

					<div class="vr-sec">Upload Documents</div>
					<div class="vr-doc-grid">
						<div>
							<div class="vr-doc-label"><span class="vr-doc-badge face">Face</span>Face Photo <span style="color:#dc2626">*</span></div>
							<div class="vr-upload-box" id="cap-face">
								<div class="vr-upload-ico">🤳</div>
								<h4>Capture Face Photo</h4>
								<p>Live photo for identity verification</p>
								<div class="vr-upload-btns">
									<button class="vr-btn vr-btn-secondary vr-btn-sm" data-a="face-web" onclick="event.stopPropagation()">Webcam</button>
								</div>
								<img class="vr-upload-thumb" id="face-thumb" src="" alt="">
								<div class="vr-upload-done">✓ Face photo captured</div>
							</div>
						</div>
						<div>
							<div class="vr-doc-label"><span class="vr-doc-badge front">Front Side</span>ID Front <span style="color:#dc2626">*</span></div>
							<div class="vr-upload-box" id="cap-id-front">
								<div class="vr-upload-ico">📄</div>
								<h4>Front of ID Card</h4>
								<p>Drag & drop or <strong>Browse</strong><br><small style="color:#94a3b8">JPG, PNG, PDF accepted</small></p>
								<div class="vr-upload-btns">
									<button class="vr-btn vr-btn-secondary vr-btn-sm" data-a="id-front-cam" onclick="event.stopPropagation()">Camera</button>
								</div>
								<img class="vr-upload-thumb" id="id-front-thumb" src="" alt="">
								<div class="vr-upload-done">✓ Front side captured</div>
							</div>
						</div>
						<div>
							<div class="vr-doc-label"><span class="vr-doc-badge back">Back Side</span>ID Back <span style="color:#dc2626">*</span></div>
							<div class="vr-upload-box" id="cap-id-back">
								<div class="vr-upload-ico">🔄</div>
								<h4>Back of ID Card</h4>
								<p>Drag & drop or <strong>Browse</strong><br><small style="color:#94a3b8">JPG, PNG, PDF accepted</small></p>
								<div class="vr-upload-btns">
									<button class="vr-btn vr-btn-secondary vr-btn-sm" data-a="id-back-cam" onclick="event.stopPropagation()">Camera</button>
								</div>
								<img class="vr-upload-thumb" id="id-back-thumb" src="" alt="">
								<div class="vr-upload-done">✓ Back side captured</div>
							</div>
						</div>
					</div>

				</div>
				<div class="vr-actions">
					<button class="vr-btn vr-btn-secondary" data-a="cancel">Cancel</button>
					<button class="vr-btn vr-btn-primary" data-a="submit" id="vr-submit">Submit Request</button>
				</div>
			</div>

			<div class="vr-otp-card" id="vr-otp-card">
				<div class="vr-otp-head">
					<div class="vr-otp-ico">📧</div>
					<div>
						<h3>Verify Your Identity</h3>
						<p>A 6-digit OTP has been sent to your registered email address.</p>
					</div>
				</div>
				<div class="vr-otp-body">
					<div class="vr-sum">
						<div class="vr-sum-cell"><div class="k">Request No.</div><div class="v"><a id="vr-ref-no" href="#" target="_blank"></a></div></div>
						<div class="vr-sum-cell"><div class="k">Visitor</div><div class="v" id="vr-ref-name"></div></div>
						<div class="vr-sum-cell"><div class="k">Host</div><div class="v" id="vr-ref-host"></div></div>
						<div class="vr-sum-cell"><div class="k">Visit Date</div><div class="v" id="vr-ref-date"></div></div>
						<div class="vr-sum-cell"><div class="k">Visit Time</div><div class="v" id="vr-ref-time"></div></div>
						<div class="vr-sum-cell"><div class="k">Status</div><div class="v" id="vr-ref-status" style="color:#b45309">Pending OTP</div></div>
					</div>
					<div class="vr-otp-steps">
						<div class="vr-otp-step"><div class="sn">1</div><div>Check your email inbox for the 6-digit OTP code.</div></div>
						<div class="vr-otp-step"><div class="sn">2</div><div>Enter the code below to verify your identity.</div></div>
						<div class="vr-otp-step"><div class="sn">3</div><div>Once verified, your host will be notified to review and approve your request.</div></div>
					</div>
					<div class="vr-otp-wrap">
						<input id="vr-otp-input" class="vr-otp-input" type="text" maxlength="6" placeholder="000000">
						<button class="vr-btn vr-btn-primary" data-a="verify-otp">Verify OTP</button>
						<button class="vr-btn vr-btn-secondary" data-a="resend-otp" style="font-size:13px;padding:11px 16px">Resend OTP</button>
					</div>
					<div id="vr-otp-msg" class="vr-otp-msg"></div>
				</div>
			</div>

			<div class="vr-new-wrap" id="vr-new-wrap">
				<button class="vr-btn vr-btn-secondary" data-a="reset">+ Submit Another Request</button>
			</div>
		</div>
		</div>`);

		this.$r = $(this.page.body).find(".vr-root");
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
		const code = this.$r.find("#vr-phone-code").val() || "+91";
		const num = (this.$r.find("#vr-phone-num").val() || "").trim();
		return num ? code + num : "";
	}

	bind_events() {
		this.$r.find("[data-a='submit']").on("click", () => this.submit());
		this.$r.find("[data-a='cancel']").on("click", () => this.reset());
		this.$r.find("[data-a='reset']").on("click", () => this.reset());
		this.$r.find("[data-a='verify-otp']").on("click", () => this.verify_otp());
		this.$r.find("[data-a='resend-otp']").on("click", () => this.resend_otp());
		this.$r.find("[data-a='face-web']").on("click",       (e) => { e.stopPropagation(); this.webcam("face"); });
		this.$r.find("[data-a='face-mob']").on("click",       (e) => { e.stopPropagation(); this.file_input("face"); });
		this.$r.find("[data-a='id-front-browse']").on("click",(e) => { e.stopPropagation(); this.file_input("id_front"); });
		this.$r.find("[data-a='id-front-cam']").on("click",   (e) => { e.stopPropagation(); this.webcam("id_front"); });
		this.$r.find("[data-a='id-back-browse']").on("click", (e) => { e.stopPropagation(); this.file_input("id_back"); });
		this.$r.find("[data-a='id-back-cam']").on("click",    (e) => { e.stopPropagation(); this.webcam("id_back"); });
	}

	validate() {
		const n = this.val("visitor_name"), e = this.val("visitor_email"),
			h = this.host_ctrl.get_value(),
			d = this.val("expected_visit_date"), t = this.val("expected_visit_time"),
			p = this.val("visit_purpose"),
			it = this.val("id_proof_type"), in_ = this.val("id_proof_number");
		if (!n || !e || !h || !d || !t || !p || !it || !in_) {
			frappe.show_alert({ message: __("Please fill all required fields"), indicator: "red" }); return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
			frappe.show_alert({ message: __("Enter a valid email address"), indicator: "red" }); return false;
		}
		if (!this.face_b64) { frappe.show_alert({ message: __("Please capture your face photo"), indicator: "red" }); return false; }
		if (!this.id_front_b64) { frappe.show_alert({ message: __("Please capture the front side of your ID"), indicator: "red" }); return false; }
		if (!this.id_back_b64) { frappe.show_alert({ message: __("Please capture the back side of your ID"), indicator: "red" }); return false; }
		return true;
	}

	async submit() {
		if (this.docname) return;
		if (!this.validate()) return;
		const btn = this.$r.find("[data-a='submit']").prop("disabled", true).text(__("Submitting..."));
		try {
			const r = await frappe.call({
				method: "visitor_management.visitor_management.page.visitor_pass_entry.visitor_pass_entry.create_visitor_pass_request",
				args: {
					payload: {
						visitor_name: this.val("visitor_name"), visitor_email: this.val("visitor_email"),
						visitor_phone: this.get_phone(), visitor_company: this.val("visitor_company"),
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
			await frappe.call({ method: "visitor_management.api.face_capture.save_face_photo", args: { doctype: "Visitor Pass Request", docname: this.docname, image_b64: this.face_b64, field: "face_photo" } });
			await frappe.call({ method: "visitor_management.api.face_capture.save_face_photo", args: { doctype: "Visitor Pass Request", docname: this.docname, image_b64: this.id_front_b64, field: "id_proof_image" } });
			await frappe.call({ method: "visitor_management.api.face_capture.save_face_photo", args: { doctype: "Visitor Pass Request", docname: this.docname, image_b64: this.id_back_b64, field: "id_proof_image_back" } });
			this.show_otp_step();
			frappe.show_alert({ message: __("Request submitted. Check your email for OTP."), indicator: "green" });
		} catch (e) {
			frappe.show_alert({ message: __("Submission failed. Please try again."), indicator: "red" });
			this.docname = null;
		} finally {
			btn.prop("disabled", false).text(__("Submit Request"));
		}
	}

	show_otp_step() {
		const date = frappe.datetime.str_to_user(this.val("expected_visit_date")) || "—";
		this.$r.find("#vr-form-card").hide();
		this.$r.find("#vr-otp-card").addClass("show");
		this.$r.find("#vr-ref-no").attr("href", `/app/visitor-pass-request/${this.docname}`).text(this.docname);
		this.$r.find("#vr-ref-name").text(this.val("visitor_name"));
		this.$r.find("#vr-ref-host").text(this.host_ctrl.get_value() || "—");
		this.$r.find("#vr-ref-date").text(date);
		this.$r.find("#vr-ref-time").text(this.val("expected_visit_time") || "—");
		this.$r.find("#vr-otp-card")[0].scrollIntoView({ behavior: "smooth", block: "start" });
	}

	async verify_otp() {
		const otp = this.$r.find("#vr-otp-input").val().trim();
		if (!otp || otp.length < 6) { frappe.show_alert({ message: __("Please enter the 6-digit OTP"), indicator: "red" }); return; }
		const btn = this.$r.find("[data-a='verify-otp']").prop("disabled", true).text(__("Verifying..."));
		const msg = this.$r.find("#vr-otp-msg");
		try {
			const r = await frappe.call({ method: "visitor_management.api.otp.verify_otp", args: { request_name: this.docname, otp_input: otp } });
			msg.show();
			if (r.message.verified) {
				msg.removeClass("err").addClass("ok").text("✓ " + (r.message.message || __("OTP verified successfully")));
				this.$r.find("#vr-ref-status").text("Pending Approval").css("color", "#2563eb");
				this.$r.find("#vr-otp-input, [data-a='verify-otp'], [data-a='resend-otp']").prop("disabled", true);
				this.$r.find("#vr-verified").addClass("show");
				this.$r.find("#vr-new-wrap").show();
				frappe.show_alert({ message: __("OTP verified. Host notified for approval."), indicator: "green" });
			} else {
				msg.removeClass("ok").addClass("err").text("✗ " + (r.message.message || __("Invalid OTP. Please try again.")));
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
			await frappe.call({ method: "visitor_management.api.otp.send_otp", args: { request_name: this.docname } });
			frappe.show_alert({ message: __("OTP resent to your email"), indicator: "green" });
			this.$r.find("#vr-otp-input").val("");
			this.$r.find("#vr-otp-msg").hide().text("").removeClass("ok err");
		} finally { btn.prop("disabled", false).text(__("Resend OTP")); }
	}

	async webcam(type) {
		const cfg = {
			face:     { title: __("Capture Face Photo"),    hint: __("Centre your face in the frame"),     facing: "user" },
			id_front: { title: __("Capture ID Front Side"), hint: __("Show the FRONT of your ID clearly"), facing: "environment" },
			id_back:  { title: __("Capture ID Back Side"),  hint: __("Show the BACK of your ID clearly"),  facing: "environment" },
		}[type];
		const d = new frappe.ui.Dialog({
			title: cfg.title,
			fields: [{ fieldtype: "HTML", fieldname: "cam" }],
			primary_action_label: __("Capture"),
			primary_action: async () => {
				try {
					const v = d.$wrapper.find("video")[0], c = d.$wrapper.find("canvas")[0];
					c.width = v.videoWidth; c.height = v.videoHeight;
					c.getContext("2d").drawImage(v, 0, 0);
					this.store_image(type, c.toDataURL("image/jpeg", 0.85));
				} finally { this.stop_stream(d); d.hide(); }
			},
		});
		d.$wrapper.on("hidden.bs.modal", () => this.stop_stream(d));
		d.show();
		d.fields_dict.cam.$wrapper.html(`
			<video autoplay playsinline style="width:100%;max-height:300px;border-radius:8px;background:#000;display:block"></video>
			<canvas style="display:none"></canvas>
			<div style="font-size:12px;color:#64748b;margin-top:8px;text-align:center;font-weight:600">${cfg.hint}</div>`);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: cfg.facing } } });
			d._stream = stream; d.$wrapper.find("video")[0].srcObject = stream;
		} catch {
			d.fields_dict.cam.$wrapper.html(`<div style="padding:20px;text-align:center;color:#dc2626">${__("Camera unavailable. Use Browse instead.")}</div>`);
		}
	}

	file_input(type) {
		const inp = document.createElement("input");
		inp.type = "file";
		inp.accept = type === "id_front" || type === "id_back" ? "image/*,application/pdf" : "image/*";
		inp.onchange = () => {
			const f = inp.files[0]; if (!f) return;
			const reader = new FileReader();
			reader.onload = (e) => this.store_image(type, e.target.result);
			reader.readAsDataURL(f);
		};
		inp.click();
	}

	store_image(type, b64) {
		const map = {
			face:     { key: "face_b64",     card: "#cap-face",     thumb: "#face-thumb",     msg: __("Face photo ready") },
			id_front: { key: "id_front_b64", card: "#cap-id-front", thumb: "#id-front-thumb", msg: __("ID front side ready") },
			id_back:  { key: "id_back_b64",  card: "#cap-id-back",  thumb: "#id-back-thumb",  msg: __("ID back side ready") },
		}[type];
		this[map.key] = b64;
		if (b64.startsWith("data:image")) this.$r.find(map.thumb).attr("src", b64);
		this.$r.find(map.card).addClass("done");
		frappe.show_alert({ message: map.msg, indicator: "green" });
	}

	stop_stream(d) { if (d._stream) { d._stream.getTracks().forEach(t => t.stop()); d._stream = null; } }
	val(k) { return (this.$r.find(`[data-k='${k}']`).val() || "").trim(); }

	reset() {
		this.docname = null; this.face_b64 = null; this.id_front_b64 = null; this.id_back_b64 = null;
		this.$r.find("input[data-k], textarea").val("");
		this.$r.find("select[data-k]").prop("selectedIndex", 0);
		this.$r.find("#vr-phone-num").val("");
		this.$r.find("#vr-phone-code").val("+91");
		this.host_ctrl.set_value(""); this.site_ctrl.set_value("");
		this.$r.find(".vr-upload-box").removeClass("done");
		this.$r.find(".vr-upload-thumb").attr("src", "");
		this.$r.find("#vr-form-card").show();
		this.$r.find("#vr-otp-card").removeClass("show");
		this.$r.find("#vr-verified").removeClass("show");
		this.$r.find("#vr-new-wrap").hide();
		this.$r.find("#vr-otp-input").val("");
		this.$r.find("#vr-otp-msg").hide().text("").removeClass("ok err");
		this.$r.find("[data-a='submit']").prop("disabled", false).text(__("Submit Request"));
		this.$r.find("[data-k='expected_visit_date']").val(frappe.datetime.get_today());
		window.scrollTo({ top: 0, behavior: "smooth" });
	}
}