from __future__ import annotations

import json

import frappe

WORKSPACE_NAME = "Visitor Management"

NUMBER_CARDS = [
	{
		"label": "Total Visitor Requests",
		"type": "Document Type",
		"document_type": "Visitor Pass Request",
		"function": "Count",
		"filters_json": "[]",
	},
	{
		"label": "Active Visitor Passes",
		"type": "Document Type",
		"document_type": "Visitor Pass",
		"function": "Count",
		"filters_json": '[["Visitor Pass","pass_status","=","Active",false]]',
	},
	{
		"label": "Active Recurring Passes",
		"type": "Document Type",
		"document_type": "Recurring Visitor Pass",
		"function": "Count",
		"filters_json": '[["Recurring Visitor Pass","status","=","Active",false]]',
	},
]

DASHBOARD_CHARTS = [
	{
		"chart_name": "Visitor Requests by Day",
		"chart_type": "Count",
		"document_type": "Visitor Pass Request",
		"based_on": "expected_visit_date",
		"timeseries": 1,
		"time_interval": "Daily",
		"timespan": "Last Month",
		"type": "Bar",
	},
	{
		"chart_name": "Visitor Passes by Day",
		"chart_type": "Count",
		"document_type": "Visitor Pass",
		"based_on": "valid_from",
		"timeseries": 1,
		"time_interval": "Daily",
		"timespan": "Last Month",
		"type": "Bar",
	},
	{
		"chart_name": "Recurring Pass Activity",
		"chart_type": "Count",
		"document_type": "Recurring Visitor Pass",
		"based_on": "last_visit",
		"timeseries": 1,
		"time_interval": "Daily",
		"timespan": "Last Month",
		"type": "Line",
	},
]


def install_visitor_workspace_assets() -> None:
	"""Create workspace, number cards, and charts for Visitor Management."""
	if not frappe.db.exists("DocType", "Workspace"):
		return
	if not frappe.db.exists("DocType", "Visitor Pass"):
		return

	_ensure_number_cards()
	_ensure_dashboard_charts()
	_ensure_workspace()
	frappe.db.commit()


def _ensure_number_cards() -> None:
	"""Create number cards used by workspace."""
	for card_def in NUMBER_CARDS:
		card = _get_or_new("Number Card", {"label": card_def["label"]})
		card.label = card_def["label"]
		card.type = card_def["type"]
		card.document_type = card_def["document_type"]
		card.function = card_def["function"]
		card.filters_json = card_def["filters_json"]
		card.is_public = 1
		card.is_standard = 0
		card.show_percentage_stats = 1
		card.stats_time_interval = "Daily"
		card.save(ignore_permissions=True)


def _ensure_dashboard_charts() -> None:
	"""Create dashboard charts used by workspace."""
	for chart_def in DASHBOARD_CHARTS:
		chart = _get_or_new("Dashboard Chart", {"chart_name": chart_def["chart_name"]})
		chart.chart_name = chart_def["chart_name"]
		chart.chart_type = chart_def["chart_type"]
		chart.document_type = chart_def["document_type"]
		chart.based_on = chart_def["based_on"]
		chart.timeseries = chart_def["timeseries"]
		chart.time_interval = chart_def["time_interval"]
		chart.timespan = chart_def["timespan"]
		chart.type = chart_def["type"]
		chart.filters_json = "[]"
		chart.is_public = 1
		chart.is_standard = 0
		chart.save(ignore_permissions=True)


def _ensure_workspace() -> None:
	"""Create or update primary Visitor Management workspace."""
	workspace = _get_or_new("Workspace", {"label": WORKSPACE_NAME})
	workspace.label = WORKSPACE_NAME
	workspace.title = WORKSPACE_NAME
	workspace.module = "Visitor Management"
	workspace.icon = "users"
	workspace.public = 1
	workspace.is_hidden = 0
	workspace.hide_custom = 1
	workspace.content = json.dumps(
		[
			{"id": "vms-header", "type": "header", "data": {"text": "<span class='h4'>Visitor Management</span>", "col": 12}},
			{"id": "vms-card-1", "type": "number_card", "data": {"number_card_name": "Total Visitor Requests", "col": 4}},
			{"id": "vms-card-2", "type": "number_card", "data": {"number_card_name": "Active Visitor Passes", "col": 4}},
			{"id": "vms-card-3", "type": "number_card", "data": {"number_card_name": "Active Recurring Passes", "col": 4}},
			{"id": "vms-short-1", "type": "shortcut", "data": {"shortcut_name": "Visitor Pass Entry", "col": 3}},
			{"id": "vms-short-2", "type": "shortcut", "data": {"shortcut_name": "Visitor Pass Entry self", "col": 3}},
			{"id": "vms-short-3", "type": "shortcut", "data": {"shortcut_name": "Visitor Pass Entry Management", "col": 3}},
			{"id": "vms-short-4", "type": "shortcut", "data": {"shortcut_name": "Visitor Pass List", "col": 3}},
			{"id": "vms-short-5", "type": "shortcut", "data": {"shortcut_name": "Visitor Pass Approval", "col": 3}},
			{"id": "vms-chart-1", "type": "chart", "data": {"chart_name": "Visitor Requests by Day", "col": 4}},
			{"id": "vms-chart-2", "type": "chart", "data": {"chart_name": "Visitor Passes by Day", "col": 4}},
			{"id": "vms-chart-3", "type": "chart", "data": {"chart_name": "Recurring Pass Activity", "col": 4}},
		]
	)
	workspace.set(
		"shortcuts",
		[
			{"label": "Visitor Pass Entry Management", "type": "Page", "link_to": "visitor-pass-entry-management"},
			{"label": "Visitor Pass Entry Self", "type": "Page", "link_to": "visitor-pass-entry-self"},
			{"label": "Visitor Pass List", "type": "URL", "url": "/app/visitor-pass-list"},
			{"label": "Visitor Pass Approval", "type": "URL", "url": "/app/visitor-pass-approval"},
			{"label": "Visitor Pass Requests", "type": "DocType", "link_to": "Visitor Pass Request", "doc_view": "List", "stats_filter": "[]"},
			{"label": "Visitor Passes", "type": "DocType", "link_to": "Visitor Pass", "doc_view": "List", "stats_filter": "[]"},
			{"label": "Recurring Visitor Passes", "type": "DocType", "link_to": "Recurring Visitor Pass", "doc_view": "List", "stats_filter": "[]"},
			{"label": "Visitor Sites", "type": "DocType", "link_to": "Visitor Site", "doc_view": "List", "stats_filter": "[]"},
			{"label": "Visitor Locations", "type": "DocType", "link_to": "Visitor Location", "doc_view": "List", "stats_filter": "[]"},
			{"label": "VMS Dashboard", "type": "URL", "url": "/app/vms-dashboard"},
			{"label": "Pre-Registration Form", "type": "URL", "url": "/visitor_pre_registration"},
		], 
	)
	workspace.set(
		"charts",
		[
			{"chart_name": "Visitor Requests by Day", "label": "Visitor Requests by Day"},
			{"chart_name": "Visitor Passes by Day", "label": "Visitor Passes by Day"},
			{"chart_name": "Recurring Pass Activity", "label": "Recurring Pass Activity"},
		],
	)
	workspace.set(
		"number_cards",
		[
			{"label": "Total Visitor Requests", "number_card_name": "Total Visitor Requests"},
			{"label": "Active Visitor Passes", "number_card_name": "Active Visitor Passes"},
			{"label": "Active Recurring Passes", "number_card_name": "Active Recurring Passes"},
		],
	)
	workspace.save(ignore_permissions=True)


def _get_or_new(doctype: str, filters: dict):
	"""Return existing document for filters or a new document."""
	name = frappe.db.get_value(doctype, filters, "name")
	if name:
		return frappe.get_doc(doctype, name)
	doc = frappe.new_doc(doctype)
	for key, value in filters.items():
		setattr(doc, key, value)
	return doc
