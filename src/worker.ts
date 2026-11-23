import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

export default {
	...handler,
	fetch(request, env, context) {
		const url = new URL(request.url);
		if (url.hostname === "reading-cat-preview-20260929.m-809.workers.dev" || (url.hostname === "reading.cat" && url.protocol !== "https:")) {
			url.protocol = "https:";
			url.host = "reading.cat";
			return Response.redirect(url.toString(), 308);
		}
		return handler.fetch!(request, env, context);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
