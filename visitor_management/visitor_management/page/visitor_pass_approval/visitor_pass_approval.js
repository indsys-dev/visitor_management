frappe.pages["visitor-pass-approval"].on_page_load = function (wrapper) {
	new VisitorPassApproval(wrapper);
};

class VisitorPassApproval {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "Visitor Pass Approval",
			single_column: true
		});

		this.render();
		this.load();
	}

	/* ---------------- UI ---------------- */
	render() {
		$(this.page.body).html(`
		<div class="vpa-root">

			<style>
				.vpa-root{
					background:#f1f5f9;padding:20px;font-family:Inter;
				}
				.vpa-card{
					background:#fff;border-radius:12px;padding:16px;
					margin-bottom:12px;box-shadow:0 5px 20px rgba(0,0,0,.08);
				}
				.vpa-title{font-size:18px;font-weight:700}
				.vpa-sub{color:#64748b;font-size:13px;margin-bottom:8px}
				.vpa-btn{
					padding:6px 12px;border:none;border-radius:6px;
					font-size:12px;margin-right:6px;cursor:pointer
				}
				.approve{background:#16a34a;color:#fff}
				.reject{background:#dc2626;color:#fff}

				/* PASS DESIGN */
				.vp-pass{
					border-radius:12px;border:1px solid #ddd;
					overflow:hidden;font-family:Inter;
				}
				.vp-head{
					background:#0f766e;color:#fff;
					padding:14px;font-weight:800;
					display:flex;justify-content:space-between;
				}
				.vp-body{padding:15px}
				.vp-row{display:flex;justify-content:space-between;margin-bottom:6px}
				.vp-qr{
					text-align:center;margin-top:15px
				}
				.vp-qr img{
					width:160px;height:160px
				}
			</style>

			<div id="list"></div>
		</div>
		`);
	}

	/* ---------------- Load ---------------- */
	async load() {
		let res = await frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Visitor Pass Request",
				filters: { status: "Pending" },
				fields: ["name","visitor_name","visitor_email","visitor_phone","visit_purpose","host_employee"]
			}
		});

		this.render_cards(res.message);
	}

	/* ---------------- Cards ---------------- */
	render_cards(data) {
		let html = data.map(d => `
			<div class="vpa-card">
				<div class="vpa-title">${d.visitor_name}</div>
				<div class="vpa-sub">${d.visitor_email}</div>

				<button class="vpa-btn approve" data-name="${d.name}">Approve</button>
				<button class="vpa-btn reject" data-name="${d.name}">Reject</button>
			</div>
		`).join("");

		$("#list").html(html);

		this.bind();
	}

	/* ---------------- Events ---------------- */
	bind() {
		$(".approve").click(e => this.approve($(e.currentTarget).data("name")));
		$(".reject").click(e => this.reject($(e.currentTarget).data("name")));
	}

	/* ---------------- Approve ---------------- */
	async approve(name) {
		let r = await frappe.call({
			method: "visitor_management.api.approve_pass",
			args: { request_name: name, action: "approve" }
		});

		this.show_pass(r.message.pass_name);
		this.load();
	}

	/* ---------------- Reject ---------------- */
	reject(name) {
		let d = new frappe.ui.Dialog({
			title: "Reject Reason",
			fields: [{ fieldname:"reason", fieldtype:"Small Text", reqd:1 }],
			primary_action: async (v) => {
				await frappe.call({
					method: "visitor_management.api.approve_pass",
					args: { request_name:name, action:"reject", reason:v.reason }
				});
				d.hide();
				this.load();
			}
		});
		d.show();
	}

	/* ---------------- Show Pass ---------------- */
	async show_pass(pass_name) {
		let r = await frappe.call({
			method: "frappe.client.get",
			args: { doctype:"Visitor Pass", name:pass_name }
		});

		let p = r.message;

		let html = `
		<div class="vp-pass">

			<div class="vp-head">
				<div>VISITOR PASS</div>
				<div>${p.name}</div>
			</div>

			<div class="vp-body">
				<div class="vp-row"><b>Name</b><span>${p.visitor_name}</span></div>
				<div class="vp-row"><b>Mobile</b><span>${p.visitor_phone}</span></div>
				<div class="vp-row"><b>Purpose</b><span>${p.visit_purpose}</span></div>
				<div class="vp-row"><b>Host</b><span>${p.host_employee}</span></div>

				<div class="vp-qr">
					<img src="${p.qr_code || ''}">
					<p>Scan for Verification</p>
				</div>

				<button id="download" class="vpa-btn approve">Download</button>
			</div>
		</div>
		`;

		let d = new frappe.ui.Dialog({
			title: "Visitor Pass",
			fields: [{ fieldtype:"HTML", fieldname:"html" }]
		});

		d.fields_dict.html.$wrapper.html(html);
		d.show();

		$("#download").click(async () => {
			let file = await frappe.call({
				method: "visitor_management.api.download_pass",
				args: { pass_name }
			});
			window.open(file.message.file_url);
		});
	}
}