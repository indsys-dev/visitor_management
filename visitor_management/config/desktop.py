from __future__ import annotations

from frappe import _


def get_data() -> list[dict]:
	"""Return desk module configuration."""
	return [
		{
			"module_name": "Visitor Management",
			"color": "blue",
			"icon": "octicon octicon-person",
			"type": "module",
			"label": _("Visitor Management"),
		}
	]
