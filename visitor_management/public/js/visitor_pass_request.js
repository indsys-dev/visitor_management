frappe.ui.form.on("Visitor Pass Request", {
	refresh(frm) {
		frm.add_custom_button(__("Capture Face"), () => capture_face(frm));
		frm.add_custom_button(__("Upload ID Proof"), () => upload_id_proof(frm));
		toggle_multisite(frm);
		if (frm.doc.watchlist_flagged) {
			frm.dashboard.set_headline_alert(__("Flagged - watchlist"), "orange");
		}
	},
	capture_face(frm) {
		capture_face(frm);
	},
	upload_id_proof(frm) {
		upload_id_proof(frm);
	},
	visitor_email(frm) {
		if (!frm.doc.visitor_email) return;
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Visitor Pass Request",
				fields: ["visitor_name", "visitor_phone", "id_proof_type", "id_proof_number"],
				filters: { visitor_email: frm.doc.visitor_email, status: "Approved" },
				order_by: "modified desc",
				limit_page_length: 1,
			},
			callback: (r) => {
				const row = (r.message || [])[0];
				if (!row) return;
				if (!frm.doc.visitor_name) frm.set_value("visitor_name", row.visitor_name);
				if (!frm.doc.visitor_phone) frm.set_value("visitor_phone", row.visitor_phone);
				if (!frm.doc.id_proof_type) frm.set_value("id_proof_type", row.id_proof_type);
				if (!frm.doc.id_proof_number) frm.set_value("id_proof_number", row.id_proof_number);
				frappe.show_alert({ message: __("Repeat visitor details applied"), indicator: "green" });
			},
		});
	},
});

function toggle_multisite(frm) {
	frappe.call({
		method: "frappe.client.get_single_value",
		args: { doctype: "VMS Settings", field: "enable_multi_site" },
		callback: (r) => {
			const enabled = cint(r.message || 0);
			frm.set_df_property("site", "hidden", enabled ? 0 : 1);
		},
	});
}

function capture_face(frm) {
	if (!frm.doc.name) {
		frappe.throw(__("Please save the document first."));
	}
	const d = new frappe.ui.Dialog({
		title: __("Capture Face"),
		fields: [{ fieldtype: "HTML", fieldname: "camera" }],
		primary_action_label: __("Capture"),
		primary_action: async () => {
			try {
				const video = d.$wrapper.find("video")[0];
				const canvas = d.$wrapper.find("canvas")[0];
				const ctx = canvas.getContext("2d");
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const image_b64 = canvas.toDataURL("image/jpeg", 0.85);
				await frappe.call({
					method: "visitor_management.api.face_capture.save_face_photo",
					args: {
						doctype: frm.doctype,
						docname: frm.doc.name,
						image_b64,
						field: "face_photo",
					},
				});
				frappe.show_alert({ message: __("Face photo saved"), indicator: "green" });
				frm.reload_doc();
			} finally {
				const stream = d._stream;
				if (stream) stream.getTracks().forEach((t) => t.stop());
				d.hide();
			}
		},
	});
	d.show();
	d.fields_dict.camera.$wrapper.html(
		`<div><video autoplay playsinline style="width:100%;max-height:360px"></video><canvas style="display:none"></canvas></div>`
	);
	navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
		d._stream = stream;
		d.$wrapper.find("video")[0].srcObject = stream;
	});
}

function upload_id_proof(frm) {
	if (!frm.doc.name) {
		frappe.throw(__("Please save the document first."));
	}
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.capture = "environment";
	input.onchange = () => {
		const file = input.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async (e) => {
			await frappe.call({
				method: "visitor_management.api.face_capture.save_face_photo",
				args: {
					doctype: frm.doctype,
					docname: frm.doc.name,
					image_b64: e.target.result,
					field: "id_proof_image",
				},
			});
			frappe.show_alert({ message: __("ID proof image saved"), indicator: "green" });
			frm.reload_doc();
		};
		reader.readAsDataURL(file);
	};
	input.click();
}
