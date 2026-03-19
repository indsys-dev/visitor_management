from __future__ import annotations

import frappe

APP_NAME = "visitor_management"
APP_LABEL = "Visitor Management"
APP_ICON = "octicon octicon-person"
APP_DEFAULT_ROUTE = '["app", "visitor_management", "home"]'
JS_ASSET = "/assets/visitor_management/js/desk/visitor_management_pages.js"
APP_HOME_HTML = """
<div class="md-landing-copy">
	<p>Manage visitor requests, approvals, entries, and passes from one focused workspace.</p>
	<p>Use the sidebar to move between masters, transactions, and live visitor operations.</p>
</div>
""".strip()

MENUS = [
	{
		"menu_key": "vm_home",
		"label": "Dashboard",
		"menu_type": "page",
		"icon": "octicon octicon-home",
		"page_key": "visitor_management.home",
		"menu_order": 10,
	},
	{
		"menu_key": "vm_masters",
		"label": "Masters",
		"menu_type": "group",
		"icon": "octicon octicon-organization",
		"menu_order": 20,
	},
	{
		"menu_key": "vm_site",
		"label": "Visitor Site",
		"menu_type": "route",
		"parent_key": "vm_masters",
		"route_json": '["list", "Visitor Site"]',
		"menu_order": 21,
	},
	{
		"menu_key": "vm_location",
		"label": "Visitor Location",
		"menu_type": "route",
		"parent_key": "vm_masters",
		"route_json": '["list", "Visitor Location"]',
		"menu_order": 22,
	},
	{
		"menu_key": "vm_transactions",
		"label": "Transactions",
		"menu_type": "group",
		"icon": "octicon octicon-checklist",
		"menu_order": 30,
	},
	{
		"menu_key": "vm_request",
		"label": "Visitor Requests",
		"menu_type": "route",
		"parent_key": "vm_transactions",
		"route_json": '["list", "Visitor Pass Request"]',
		"menu_order": 31,
	},
	{
		"menu_key": "vm_pass",
		"label": "Visitor Passes",
		"menu_type": "route",
		"parent_key": "vm_transactions",
		"route_json": '["list", "Visitor Pass"]',
		"menu_order": 32,
	},
	{
		"menu_key": "vm_entry",
		"label": "Pass Entry",
		"menu_type": "page",
		"parent_key": "vm_transactions",
		"page_key": "visitor_management.pass_entry",
		"menu_order": 33,
	},
	{
		"menu_key": "vm_approval",
		"label": "Pass Approval",
		"menu_type": "page",
		"parent_key": "vm_transactions",
		"page_key": "visitor_management.pass_approval",
		"menu_order": 34,
	},
	{
		"menu_key": "vm_reports",
		"label": "Reports",
		"menu_type": "external",
		"icon": "octicon octicon-graph",
		"url": "/app/vms-dashboard",
		"menu_order": 40,
	},
]

PAGES = [
	{
		"page_key": "visitor_management.home",
		"title": "Visitor Management Home",
		"js_asset": JS_ASSET,
		"handler_key": "visitor_management.home",
		"page_order": 10,
	},
	{
		"page_key": "visitor_management.pass_entry",
		"title": "Visitor Pass Entry",
		"js_asset": JS_ASSET,
		"handler_key": "visitor_management.pass_entry",
		"page_order": 20,
	},
	{
		"page_key": "visitor_management.pass_approval",
		"title": "Visitor Pass Approval",
		"js_asset": JS_ASSET,
		"handler_key": "visitor_management.pass_approval",
		"page_order": 30,
	},
]


def sync_master_desk_config() -> None:
	"""Upsert Visitor Management shell config into Master Desk doctypes."""
	if not frappe.db.exists("DocType", "Master Desk App"):
		return

	name = frappe.db.get_value("Master Desk App", {"app_name": APP_NAME}, "name")
	doc = frappe.get_doc("Master Desk App", name) if name else frappe.new_doc("Master Desk App")
	doc.app_name = APP_NAME
	doc.app_label = APP_LABEL
	doc.app_icon = APP_ICON
	doc.use_master_desk = 1
	doc.is_active = 1
	doc.default_route_json = APP_DEFAULT_ROUTE
	if not doc.get("app_home_html"):
		doc.app_home_html = APP_HOME_HTML
	doc.set("menus", [])
	for row in MENUS:
		doc.append("menus", {**row, "is_active": 1})
	doc.set("pages", [])
	for row in PAGES:
		doc.append("pages", {**row, "is_active": 1})

	if doc.is_new():
		doc.insert(ignore_permissions=True)
	else:
		doc.save(ignore_permissions=True)
