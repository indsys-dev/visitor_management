app_name = "visitor_management"
app_title = "Visitor Management"
app_publisher = "Your Company"
app_description = "Complete Visitor Management System for Frappe"
app_email = "support@yourcompany.com"
app_license = "mit"
app_version = "1.0.0"
required_apps = ["frappe"]

after_install = "visitor_management.install.after_install"
after_migrate = "visitor_management.install.after_migrate"

fixtures = [
	"Visitor Location",
	{"dt": "Custom Field", "filters": [["dt", "in", ["Employee"]]]},
	"Workflow",
	"Workflow State",
	"Workflow Action Master",
]

doctype_js = {
	"Visitor Pass Request": "public/js/visitor_pass_request.js",
	"Recurring Visitor Pass": "public/js/recurring_visitor_pass.js",
	"VMS Settings": "public/js/vms_settings.js",
}

web_forms = ["visitor_pre_registration"]

scheduler_events = {
	"hourly": [
		"visitor_management.tasks.expire_old_passes",
		"visitor_management.tasks.expire_recurring_passes",
		"visitor_management.tasks.alert_overstay_visitors",
	],
	"daily": [
		"visitor_management.tasks.send_daily_visitor_report",
		"visitor_management.tasks.cleanup_old_otps",
	],
}

website_route_rules = [
	{"from_route": "/visitor-registration", "to_route": "visitor_pre_registration"},
	{"from_route": "/visitor-pass/", "to_route": "visitor_pass"},
]

on_login = "visitor_management.api.gate.check_active_passes_on_login"
