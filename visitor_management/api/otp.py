from __future__ import annotations

import hashlib
import random
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime


def _hash_otp(otp: str) -> str:
	"""Return deterministic OTP hash."""
	return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def _get_request_doc(request_name: str):
	"""Load and permission-check a Visitor Pass Request document."""
	doc = frappe.get_doc("Visitor Pass Request", request_name)
	if not doc.has_permission("read"):
		frappe.throw(_("Not permitted to access this request"))
	return doc


def _get_host_email(doc) -> str:
	"""Resolve host employee linked user email."""
	if not doc.host_employee:
		frappe.throw(_("Host Employee is required"))
	employee = frappe.db.get_value("Employee", doc.host_employee, ["user_id", "employee_name"], as_dict=True)
	if not employee or not employee.user_id:
		frappe.throw(_("Host Employee must have a linked User"))
	email = frappe.db.get_value("User", employee.user_id, "email")
	if not email:
		frappe.throw(_("Host User does not have an email address"))
	return email


@frappe.whitelist()
def send_otp(request_name: str) -> dict:
	"""Generate and send OTP to host for visitor approval."""
	doc = _get_request_doc(request_name)
	if not doc.has_permission("write"):
		frappe.throw(_("Not permitted to send OTP"))

	otp = f"{random.randint(0, 999999):06d}"
	now = now_datetime()
	doc.db_set("otp_hash", _hash_otp(otp), update_modified=False)
	doc.db_set("otp_sent_on", now, update_modified=False)
	doc.db_set("otp_attempts", 0, update_modified=False)
	doc.db_set("otp_locked", 0, update_modified=False)
	doc.db_set("status", "Pending OTP", update_modified=False)

	host_email = _get_host_email(doc)
	context = {
		"request_name": doc.name,
		"visitor_name": doc.visitor_name,
		"host_employee": doc.host_employee,
		"otp": otp,
	}
	body = frappe.render_template("visitor_management/templates/emails/otp_approval.html", context)
	frappe.sendmail(
		recipients=[host_email],
		subject=_("OTP for visitor request {0}").format(doc.name),
		message=body,
		delayed=False,
	)
	frappe.db.commit()
	return {"sent": True}


@frappe.whitelist()
def verify_otp(request_name: str, otp_input: str) -> dict:
	"""Validate OTP value and update request status."""
	doc = _get_request_doc(request_name)
	if not doc.has_permission("write"):
		frappe.throw(_("Not permitted to verify OTP"))
	if doc.otp_locked:
		return {"verified": False, "message": _("OTP is locked after multiple failed attempts")}
	if not doc.otp_hash or not doc.otp_sent_on:
		return {"verified": False, "message": _("OTP not sent for this request")}

	expiry_minutes = int(frappe.db.get_single_value("VMS Settings", "otp_expiry_minutes") or 10)
	expires_on = add_to_date(doc.otp_sent_on, minutes=expiry_minutes, as_datetime=True)
	if now_datetime() > expires_on:
		return {"verified": False, "message": _("OTP has expired")}

	if _hash_otp(otp_input or "") != doc.otp_hash:
		attempts = int(doc.otp_attempts or 0) + 1
		locked = 1 if attempts >= 3 else 0
		doc.db_set("otp_attempts", attempts, update_modified=False)
		doc.db_set("otp_locked", locked, update_modified=False)
		frappe.db.commit()
		return {
			"verified": False,
			"message": _("Invalid OTP" if not locked else "OTP locked after 3 failures"),
		}

	doc.db_set("otp_verified", 1, update_modified=False)
	doc.db_set("status", "Pending Approval", update_modified=False)
	doc.db_set("workflow_state", "Pending Approval", update_modified=False)
	frappe.db.commit()
	return {"verified": True, "message": _("OTP verified successfully")}


@frappe.whitelist()
def approve_pass(request_name: str, action: str) -> dict:
	"""Approve or reject request by host employee linked user."""
	doc = _get_request_doc(request_name)
	if action not in {"approve", "reject"}:
		frappe.throw(_("Invalid action"))
	if not doc.host_employee:
		frappe.throw(_("Host Employee is mandatory"))

	host_user = frappe.db.get_value("Employee", doc.host_employee, "user_id")
	if not host_user or host_user != frappe.session.user:
		frappe.throw(_("Only the host employee can perform this action"))

	if action == "approve":
		doc.on_approve()
	else:
		doc.on_reject()
	frappe.db.commit()
	return {"ok": True, "status": doc.status}
