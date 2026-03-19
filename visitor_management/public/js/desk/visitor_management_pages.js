/* visitor_management/public/js/desk/visitor_management_pages.js */

window.MasterDeskPageHandlers = window.MasterDeskPageHandlers || {};

function hideEmbeddedDeskChrome($iframe) {
	$iframe.on("load", () => {
		try {
			const doc = $iframe[0].contentWindow.document;
			const style = doc.createElement("style");
			style.textContent = `
				.navbar,
				.page-head,
				.page-head-content,
				.layout-side-section,
				.desk-sidebar,
				.standard-sidebar,
				.search-bar {
					display: none !important;
				}
				.layout-main-section-wrapper,
				.layout-main-section,
				.page-body,
				.page-wrapper,
				.container,
				.main-section {
					margin: 0 !important;
					padding: 0 !important;
					max-width: 100% !important;
				}
				body {
					background: transparent !important;
				}
			`;
			doc.head.appendChild(style);
		} catch (error) {
			console.warn("Unable to hide embedded desk chrome", error);
		}
	});
}

window.MasterDeskPageHandlers["visitor_management.home"] = function ($container, context) {
	$container.html(`
		<div style="font-family:Manrope,Segoe UI,sans-serif;display:grid;gap:12px;">
			<div style="background:#fff;border:1px solid #dbe4f1;border-radius:12px;padding:14px;">
				<h3 style="margin:0 0 6px 0;">Visitor Management Workspace</h3>
				<div class="text-muted">App-specific page logic is loaded from visitor_management app while shell is from master_desk.</div>
			</div>
			<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
				<button class="btn btn-default" data-goto="entry">Open Pass Entry</button>
				<button class="btn btn-default" data-goto="approval">Open Approval</button>
				<button class="btn btn-default" data-goto="requests">Visitor Requests List</button>
			</div>
		</div>
	`);
	$container.find("[data-goto='entry']").on("click", () => context.router.navigate(["page", "visitor_management.pass_entry"]));
	$container.find("[data-goto='approval']").on("click", () => context.router.navigate(["page", "visitor_management.pass_approval"]));
	$container.find("[data-goto='requests']").on("click", () => context.router.navigate(["list", "Visitor Pass Request"]));
};

window.MasterDeskPageHandlers["visitor_management.pass_entry"] = function ($container) {
	$container.html(`
		<div style="display:grid;gap:10px;">
			<div style="background:#fff;border:1px solid #dbe4f1;border-radius:12px;padding:12px;">
				<h4 style="margin:0 0 6px 0;">Visitor Pass Entry (App Page)</h4>
				<div class="text-muted">This UI remains in visitor_management page logic.</div>
			</div>
			<iframe data-embedded-page="entry" src="/app/visitor-pass-entry" style="width:100%;height:76vh;border:1px solid #dbe4f1;border-radius:12px;background:#fff;"></iframe>
		</div>
	`);
	hideEmbeddedDeskChrome($container.find("[data-embedded-page='entry']"));
};

window.MasterDeskPageHandlers["visitor_management.pass_approval"] = function ($container) {
	$container.html(`
		<div style="display:grid;gap:10px;">
			<div style="background:#fff;border:1px solid #dbe4f1;border-radius:12px;padding:12px;">
				<h4 style="margin:0 0 6px 0;">Visitor Pass Approval (App Page)</h4>
				<div class="text-muted">Approval page script is still owned by visitor_management app.</div>
			</div>
			<iframe data-embedded-page="approval" src="/app/visitor-pass-approval" style="width:100%;height:76vh;border:1px solid #dbe4f1;border-radius:12px;background:#fff;"></iframe>
		</div>
	`);
	hideEmbeddedDeskChrome($container.find("[data-embedded-page='approval']"));
};
