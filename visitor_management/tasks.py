from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime, nowdate


def expire_old_passes() -> None:
	"""Expire active one-time passes older than validity."""
	if not int(frappe.db.get_single_value("VMS Settings", "auto_expire_passes") or 1):
		return
	rows = frappe.get_all(
		"Visitor Pass",
		filters={"pass_status": "Active", "valid_until": ["<", now_datetime()]},
		fields=["name"],
	)
	for row in rows:
		frappe.db.set_value("Visitor Pass", row.name, "pass_status", "Expired", update_modified=False)
	if rows:
		frappe.db.commit()


def expire_recurring_passes() -> None:
	"""Expire recurring passes once valid_until date is over."""
	rows = frappe.get_all(
		"Recurring Visitor Pass",
		filters={"status": "Active", "valid_until": ["<", nowdate()]},
		fields=["name"],
	)
	for row in rows:
		frappe.db.set_value("Recurring Visitor Pass", row.name, "status", "Expired", update_modified=False)
	if rows:
		frappe.db.commit()


def alert_overstay_visitors() -> None:
	"""Send overstay alerts to site admins."""
	overstays = frappe.get_all(
		"Visitor Pass",
		filters={
			"entry_time": ["is", "set"],
			"exit_time": ["is", "not set"],
			"valid_until": ["<", now_datetime()],
		},
		fields=["name", "visitor_name", "site", "host_employee", "valid_until"],
	)
	if not overstays:
		return
	by_site: dict[str, list] = {}
	for row in overstays:
		by_site.setdefault(row.site or "", []).append(row)
	for site, rows in by_site.items():
		site_admin = frappe.db.get_value("Visitor Site", site, "site_admin") if site else None
		recipients = [site_admin] if site_admin else ["Administrator"]
		content = "<br>".join([f"{r.name}: {r.visitor_name} (valid until {r.valid_until})" for r in rows])
		frappe.sendmail(
			recipients=recipients,
			subject=_("Overstay Visitor Alert"),
			message=_("Overstay visitors detected:<br>{0}").format(content),
			delayed=True,
		)


def send_daily_visitor_report() -> None:
	"""Email per-site daily visitor summary to site admins."""
	sites = frappe.get_all("Visitor Site", filters={"is_active": 1}, fields=["name", "site_admin", "site_name"])
	today = nowdate()
	for site in sites:
		if not site.site_admin:
			continue
		total = frappe.db.count("Visitor Pass", {"site": site.name, "creation": ["between", [today, add_to_date(today, days=1)]]})
		active = frappe.db.count("Visitor Pass", {"site": site.name, "pass_status": "Active"})
		message = _("Daily VMS report for {0}<br>Total visits today: {1}<br>Active now: {2}").format(
			site.site_name or site.name, total, active
		)
		frappe.sendmail(recipients=[site.site_admin], subject=_("Daily Visitor Report"), message=message, delayed=True)


def cleanup_old_otps() -> None:
	"""Clear OTP data for stale requests older than 24 hours."""
	cutoff = add_to_date(now_datetime(), hours=-24, as_datetime=True)
	rows = frappe.get_all(
		"Visitor Pass Request",
		filters={"modified": ["<", cutoff], "otp_hash": ["is", "set"]},
		fields=["name"],
	)
	for row in rows:
		frappe.db.set_value(
			"Visitor Pass Request",
			row.name,
			{
				"otp_hash": None,
				"otp_sent_on": None,
				"otp_attempts": 0,
				"otp_locked": 0,
			},
			update_modified=False,
		)
	if rows:
		frappe.db.commit()
