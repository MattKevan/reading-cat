import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { d1, r2 } from "@emdash-cms/cloudflare";

export default defineConfig({
	output: "server",
	site: process.env.CLOUDFLARE_ENV === "production" ? "https://reading.cat" : undefined,
  outDir: "./dist-cloudflare",
  adapter: cloudflare({ imageService: "passthrough" }),
  cache: { provider: cacheCloudflare() },
  routeRules: {
    "/": { maxAge: 60, swr: 300 },
    "/bookshelf": { maxAge: 60, swr: 300 },
    "/reviews/[slug]": { maxAge: 60, swr: 300 },
  },
  image: { layout: "constrained", responsiveStyles: true },
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB" }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	devToolbar: { enabled: false },
});
