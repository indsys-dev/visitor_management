/* visitor_management/public/js/vms_settings.js */

frappe.ui.form.on("VMS Settings", {
	refresh(frm) {
		if (!frappe.user.has_role("System Manager")) {
			return;
		}

		frm.add_custom_button(__("Sync Master Desk Setup"), async () => {
			await frappe.call({
				method: "visitor_management.api.master_desk.sync_configuration",
			});
			frappe.show_alert({
				message: __("Master Desk configuration synced for Visitor Management"),
				indicator: "green",
			});
		});

		frm.add_custom_button(__("Open Master Desk Config"), async () => {
			const response = await frappe.call({
				method: "visitor_management.api.master_desk.get_configuration_name",
			});
			const config_name = response?.message?.name;
			if (config_name) {
				frappe.set_route("Form", "Master Desk App", config_name);
				return;
			}
			frappe.msgprint({
				title: __("Configuration Missing"),
				indicator: "orange",
				message: __("No Master Desk App record found for Visitor Management. Click 'Sync Master Desk Setup' first."),
			});
		});
	},
});
