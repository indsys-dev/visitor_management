from __future__ import annotations

import frappe
from frappe import _

from visitor_management.setup.master_desk_setup import sync_master_desk_config


@frappe.whitelist()
def sync_configuration() -> dict:
	"""Sync Visitor Management menu/page setup into Master Desk App configuration."""
	if "System Manager" not in frappe.get_roles():
		frappe.throw(_("Only System Manager can sync Master Desk configuration."), frappe.PermissionError)

	sync_master_desk_config()
	frappe.db.commit()
	return {"ok": True}


@frappe.whitelist()
def get_configuration_name() -> dict:
	"""Return Master Desk App record name for Visitor Management."""
	if "System Manager" not in frappe.get_roles():
		frappe.throw(_("Only System Manager can view Master Desk configuration."), frappe.PermissionError)

	name = frappe.db.get_value("Master Desk App", {"app_name": "visitor_management"}, "name")
	return {"name": name}
