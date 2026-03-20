frappe.pages["visitor-pass-entry"].on_page_load = function (wrapper) {
	new VisitorPassEntryPage(wrapper);
};

class VisitorPassEntryPage {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Visitor Registration"),
			single_column: true,
		});
		this.docname = null;
		this.step = 1;
		this.total_steps = 3;
		this.make_layout();
		this.make_controls();
		this.bind_events();
		this.go_to_step(1);
	}

	make_layout() {
		$(this.page.body).html(`
			<div class="vpe-root">
				<style>
					/* ── Reset & base ───────────────────────────── */
					.vpe-root * { box-sizing: border-box; }
					.vpe-root {
						--c-bg:       #f4f6f9;
						--c-surface:  #ffffff;
						--c-border:   #e2e8f0;
						--c-border2:  #cbd5e1;
						--c-ink:      #0f172a;
						--c-ink2:     #334155;
						--c-muted:    #64748b;
						--c-accent:   #1e40af;
						--c-accent-l: #dbeafe;
						--c-accent-d: #1e3a8a;
						--c-success:  #166534;
						--c-success-l:#dcfce7;
						--c-warn:     #92400e;
						--c-warn-l:   #fef3c7;
						--c-danger:   #991b1b;
						--c-danger-l: #fee2e2;
						--radius:     10px;
						--shadow:     0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04);
						--shadow-lg:  0 4px 16px rgba(0,0,0,.10), 0 12px 40px rgba(0,0,0,.06);
						font-family: "Inter var", "Inter", "Segoe UI", sans-serif;
						background: var(--c-bg);
						min-height: 100vh;
						padding: 24px 20px 40px;
					}

					/* ── Header bar ─────────────────────────────── */
					.vpe-header {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: 24px;
					}
					.vpe-header-left h2 {
						margin: 0;
						font-size: 20px;
						font-weight: 700;
						color: var(--c-ink);
						letter-spacing: -0.3px;
					}
					.vpe-header-left p {
						margin: 3px 0 0;
						font-size: 13px;
						color: var(--c-muted);
					}
					.vpe-header-badge {
						background: var(--c-accent-l);
						color: var(--c-accent);
						font-size: 12px;
						font-weight: 600;
						padding: 5px 12px;
						border-radius: 999px;
						letter-spacing: .2px;
					}

					/* ── Step progress ──────────────────────────── */
					.vpe-stepper {
						display: flex;
						align-items: center;
						gap: 0;
						margin-bottom: 24px;
						background: var(--c-surface);
						border: 1px solid var(--c-border);
						border-radius: var(--radius);
						padding: 16px 24px;
						box-shadow: var(--shadow);
					}
					.vpe-step {
						display: flex;
						align-items: center;
						gap: 10px;
						flex: 1;
						cursor: default;
					}
					.vpe-step-num {
						width: 32px;
						height: 32px;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 13px;
						font-weight: 700;
						flex-shrink: 0;
						border: 2px solid var(--c-border2);
						color: var(--c-muted);
						background: transparent;
						transition: all .2s;
					}
					.vpe-step-info .vpe-step-label {
						font-size: 11px;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: .6px;
						color: var(--c-muted);
						transition: color .2s;
					}
					.vpe-step-info .vpe-step-title {
						font-size: 13px;
						font-weight: 600;
						color: var(--c-ink2);
						transition: color .2s;
					}
					.vpe-step-divider {
						flex: 1;
						height: 1px;
						background: var(--c-border);
						margin: 0 16px;
					}
					.vpe-step.active .vpe-step-num {
						background: var(--c-accent);
						border-color: var(--c-accent);
						color: #fff;
					}
					.vpe-step.active .vpe-step-label { color: var(--c-accent); }
					.vpe-step.active .vpe-step-title { color: var(--c-ink); }
					.vpe-step.done .vpe-step-num {
						background: var(--c-success-l);
						border-color: #86efac;
						color: var(--c-success);
					}
					.vpe-step.done .vpe-step-num::after { content: "✓"; }
					.vpe-step.done .vpe-step-num span { display: none; }

					/* ── Card ───────────────────────────────────── */
					.vpe-card {
						background: var(--c-surface);
						border: 1px solid var(--c-border);
						border-radius: var(--radius);
						box-shadow: var(--shadow);
						overflow: hidden;
					}
					.vpe-card-head {
						padding: 20px 24px 16px;
						border-bottom: 1px solid var(--c-border);
						display: flex;
						align-items: center;
						gap: 12px;
					}
					.vpe-card-icon {
						width: 36px;
						height: 36px;
						border-radius: 8px;
						background: var(--c-accent-l);
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 16px;
						flex-shrink: 0;
					}
					.vpe-card-head h3 {
						margin: 0;
						font-size: 15px;
						font-weight: 700;
						color: var(--c-ink);
					}
					.vpe-card-head p {
						margin: 2px 0 0;
						font-size: 12px;
						color: var(--c-muted);
					}
					.vpe-card-body { padding: 24px; }

					/* ── Field grid ─────────────────────────────── */
					.vpe-grid-2 {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 16px;
					}
					.vpe-grid-3 {
						display: grid;
						grid-template-columns: 1fr 1fr 1fr;
						gap: 16px;
					}
					.vpe-span-2 { grid-column: span 2; }
					.vpe-span-3 { grid-column: span 3; }
					.vpe-field { display: flex; flex-direction: column; gap: 5px; }
					.vpe-field label {
						font-size: 12px;
						font-weight: 600;
						color: var(--c-ink2);
						letter-spacing: .2px;
					}
					.vpe-field label .req {
						color: var(--c-danger);
						margin-left: 2px;
					}
					.vpe-field input,
					.vpe-field select,
					.vpe-field textarea {
						width: 100%;
						padding: 9px 12px;
						border: 1px solid var(--c-border2);
						border-radius: 7px;
						font-size: 14px;
						color: var(--c-ink);
						background: #fff;
						transition: border-color .15s, box-shadow .15s;
						outline: none;
						font-family: inherit;
					}
					.vpe-field input:focus,
					.vpe-field select:focus,
					.vpe-field textarea:focus {
						border-color: var(--c-accent);
						box-shadow: 0 0 0 3px rgba(30,64,175,.10);
					}
					.vpe-field textarea { resize: vertical; min-height: 80px; }

					/* ── Frappe Link control overrides ──────────── */
					.vpe-link-wrap .form-group { margin: 0; }
					.vpe-link-wrap .form-control {
						padding: 9px 12px !important;
						border: 1px solid var(--c-border2) !important;
						border-radius: 7px !important;
						font-size: 14px !important;
						height: auto !important;
					}
					.vpe-link-wrap .form-control:focus {
						border-color: var(--c-accent) !important;
						box-shadow: 0 0 0 3px rgba(30,64,175,.10) !important;
					}
					.vpe-link-wrap .clearfix,
					.vpe-link-wrap .help-box { display: none; }

					/* ── Capture section ────────────────────────── */
					.vpe-capture-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 14px;
					}
					.vpe-capture-card {
						border: 1.5px dashed var(--c-border2);
						border-radius: var(--radius);
						padding: 16px;
						text-align: center;
						transition: border-color .15s, background .15s;
					}
					.vpe-capture-card:hover { border-color: var(--c-accent); background: var(--c-accent-l); }
					.vpe-capture-card.done {
						border-style: solid;
						border-color: #86efac;
						background: var(--c-success-l);
					}
					.vpe-capture-card .cap-icon { font-size: 24px; margin-bottom: 8px; }
					.vpe-capture-card h4 {
						margin: 0 0 4px;
						font-size: 13px;
						font-weight: 700;
						color: var(--c-ink);
					}
					.vpe-capture-card p {
						margin: 0 0 10px;
						font-size: 12px;
						color: var(--c-muted);
					}
					.vpe-capture-card .cap-btns {
						display: flex;
						gap: 6px;
						justify-content: center;
						flex-wrap: wrap;
					}
					.vpe-capture-card .cap-status {
						display: none;
						font-size: 12px;
						font-weight: 600;
						color: var(--c-success);
						margin-top: 6px;
					}
					.vpe-capture-card.done .cap-status { display: block; }

					/* ── Buttons ────────────────────────────────── */
					.vpe-btn {
						display: inline-flex;
						align-items: center;
						gap: 6px;
						padding: 9px 18px;
						border-radius: 7px;
						font-size: 13px;
						font-weight: 600;
						cursor: pointer;
						border: none;
						transition: all .15s;
						font-family: inherit;
					}
					.vpe-btn-primary {
						background: var(--c-accent);
						color: #fff;
					}
					.vpe-btn-primary:hover { background: var(--c-accent-d); }
					.vpe-btn-secondary {
						background: transparent;
						color: var(--c-ink2);
						border: 1px solid var(--c-border2);
					}
					.vpe-btn-secondary:hover { background: var(--c-bg); }
					.vpe-btn-ghost {
						background: transparent;
						color: var(--c-accent);
						padding: 9px 14px;
					}
					.vpe-btn-ghost:hover { background: var(--c-accent-l); }
					.vpe-btn-sm {
						padding: 6px 12px;
						font-size: 12px;
					}
					.vpe-btn:disabled { opacity: .5; cursor: not-allowed; }

					/* ── Footer actions ─────────────────────────── */
					.vpe-footer {
						display: flex;
						align-items: center;
						justify-content: space-between;
						padding: 16px 24px;
						border-top: 1px solid var(--c-border);
						background: #fafbfc;
					}
					.vpe-footer-right { display: flex; gap: 10px; }

					/* ── Success panel ──────────────────────────── */
					.vpe-success-wrap {
						display: none;
						text-align: center;
						padding: 40px 24px;
					}
					.vpe-success-wrap.show { display: block; }
					.vpe-success-icon {
						width: 64px;
						height: 64px;
						background: var(--c-success-l);
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 28px;
						margin: 0 auto 16px;
					}
					.vpe-success-wrap h3 {
						font-size: 18px;
						font-weight: 700;
						color: var(--c-ink);
						margin: 0 0 6px;
					}
					.vpe-success-wrap p {
						font-size: 14px;
						color: var(--c-muted);
						margin: 0 0 20px;
					}
					.vpe-success-ref {
						display: inline-block;
						background: var(--c-accent-l);
						color: var(--c-accent);
						font-size: 13px;
						font-weight: 700;
						padding: 8px 18px;
						border-radius: 7px;
						text-decoration: none;
						margin-bottom: 20px;
					}
					.vpe-success-ref:hover { background: #bfdbfe; }
					.vpe-success-actions { display: flex; gap: 10px; justify-content: center; }

					/* ── Step panels ────────────────────────────── */
					.vpe-panel { display: none; }
					.vpe-panel.active { display: block; }

					/* ── Divider with label ─────────────────────── */
					.vpe-section-label {
						font-size: 11px;
						font-weight: 700;
						text-transform: uppercase;
						letter-spacing: .7px;
						color: var(--c-muted);
						margin: 20px 0 12px;
						display: flex;
						align-items: center;
						gap: 8px;
					}
					.vpe-section-label::after {
						content: "";
						flex: 1;
						height: 1px;
						background: var(--c-border);
					}

					/* ── Info tag ───────────────────────────────── */
					.vpe-info-tag {
						display: inline-flex;
						align-items: center;
						gap: 5px;
						background: var(--c-warn-l);
						color: var(--c-warn);
						font-size: 12px;
						font-weight: 600;
						padding: 5px 10px;
						border-radius: 6px;
						margin-bottom: 16px;
					}

					/* ── Summary review ─────────────────────────── */
					.vpe-summary {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 1px;
						background: var(--c-border);
						border: 1px solid var(--c-border);
						border-radius: var(--radius);
						overflow: hidden;
						margin-bottom: 20px;
					}
					.vpe-summary-row {
						background: var(--c-surface);
						padding: 12px 16px;
					}
					.vpe-summary-row .k {
						font-size: 11px;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: .5px;
						color: var(--c-muted);
						margin-bottom: 3px;
					}
					.vpe-summary-row .v {
						font-size: 14px;
						font-weight: 500;
						color: var(--c-ink);
					}

					@media (max-width: 768px) {
						.vpe-grid-2, .vpe-grid-3 { grid-template-columns: 1fr; }
						.vpe-span-2, .vpe-span-3 { grid-column: span 1; }
						.vpe-capture-grid { grid-template-columns: 1fr; }
						.vpe-stepper { padding: 12px 16px; gap: 0; }
						.vpe-step-divider { margin: 0 8px; }
						.vpe-step-info { display: none; }
						.vpe-summary { grid-template-columns: 1fr; }
					}
				</style>

				<!-- Header -->
				<div class="vpe-header">
					<div class="vpe-header-left">
						<h2>${__("New Visitor Registration")}</h2>
						<p>${__("Complete all steps to register a visitor and generate a pass request.")}</p>
					</div>
					<div class="vpe-header-badge">${__("Gate Registration")}</div>
				</div>

				<!-- Stepper -->
				<div class="vpe-stepper">
					<div class="vpe-step active" data-step="1">
						<div class="vpe-step-num"><span>1</span></div>
						<div class="vpe-step-info">
							<div class="vpe-step-label">${__("Step 1")}</div>
							<div class="vpe-step-title">${__("Visitor Details")}</div>
						</div>
					</div>
					<div class="vpe-step-divider"></div>
					<div class="vpe-step" data-step="2">
						<div class="vpe-step-num"><span>2</span></div>
						<div class="vpe-step-info">
							<div class="vpe-step-label">${__("Step 2")}</div>
							<div class="vpe-step-title">${__("Visit Info")}</div>
						</div>
					</div>
					<div class="vpe-step-divider"></div>
					<div class="vpe-step" data-step="3">
						<div class="vpe-step-num"><span>3</span></div>
						<div class="vpe-step-info">
							<div class="vpe-step-label">${__("Step 3")}</div>
							<div class="vpe-step-title">${__("Documents & Confirm")}</div>
						</div>
					</div>
				</div>

				<!-- Step 1 — Visitor Details -->
				<div class="vpe-panel active" id="vpe-step-1">
					<div class="vpe-card">
						<div class="vpe-card-head">
							<div class="vpe-card-icon">👤</div>
							<div>
								<h3>${__("Visitor Information")}</h3>
								<p>${__("Basic identity and contact details of the visitor.")}</p>
							</div>
						</div>
						<div class="vpe-card-body">
							<div class="vpe-grid-2">
								<div class="vpe-field">
									<label>${__("Full Name")} <span class="req">*</span></label>
									<input type="text" data-key="visitor_name" placeholder="${__("e.g. Ramesh Kumar")}">
								</div>
								<div class="vpe-field">
									<label>${__("Email Address")} <span class="req">*</span></label>
									<input type="email" data-key="visitor_email" placeholder="${__("visitor@company.com")}">
								</div>
								<div class="vpe-field">
									<label>${__("Phone Number")}</label>
									<input type="tel" data-key="visitor_phone" placeholder="${__("e.g. 9876543210")}">
								</div>
								<div class="vpe-field">
									<label>${__("Company / Organisation")}</label>
									<input type="text" data-key="visitor_company" placeholder="${__("Optional")}">
								</div>
							</div>

							<div class="vpe-section-label">${__("Identity Document")}</div>
							<div class="vpe-grid-2">
								<div class="vpe-field">
									<label>${__("ID Proof Type")}</label>
									<select data-key="id_proof_type">
										<option value="">${__("Select type")}</option>
										<option value="Aadhar">${__("Aadhar")}</option>
										<option value="Passport">${__("Passport")}</option>
										<option value="Driving License">${__("Driving License")}</option>
										<option value="Other">${__("Other")}</option>
									</select>
								</div>
								<div class="vpe-field">
									<label>${__("ID Proof Number")} <span class="req">*</span></label>
									<input type="text" data-key="id_proof_number" placeholder="${__("Document number")}">
								</div>
							</div>
						</div>
						<div class="vpe-footer">
							<div></div>
							<div class="vpe-footer-right">
								<button class="vpe-btn vpe-btn-primary" data-action="next-1">
									${__("Next: Visit Info")} →
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 2 — Visit Info -->
				<div class="vpe-panel" id="vpe-step-2">
					<div class="vpe-card">
						<div class="vpe-card-head">
							<div class="vpe-card-icon">📋</div>
							<div>
								<h3>${__("Visit Details")}</h3>
								<p>${__("Who the visitor is meeting, when, and why.")}</p>
							</div>
						</div>
						<div class="vpe-card-body">
							<div class="vpe-grid-2">
								<div class="vpe-field">
									<label>${__("Host Employee")} <span class="req">*</span></label>
									<div class="vpe-link-wrap" data-control="host_employee"></div>
								</div>
								<div class="vpe-field">
									<label>${__("Site")}</label>
									<div class="vpe-link-wrap" data-control="site"></div>
								</div>
								<div class="vpe-field">
									<label>${__("Expected Date")} <span class="req">*</span></label>
									<input type="date" data-key="expected_visit_date">
								</div>
								<div class="vpe-field">
									<label>${__("Expected Time")} <span class="req">*</span></label>
									<input type="time" data-key="expected_visit_time">
								</div>
								<div class="vpe-field vpe-span-2">
									<label>${__("Purpose of Visit")} <span class="req">*</span></label>
									<textarea data-key="visit_purpose" placeholder="${__("Describe the reason for the visit...")}"></textarea>
								</div>
							</div>
						</div>
						<div class="vpe-footer">
							<button class="vpe-btn vpe-btn-secondary" data-action="back-2">← ${__("Back")}</button>
							<div class="vpe-footer-right">
								<button class="vpe-btn vpe-btn-primary" data-action="next-2">
									${__("Next: Documents")} →
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 3 — Documents & Submit -->
				<div class="vpe-panel" id="vpe-step-3">
					<div class="vpe-card">
						<div class="vpe-card-head">
							<div class="vpe-card-icon">📸</div>
							<div>
								<h3>${__("Documents & Confirmation")}</h3>
								<p>${__("Review details, then create the request. Capture images after.")}</p>
							</div>
						</div>
						<div class="vpe-card-body">

							<!-- Summary -->
							<div class="vpe-summary" id="vpe-summary"></div>

							<!-- Success panel (shown after creation) -->
							<div class="vpe-success-wrap" id="vpe-success">
								<div class="vpe-success-icon">✓</div>
								<h3>${__("Request Created")}</h3>
								<p id="vpe-success-msg">${__("Visitor pass request has been submitted successfully.")}</p>
								<a id="vpe-success-link" href="#" class="vpe-success-ref" target="_blank"></a>
								<br>
								<div class="vpe-section-label">${__("Capture Images (Optional)")}</div>
							</div>

							<!-- Image capture (always visible in step 3) -->
							<div class="vpe-capture-grid">
								<div class="vpe-capture-card" id="cap-face">
									<div class="cap-icon">🤳</div>
									<h4>${__("Face Photo")}</h4>
									<p>${__("Capture visitor's face for verification.")}</p>
									<div class="cap-btns">
										<button class="btn btn-xs btn-default vpe-btn-sm" data-action="capture-face-webcam">${__("Webcam")}</button>
										<button class="btn btn-xs btn-default vpe-btn-sm" data-action="capture-face-mobile">${__("Mobile Cam")}</button>
									</div>
									<div class="cap-status">✓ ${__("Photo captured")}</div>
								</div>
								<div class="vpe-capture-card" id="cap-id">
									<div class="cap-icon">🪪</div>
									<h4>${__("ID Proof Image")}</h4>
									<p>${__("Scan or photograph the ID document.")}</p>
									<div class="cap-btns">
										<button class="btn btn-xs btn-default vpe-btn-sm" data-action="capture-id-webcam">${__("Webcam")}</button>
										<button class="btn btn-xs btn-default vpe-btn-sm" data-action="capture-id-mobile">${__("Mobile Cam")}</button>
									</div>
									<div class="cap-status">✓ ${__("ID captured")}</div>
								</div>
							</div>

						</div>
						<div class="vpe-footer">
							<button class="vpe-btn vpe-btn-secondary" data-action="back-3" id="btn-back-3">← ${__("Back")}</button>
							<div class="vpe-footer-right">
								<button class="vpe-btn vpe-btn-ghost" data-action="reset">${__("Start Over")}</button>
								<button class="vpe-btn vpe-btn-primary" data-action="create" id="btn-create">
									${__("Submit Request")}
								</button>
							</div>
						</div>
					</div>
				</div>

			</div>
		`);
		this.$root = $(this.page.body).find(".vpe-root");
	}

	make_controls() {
		this.host_control = frappe.ui.form.make_control({
			parent: this.$root.find("[data-control='host_employee']").get(0),
			df: { fieldtype: "Link", fieldname: "host_employee", options: "Host", reqd: 1, placeholder: __("Search host...") },
			render_input: true,
		});
		this.site_control = frappe.ui.form.make_control({
			parent: this.$root.find("[data-control='site']").get(0),
			df: { fieldtype: "Link", fieldname: "site", options: "Visitor Site", placeholder: __("Select site...") },
			render_input: true,
		});
		this.host_control.refresh();
		this.site_control.refresh();

		// Set today's date as default
		const today = frappe.datetime.get_today();
		this.$root.find("[data-key='expected_visit_date']").val(today);
	}

	bind_events() {
		// Navigation
		this.$root.find("[data-action='next-1']").on("click", () => this.validate_and_next(1));
		this.$root.find("[data-action='next-2']").on("click", () => this.validate_and_next(2));
		this.$root.find("[data-action='back-2']").on("click", () => this.go_to_step(1));
		this.$root.find("[data-action='back-3']").on("click", () => this.go_to_step(2));

		// Submit and reset
		this.$root.find("[data-action='create']").on("click", () => this.create_request());
		this.$root.find("[data-action='reset']").on("click", () => this.reset());

		// Capture
		this.$root.find("[data-action='capture-face-webcam']").on("click", () => this.capture_with_webcam("face_photo"));
		this.$root.find("[data-action='capture-id-webcam']").on("click", () => this.capture_with_webcam("id_proof_image"));
		this.$root.find("[data-action='capture-face-mobile']").on("click", () => this.capture_with_file_input("face_photo", "user"));
		this.$root.find("[data-action='capture-id-mobile']").on("click", () => this.capture_with_file_input("id_proof_image", "environment"));
	}

	go_to_step(n) {
		this.step = n;

		// Toggle panels
		this.$root.find(".vpe-panel").removeClass("active");
		this.$root.find(`#vpe-step-${n}`).addClass("active");

		// Update stepper
		this.$root.find(".vpe-step").each(function () {
			const s = parseInt($(this).data("step"));
			$(this).removeClass("active done");
			if (s === n) $(this).addClass("active");
			else if (s < n) $(this).addClass("done");
		});

		// Rebuild summary when entering step 3
		if (n === 3) this.render_summary();

		// Scroll to top
		this.$root[0].scrollIntoView({ behavior: "smooth", block: "start" });
	}

	validate_and_next(from_step) {
		if (from_step === 1) {
			const name = this.value("visitor_name");
			const email = this.value("visitor_email");
			const id_num = this.value("id_proof_number");
			if (!name || !email || !id_num) {
				frappe.show_alert({ message: __("Please fill: Full Name, Email and ID Proof Number"), indicator: "red" });
				return;
			}
			if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				frappe.show_alert({ message: __("Please enter a valid email address"), indicator: "red" });
				return;
			}
		}
		if (from_step === 2) {
			const host = this.host_control.get_value();
			const date = this.value("expected_visit_date");
			const time = this.value("expected_visit_time");
			const purpose = this.value("visit_purpose");
			if (!host || !date || !time || !purpose) {
				frappe.show_alert({ message: __("Please fill: Host, Date, Time and Purpose"), indicator: "red" });
				return;
			}
		}
		this.go_to_step(from_step + 1);
	}

	render_summary() {
		const rows = [
			[__("Full Name"), this.value("visitor_name")],
			[__("Email"), this.value("visitor_email")],
			[__("Phone"), this.value("visitor_phone") || "—"],
			[__("Company"), this.value("visitor_company") || "—"],
			[__("ID Type"), this.value("id_proof_type") || "—"],
			[__("ID Number"), this.value("id_proof_number")],
			[__("Host"), this.host_control.get_value() || "—"],
			[__("Site"), this.site_control.get_value() || "—"],
			[__("Visit Date"), frappe.datetime.str_to_user(this.value("expected_visit_date")) || "—"],
			[__("Visit Time"), this.value("expected_visit_time") || "—"],
		];
		const purpose = this.value("visit_purpose");
		const html = rows.map(([k, v]) => `
			<div class="vpe-summary-row">
				<div class="k">${frappe.utils.escape_html(k)}</div>
				<div class="v">${frappe.utils.escape_html(v)}</div>
			</div>
		`).join("") + `
			<div class="vpe-summary-row" style="grid-column: span 2;">
				<div class="k">${__("Purpose")}</div>
				<div class="v">${frappe.utils.escape_html(purpose || "—")}</div>
			</div>
		`;
		this.$root.find("#vpe-summary").html(html).show();
	}

	value(key) {
		return (this.$root.find(`[data-key='${key}']`).val() || "").trim();
	}

	get_payload() {
		return {
			visitor_name: this.value("visitor_name"),
			visitor_email: this.value("visitor_email"),
			visitor_phone: this.value("visitor_phone"),
			visitor_company: this.value("visitor_company"),
			id_proof_type: this.value("id_proof_type"),
			id_proof_number: this.value("id_proof_number"),
			host_employee: this.host_control.get_value(),
			site: this.site_control.get_value(),
			visit_purpose: this.value("visit_purpose"),
			expected_visit_date: this.value("expected_visit_date"),
			expected_visit_time: this.value("expected_visit_time"),
		};
	}

	async create_request() {
		if (this.docname) {
			frappe.show_alert({ message: __("Request already created for this session"), indicator: "orange" });
			return;
		}
		const btn = this.$root.find("[data-action='create']");
		btn.prop("disabled", true).text(__("Submitting..."));

		try {
			const r = await frappe.call({
				method: "visitor_management.visitor_management.page.visitor_pass_entry.visitor_pass_entry.create_visitor_pass_request",
				args: { payload: this.get_payload() },
			});

			this.docname = r.message.name;

			// Show success panel
			this.$root.find("#vpe-summary").hide();
			this.$root.find("#vpe-success").addClass("show");
			this.$root.find("#vpe-success-link")
				.attr("href", `/app/visitor-pass-request/${this.docname}`)
				.text(this.docname);
			this.$root.find("#btn-create").hide();
			this.$root.find("#btn-back-3").hide();

			frappe.show_alert({ message: __("Visitor request created successfully"), indicator: "green" });

		} catch (e) {
			frappe.show_alert({ message: __("Failed to create request. Please try again."), indicator: "red" });
		} finally {
			btn.prop("disabled", false).text(__("Submit Request"));
		}
	}

	async capture_with_webcam(fieldname) {
		if (!this.docname) {
			frappe.show_alert({ message: __("Please submit the request first before capturing images"), indicator: "orange" });
			return;
		}
		const is_face = fieldname === "face_photo";
		const d = new frappe.ui.Dialog({
			title: is_face ? __("Capture Face Photo") : __("Capture ID Proof"),
			fields: [{ fieldtype: "HTML", fieldname: "cam_html" }],
			primary_action_label: __("Capture Photo"),
			primary_action: async () => {
				try {
					const video = d.$wrapper.find("video")[0];
					const canvas = d.$wrapper.find("canvas")[0];
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
					canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
					const image_b64 = canvas.toDataURL("image/jpeg", 0.85);
					await this.save_image(fieldname, image_b64);
					this._mark_captured(fieldname);
				} finally {
					this._stop_stream(d);
					d.hide();
				}
			},
		});

		// Stop stream on any close
		d.$wrapper.on("hidden.bs.modal", () => this._stop_stream(d));

		d.show();
		d.fields_dict.cam_html.$wrapper.html(`
			<div style="position:relative; border-radius:10px; overflow:hidden; background:#000;">
				<video autoplay playsinline style="width:100%;max-height:340px;display:block;"></video>
			</div>
			<canvas style="display:none"></canvas>
			<div style="font-size:12px;color:#64748b;margin-top:8px;text-align:center;">
				${is_face ? __("Position face in the centre of the frame") : __("Ensure the ID document is clearly visible")}
			</div>
		`);

		const constraints = {
			video: { facingMode: is_face ? "user" : { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
		};
		try {
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			d._stream = stream;
			d.$wrapper.find("video")[0].srcObject = stream;
		} catch (err) {
			d.fields_dict.cam_html.$wrapper.html(`
				<div style="padding:20px;text-align:center;color:#991b1b;">
					${__("Camera access denied or unavailable. Please use mobile capture instead.")}
				</div>
			`);
		}
	}

	_stop_stream(d) {
		if (d._stream) {
			d._stream.getTracks().forEach((t) => t.stop());
			d._stream = null;
		}
	}

	_mark_captured(fieldname) {
		const card = fieldname === "face_photo" ? "#cap-face" : "#cap-id";
		this.$root.find(card).addClass("done");
	}

	capture_with_file_input(fieldname, facingMode) {
		if (!this.docname) {
			frappe.show_alert({ message: __("Please submit the request first before capturing images"), indicator: "orange" });
			return;
		}
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.capture = facingMode;
		input.onchange = () => {
			const file = input.files && input.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = async (e) => {
				await this.save_image(fieldname, e.target.result);
				this._mark_captured(fieldname);
			};
			reader.readAsDataURL(file);
		};
		input.click();
	}

	async save_image(fieldname, image_b64) {
		await frappe.call({
			method: "visitor_management.api.face_capture.save_face_photo",
			args: {
				doctype: "Visitor Pass Request",
				docname: this.docname,
				image_b64,
				field: fieldname,
			},
		});
		frappe.show_alert({ message: __("Image saved successfully"), indicator: "green" });
	}

	reset() {
		frappe.confirm(
			__("Start over? All entered data will be cleared."),
			() => {
				this.docname = null;
				this.$root.find("input, textarea").val("");
				this.$root.find("select").prop("selectedIndex", 0);
				this.host_control.set_value("");
				this.site_control.set_value("");
				this.$root.find("#vpe-success").removeClass("show");
				this.$root.find("#vpe-summary").show();
				this.$root.find("#btn-create").show();
				this.$root.find("#btn-back-3").show();
				this.$root.find(".vpe-capture-card").removeClass("done");

				// Reset today's date
				this.$root.find("[data-key='expected_visit_date']").val(frappe.datetime.get_today());

				this.go_to_step(1);
				frappe.show_alert({ message: __("Form cleared"), indicator: "blue" });
			}
		);
	}
}