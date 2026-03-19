from __future__ import annotations

import json

import frappe
from frappe import _


SUPPORTED_FIELDTYPES = {
	"Data",
	"Link",
	"Select",
	"Date",
	"Datetime",
	"Time",
	"Check",
	"Small Text",
	"Text",
	"Text Editor",
	"Int",
	"Float",
	"Currency",
	"Table",
}


LAYOUT_FIELDTYPES = {
	"Section Break",
	"Column Break",
	"Tab Break",
	"Fold",
	"Heading",
	"HTML",
	"Button",
}


def _ensure_permission(doctype: str, ptype: str) -> None:
	"""Validate user permission for a doctype and action."""
	if not frappe.has_permission(doctype, ptype=ptype):
		frappe.throw(_("Not permitted for doctype {0}").format(doctype))


def _field_dict(df) -> dict:
	"""Serialize docfield for frontend renderer."""
	return {
		"fieldname": df.fieldname,
		"label": df.label,
		"fieldtype": df.fieldtype,
		"options": df.options,
		"reqd": df.reqd,
		"read_only": df.read_only,
		"default": df.default,
		"hidden": df.hidden,
		"depends_on": df.depends_on,
		"in_list_view": df.in_list_view,
		"description": df.description,
	}


@frappe.whitelist()
def get_doctype_meta(doctype: str) -> dict:
	"""Return filtered DocType metadata and child table schema for custom shell form rendering."""
	_ensure_permission(doctype, "read")
	meta = frappe.get_meta(doctype)

	fields = []
	for df in meta.fields:
		if df.fieldtype in SUPPORTED_FIELDTYPES or df.fieldtype in LAYOUT_FIELDTYPES:
			fields.append(_field_dict(df))

	child_tables = {}
	for df in meta.fields:
		if df.fieldtype != "Table" or not df.options:
			continue
		child_meta = frappe.get_meta(df.options)
		child_fields = []
		for cdf in child_meta.fields:
			if cdf.fieldtype in LAYOUT_FIELDTYPES:
				continue
			if not cdf.fieldname:
				continue
			if cdf.fieldtype not in SUPPORTED_FIELDTYPES:
				continue
			child_fields.append(_field_dict(cdf))
		child_tables[df.fieldname] = {
			"doctype": df.options,
			"fields": child_fields,
		}

	return {
		"doctype": doctype,
		"module": meta.module,
		"title_field": meta.title_field,
		"autoname": meta.autoname,
		"is_submittable": meta.is_submittable,
		"fields": fields,
		"child_tables": child_tables,
	}


@frappe.whitelist()
def get_document(doctype: str, name: str) -> dict:
	"""Return a document dictionary with child tables for custom shell edit mode."""
	_ensure_permission(doctype, "read")
	doc = frappe.get_doc(doctype, name)
	if not doc.has_permission("read"):
		frappe.throw(_("Not permitted to read document {0}").format(name))
	return doc.as_dict()


@frappe.whitelist()
def save_document(payload: str | dict, action: str | None = None) -> dict:
	"""Insert or update a document while preserving DocType validation and workflow logic."""
	data = payload
	if isinstance(payload, str):
		try:
			data = json.loads(payload)
		except Exception:
			frappe.throw(_("Invalid payload JSON"))
	if not isinstance(data, dict):
		frappe.throw(_("Payload must be a document object"))

	doctype = data.get("doctype")
	if not doctype:
		frappe.throw(_("doctype is required"))

	name = data.get("name")
	if name and frappe.db.exists(doctype, name):
		_ensure_permission(doctype, "write")
		doc = frappe.get_doc(doctype, name)
		if not doc.has_permission("write"):
			frappe.throw(_("Not permitted to edit document {0}").format(name))
		doc.update(data)
		doc.save(ignore_permissions=True)
	else:
		_ensure_permission(doctype, "create")
		doc = frappe.get_doc(data)
		doc.insert(ignore_permissions=True)

	if action == "submit" and doc.docstatus == 0:
		if not doc.has_permission("submit"):
			frappe.throw(_("Not permitted to submit document {0}").format(doc.name))
		doc.submit()
	elif action == "cancel" and doc.docstatus == 1:
		if not doc.has_permission("cancel"):
			frappe.throw(_("Not permitted to cancel document {0}").format(doc.name))
		doc.cancel()

	frappe.db.commit()
	return {"name": doc.name, "doc": doc.as_dict()}


@frappe.whitelist()
def list_documents(
	doctype: str,
	filters: str | dict | None = None,
	fields: str | list[str] | None = None,
	limit_page_length: int = 20,
	order_by: str | None = None,
) -> list[dict]:
	"""Return list data for a doctype with permission checks for custom shell tables."""
	_ensure_permission(doctype, "read")

	resolved_filters = filters
	if isinstance(filters, str):
		try:
			resolved_filters = json.loads(filters)
		except Exception:
			resolved_filters = {}

	resolved_fields = fields
	if isinstance(fields, str):
		try:
			resolved_fields = json.loads(fields)
		except Exception:
			resolved_fields = [f.strip() for f in fields.split(",") if f.strip()]

	if not resolved_fields:
		resolved_fields = ["name", "modified"]

	return frappe.get_list(
		doctype,
		filters=resolved_filters,
		fields=resolved_fields,
		limit_page_length=limit_page_length,
		order_by=order_by or "modified desc",
	)
