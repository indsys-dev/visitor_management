from __future__ import annotations

import frappe
from frappe.utils import getdate, now_datetime, nowdate


def _site_filter(site: str | None) -> dict:
	"""Build site filter map."""
	return {"site": site} if site else {}


@frappe.whitelist()
def get_dashboard_summary(site: str | None = None, from_date: str | None = None, to_date: str | None = None) -> dict:
	"""Return summary counters and chart data for VMS dashboard."""
	filters = _site_filter(site)
	if from_date and to_date:
		filters["creation"] = ["between", [from_date, to_date]]
	elif from_date:
		filters["creation"] = [">=", from_date]
	elif to_date:
		filters["creation"] = ["<=", to_date]

	passes = frappe.get_all(
		"Visitor Pass",
		filters=filters,
		fields=["name", "entry_time", "exit_time", "pass_status", "host_employee", "visit_purpose", "site", "creation"],
	)
	total_visits = len(passes)
	active_now = len([p for p in passes if p.entry_time and not p.exit_time and p.pass_status == "Active"])
	durations = []
	for p in passes:
		if p.entry_time and p.exit_time:
			durations.append((p.exit_time - p.entry_time).total_seconds() / 60)
	avg_duration = round(sum(durations) / len(durations), 2) if durations else 0
	rejected_count = frappe.db.count("Visitor Pass Request", {**_site_filter(site), "status": "Rejected"})
	blacklist_hits = frappe.db.count("Visitor Pass Request", {**_site_filter(site), "watchlist_flagged": 1})

	host_counts: dict[str, int] = {}
	purpose_counts: dict[str, int] = {}
	day_counts: dict[str, int] = {}
	for row in passes:
		host_counts[row.host_employee] = host_counts.get(row.host_employee, 0) + 1
		purpose_key = row.visit_purpose or "Other"
		purpose_counts[purpose_key] = purpose_counts.get(purpose_key, 0) + 1
		day_key = str(getdate(row.creation))
		day_counts[day_key] = day_counts.get(day_key, 0) + 1

	movement_filters = _site_filter(site)
	top_locations_raw = frappe.get_all(
		"Visitor Movement Log",
		filters=movement_filters,
		fields=["location"],
	)
	location_counts: dict[str, int] = {}
	for row in top_locations_raw:
		if row.location:
			location_counts[row.location] = location_counts.get(row.location, 0) + 1

	return {
		"total_visits": total_visits,
		"active_now": active_now,
		"avg_duration_minutes": avg_duration,
		"rejected_count": rejected_count,
		"blacklist_hits": blacklist_hits,
		"top_hosts": [{"name": k, "count": v} for k, v in sorted(host_counts.items(), key=lambda i: i[1], reverse=True)[:10]],
		"top_locations": [
			{"name": k, "count": v} for k, v in sorted(location_counts.items(), key=lambda i: i[1], reverse=True)[:10]
		],
		"visits_by_day": [{"date": k, "count": v} for k, v in sorted(day_counts.items())],
		"visits_by_purpose": [{"purpose": k, "count": v} for k, v in sorted(purpose_counts.items(), key=lambda i: i[1], reverse=True)],
	}


@frappe.whitelist()
def get_active_visitors(site: str | None = None) -> list[dict]:
	"""Return visitors currently checked in."""
	filters = {"entry_time": ["is", "set"], "exit_time": ["is", "not set"], "pass_status": "Active"}
	if site:
		filters["site"] = site
	records = frappe.get_all(
		"Visitor Pass",
		filters=filters,
		fields=["name", "visitor_name", "host_employee", "entry_time", "valid_until"],
	)
	for row in records:
		allowed = frappe.get_all(
			"Visitor Location Access",
			filters={"parent": row.name, "parenttype": "Visitor Pass"},
			fields=["location"],
		)
		row.allowed_locations = ", ".join([d.location for d in allowed if d.location])
	return records


@frappe.whitelist()
def get_overstay_visitors() -> list[dict]:
	"""Return active visitors who crossed pass validity without exit."""
	return frappe.get_all(
		"Visitor Pass",
		filters={
			"entry_time": ["is", "set"],
			"exit_time": ["is", "not set"],
			"valid_until": ["<", now_datetime()],
		},
		fields=["name", "visitor_name", "host_employee", "entry_time", "valid_until", "site"],
	)
