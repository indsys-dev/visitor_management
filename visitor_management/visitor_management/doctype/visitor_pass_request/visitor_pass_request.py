from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class VisitorPassRequest(Document):
	"""Request document for one-time visitor access approval workflow."""

	def validate(self) -> None:
		"""Run request validations and helper defaulting."""
		self._validate_requested_by()
		self._prefill_repeat_visitor()

	def before_save(self) -> None:
		"""Validate blacklist/watchlist status before saving the request."""
		self._check_blacklist_watchlist()

	def on_submit(self) -> None:
		"""Advance request into OTP or direct approval queue."""
		require_otp = int(frappe.db.get_single_value("VMS Settings", "require_otp_for_approval") or 1)
		if require_otp:
			self.db_set("status", "Pending OTP", update_modified=False)
			self.db_set("workflow_state", "Pending OTP", update_modified=False)
			from visitor_management.api.otp import send_otp

			send_otp(self.name)
		else:
			self.db_set("status", "Pending Approval", update_modified=False)
			self.db_set("workflow_state", "Pending Approval", update_modified=False)

	def on_approve(self) -> None:
		"""Mark request approved and generate visitor pass."""
		if self.docstatus != 1:
			frappe.throw(_("Only submitted requests can be approved"))
		self.db_set("status", "Approved", update_modified=False)
		self.db_set("workflow_state", "Approved", update_modified=False)
		from visitor_management.api.gate import generate_visitor_pass

		pass_meta = generate_visitor_pass(self.name)
		if self.visitor_email:
			message = frappe.render_template(
				"visitor_management/templates/emails/pass_approved.html",
				{
					"visitor_name": self.visitor_name,
					"pass_number": pass_meta.get("name"),
				},
			)
			frappe.sendmail(
				recipients=[self.visitor_email],
				subject=_("Visitor request {0} approved").format(self.name),
				message=message,
				delayed=False,
			)

	def on_reject(self) -> None:
		"""Mark request rejected and notify visitor if email is available."""
		if self.docstatus != 1:
			frappe.throw(_("Only submitted requests can be rejected"))
		self.db_set("status", "Rejected", update_modified=False)
		self.db_set("workflow_state", "Rejected", update_modified=False)
		if self.visitor_email:
			message = frappe.render_template(
				"visitor_management/templates/emails/pass_rejected.html",
				{"request_name": self.name, "visitor_name": self.visitor_name},
			)
			frappe.sendmail(
				recipients=[self.visitor_email],
				subject=_("Visitor request {0} rejected").format(self.name),
				message=message,
				delayed=False,
			)

	def _validate_requested_by(self) -> None:
		"""Validate requested_by field is set."""
		if not self.requested_by:
			self.requested_by = "Self"
			
	def _prefill_repeat_visitor(self) -> None:
		"""Prefill core visitor details from previous approved request by email."""
		if not self.visitor_email:
			return
		if self.visitor_name and self.visitor_phone and self.id_proof_type and self.id_proof_number:
			return
		prev = frappe.get_all(
			"Visitor Pass Request",
			filters={"visitor_email": self.visitor_email, "status": "Approved", "name": ["!=", self.name or ""]},
			fields=["visitor_name", "visitor_phone", "id_proof_type", "id_proof_number"],
			order_by="modified desc",
			limit=1,
		)
		if not prev:
			return
		last = prev[0]
		self.visitor_name = self.visitor_name or last.visitor_name
		self.visitor_phone = self.visitor_phone or last.visitor_phone
		self.id_proof_type = self.id_proof_type or last.id_proof_type
		self.id_proof_number = self.id_proof_number or last.id_proof_number

	def _check_blacklist_watchlist(self) -> None:
		"""Check if visitor appears in active blacklist/watchlist entries."""
		enabled = int(frappe.db.get_single_value("VMS Settings", "blacklist_check_enabled") or 1)
		if not enabled:
			return
		rows = frappe.get_all(
			"Visitor Blacklist",
			filters={"is_active": 1},
			fields=["name", "list_type", "reason", "site", "email", "id_proof_number"],
		)
		for row in rows:
			if row.site and self.site and row.site != self.site:
				continue
			identity_match = (self.visitor_email and self.visitor_email == row.email) or (
				self.id_proof_number and self.id_proof_number == row.id_proof_number
			)
			if not identity_match:
				continue
			if row.list_type == "Blacklist":
				frappe.throw(_("Visitor is blacklisted: {0}").format(row.reason or row.name))
			self.watchlist_flagged = 1
			frappe.msgprint(_("Flagged - watchlist: {0}").format(row.reason or row.name), alert=True)
