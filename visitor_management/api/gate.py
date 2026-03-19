from __future__ import annotations

import base64
import hashlib
import hmac
import json
from io import BytesIO

import frappe
import qrcode
from frappe import _
from frappe.utils import add_to_date, now_datetime
from frappe.utils.file_manager import save_file


ROLE_SET = {"System Manager", "VMS Manager", "Gate Staff"}


def _assert_gate_user() -> None:
	"""Validate current user has gate-level role access."""
	if frappe.session.user == "Administrator":
		return
	roles = set(frappe.get_roles(frappe.session.user))
	if not roles.intersection(ROLE_SET):
		frappe.throw(_("User is not allowed to perform gate operations"))


def _settings_value(key: str, default=None):
	"""Read singleton settings via get_single_value."""
	return frappe.db.get_single_value("VMS Settings", key) or default


def _sign_payload(payload: dict) -> str:
	"""Compute payload signature using VMS HMAC secret."""
	secret = _settings_value("hmac_secret")
	if not secret:
		frappe.throw(_("HMAC secret is not configured in VMS Settings"))
	serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
	return hmac.new(secret.encode("utf-8"), serialized.encode("utf-8"), hashlib.sha256).hexdigest()


def _build_qr_base64(payload: dict) -> tuple[str, str]:
	"""Create signed payload and return encoded data + image base64."""
	signable = dict(payload)
	signable["sig"] = _sign_payload(payload)
	qr_data = json.dumps(signable, sort_keys=True, separators=(",", ":"))
	buffer = BytesIO()
	qrcode.make(qr_data).save(buffer, format="PNG")
	qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
	return qr_data, qr_base64


def _record_log(pass_doc, log_type: str, gate_location: str | None, site: str | None, remarks: str = "") -> None:
	"""Append a movement log row to pass child table."""
	pass_doc.append(
		"movement_logs",
		{
			"visitor_pass": pass_doc.name,
			"location": gate_location,
			"site": site or pass_doc.site,
			"log_type": log_type,
			"timestamp": now_datetime(),
			"scanned_by": frappe.session.user,
			"remarks": remarks,
		},
	)


def _check_blacklist(visitor_email: str | None, id_proof_number: str | None, site: str | None) -> None:
	"""Block gate entry for active blacklist matches."""
	if not int(_settings_value("blacklist_check_enabled", 1)):
		return
	filters = {"is_active": 1}
	matches = frappe.get_all(
		"Visitor Blacklist",
		filters=filters,
		fields=["name", "list_type", "reason", "site", "email", "id_proof_number"],
	)
	for row in matches:
		site_ok = not row.site or row.site == site
		identity_match = (visitor_email and row.email == visitor_email) or (
			id_proof_number and row.id_proof_number == id_proof_number
		)
		if site_ok and identity_match and row.list_type == "Blacklist":
			frappe.throw(_("Visitor is blacklisted: {0}").format(row.reason or row.name))


@frappe.whitelist()
def generate_visitor_pass(request_name: str) -> dict:
	"""Create one-time visitor pass, generate QR and email to visitor."""
	request_doc = frappe.get_doc("Visitor Pass Request", request_name)
	if not request_doc.has_permission("read"):
		frappe.throw(_("Not permitted"))
	if request_doc.status != "Approved":
		frappe.throw(_("Only approved requests can generate passes"))

	validity_hours = int(_settings_value("default_pass_validity_hours", 8))
	valid_until = add_to_date(now_datetime(), hours=validity_hours, as_datetime=True)
	pass_doc = frappe.get_doc(
		{
			"doctype": "Visitor Pass",
			"visitor_pass_request": request_doc.name,
			"visitor_name": request_doc.visitor_name,
			"visitor_email": request_doc.visitor_email,
			"visitor_phone": request_doc.visitor_phone,
			"visitor_company": request_doc.visitor_company,
			"host_employee": request_doc.host_employee,
			"site": request_doc.site,
			"visit_purpose": request_doc.visit_purpose,
			"pass_status": "Active",
			"valid_from": now_datetime(),
			"valid_until": valid_until,
			"face_photo": request_doc.face_photo,
			"id_proof_type": request_doc.id_proof_type,
			"id_proof_number": request_doc.id_proof_number,
			"id_proof_image": request_doc.id_proof_image,
		}
	).insert(ignore_permissions=True)

	for access in request_doc.allowed_locations or []:
		pass_doc.append(
			"allowed_locations",
			{
				"location": access.location,
				"access_type": access.access_type,
			},
		)
	pass_doc.save(ignore_permissions=True)

	payload = {
		"pass_number": pass_doc.name,
		"type": "onetime",
		"visitor_email": pass_doc.visitor_email,
		"host": pass_doc.host_employee,
		"valid_until": str(pass_doc.valid_until),
		"site": pass_doc.site,
		"locations": [row.location for row in pass_doc.allowed_locations],
	}
	qr_payload, qr_base64 = _build_qr_base64(payload)
	binary_qr = base64.b64decode(qr_base64)
	file_doc = save_file(
		f"{pass_doc.name}-qr.png",
		binary_qr,
		"Visitor Pass",
		pass_doc.name,
		is_private=1,
	)
	pass_doc.db_set("qr_code", file_doc.file_url, update_modified=False)
	pass_doc.db_set("qr_payload", qr_payload, update_modified=False)

	host_name = frappe.db.get_value("Employee", pass_doc.host_employee, "employee_name") or pass_doc.host_employee
	context = {
		"pass_number": pass_doc.name,
		"visitor_name": pass_doc.visitor_name,
		"host_name": host_name,
		"valid_until": pass_doc.valid_until,
		"allowed_locations": ", ".join([row.location for row in pass_doc.allowed_locations]),
		"qr_base64": qr_base64,
	}
	message = frappe.render_template("visitor_management/templates/emails/visitor_pass.html", context)
	if pass_doc.visitor_email:
		frappe.sendmail(
			recipients=[pass_doc.visitor_email],
			subject=_("Visitor Pass {0}").format(pass_doc.name),
			message=message,
			delayed=False,
		)

	frappe.db.commit()
	return {"name": pass_doc.name, "qr_file": file_doc.file_url}


def _verify_signature(payload: dict) -> None:
	"""Validate HMAC signature from QR payload."""
	sig = payload.get("sig")
	if not sig:
		frappe.throw(_("Missing QR signature"))
	data = dict(payload)
	data.pop("sig", None)
	expected = _sign_payload(data)
	if not hmac.compare_digest(sig, expected):
		frappe.throw(_("Invalid QR signature"))


def _ensure_allowed_location(pass_doc, gate_location: str) -> None:
	"""Validate location is present in pass allow-list."""
	allowed = {row.location for row in pass_doc.allowed_locations or [] if row.location}
	if gate_location and allowed and gate_location not in allowed:
		frappe.throw(_("Access denied for location {0}").format(gate_location))


def _verify_onetime(payload: dict, gate_location: str, site: str, is_exit: int = 0) -> dict:
	"""Verify one-time pass flow and write movement logs."""
	pass_doc = frappe.get_doc("Visitor Pass", payload.get("pass_number"))
	if pass_doc.pass_status != "Active":
		frappe.throw(_("Pass is not active"))
	if pass_doc.site and site and pass_doc.site != site:
		frappe.throw(_("Pass does not belong to this site"))
	if now_datetime() > pass_doc.valid_until:
		pass_doc.db_set("pass_status", "Expired", update_modified=False)
		frappe.db.commit()
		frappe.throw(_("Pass has expired"))

	_check_blacklist(pass_doc.visitor_email, pass_doc.id_proof_number, site)
	_ensure_allowed_location(pass_doc, gate_location)
	if is_exit:
		pass_doc.exit_time = now_datetime()
		pass_doc.pass_status = "Completed"
		_record_log(pass_doc, "Exit", gate_location, site)
	else:
		if not pass_doc.entry_time:
			pass_doc.entry_time = now_datetime()
		_record_log(pass_doc, "Entry", gate_location, site)
	pass_doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"status": "ok",
		"visitor_name": pass_doc.visitor_name,
		"host_name": pass_doc.host_employee,
		"valid_until": pass_doc.valid_until,
	}


def _verify_recurring(payload: dict, gate_location: str, site: str, is_exit: int = 0) -> dict:
	"""Verify recurring pass flow and record visit details."""
	rvp = frappe.get_doc("Recurring Visitor Pass", payload.get("pass_number"))
	if rvp.status != "Active":
		frappe.throw(_("Recurring pass is not active"))
	if rvp.site and site and rvp.site != site:
		frappe.throw(_("Recurring pass does not belong to this site"))
	now = now_datetime()
	today = now.date()
	if not (rvp.valid_from <= today <= rvp.valid_until):
		frappe.throw(_("Recurring pass is outside validity dates"))
	weekday = now.strftime("%a")
	allowed_days = {d.strip() for d in (rvp.allowed_days or "").split(",") if d.strip()}
	if allowed_days and weekday not in allowed_days:
		frappe.throw(_("Access not allowed today"))
	if rvp.entry_time_from and rvp.entry_time_to:
		current_t = now.time()
		if current_t < rvp.entry_time_from or current_t > rvp.entry_time_to:
			frappe.throw(_("Access not allowed at this time"))
	allowed = {row.location for row in rvp.allowed_locations or [] if row.location}
	if gate_location and allowed and gate_location not in allowed:
		frappe.throw(_("Access denied for location {0}").format(gate_location))
	_check_blacklist(rvp.visitor_email, rvp.id_proof_number, site)

	if is_exit:
		log_type = "Exit"
	else:
		log_type = "Entry"
	rvp.append(
		"movement_logs",
		{
			"location": gate_location,
			"site": site or rvp.site,
			"log_type": log_type,
			"timestamp": now,
			"scanned_by": frappe.session.user,
			"remarks": "Recurring pass scan",
		},
	)
	if not is_exit:
		rvp.total_visits = int(rvp.total_visits or 0) + 1
		rvp.last_visit = now
	rvp.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"status": "ok",
		"visitor_name": rvp.visitor_name,
		"host_name": rvp.host_employee,
		"valid_until": rvp.valid_until,
	}


@frappe.whitelist()
def verify_pass_at_gate(qr_payload: str, gate_location: str | None = None, site: str | None = None, is_exit: int = 0) -> dict:
	"""Verify incoming QR payload for one-time or recurring pass scanning."""
	_assert_gate_user()
	if not qr_payload:
		frappe.throw(_("QR payload is required"))
	try:
		payload = json.loads(qr_payload) if isinstance(qr_payload, str) else qr_payload
	except Exception:
		frappe.throw(_("Invalid QR payload format"))

	_verify_signature(payload)
	pass_type = payload.get("type", "onetime")
	if pass_type == "recurring":
		return _verify_recurring(payload, gate_location, site, is_exit)
	return _verify_onetime(payload, gate_location, site, is_exit)


@frappe.whitelist()
def check_active_passes_on_login(login_manager=None) -> None:
	"""Notify users about currently active visitors linked to their employee profile."""
	if not frappe.session.user or frappe.session.user == "Guest":
		return
	employee = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
	if not employee:
		return
	active = frappe.get_all(
		"Visitor Pass",
		filters={"host_employee": employee, "pass_status": "Active"},
		fields=["name", "visitor_name", "valid_until"],
		limit=5,
	)
	if active:
		frappe.msgprint(
			_("You have {0} active visitor pass(es): {1}").format(
				len(active), ", ".join(row.name for row in active)
			),
			alert=True,
		)
