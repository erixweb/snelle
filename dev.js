#!/usr/bin/env node

import http from "http"
import fs from "fs"
import { buildApp } from "./build.js"

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`)

	// Make it so it builds all elements in src/ and all assets in public/
	if (url.pathname.startsWith("/public/")) {
		const filePath = `.${url.pathname}`
		try {
			const file = fs.readFileSync(filePath, "utf8")
			res.end(file)
			return
		} catch (error) {
			res.writeHead(404)
			res.end("Not Found")
			return
		}
	}

	if (url.pathname === "/") {
		buildApp("src/index.html")
		const htmlFilePath = `.snelle/index.html`
		try {
			const html = fs.readFileSync(htmlFilePath, "utf8")
			res.writeHead(200, { "Content-Type": "text/html" })
			res.end(html)
			return
		} catch (error) {
			res.writeHead(404)
			res.end("Not Found")
			return
		}
	} else {
		// Trim slashes (/) at the end and start of the pathname
		try {
			const cleanPath = url.pathname.replace(/^\/+|\/+$/g, "")

			if (fs.existsSync(`src/${cleanPath}.html`) === false) {
				if (fs.existsSync(`public/${cleanPath}`) === true) {
					const filePath = `.${url.pathname}`
					try {
						const file = fs.readFileSync(`public/${cleanPath}`)
						const extension = cleanPath.split(".").pop().toLowerCase()
						const mimeTypes = {
							jpg: "image/jpeg",
							jpeg: "image/jpeg",
							png: "image/png",
							gif: "image/gif",
							svg: "image/svg+xml",
							webp: "image/webp",
						}
						res.setHeader(
							"Content-Type",
							mimeTypes[extension] || "application/octet-stream"
						)
						res.end(file)
						return
					} catch (error) {
						res.writeHead(404)
						res.end("Not Found")
						return
					}
				}

				res.writeHead(404)
				res.end("Not Found")
				return
			}

			await buildApp(`src/${cleanPath}.html`)
			const htmlFilePath = `.snelle/${cleanPath}.html`
			// Create necessary directories for the output file
			const directories = cleanPath.split("/").slice(0, -1)
			if (directories.length > 0) {
				const dirPath = `.snelle/${directories.join("/")}`
				fs.mkdirSync(dirPath, { recursive: true })
			}
			const html = fs.readFileSync(htmlFilePath, "utf8")
			res.writeHead(200, { "Content-Type": "text/html" })
			res.end(html)
			return
		} catch (error) {
			res.writeHead(404)
			res.end("Not Found")
			return
		}
	}
})

export default function start() {
	server.listen(3000, () => {
		console.log("Server running at http://localhost:3000/")
	})
}
