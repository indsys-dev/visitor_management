from __future__ import annotations

import hashlib
import random
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def _get_request_doc(request_name: str):
    doc = frappe.get_doc("Visitor Pass Request", request_name)
    if not doc.has_permission("read"):
        frappe.throw(_("Not permitted to access this request"))
    return doc


def _get_host_email(doc) -> str:
    """Resolve host email from Host doctype directly."""
    if not doc.host_employee:
        frappe.throw(_("Host Employee is required"))
    host = frappe.db.get_value(
        "Host", doc.host_employee,
        ["email", "employee_name", "is_active"],
        as_dict=True
    )
    if not host:
        frappe.throw(_("Host record not found: {0}").format(doc.host_employee))
    if not host.email:
        frappe.throw(_("Host {0} does not have an email address").format(doc.host_employee))
    return host.email


@frappe.whitelist()
def send_otp(request_name: str) -> dict:
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
    body = frappe.render_template(
        "visitor_management/templates/emails/otp_approval.html", context
    )
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
    doc = _get_request_doc(request_name)
    if not doc.has_permission("write"):
        frappe.throw(_("Not permitted to verify OTP"))
    if doc.otp_locked:
        return {"verified": False, "message": _("OTP locked after multiple failed attempts")}
    if not doc.otp_hash or not doc.otp_sent_on:
        return {"verified": False, "message": _("OTP not sent for this request")}

    expiry_minutes = int(
        frappe.db.get_single_value("VMS Settings", "otp_expiry_minutes") or 10
    )
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
            "message": _("OTP locked after 3 failures") if locked else _("Invalid OTP"),
        }

    doc.db_set("otp_verified", 1, update_modified=False)
    doc.db_set("status", "Pending Approval", update_modified=False)
    doc.db_set("workflow_state", "Pending Approval", update_modified=False)
    frappe.db.commit()
    return {"verified": True, "message": _("OTP verified successfully")}


@frappe.whitelist()
def approve_pass(request_name: str, action: str) -> dict:
    """Approve or reject a visitor pass request."""
    doc = _get_request_doc(request_name)
    if action not in {"approve", "reject"}:
        frappe.throw(_("Invalid action"))
    if doc.docstatus != 1:
        frappe.throw(_("Only submitted requests can be approved or rejected"))

    if action == "approve":
        doc.db_set("status", "Approved", update_modified=False)
        doc.db_set("workflow_state", "Approved", update_modified=False)

        from visitor_management.api.gate import generate_visitor_pass
        pass_meta = generate_visitor_pass(doc.name)

        if doc.visitor_email:
            try:
                message = frappe.render_template(
                    "visitor_management/templates/emails/pass_approved.html",
                    {
                        "visitor_name": doc.visitor_name,
                        "pass_number": pass_meta.get("name"),
                    },
                )
                frappe.sendmail(
                    recipients=[doc.visitor_email],
                    subject=_("Visitor pass approved: {0}").format(doc.name),
                    message=message,
                    delayed=False,
                )
            except Exception:
                frappe.log_error(
                    title="Pass Approval Email Failed",
                    message=f"Could not send approval email for {doc.name}",
                )

        frappe.db.commit()
        return {"ok": True, "status": "Approved", "pass_name": pass_meta.get("name")}

    else:
        doc.db_set("status", "Rejected", update_modified=False)
        doc.db_set("workflow_state", "Rejected", update_modified=False)

        if doc.visitor_email:
            try:
                message = frappe.render_template(
                    "visitor_management/templates/emails/pass_rejected.html",
                    {"request_name": doc.name, "visitor_name": doc.visitor_name},
                )
                frappe.sendmail(
                    recipients=[doc.visitor_email],
                    subject=_("Visitor request rejected: {0}").format(doc.name),
                    message=message,
                    delayed=False,
                )
            except Exception:
                frappe.log_error(
                    title="Pass Rejection Email Failed",
                    message=f"Could not send rejection email for {doc.name}",
                )

        frappe.db.commit()
        return {"ok": True, "status": "Rejected"}
