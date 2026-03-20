from __future__ import annotations

import base64
from binascii import Error as BinasciiError

import frappe
from frappe import _
from frappe.utils.file_manager import save_file

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_FIELDS = {"face_photo", "id_proof_image", "id_proof_image_back"}


@frappe.whitelist()
def save_face_photo(doctype: str, docname: str, image_b64: str, field: str = "face_photo") -> dict:
	"""Save base64 image to a private file and set the given field on the document."""
	if not doctype or not docname or not image_b64:
		frappe.throw(_("doctype, docname and image_b64 are required"))
	if field not in ALLOWED_FIELDS:
		frappe.throw(_("Invalid target field"))

	doc = frappe.get_doc(doctype, docname)
	if not doc.has_permission("write"):
		frappe.throw(_("You do not have permission to update this document"))

	payload = image_b64.split(",", 1)[1] if "," in image_b64 else image_b64
	try:
		decoded = base64.b64decode(payload)
	except (BinasciiError, ValueError):
		frappe.throw(_("Invalid base64 image payload"))

	if len(decoded) > MAX_IMAGE_BYTES:
		frappe.throw(_("Image exceeds 2MB size limit"))

	filename = f"{docname}-{field}.jpg"
	file_doc = save_file(filename, decoded, doctype, docname, is_private=1)
	frappe.db.set_value(doctype, docname, field, file_doc.file_url, update_modified=True)
	frappe.db.commit()
	return {"file_url": file_doc.file_url}
