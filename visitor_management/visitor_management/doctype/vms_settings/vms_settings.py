from __future__ import annotations

import secrets

import frappe
from frappe.model.document import Document


class VMSSettings(Document):
	"""Singleton settings for Visitor Management."""

	def validate(self) -> None:
		"""Ensure required security defaults are present."""
		if not self.hmac_secret:
			self.hmac_secret = secrets.token_hex(32)
		if not self.default_pass_validity_hours:
			self.default_pass_validity_hours = 8
		if not self.contractor_pass_max_days:
			self.contractor_pass_max_days = 30
		if not self.otp_expiry_minutes:
			self.otp_expiry_minutes = 10
