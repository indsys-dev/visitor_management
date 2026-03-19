from setuptools import find_packages, setup

with open("requirements.txt", encoding="utf-8") as requirements_file:
	requirements = [line.strip() for line in requirements_file if line.strip() and not line.startswith("#")]

setup(
	name="visitor_management",
	version="1.0.0",
	description="Complete Visitor Management System for Frappe",
	author="Your Company",
	packages=find_packages(),
	include_package_data=True,
	zip_safe=False,
	install_requires=requirements,
)
