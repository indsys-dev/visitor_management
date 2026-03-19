/* visitor_management/public/js/custom_form_renderer.js */

window.VMSCustomFormRenderer = class VMSCustomFormRenderer {
	constructor(options) {
		this.container = options.container;
		this.api_base = "visitor_management.api.shell";
		this.meta = null;
		this.doc = null;
		this.mode = "new";
		this.on_saved = options.on_saved;
	}

	async load(doctype, name = null) {
		this.mode = name ? "edit" : "new";
		const meta_res = await frappe.call({
			method: `${this.api_base}.get_doctype_meta`,
			args: { doctype },
		});
		this.meta = meta_res.message;

		if (name) {
			const doc_res = await frappe.call({
				method: `${this.api_base}.get_document`,
				args: { doctype, name },
			});
			this.doc = doc_res.message;
		} else {
			this.doc = { doctype };
		}

		this.render();
	}

	_sectionize_fields() {
		const sections = [];
		let current = { title: __("Details"), fields: [] };
		const meta_fields = this.meta.fields || [];
		for (const df of meta_fields) {
			if (df.fieldtype === "Section Break") {
				if (current.fields.length) sections.push(current);
				current = { title: df.label || __("Section"), fields: [] };
				continue;
			}
			if (["Column Break", "Tab Break", "Fold", "Heading", "HTML", "Button"].includes(df.fieldtype)) {
				continue;
			}
			if (!df.fieldname) continue;
			current.fields.push(df);
		}
		if (current.fields.length) sections.push(current);
		return sections;
	}

	render() {
		const sections = this._sectionize_fields();
		const cards = sections
			.map((sec) => {
				const fields_html = sec.fields.map((df) => this.render_field(df)).join("");
				return `
					<section class="vms-form-card">
						<div class="vms-form-card-title">${frappe.utils.escape_html(sec.title)}</div>
						<div class="vms-form-grid">${fields_html}</div>
					</section>
				`;
			})
			.join("");

		this.container.html(`
			<div class="vms-form-wrap">
				<div class="vms-form-header">
					<h3>${frappe.utils.escape_html(this.meta.doctype)} ${this.mode === "new" ? __("(New)") : `#${frappe.utils.escape_html(this.doc.name || "")}`}</h3>
					<div class="text-muted">${__("Business logic, permissions, workflows and validation remain server-side.")}</div>
				</div>
				<div class="vms-form-errors" style="display:none"></div>
				${cards}
				<div class="vms-form-actions">
					<button class="btn btn-primary" data-action="save">${__("Save")}</button>
					<button class="btn btn-success" data-action="submit">${__("Submit")}</button>
					<button class="btn btn-danger" data-action="cancel">${__("Cancel")}</button>
				</div>
			</div>
		`);

		this.bind_actions();
	}

	render_field(df) {
		const value = this.doc[df.fieldname];
		const safe_label = frappe.utils.escape_html(df.label || df.fieldname);
		const reqd = df.reqd ? "<span class='vms-req'>*</span>" : "";

		if (df.fieldtype === "Table") {
			return this.render_child_table(df);
		}

		const common = `data-field="${frappe.utils.escape_html(df.fieldname)}" ${df.read_only ? "disabled" : ""}`;
		let input = "";
		if (df.fieldtype === "Check") {
			input = `<input type="checkbox" class="vms-input-check" ${common} ${value ? "checked" : ""}>`;
		} else if (df.fieldtype === "Select") {
			const options = (df.options || "")
				.split("\n")
				.filter(Boolean)
				.map((opt) => `<option value="${frappe.utils.escape_html(opt)}" ${value === opt ? "selected" : ""}>${frappe.utils.escape_html(opt)}</option>`)
				.join("");
			input = `<select class="form-control" ${common}><option value=""></option>${options}</select>`;
		} else if (df.fieldtype === "Date") {
			input = `<input type="date" class="form-control" ${common} value="${frappe.utils.escape_html(value || "")}">`;
		} else if (df.fieldtype === "Int") {
			input = `<input type="number" step="1" class="form-control" ${common} value="${value == null ? "" : value}">`;
		} else if (["Float", "Currency"].includes(df.fieldtype)) {
			input = `<input type="number" step="0.01" class="form-control" ${common} value="${value == null ? "" : value}">`;
		} else if (["Small Text", "Text", "Text Editor"].includes(df.fieldtype)) {
			input = `<textarea class="form-control" rows="3" ${common}>${frappe.utils.escape_html(value || "")}</textarea>`;
		} else {
			input = `<input type="text" class="form-control" ${common} value="${frappe.utils.escape_html(value || "")}" placeholder="${frappe.utils.escape_html(df.options || "")}">`;
		}

		return `
			<div class="vms-field">
				<label class="vms-label">${safe_label}${reqd}</label>
				${input}
			</div>
		`;
	}

	render_child_table(df) {
		const table_meta = this.meta.child_tables[df.fieldname] || { fields: [] };
		const rows = this.doc[df.fieldname] || [];
		const cols = table_meta.fields.slice(0, 4);
		const headers = cols.map((c) => `<th>${frappe.utils.escape_html(c.label || c.fieldname)}</th>`).join("");
		const body = rows
			.map((row, row_index) => {
				const cells = cols
					.map((col) => {
						const val = row[col.fieldname] || "";
						return `<td><input class="form-control input-xs" data-child-table="${df.fieldname}" data-row="${row_index}" data-col="${col.fieldname}" value="${frappe.utils.escape_html(val)}"></td>`;
					})
					.join("");
				return `<tr>${cells}</tr>`;
			})
			.join("");
		return `
			<div class="vms-field vms-child-wrap">
				<label class="vms-label">${frappe.utils.escape_html(df.label || df.fieldname)}</label>
				<div class="vms-child-table" data-table="${frappe.utils.escape_html(df.fieldname)}">
					<table class="table table-bordered table-sm">
						<thead><tr>${headers}</tr></thead>
						<tbody>${body || ""}</tbody>
					</table>
					<button class="btn btn-xs btn-default" data-action="add-row" data-table="${frappe.utils.escape_html(df.fieldname)}">${__("Add Row")}</button>
				</div>
			</div>
		`;
	}

	collect_values() {
		const payload = { ...this.doc, doctype: this.meta.doctype };
		this.container.find("[data-field]").each((_, el) => {
			const $el = $(el);
			const fieldname = $el.attr("data-field");
			if ($el.is(":checkbox")) {
				payload[fieldname] = $el.is(":checked") ? 1 : 0;
			} else {
				payload[fieldname] = $el.val();
			}
		});

		const child_tables = this.meta.child_tables || {};
		Object.keys(child_tables).forEach((table_fieldname) => {
			const rows = payload[table_fieldname] ? [...payload[table_fieldname]] : [];
			this.container.find(`[data-child-table='${table_fieldname}']`).each((_, input) => {
				const $input = $(input);
				const row_index = cint($input.attr("data-row"));
				const col = $input.attr("data-col");
				rows[row_index] = rows[row_index] || {};
				rows[row_index][col] = $input.val();
			});
			payload[table_fieldname] = rows;
		});

		return payload;
	}

	bind_actions() {
		this.container.find("[data-action='save']").on("click", () => this.save());
		this.container.find("[data-action='submit']").on("click", () => this.save("submit"));
		this.container.find("[data-action='cancel']").on("click", () => this.save("cancel"));
		this.container.find("[data-action='add-row']").on("click", (e) => {
			const table_fieldname = $(e.currentTarget).attr("data-table");
			this.doc[table_fieldname] = this.doc[table_fieldname] || [];
			this.doc[table_fieldname].push({});
			this.render();
		});
	}

	async save(action = null) {
		this.container.find(".vms-form-errors").hide().empty();
		const payload = this.collect_values();
		try {
			const res = await frappe.call({
				method: `${this.api_base}.save_document`,
				args: { payload, action },
			});
			this.doc = res.message.doc;
			frappe.show_alert({ message: __("Saved successfully"), indicator: "green" });
			if (this.on_saved) this.on_saved(this.doc);
			this.render();
		} catch (e) {
			const msg = (e && e.message) || __("Failed to save document");
			this.container.find(".vms-form-errors").text(msg).show();
			frappe.show_alert({ message: __("Validation error"), indicator: "red" });
		}
	}
};
