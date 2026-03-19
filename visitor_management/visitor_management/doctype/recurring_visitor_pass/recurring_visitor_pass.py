from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from io import BytesIO

import frappe
import qrcode
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, nowdate
from frappe.utils.file_manager import save_file


class RecurringVisitorPass(Document):
	"""Recurring/contractor visitor pass with periodic access checks."""

	def before_insert(self) -> None:
		"""Generate pass number and QR before first insert."""
		if not self.pass_number:
			self.pass_number = self._make_pass_number()
		self.generate_recurring_qr()

	def validate(self) -> None:
		"""Validate date range within configured contractor max limit."""
		max_days = int(frappe.db.get_single_value("VMS Settings", "contractor_pass_max_days") or 30)
		if self.valid_from and self.valid_until:
			delta_days = (getdate(self.valid_until) - getdate(self.valid_from)).days
			if delta_days > max_days:
				frappe.throw(_("Recurring pass cannot exceed {0} days").format(max_days))

	def after_insert(self) -> None:
		"""Send welcome email after pass creation."""
		if self.visitor_email:
			try:
				frappe.sendmail(
					recipients=[self.visitor_email],
					subject=_("Recurring Visitor Pass {0}").format(self.pass_number),
					message=frappe.render_template(
						"visitor_management/templates/emails/pass_approved.html",
						{"visitor_name": self.visitor_name, "pass_number": self.pass_number},
					),
					delayed=False,
				)
			except Exception:
				frappe.log_error(
					title="Recurring Visitor Pass Welcome Email Failed",
					message=f"Could not send email for {self.name}",
				)

	def on_update(self) -> None:
		"""Notify visitor when pass is suspended or revoked."""
		if not self.has_value_changed("status"):
			return
		if self.status in {"Suspended", "Revoked"} and self.visitor_email:
			try:
				frappe.sendmail(
					recipients=[self.visitor_email],
					subject=_("Recurring pass {0} updated").format(self.pass_number),
					message=_("Your recurring pass status is now {0}.").format(self.status),
					delayed=True,
				)
			except Exception:
				frappe.log_error(
					title="Recurring Visitor Pass Status Email Failed",
					message=f"Could not send status update for {self.name}",
				)

	def _make_pass_number(self) -> str:
		"""Generate deterministic recurring pass number format."""
		year = nowdate().split("-")[0]
		random_code = secrets.token_hex(3).upper()
		return f"RVP-{year}-{random_code}"

	def generate_recurring_qr(self) -> None:
		"""Create signed QR payload and persist as private attachment."""
		attached_name = str(self.name or self.pass_number or "")
		if not attached_name:
			frappe.throw(_("Unable to generate QR without a pass identifier"))
		payload = {
			"pass_number": attached_name,
			"type": "recurring",
			"visitor_email": self.visitor_email,
			"valid_until": str(self.valid_until),
		}
		secret = frappe.db.get_single_value("VMS Settings", "hmac_secret")
		if not secret:
			frappe.throw(_("HMAC secret is not configured in VMS Settings"))
		serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
		sig = hmac.new(secret.encode("utf-8"), serialized.encode("utf-8"), hashlib.sha256).hexdigest()
		signed_payload = dict(payload)
		signed_payload["sig"] = sig
		qr_data = json.dumps(signed_payload, sort_keys=True, separators=(",", ":"))

		buffer = BytesIO()
		qrcode.make(qr_data).save(buffer, format="PNG")
		file_doc = save_file(
			f"{self.pass_number}-qr.png",
			buffer.getvalue(),
			"Recurring Visitor Pass",
			attached_name,
			is_private=1,
		)
		self.qr_code = file_doc.file_url
