from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document


class VisitorPass(Document):
	"""Issued one-time visitor pass document."""

	def validate(self) -> None:
		"""Prevent edits on finalized pass states."""
		if self.is_new():
			return
		if self.pass_status in {"Completed", "Expired", "Rejected"} and not frappe.flags.in_patch:
			if self.has_value_changed("visitor_name") or self.has_value_changed("visitor_email"):
				frappe.throw(_("Submitted passes cannot be edited in final states"))
