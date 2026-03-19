from __future__ import annotations

from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_days, now_datetime, nowdate

DEMO_TAG = "VMS-DEMO"


def load_demo_data() -> dict:
	"""Create idempotent demo records for all Visitor Management DocTypes."""
	if not frappe.db.exists("DocType", "Visitor Site"):
		return {"created": [], "message": "Visitor Management DocTypes are not available"}

	created: list[str] = []
	_ensure_secret()

	site_name = _ensure_site(created)
	_ensure_additional_sites(created)
	locations = _ensure_locations(site_name, created)
	_ensure_additional_locations(site_name, created)
	all_locations = _get_all_locations()
	_ensure_blacklist(site_name, created)
	_ensure_additional_blacklist(site_name, created)
	request_name = _ensure_pass_request(site_name, locations, created)
	request_map = _ensure_additional_pass_requests(site_name, all_locations, created)
	pass_name = _ensure_visitor_pass(site_name, locations, request_name, created)
	_ensure_additional_visitor_passes(site_name, all_locations, request_map, created)
	_ensure_recurring_pass(site_name, locations, created)
	_ensure_additional_recurring_passes(site_name, all_locations, created)

	frappe.db.commit()
	return {
		"created": created,
		"message": _("Demo data is ready. Sample pass: {0}").format(pass_name),
	}


def _ensure_secret() -> None:
	"""Ensure HMAC secret exists for QR signing in demo records."""
	if not frappe.db.get_single_value("VMS Settings", "hmac_secret"):
		frappe.db.set_single_value("VMS Settings", "hmac_secret", frappe.generate_hash(length=64))


def _ensure_site(created: list[str]) -> str:
	"""Create demo Visitor Site if missing."""
	existing = frappe.db.get_value("Visitor Site", {"site_code": "HQ-DEMO"}, "name")
	if existing:
		return existing
	doc = frappe.get_doc(
		{
			"doctype": "Visitor Site",
			"site_name": "Head Office Demo Campus",
			"site_code": "HQ-DEMO",
			"address": "123 Demo Tech Park",
			"city": "Chennai",
			"country": "India",
			"is_active": 1,
		}
	).insert(ignore_permissions=True)
	created.append(f"Visitor Site: {doc.name}")
	return doc.name


def _ensure_locations(site: str, created: list[str]) -> list[str]:
	"""Create demo visitor locations for zone access."""
	rows = [
		{"location_name": "Main Reception", "location_code": "REC-01", "building": "A", "floor": "Ground", "access_level": "Open"},
		{"location_name": "R&D Lab", "location_code": "RND-01", "building": "B", "floor": "2", "access_level": "Restricted"},
		{"location_name": "Server Vault", "location_code": "SEC-01", "building": "C", "floor": "1", "access_level": "High Security"},
	]
	location_names: list[str] = []
	for row in rows:
		existing = frappe.db.get_value("Visitor Location", {"location_code": row["location_code"]}, "name")
		if existing:
			location_names.append(existing)
			continue
		doc = frappe.get_doc(
			{
				"doctype": "Visitor Location",
				**row,
				"site": site,
				"is_active": 1,
			}
		).insert(ignore_permissions=True)
		created.append(f"Visitor Location: {doc.name}")
		location_names.append(doc.name)
	return location_names


def _ensure_additional_sites(created: list[str]) -> None:
	"""Create 5 additional sites for richer demo scenarios."""
	rows = [
		{"site_name": "Demo North Campus", "site_code": "HQ-DEMO-N1", "city": "Bengaluru", "country": "India", "is_active": 1},
		{"site_name": "Demo South Plant", "site_code": "HQ-DEMO-S1", "city": "Hyderabad", "country": "India", "is_active": 1},
		{"site_name": "Demo East Hub", "site_code": "HQ-DEMO-E1", "city": "Kolkata", "country": "India", "is_active": 1},
		{"site_name": "Demo West Tower", "site_code": "HQ-DEMO-W1", "city": "Mumbai", "country": "India", "is_active": 1},
		{"site_name": "Demo Archive Site", "site_code": "HQ-DEMO-A1", "city": "Chennai", "country": "India", "is_active": 0},
	]
	for row in rows:
		if frappe.db.get_value("Visitor Site", {"site_code": row["site_code"]}, "name"):
			continue
		doc = frappe.get_doc({"doctype": "Visitor Site", **row}).insert(ignore_permissions=True)
		created.append(f"Visitor Site: {doc.name}")


def _ensure_additional_locations(site: str, created: list[str]) -> None:
	"""Create 5 additional locations with mixed security and active state."""
	rows = [
		{"location_name": "Finance Block", "location_code": "FIN-01", "building": "D", "floor": "3", "access_level": "Restricted", "is_active": 1},
		{"location_name": "Design Studio", "location_code": "DSN-01", "building": "E", "floor": "2", "access_level": "Open", "is_active": 1},
		{"location_name": "Production Floor", "location_code": "PRD-01", "building": "F", "floor": "Ground", "access_level": "Restricted", "is_active": 1},
		{"location_name": "Data Center 2", "location_code": "DC2-01", "building": "G", "floor": "1", "access_level": "High Security", "is_active": 1},
		{"location_name": "Legacy Gate", "location_code": "LEG-01", "building": "H", "floor": "Ground", "access_level": "Open", "is_active": 0},
	]
	for row in rows:
		if frappe.db.get_value("Visitor Location", {"location_code": row["location_code"]}, "name"):
			continue
		doc = frappe.get_doc({"doctype": "Visitor Location", "site": site, **row}).insert(ignore_permissions=True)
		created.append(f"Visitor Location: {doc.name}")


def _get_all_locations() -> list[str]:
	"""Return all location names for demo location access wiring."""
	rows = frappe.get_all("Visitor Location", fields=["name"], order_by="creation asc")
	return [row.name for row in rows]


def _ensure_blacklist(site: str, created: list[str]) -> None:
	"""Create a watchlist and blacklist sample entry."""
	samples = [
		{
			"visitor_name": "Blacklisted Visitor",
			"email": "blocked.demo@example.com",
			"phone": "+919999000001",
			"id_proof_number": "BLK-DEMO-001",
			"list_type": "Blacklist",
			"reason": "Security policy violation (demo)",
			"site": site,
		},
		{
			"visitor_name": "Watchlisted Visitor",
			"email": "watch.demo@example.com",
			"phone": "+919999000002",
			"id_proof_number": "WCH-DEMO-001",
			"list_type": "Watchlist",
			"reason": "Manual verification required (demo)",
			"site": site,
		},
	]
	for sample in samples:
		if frappe.db.exists("Visitor Blacklist", {"id_proof_number": sample["id_proof_number"]}):
			continue
		frappe.get_doc({"doctype": "Visitor Blacklist", **sample, "is_active": 1}).insert(ignore_permissions=True)
		created.append(f"Visitor Blacklist: {sample['id_proof_number']}")


def _ensure_additional_blacklist(site: str, created: list[str]) -> None:
	"""Create 5 additional blacklist/watchlist records with mixed active state."""
	rows = [
		{"visitor_name": "Demo Risk 01", "email": "risk01.demo@example.com", "phone": "+919999100001", "id_proof_number": "BLK-DEMO-011", "list_type": "Blacklist", "reason": "Unauthorized access attempt", "is_active": 1},
		{"visitor_name": "Demo Risk 02", "email": "risk02.demo@example.com", "phone": "+919999100002", "id_proof_number": "BLK-DEMO-012", "list_type": "Watchlist", "reason": "Identity mismatch in previous visit", "is_active": 1},
		{"visitor_name": "Demo Risk 03", "email": "risk03.demo@example.com", "phone": "+919999100003", "id_proof_number": "BLK-DEMO-013", "list_type": "Blacklist", "reason": "Policy breach escalation", "is_active": 1},
		{"visitor_name": "Demo Risk 04", "email": "risk04.demo@example.com", "phone": "+919999100004", "id_proof_number": "BLK-DEMO-014", "list_type": "Watchlist", "reason": "Manual frisking required", "is_active": 0},
		{"visitor_name": "Demo Risk 05", "email": "risk05.demo@example.com", "phone": "+919999100005", "id_proof_number": "BLK-DEMO-015", "list_type": "Blacklist", "reason": "Temporary suspension", "is_active": 0},
	]
	for row in rows:
		if frappe.db.exists("Visitor Blacklist", {"id_proof_number": row["id_proof_number"]}):
			continue
		doc = frappe.get_doc({"doctype": "Visitor Blacklist", "site": site, **row}).insert(ignore_permissions=True)
		created.append(f"Visitor Blacklist: {doc.name}")


def _ensure_pass_request(site: str, locations: list[str], created: list[str]) -> str:
	"""Create a submitted-style demo pass request record."""
	existing = frappe.db.get_value("Visitor Pass Request", {"visitor_email": "visitor.demo@example.com"}, "name")
	if existing:
		return existing
	doc = frappe.get_doc(
		{
			"doctype": "Visitor Pass Request",
			"status": "Pending Approval",
			"workflow_state": "Pending Approval",
			"requested_by": "Self",
			"site": site,
			"visitor_name": "Demo Visitor",
			"visitor_email": "visitor.demo@example.com",
			"visitor_phone": "+919999000003",
			"visitor_company": "Demo Industries",
			"visit_purpose": "Product demo meeting",
			"expected_visit_date": nowdate(),
			"expected_visit_time": "10:00:00",
			"id_proof_type": "Aadhar",
			"id_proof_number": "DEMO-ID-001",
			"otp_verified": 1,
		}
	)
	for location in locations[:2]:
		doc.append("allowed_locations", {"location": location, "access_type": "Both"})
	doc.insert(ignore_permissions=True, ignore_mandatory=True)
	created.append(f"Visitor Pass Request: {doc.name}")
	return doc.name


def _ensure_additional_pass_requests(site: str, locations: list[str], created: list[str]) -> dict[str, str]:
	"""Create 5 additional pass requests with mixed statuses."""
	rows = [
		{"suffix": "01", "status": "Draft", "workflow_state": "Draft", "requested_by": "Self", "purpose": "Vendor meeting"},
		{"suffix": "02", "status": "Pending OTP", "workflow_state": "Pending OTP", "requested_by": "Self", "purpose": "Interview"},
		{"suffix": "03", "status": "Pending Approval", "workflow_state": "Pending Approval", "requested_by": "Self", "purpose": "Audit review"},
		{"suffix": "04", "status": "Approved", "workflow_state": "Approved", "requested_by": "Self", "purpose": "Client onboarding"},
		{"suffix": "05", "status": "Rejected", "workflow_state": "Rejected", "requested_by": "Self", "purpose": "Unknown purpose"},
	]
	result: dict[str, str] = {}
	for idx, row in enumerate(rows):
		email = f"visitor.bulk{row['suffix']}@example.com"
		existing = frappe.db.get_value("Visitor Pass Request", {"visitor_email": email}, "name")
		if existing:
			result[row["status"]] = existing
			continue
		doc = frappe.get_doc(
			{
				"doctype": "Visitor Pass Request",
				"status": row["status"],
				"workflow_state": row["workflow_state"],
				"requested_by": row["requested_by"],
				"site": site,
				"visitor_name": f"Bulk Visitor {row['suffix']}",
				"visitor_email": email,
				"visitor_phone": f"+91999920000{idx + 1}",
				"visitor_company": "Bulk Demo Co",
				"visit_purpose": row["purpose"],
				"expected_visit_date": add_days(nowdate(), idx),
				"expected_visit_time": "11:00:00",
				"id_proof_type": "Passport",
				"id_proof_number": f"DEMO-REQ-{row['suffix']}",
				"otp_verified": 1 if row["status"] in {"Approved", "Pending Approval"} else 0,
			}
		)
		if locations:
			doc.append("allowed_locations", {"location": locations[idx % len(locations)], "access_type": "Both"})
		doc.insert(ignore_permissions=True, ignore_mandatory=True)
		created.append(f"Visitor Pass Request: {doc.name}")
		result[row["status"]] = doc.name
	return result


def _ensure_visitor_pass(site: str, locations: list[str], request_name: str, created: list[str]) -> str:
	"""Create demo one-time visitor pass and movement logs."""
	existing = frappe.db.get_value("Visitor Pass", {"visitor_email": "visitor.demo@example.com"}, "name")
	if existing:
		return existing
	now = now_datetime()
	pass_doc = frappe.get_doc(
		{
			"doctype": "Visitor Pass",
			"pass_status": "Active",
			"visitor_pass_request": request_name,
			"site": site,
			"visitor_name": "Demo Visitor",
			"visitor_email": "visitor.demo@example.com",
			"visitor_phone": "+919999000003",
			"visitor_company": "Demo Industries",
			"visit_purpose": "Product demo meeting",
			"valid_from": now,
			"valid_until": now + timedelta(hours=8),
			"entry_time": now,
			"id_proof_type": "Aadhar",
			"id_proof_number": "DEMO-ID-001",
		}
	).insert(ignore_permissions=True, ignore_mandatory=True)

	for location in locations[:2]:
		pass_doc.append("allowed_locations", {"location": location, "access_type": "Both"})
	pass_doc.append(
		"movement_logs",
		{
			"visitor_pass": pass_doc.name,
			"location": locations[0],
			"site": site,
			"log_type": "Entry",
			"timestamp": now,
			"scanned_by": "Administrator",
			"device_id": f"{DEMO_TAG}-GATE-01",
			"remarks": "Demo entry scan",
		},
	)
	pass_doc.append(
		"movement_logs",
		{
			"visitor_pass": pass_doc.name,
			"location": locations[1],
			"site": site,
			"log_type": "Checkpoint",
			"timestamp": now,
			"scanned_by": "Administrator",
			"device_id": f"{DEMO_TAG}-GATE-02",
			"remarks": "Demo checkpoint scan",
		},
	)
	pass_doc.save(ignore_permissions=True)
	created.append(f"Visitor Pass: {pass_doc.name}")
	return pass_doc.name


def _ensure_additional_visitor_passes(site: str, locations: list[str], request_map: dict[str, str], created: list[str]) -> None:
	"""Create 5 additional visitor passes with varied statuses."""
	now = now_datetime()
	rows = [
		{"suffix": "01", "status": "Draft", "delta_start": -1, "delta_end": 4, "entry": False, "exit": False},
		{"suffix": "02", "status": "Active", "delta_start": 0, "delta_end": 6, "entry": True, "exit": False},
		{"suffix": "03", "status": "Completed", "delta_start": -1, "delta_end": 3, "entry": True, "exit": True},
		{"suffix": "04", "status": "Expired", "delta_start": -2, "delta_end": -1, "entry": True, "exit": False},
		{"suffix": "05", "status": "Rejected", "delta_start": 0, "delta_end": 2, "entry": False, "exit": False},
	]
	for idx, row in enumerate(rows):
		email = f"pass.bulk{row['suffix']}@example.com"
		if frappe.db.get_value("Visitor Pass", {"visitor_email": email}, "name"):
			continue
		entry_time = now + timedelta(hours=row["delta_start"]) if row["entry"] else None
		exit_time = (entry_time + timedelta(hours=1)) if (row["exit"] and entry_time) else None
		doc = frappe.get_doc(
			{
				"doctype": "Visitor Pass",
				"pass_status": row["status"],
				"visitor_pass_request": request_map.get("Approved") or request_map.get("Pending Approval"),
				"site": site,
				"visitor_name": f"Bulk Pass Visitor {row['suffix']}",
				"visitor_email": email,
				"visitor_phone": f"+91999930000{idx + 1}",
				"visitor_company": "Bulk Pass Co",
				"visit_purpose": "Bulk pass scenario",
				"valid_from": now + timedelta(hours=row["delta_start"]),
				"valid_until": now + timedelta(hours=row["delta_end"]),
				"entry_time": entry_time,
				"exit_time": exit_time,
				"id_proof_type": "Driving License",
				"id_proof_number": f"DEMO-PASS-{row['suffix']}",
			}
		).insert(ignore_permissions=True, ignore_mandatory=True)
		if locations:
			doc.append("allowed_locations", {"location": locations[idx % len(locations)], "access_type": "Both"})
		doc.append(
			"movement_logs",
			{
				"visitor_pass": doc.name,
				"location": locations[idx % len(locations)] if locations else None,
				"site": site,
				"log_type": "Entry" if row["entry"] else "Denied",
				"timestamp": now,
				"scanned_by": "Administrator",
				"device_id": f"{DEMO_TAG}-BULK-{idx + 1:02d}",
				"remarks": f"Bulk status seed: {row['status']}",
			},
		)
		doc.save(ignore_permissions=True)
		created.append(f"Visitor Pass: {doc.name}")


def _ensure_recurring_pass(site: str, locations: list[str], created: list[str]) -> None:
	"""Create demo recurring contractor pass with sample movement logs."""
	existing = frappe.db.get_value("Recurring Visitor Pass", {"visitor_email": "contractor.demo@example.com"}, "name")
	if existing:
		return
	doc = frappe.get_doc(
		{
			"doctype": "Recurring Visitor Pass",
			"status": "Active",
			"site": site,
			"visitor_name": "Demo Contractor",
			"visitor_email": "contractor.demo@example.com",
			"visitor_phone": "+919999000004",
			"visitor_company": "Demo Contracting Co",
			"id_proof_type": "Passport",
			"id_proof_number": "DEMO-ID-002",
			"pass_type": "Weekly",
			"allowed_days": "Mon,Tue,Wed,Thu,Fri",
			"entry_time_from": "09:00:00",
			"entry_time_to": "19:00:00",
			"valid_from": nowdate(),
			"valid_until": add_days(nowdate(), 15),
			"total_visits": 1,
			"last_visit": now_datetime(),
		}
	)
	for location in locations[:2]:
		doc.append("allowed_locations", {"location": location, "access_type": "Both"})
	doc.insert(ignore_permissions=True, ignore_mandatory=True)

	doc.append(
		"movement_logs",
		{
			"location": locations[0],
			"site": site,
			"log_type": "Entry",
			"timestamp": now_datetime(),
			"scanned_by": "Administrator",
			"device_id": f"{DEMO_TAG}-RVP-01",
			"remarks": "Demo recurring entry",
		},
	)
	doc.save(ignore_permissions=True)
	created.append(f"Recurring Visitor Pass: {doc.name}")


def _ensure_additional_recurring_passes(site: str, locations: list[str], created: list[str]) -> None:
	"""Create 5 additional recurring passes with varied statuses."""
	rows = [
		{"suffix": "01", "status": "Active", "valid_from": add_days(nowdate(), -3), "valid_until": add_days(nowdate(), 20)},
		{"suffix": "02", "status": "Suspended", "valid_from": add_days(nowdate(), -5), "valid_until": add_days(nowdate(), 10)},
		{"suffix": "03", "status": "Expired", "valid_from": add_days(nowdate(), -20), "valid_until": add_days(nowdate(), -1)},
		{"suffix": "04", "status": "Revoked", "valid_from": add_days(nowdate(), -7), "valid_until": add_days(nowdate(), 7)},
		{"suffix": "05", "status": "Active", "valid_from": add_days(nowdate(), -1), "valid_until": add_days(nowdate(), 29)},
	]
	for idx, row in enumerate(rows):
		email = f"contractor.bulk{row['suffix']}@example.com"
		if frappe.db.get_value("Recurring Visitor Pass", {"visitor_email": email}, "name"):
			continue
		doc = frappe.get_doc(
			{
				"doctype": "Recurring Visitor Pass",
				"status": row["status"],
				"site": site,
				"visitor_name": f"Bulk Contractor {row['suffix']}",
				"visitor_email": email,
				"visitor_phone": f"+91999940000{idx + 1}",
				"visitor_company": "Bulk Contractor Co",
				"id_proof_type": "Aadhar",
				"id_proof_number": f"DEMO-RVP-{row['suffix']}",
				"pass_type": "Custom",
				"allowed_days": "Mon,Tue,Wed,Thu,Fri,Sat",
				"entry_time_from": "08:00:00",
				"entry_time_to": "20:00:00",
				"valid_from": row["valid_from"],
				"valid_until": row["valid_until"],
				"total_visits": idx,
				"last_visit": now_datetime(),
			}
		)
		if locations:
			doc.append("allowed_locations", {"location": locations[idx % len(locations)], "access_type": "Both"})
		doc.insert(ignore_permissions=True, ignore_mandatory=True)
		doc.append(
			"movement_logs",
			{
				"location": locations[idx % len(locations)] if locations else None,
				"site": site,
				"log_type": "Entry" if row["status"] == "Active" else "Denied",
				"timestamp": now_datetime(),
				"scanned_by": "Administrator",
				"device_id": f"{DEMO_TAG}-RVP-BULK-{idx + 1:02d}",
				"remarks": f"Bulk recurring seed: {row['status']}",
			},
		)
		doc.save(ignore_permissions=True)
		created.append(f"Recurring Visitor Pass: {doc.name}")
