#!/usr/bin/env node

import { serve } from "bun"
import { readFileSync } from "fs"
import { buildApp } from "./build"

serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url)
		// Make it so it builds all elements in src/ and all assets in public/
		if (url.pathname.startsWith("/public/")) {
			const filePath = `.${url.pathname}`
			const file = readFileSync(filePath, "utf8")
			return new Response(file, {
				headers: {
					"Content-Type": "text/html",
				},
			})
		}
		if (url.pathname.endsWith("/")) {
			console.log(url.pathname)
		}


		if (url.pathname === "/") {
            buildApp("src/index.html")
			const htmlFilePath = `.snelle/src/index.html`
			const html = readFileSync(htmlFilePath, "utf8")
			return new Response(html, {
				headers: {
					"Content-Type": "text/html",
				},
			})
		} else {
			// Trim slashes (/) at the end and start of the pathname
			url.pathname = url.pathname.replace(/^\/+|\/+$/g, "")
			await buildApp(`src/${url.pathname}.html`)
			const htmlFilePath = `.snelle/src/${url.pathname}.html`
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
