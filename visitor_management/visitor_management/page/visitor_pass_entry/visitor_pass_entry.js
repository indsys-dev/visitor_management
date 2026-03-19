frappe.pages["visitor-pass-entry"].on_page_load = function (wrapper) {
	new VisitorPassEntryPage(wrapper);
};

class VisitorPassEntryPage {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Visitor Pass Entry"),
			single_column: true,
		});
		this.docname = null;
		this.make_layout();
		this.make_controls();
		this.bind_events();
	}

	make_layout() {
		$(this.page.body).html(`
			<div class="vpe-wrap">
				<style>
					.vpe-wrap {
						--ink:#0f172a;--muted:#475569;--line:#dbe3ef;--brand:#0f766e;
						font-family: "Manrope", "Segoe UI", sans-serif;
						background: radial-gradient(circle at 8% 5%, #e7fbf8 0%, #f2f6fb 42%), linear-gradient(135deg, #fff, #edf4ff);
						padding: 20px;
						border-radius: 18px;
					}
					.vpe-hero {
						background: linear-gradient(120deg, #0f766e, #115e59 55%, #164e63);
						color: #fff;
						padding: 18px;
						border-radius: 16px;
						margin-bottom: 14px;
						box-shadow: 0 8px 24px rgba(15,118,110,.22);
					}
					.vpe-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
					.vpe-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px; }
					.vpe-row {margin-bottom:10px;}
					.vpe-label {font-size:12px;color:var(--muted);margin-bottom:4px;font-weight:700;letter-spacing:.2px;}
					.vpe-actions {display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;}
					.vpe-success {display:none;margin-top:12px;padding:12px;border-radius:12px;background:#ecfdf5;border:1px solid #86efac;color:#166534;}
					.vpe-capture { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
					.vpe-preview { font-size:12px; color:#0f766e; margin-top:6px; word-break: break-all; }
					@media (max-width: 900px) { .vpe-grid{grid-template-columns:1fr;} .vpe-capture{grid-template-columns:1fr;} }
				</style>
				<div class="vpe-hero">
					<h3 style="margin:0 0 6px 0;font-weight:800;">${__("Quick Visitor Registration")}</h3>
					<div style="opacity:.9">${__("Create request, then capture face and ID proof via webcam or mobile camera.")}</div>
				</div>
				<div class="vpe-grid">
					<div class="vpe-card">
						<div class="vpe-row"><div class="vpe-label">${__("Visitor Name")}</div><input class="form-control" data-key="visitor_name"></div>
						<div class="vpe-row"><div class="vpe-label">${__("Visitor Email")}</div><input class="form-control" data-key="visitor_email" type="email"></div>
						<div class="vpe-row"><div class="vpe-label">${__("Visitor Phone")}</div><input class="form-control" data-key="visitor_phone"></div>
						<div class="vpe-row"><div class="vpe-label">${__("Visitor Company")}</div><input class="form-control" data-key="visitor_company"></div>
						<div class="vpe-row"><div class="vpe-label">${__("ID Proof Type")}</div><select class="form-control" data-key="id_proof_type"><option>Aadhar</option><option>Passport</option><option>Driving License</option><option>Other</option></select></div>
						<div class="vpe-row"><div class="vpe-label">${__("ID Proof Number")}</div><input class="form-control" data-key="id_proof_number"></div>
						<div class="vpe-row">
							<div class="vpe-label">${__("Face Capture")}</div>
							<div class="vpe-capture">
								<button class="btn btn-default" data-action="capture-face-webcam">${__("Capture Face (Webcam)")}</button>
								<button class="btn btn-default" data-action="capture-face-mobile">${__("Capture Face (Mobile Cam)")}</button>
							</div>
							<div class="vpe-preview" data-preview="face_photo"></div>
						</div>
						<div class="vpe-row">
							<div class="vpe-label">${__("ID Proof Capture")}</div>
							<div class="vpe-capture">
								<button class="btn btn-default" data-action="capture-id-webcam">${__("Capture ID (Webcam)")}</button>
								<button class="btn btn-default" data-action="capture-id-mobile">${__("Capture ID (Mobile Cam)")}</button>
							</div>
							<div class="vpe-preview" data-preview="id_proof_image"></div>
						</div>
					</div>
					<div class="vpe-card">
						<div class="vpe-row"><div class="vpe-label">${__("Host Employee")}</div><div data-control="host_employee"></div></div>
						<div class="vpe-row"><div class="vpe-label">${__("Site")}</div><div data-control="site"></div></div>
						<div class="vpe-row"><div class="vpe-label">${__("Visit Purpose")}</div><textarea class="form-control" rows="4" data-key="visit_purpose"></textarea></div>
						<div class="vpe-row"><div class="vpe-label">${__("Expected Visit Date")}</div><input class="form-control" data-key="expected_visit_date" type="date"></div>
						<div class="vpe-row"><div class="vpe-label">${__("Expected Visit Time")}</div><input class="form-control" data-key="expected_visit_time" type="time"></div>
						<div class="vpe-actions">
							<button class="btn btn-primary" data-action="create">${__("Create Request")}</button>
							<button class="btn btn-default" data-action="reset">${__("Reset")}</button>
						</div>
						<div class="vpe-success"></div>
					</div>
				</div>
			</div>
		`);
		this.$root = $(this.page.body).find(".vpe-wrap");
	}

	make_controls() {
		this.host_control = frappe.ui.form.make_control({
			parent: this.$root.find("[data-control='host_employee']").get(0),
			df: { fieldtype: "Link", fieldname: "host_employee", options: "Employee", reqd: 1 },
			render_input: true,
		});
		this.site_control = frappe.ui.form.make_control({
			parent: this.$root.find("[data-control='site']").get(0),
			df: { fieldtype: "Link", fieldname: "site", options: "Visitor Site" },
			render_input: true,
		});
		this.host_control.refresh();
		this.site_control.refresh();
	}

	bind_events() {
		this.$root.find("[data-action='create']").on("click", () => this.create_request());
		this.$root.find("[data-action='reset']").on("click", () => this.reset());

		this.$root.find("[data-action='capture-face-webcam']").on("click", () => this.capture_with_webcam("face_photo"));
		this.$root.find("[data-action='capture-id-webcam']").on("click", () => this.capture_with_webcam("id_proof_image"));
		this.$root.find("[data-action='capture-face-mobile']").on("click", () => this.capture_with_file_input("face_photo", "user"));
		this.$root.find("[data-action='capture-id-mobile']").on("click", () => this.capture_with_file_input("id_proof_image", "environment"));
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
		const payload = this.get_payload();
		if (!payload.visitor_name || !payload.visitor_email || !payload.host_employee || !payload.id_proof_number || !payload.expected_visit_date || !payload.expected_visit_time || !payload.visit_purpose) {
			frappe.show_alert({ message: __("Please fill all required fields"), indicator: "red" });
			return;
		}
		const r = await frappe.call({
			method: "visitor_management.visitor_management.page.visitor_pass_entry.visitor_pass_entry.create_visitor_pass_request",
			args: { payload },
		});
		this.docname = r.message.name;
		this.$root
			.find(".vpe-success")
			.html(`${__("Created request")}: <a href="/app/visitor-pass-request/${this.docname}">${this.docname}</a><br>${__("Requested By")}: ${r.message.requested_by}`)
			.show();
		frappe.show_alert({ message: __("Visitor request created"), indicator: "green" });
	}

	async capture_with_webcam(fieldname) {
		if (!this.docname) {
			frappe.show_alert({ message: __("Create request first"), indicator: "orange" });
			return;
		}
		const title = fieldname === "face_photo" ? __("Capture Face") : __("Capture ID Proof");
		const d = new frappe.ui.Dialog({
			title,
			fields: [{ fieldtype: "HTML", fieldname: "cam" }],
			primary_action_label: __("Capture"),
			primary_action: async () => {
				try {
					const video = d.$wrapper.find("video")[0];
					const canvas = d.$wrapper.find("canvas")[0];
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
					canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
					const image_b64 = canvas.toDataURL("image/jpeg", 0.85);
					await this.save_image(fieldname, image_b64);
				} finally {
					if (d._stream) d._stream.getTracks().forEach((t) => t.stop());
					d.hide();
				}
			},
		});
		d.show();
		d.fields_dict.cam.$wrapper.html(`<video autoplay playsinline style="width:100%;max-height:360px;border-radius:8px"></video><canvas style="display:none"></canvas>`);
		const constraints = fieldname === "id_proof_image" ? { video: { facingMode: { ideal: "environment" } } } : { video: { facingMode: "user" } };
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		d._stream = stream;
		d.$wrapper.find("video")[0].srcObject = stream;
	}

	capture_with_file_input(fieldname, facingMode) {
		if (!this.docname) {
			frappe.show_alert({ message: __("Create request first"), indicator: "orange" });
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
			};
			reader.readAsDataURL(file);
		};
		input.click();
	}

	async save_image(fieldname, image_b64) {
		const r = await frappe.call({
			method: "visitor_management.api.face_capture.save_face_photo",
			args: {
				doctype: "Visitor Pass Request",
				docname: this.docname,
				image_b64,
				field: fieldname,
			},
		});
		this.$root.find(`[data-preview='${fieldname}']`).html(`${__("Saved")}: ${frappe.utils.escape_html(r.message.file_url || "")}`);
		frappe.show_alert({ message: __("Image saved"), indicator: "green" });
	}

	reset() {
		this.docname = null;
		this.$root.find("input, textarea").val("");
		this.$root.find("select").prop("selectedIndex", 0);
		this.host_control.set_value("");
		this.site_control.set_value("");
		this.$root.find(".vpe-success").hide().text("");
		this.$root.find(".vpe-preview").text("");
	}
}
