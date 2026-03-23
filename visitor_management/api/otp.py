from __future__ import annotations

import hmac
import hashlib
import random

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


def _generate_approval_token(request_name: str, action: str) -> str:
    secret = frappe.db.get_single_value("VMS Settings", "hmac_secret") or "vms-default-secret"
    msg = f"{request_name}:{action}"
    return hmac.HMAC(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

# ── STEP 1: Send OTP to visitor ─────────────────────────────────────────────
@frappe.whitelist()
def send_otp(request_name: str) -> dict:
    doc = _get_request_doc(request_name)
    if not doc.has_permission("write"):
        frappe.throw(_("Not permitted to send OTP"))
    if not doc.visitor_email:
        frappe.throw(_("Visitor email is required for OTP verification"))

    otp = f"{random.randint(0, 999999):06d}"
    now = now_datetime()
    doc.db_set("otp_hash", _hash_otp(otp), update_modified=False)
    doc.db_set("otp_sent_on", now, update_modified=False)
    doc.db_set("otp_attempts", 0, update_modified=False)
    doc.db_set("otp_locked", 0, update_modified=False)
    doc.db_set("status", "Pending OTP", update_modified=False)

    body = frappe.render_template(
        "visitor_management/templates/emails/otp_approval.html",
        {
            "request_name": doc.name,
            "visitor_name": doc.visitor_name,
            "host_employee": doc.host_employee,
            "otp": otp,
        },
    )
    frappe.sendmail(
        recipients=[doc.visitor_email],
        subject=_("Verify your visitor pass request {0}").format(doc.name),
        message=body,
        delayed=False,
    )
    frappe.db.commit()
    return {"sent": True}


# ── STEP 2: Visitor verifies OTP → notify host ──────────────────────────────
@frappe.whitelist()
def verify_otp(request_name: str, otp_input: str) -> dict:
    doc = _get_request_doc(request_name)
    if not doc.has_permission("write"):
        frappe.throw(_("Not permitted to verify OTP"))
    if doc.otp_locked:
        return {"verified": False, "message": _("OTP locked after multiple failed attempts")}
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
            "message": _("OTP locked after 3 failures") if locked else _("Invalid OTP"),
        }

    # OTP correct — move to Pending Approval
    doc.db_set("otp_verified", 1, update_modified=False)
    doc.db_set("status", "Pending Approval", update_modified=False)
    doc.db_set("workflow_state", "Pending Approval", update_modified=False)

    # Notify host with approve/reject buttons
    try:
        host = frappe.db.get_value("Host", doc.host_employee,
            ["email", "employee_name"], as_dict=True)
        if host and host.email:
            visit_time = str(doc.expected_visit_time)[:5] if doc.expected_visit_time else "—"
            base_url = frappe.utils.get_url()
            approval_url = f"{base_url}/app/visitor-pass-approval"
            approve_token = _generate_approval_token(doc.name, "approve")
            reject_token = _generate_approval_token(doc.name, "reject")
            approve_url = f"{base_url}/api/method/visitor_management.api.otp.approve_by_token?request_name={doc.name}&action=approve&token={approve_token}"
            reject_url = f"{base_url}/api/method/visitor_management.api.otp.approve_by_token?request_name={doc.name}&action=reject&token={reject_token}"
            frappe.sendmail(
                recipients=[host.email],
                subject=_("Action Required: Approve visitor {0}").format(doc.visitor_name),
                message=f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#1e3a6e,#274d94);border-radius:14px 14px 0 0;padding:28px 32px;text-align:center;">
  <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">INDSYS</div>
  <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">Visitor Approval Required</h1>
  <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Visitor has verified identity — awaiting your approval</p>
</td></tr>
<tr><td style="background:#fff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
  <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.6;">
    Dear <strong>{host.employee_name or doc.host_employee}</strong>,<br>
    Visitor <strong style="color:#1e3a6e;">{doc.visitor_name}</strong> has verified their identity via OTP and is awaiting your approval.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
    <tr style="background:#f8fafc;"><td colspan="2" style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;border-bottom:1px solid #e2e8f0;">Visitor Details</td></tr>
    <tr><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;width:40%;">Request ID</td><td style="padding:11px 16px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">{doc.name}</td></tr>
    <tr style="background:#fafbfc;"><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Visitor Name</td><td style="padding:11px 16px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">{doc.visitor_name}</td></tr>
    <tr><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Email</td><td style="padding:11px 16px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9;">{doc.visitor_email or '—'}</td></tr>
    <tr style="background:#fafbfc;"><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Visit Date</td><td style="padding:11px 16px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">{doc.expected_visit_date}</td></tr>
    <tr><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Visit Time</td><td style="padding:11px 16px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">{visit_time}</td></tr>
    <tr style="background:#fafbfc;"><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Company</td><td style="padding:11px 16px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9;">{doc.visitor_company or '—'}</td></tr>
    <tr><td style="padding:11px 16px;font-size:12px;font-weight:600;color:#64748b;">Purpose</td><td style="padding:11px 16px;font-size:13px;color:#0f172a;">{doc.visit_purpose or '—'}</td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr><td align="center" style="padding:8px 4px;">
      <a href="{approve_url}" style="display:inline-block;background:#15803d;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-right:12px;">✓ Approve Visitor</a>
      <a href="{reject_url}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">✕ Reject Visitor</a>
    </td></tr>
    <tr><td align="center" style="padding:4px;">
      <a href="{approval_url}" style="font-size:12px;color:#64748b;text-decoration:underline;">Or go to the full approval page →</a>
    </td></tr>
  </table>
</td></tr>
<tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 14px 14px;padding:16px 32px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#94a3b8;">Automated message from INDSYS Visitor Management System. Do not reply.</p>
</td></tr>
</table></td></tr></table>
</body></html>""",
                delayed=False,
            )
    except Exception:
        frappe.log_error(title="Host Notification Failed",
            message=f"Could not notify host for {doc.name}")

    frappe.db.commit()
    return {"verified": True, "message": _("OTP verified. Host notified for approval.")}


# ── STEP 3a: Host approves from email link ───────────────────────────────────
@frappe.whitelist(allow_guest=True)
def approve_by_token(request_name: str, action: str, token: str) -> None:
    if action not in {"approve", "reject"}:
        frappe.respond_as_web_page("Invalid Action", "Invalid action.", http_status_code=400)
        return
    expected_token = _generate_approval_token(request_name, action)
    if not hmac.compare_digest(token, expected_token):
        frappe.respond_as_web_page("Invalid Token", "This link is invalid or expired.", http_status_code=403)
        return
    try:
        doc = frappe.get_doc("Visitor Pass Request", request_name)
    except Exception:
        frappe.respond_as_web_page("Not Found", "Request not found.", http_status_code=404)
        return
    if doc.status in ("Approved", "Rejected", "Cancelled"):
        frappe.respond_as_web_page("Already Processed",
            f"This request has already been <strong>{doc.status}</strong>.", http_status_code=200)
        return

    if action == "approve":
        doc.db_set("status", "Approved", update_modified=False)
        doc.db_set("workflow_state", "Approved", update_modified=False)
        frappe.db.commit()
        try:
            from visitor_management.api.gate import generate_visitor_pass
            # Run as Administrator since approve_by_token is guest-accessible
            frappe.set_user("Administrator")
            generate_visitor_pass(doc.name)
            frappe.set_user("Guest")
        except Exception:
            frappe.set_user("Guest")
            frappe.log_error(title="Token Approval Error", message=frappe.get_traceback())
        frappe.db.commit()
        frappe.respond_as_web_page("✅ Visitor Approved",
            f"""<div style="font-family:Arial,sans-serif;text-align:center;padding:40px">
            <div style="font-size:60px;margin-bottom:16px">✅</div>
            <h2 style="color:#166534">Visitor Approved Successfully</h2>
            <p style="color:#334155;font-size:15px">
                Visitor <strong>{doc.visitor_name}</strong> has been approved.<br>
                Pass has been issued and emailed to the visitor.
            </p>
            <p style="color:#64748b;font-size:13px;margin-top:24px">Request: {doc.name}</p>
            </div>""", http_status_code=200)
    else:
        reason = frappe.form_dict.get("reason") or ""
        doc.db_set("status", "Rejected", update_modified=False)
        doc.db_set("workflow_state", "Rejected", update_modified=False)
        if reason:
            doc.db_set("rejection_reason", reason, update_modified=False)
        try:
            if doc.visitor_email:
                message = frappe.render_template(
                    "visitor_management/templates/emails/pass_rejected.html",
                    {"request_name": doc.name, "visitor_name": doc.visitor_name},
                )
                frappe.sendmail(
                    recipients=[doc.visitor_email],
                    subject=f"Visitor request rejected: {doc.name}",
                    message=message, delayed=False,
                )
        except Exception:
            frappe.log_error(title="Token Rejection Error", message=frappe.get_traceback())
        frappe.db.commit()
        frappe.respond_as_web_page("❌ Visitor Rejected",
            f"""<div style="font-family:Arial,sans-serif;text-align:center;padding:40px">
            <div style="font-size:60px;margin-bottom:16px">❌</div>
            <h2 style="color:#991b1b">Visitor Request Rejected</h2>
            <p style="color:#334155;font-size:15px">
                Request <strong>{doc.name}</strong> for <strong>{doc.visitor_name}</strong> has been rejected.<br>
                The visitor has been notified.
            </p></div>""", http_status_code=200)


# ── STEP 3b: Host approves from approval page ────────────────────────────────
@frappe.whitelist()
def approve_pass(request_name: str, action: str, reason: str = "") -> dict:
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
        # gate.py sends the visitor pass email with PDF — no extra email here
        frappe.db.commit()
        return {"ok": True, "status": "Approved", "pass_name": pass_meta.get("name")}

    else:
        doc.db_set("status", "Rejected", update_modified=False)
        doc.db_set("workflow_state", "Rejected", update_modified=False)
        if reason:
            doc.db_set("rejection_reason", reason, update_modified=False)
        try:
            if doc.visitor_email:
                message = frappe.render_template(
                    "visitor_management/templates/emails/pass_rejected.html",
                    {"request_name": doc.name, "visitor_name": doc.visitor_name},
                )
                frappe.sendmail(
                    recipients=[doc.visitor_email],
                    subject=_("Visitor request rejected: {0}").format(doc.name),
                    message=message, delayed=False,
                )
        except Exception:
            frappe.log_error(title="Pass Rejection Email Failed",
                message=f"Could not send rejection email for {doc.name}")
        frappe.db.commit()
        return {"ok": True, "status": "Rejected"}
