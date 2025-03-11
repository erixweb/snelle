#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const { buildApp } = require('./build');

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Make it so it builds all elements in src/ and all assets in public/
    if (url.pathname.startsWith("/public/")) {
        const filePath = `.${url.pathname}`;
        try {
            const file = fs.readFileSync(filePath, "utf8");
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(file);
            return;
        } catch (error) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }
    }

    if (url.pathname.endsWith("/")) {
        console.log(url.pathname);
    }

    if (url.pathname === "/") {
        buildApp("src/index.html");
        const htmlFilePath = `.snelle/src/index.html`;
        try {
            const html = fs.readFileSync(htmlFilePath, "utf8");
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        } catch (error) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }
    } else {
        // Trim slashes (/) at the end and start of the pathname
        const cleanPath = url.pathname.replace(/^\/+|\/+$/g, "");
        await buildApp(`src/${cleanPath}.html`);
        const htmlFilePath = `.snelle/src/${cleanPath}.html`;
        try {
            const html = fs.readFileSync(htmlFilePath, "utf8");
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        } catch (error) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
