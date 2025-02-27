#!/usr/bin/env node

import { serve } from "bun"
import { readFileSync } from "fs"
import { buildApp } from "./build"

serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url)
		if (url.pathname === "/") {
            buildApp("src/index.html")
			const htmlFilePath = `.snelle/src/index.html`
			const html = readFileSync(htmlFilePath, "utf8")
			return new Response(html, {
				headers: {
					"Content-Type": "text/html",
				},
			})
		}
		return new Response("Not Found", { status: 404 })
	},
})
