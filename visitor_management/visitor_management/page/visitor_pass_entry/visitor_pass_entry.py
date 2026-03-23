from __future__ import annotations

import json

import frappe
from frappe import _


@frappe.whitelist(allow_guest=True)
def create_visitor_pass_request(payload: str | dict) -> dict:
	"""Create a Visitor Pass Request from custom entry page with safe defaults."""
	if isinstance(payload, str):
		try:
			data = json.loads(payload)
		except Exception:
			frappe.throw(_("Invalid payload format"))
	else:
		data = payload or {}

	always_required = [
		"visitor_name",
		"visitor_email",
		"host_employee",
		"visit_purpose",
		"expected_visit_date",
		"expected_visit_time",
	]
	for key in always_required:
		if not data.get(key):
			frappe.throw(_("Missing required field: {0}").format(key))

	if data.get("requested_by") != "Management":
		if not data.get("id_proof_number"):
			frappe.throw(_("Missing required field: id_proof_number"))

	requested_by = data.get("requested_by") or "Self"

	doc = frappe.get_doc({
		"doctype": "Visitor Pass Request",
		"status": "Draft",
		"workflow_state": "Draft",
		"requested_by": requested_by,
		"created_by_employee": data.get("created_by_employee") if requested_by == "Management" else None,
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
	}).insert(ignore_permissions=True)

	doc.submit()

	# Send OTP to visitor after submit
	if requested_by == "Self":
		try:
			from visitor_management.api.otp import send_otp
			send_otp(doc.name)
		except Exception:
			frappe.log_error(title="OTP Send Failed", message=frappe.get_traceback())

	# Management — auto approve
	if requested_by == "Management":
		try:
			from visitor_management.api.otp import approve_pass
			approve_pass(doc.name, "approve")
		except Exception:
			frappe.log_error(title="Auto Approve Failed", message=frappe.get_traceback())

	frappe.db.commit()
	return {"name": doc.name, "status": doc.status}