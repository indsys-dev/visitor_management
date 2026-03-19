from __future__ import annotations

import json

import frappe
from frappe import _


def _get_logged_in_employee() -> str | None:
	"""Return Employee linked to current session user, if available."""
	if frappe.session.user in {"Guest", "Administrator"}:
		return frappe.db.get_value("Employee", {"user_id": "Administrator"}, "name")
	return frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")


@frappe.whitelist()
def create_visitor_pass_request(payload: str | dict) -> dict:
	"""Create a Visitor Pass Request from custom entry page with safe defaults."""
	if not frappe.has_permission("Visitor Pass Request", "create"):
		frappe.throw(_("Not permitted to create Visitor Pass Request"))

	if isinstance(payload, str):
		try:
			data = json.loads(payload)
		except Exception:
			frappe.throw(_("Invalid payload format"))
	else:
		data = payload or {}

	required = [
		"visitor_name",
		"visitor_email",
		"host_employee",
		"id_proof_number",
		"visit_purpose",
		"expected_visit_date",
		"expected_visit_time",
	]
	for key in required:
		if not data.get(key):
			frappe.throw(_("Missing required field: {0}").format(key))

	employee = _get_logged_in_employee()
	requested_by = "Management" if employee else "Self"

	doc = frappe.get_doc(
		{
			"doctype": "Visitor Pass Request",
			"status": "Draft",
			"workflow_state": "Draft",
			"requested_by": requested_by,
			"created_by_employee": employee if requested_by == "Management" else None,
			"visitor_name": data.get("visitor_name"),
			"visitor_email": data.get("visitor_email"),
			"visitor_phone": data.get("visitor_phone"),
			"visitor_company": data.get("visitor_company"),
			"id_proof_type": data.get("id_proof_type"),
			"id_proof_number": data.get("id_proof_number"),
			"host_employee": data.get("host_employee"),
			"site": data.get("site"),
			"visit_purpose": data.get("visit_purpose"),
			"expected_visit_date": data.get("expected_visit_date"),
			"expected_visit_time": data.get("expected_visit_time"),
		}
	).insert(ignore_permissions=True)

	frappe.db.commit()
	return {"name": doc.name, "requested_by": doc.requested_by, "created_by_employee": doc.created_by_employee}
