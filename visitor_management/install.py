from __future__ import annotations

import os
import secrets
import sys

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

from visitor_management.setup.demo_entry import load_demo_data
from visitor_management.setup.master_desk_setup import sync_master_desk_config
from visitor_management.setup.workspace_setup import install_visitor_workspace_assets

ROLES = ["VMS Manager", "Gate Staff"]


def after_install() -> None:
	"""Initialize VMS defaults after app installation."""
	create_roles()
	ensure_settings()
	ensure_employee_custom_fields()
	ensure_web_form()
	ensure_email_templates()
	ensure_workflow()
	sync_master_desk_config()
	install_visitor_workspace_assets()
	if should_install_demo_data():
		result = load_demo_data()
		frappe.log_error(message=str(result), title="Visitor Management Demo Data Installed")
	frappe.db.commit()


def after_migrate() -> None:
	"""Ensure workspace assets persist after migrations."""
	ensure_settings()
	sync_master_desk_config()
	install_visitor_workspace_assets()
	frappe.db.commit()


def should_install_demo_data() -> bool:
	"""Ask install-time question (or use config/env override) for demo data."""
	config_flag = frappe.conf.get("visitor_management_install_demo_data")
	if config_flag is not None:
		return _to_bool(config_flag)
	env_flag = os.environ.get("VISITOR_MANAGEMENT_INSTALL_DEMO_DATA")
	if env_flag is not None:
		return _to_bool(env_flag)

	if not sys.stdin or not sys.stdin.isatty():
		return False
	try:
		import click

		return bool(click.confirm("Install Visitor Management demo data now?", default=False))
	except Exception:
		return False


def _to_bool(value) -> bool:
	"""Convert common boolean string/int representations."""
	return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def create_roles() -> None:
	"""Create app specific roles if missing."""
	for role_name in ROLES:
		if not frappe.db.exists("Role", role_name):
			frappe.get_doc({"doctype": "Role", "role_name": role_name}).insert(ignore_permissions=True)


def ensure_settings() -> None:
	"""Create VMS Settings singleton defaults and secret."""
	if not frappe.db.exists("DocType", "VMS Settings"):
		return
	if not frappe.db.get_single_value("VMS Settings", "hmac_secret"):
		frappe.db.set_single_value("VMS Settings", "hmac_secret", secrets.token_hex(32))


def ensure_employee_custom_fields() -> None:
	"""Add helper links on Employee for host notifications."""
	custom_fields = {
		"Employee": [
			{
				"fieldname": "vms_section",
				"fieldtype": "Section Break",
				"label": "Visitor Management",
				"insert_after": "cell_number",
			},
			{
				"fieldname": "allow_vms_host",
				"fieldtype": "Check",
				"label": "Allow Visitor Hosting",
				"insert_after": "vms_section",
				"default": "1",
			},
		]
	}
	create_custom_fields(custom_fields, update=True)


def ensure_web_form() -> None:
	"""Create or update guest pre-registration web form."""
	if not frappe.db.exists("DocType", "Web Form"):
		return
	name = "visitor_pre_registration"
	doc = frappe.get_doc("Web Form", name) if frappe.db.exists("Web Form", name) else frappe.new_doc("Web Form")
	doc.title = "Visitor Pre Registration"
	doc.route = name
	doc.doc_type = "Visitor Pass Request"
	doc.is_standard = 1
	doc.published = 1
	doc.anonymous = 1
	doc.success_message = "Thank you. Your request number is {{ doc.name }}"
	doc.success_url = "/visitor_pre_registration?submitted=1"
	doc.introduction_text = "Fill your visitor details to request a pass."
	doc.show_sidebar = 0
	doc.web_form_fields = []
	for fieldname in [
		"visitor_name",
		"visitor_email",
		"visitor_phone",
		"visitor_company",
		"id_proof_type",
		"host_employee",
		"visit_purpose",
		"expected_visit_date",
		"expected_visit_time",
	]:
		doc.append("web_form_fields", {"fieldname": fieldname, "allow_read_on_all_link_options": 1})
	if doc.is_new():
		doc.insert(ignore_permissions=True)
	else:
		doc.save(ignore_permissions=True)


def ensure_email_templates() -> None:
	"""Create standard email templates required by VMS."""
	templates = {
		"VMS Visitor Pass": {
			"subject": "Visitor Pass {{ pass_number }}",
			"response": "{{ visitor_name }}",
		},
		"VMS OTP Approval": {
			"subject": "OTP for visitor approval {{ request_name }}",
			"response": "{{ otp }}",
		},
	}
	for name, meta in templates.items():
		if frappe.db.exists("Email Template", name):
			continue
		frappe.get_doc(
			{
				"doctype": "Email Template",
				"name": name,
				"subject": meta["subject"],
				"response": meta["response"],
			}
		).insert(ignore_permissions=True)


def ensure_workflow() -> None:
	"""Create Visitor Pass Request workflow if missing."""
	if frappe.db.exists("Workflow", "Visitor Pass Request Workflow"):
		return
	workflow = frappe.get_doc(
		{
			"doctype": "Workflow",
			"workflow_name": "Visitor Pass Request Workflow",
			"document_type": "Visitor Pass Request",
			"is_active": 1,
			"send_email_alert": 0,
			"workflow_state_field": "workflow_state",
			"states": [
				{"state": "Draft", "doc_status": "0", "allow_edit": "VMS Manager"},
				{"state": "Pending OTP", "doc_status": "1", "allow_edit": "VMS Manager"},
				{"state": "Pending Approval", "doc_status": "1", "allow_edit": "VMS Manager"},
				{"state": "Approved", "doc_status": "1", "allow_edit": "VMS Manager"},
				{"state": "Rejected", "doc_status": "1", "allow_edit": "VMS Manager"},
			],
			"transitions": [
				{
					"state": "Pending Approval",
					"action": "Approve",
					"next_state": "Approved",
					"allowed": "Employee",
				},
				{
					"state": "Pending Approval",
					"action": "Reject",
					"next_state": "Rejected",
					"allowed": "Employee",
				},
			],
		}
	)
	workflow.insert(ignore_permissions=True)
