frappe.ui.form.on("Recurring Visitor Pass", {
	refresh(frm) {
		frappe.call({
			method: "frappe.client.get_single_value",
			args: { doctype: "VMS Settings", field: "enable_multi_site" },
			callback: (r) => frm.set_df_property("site", "hidden", cint(r.message || 0) ? 0 : 1),
		});
		if (!["Suspended", "Revoked"].includes(frm.doc.status) && frm.doc.docstatus === 0) {
			frm.add_custom_button(__("Generate QR"), async () => {
				await frm.call("generate_recurring_qr");
				await frm.save();
				frappe.show_alert({ message: __("QR regenerated"), indicator: "green" });
			});
		}
	},
});
