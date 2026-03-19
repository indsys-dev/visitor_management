frappe.pages["vms-dashboard"].on_page_load = function (wrapper) {
	new VMSDashboard(wrapper);
};

class VMSDashboard {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("VMS Dashboard"),
			single_column: true,
		});
		this.wrapper = wrapper;
		this.charts = {};
		this.make_layout();
		this.load_chart_js().then(() => this.refresh());
		setInterval(() => this.refresh(), 60000);
	}

	make_layout() {
		$(this.page.body).html(`
			<div class="vms-dashboard p-2">
				<div class="d-flex gap-2 mb-3">
					<input type="date" class="form-control from-date" style="max-width:170px"/>
					<input type="date" class="form-control to-date" style="max-width:170px"/>
					<input type="text" class="form-control site" placeholder="Site" style="max-width:220px"/>
					<button class="btn btn-primary refresh">${__("Refresh")}</button>
				</div>
				<div class="row mb-3 summary"></div>
				<div class="row">
					<div class="col-md-6"><canvas id="visitsByDay"></canvas></div>
					<div class="col-md-6"><canvas id="purposeChart"></canvas></div>
				</div>
				<div class="row mt-3">
					<div class="col-md-12"><canvas id="hostChart"></canvas></div>
				</div>
				<h4 class="mt-4">${__("Active Visitors")}</h4>
				<div class="active-visitors"></div>
				<h4 class="mt-4 text-warning">${__("Overstay Alerts")}</h4>
				<div class="overstays"></div>
			</div>
		`);
		this.$el = $(this.page.body);
		this.$el.find(".refresh").on("click", () => this.refresh());
	}

	async load_chart_js() {
		if (window.Chart) return;
		await frappe.require("https://cdn.jsdelivr.net/npm/chart.js");
	}

	async refresh() {
		const filters = {
			site: this.$el.find(".site").val() || null,
			from_date: this.$el.find(".from-date").val() || null,
			to_date: this.$el.find(".to-date").val() || null,
		};
		const summaryRes = await frappe.call({
			method: "visitor_management.api.analytics.get_dashboard_summary",
			args: filters,
		});
		const activeRes = await frappe.call({
			method: "visitor_management.api.analytics.get_active_visitors",
			args: { site: filters.site },
		});
		const overstayRes = await frappe.call({
			method: "visitor_management.api.analytics.get_overstay_visitors",
		});
		const data = summaryRes.message || {};
		this.render_summary(data, overstayRes.message || []);
		this.render_charts(data);
		this.render_table(".active-visitors", activeRes.message || []);
		this.render_table(".overstays", overstayRes.message || []);
	}

	render_summary(data, overstays) {
		const cards = [
			{ l: __("Total Today"), v: data.total_visits || 0 },
			{ l: __("Active Now"), v: data.active_now || 0 },
			{ l: __("Avg Duration (min)"), v: data.avg_duration_minutes || 0 },
			{ l: __("Overstays"), v: overstays.length || 0 },
		];
		this.$el
			.find(".summary")
			.html(cards.map((c) => `<div class="col-md-3"><div class="card p-3"><div class="text-muted">${c.l}</div><h2>${c.v}</h2></div></div>`).join(""));
	}

	render_charts(data) {
		this.plot("visitsByDay", "bar", data.visits_by_day || [], "date", "count", __("Visits per Day"));
		this.plot("purposeChart", "doughnut", data.visits_by_purpose || [], "purpose", "count", __("Visits by Purpose"));
		this.plot("hostChart", "bar", data.top_hosts || [], "name", "count", __("Top Hosts"));
	}

	plot(id, type, rows, labelKey, valueKey, title) {
		if (this.charts[id]) this.charts[id].destroy();
		const ctx = document.getElementById(id);
		this.charts[id] = new Chart(ctx, {
			type,
			data: {
				labels: rows.map((r) => r[labelKey]),
				datasets: [{ label: title, data: rows.map((r) => r[valueKey]) }],
			},
		});
	}

	render_table(selector, rows) {
		if (!rows.length) {
			this.$el.find(selector).html(`<div class="text-muted">${__("No data")}</div>`);
			return;
		}
		const cols = Object.keys(rows[0]);
		const head = `<tr>${cols.map((c) => `<th>${frappe.utils.escape_html(c)}</th>`).join("")}</tr>`;
		const body = rows
			.map((row) => `<tr>${cols.map((c) => `<td>${frappe.utils.escape_html(String(row[c] ?? ""))}</td>`).join("")}</tr>`)
			.join("");
		this.$el.find(selector).html(`<table class="table table-bordered table-sm"><thead>${head}</thead><tbody>${body}</tbody></table>`);
	}
}
