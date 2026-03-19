from __future__ import annotations

import frappe
from frappe.model.document import Document


class VisitorBlacklist(Document):
	"""Blacklist and watchlist master for visitors."""

	def before_insert(self) -> None:
		"""Populate audit defaults."""
		if not self.blacklisted_by:
			self.blacklisted_by = frappe.session.user
