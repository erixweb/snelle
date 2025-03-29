#!/usr/bin/env node
import { readFileSync, readdirSync, promises as fsPromises, existsSync } from "fs"
import * as path from "path"
import * as cheerio from "cheerio"
import { chalk } from "./chalk.js"

const { readFile, mkdir, writeFile } = fsPromises

async function resolveComponents() {
	const components = readdirSync("components")

	const resolvedComponents = await Promise.all(
		components.map(async (component) => {
			const html = await resolveComponent(component)

			return {
				name: component.split(".")[0],
				html,
			}
		})
	)

	return resolvedComponents
}

async function resolveComponent(componentPath) {
	const html = await readFile(`components/${componentPath}`, "utf8")
	return html
}

// Read the HTML file
export async function buildApp(file) {
	if (file === undefined) return

	const time = Date.now()
	console.log(chalk(`∙∙∙ !8Building !e${file}!8.`))
	const htmlFilePath = `${file}`

	try {
		let data = await readFile(htmlFilePath, "utf8")
		// Replace {{ x }} with <snelle-x></snelle-x> in the HTML
		data = data.replace(/{{[^}]*}}/g, (match) => {
			const attr = match.replace(/{{|}}/g, "").trim()
			return `<snelle-${attr}></snelle-${attr}>`
		})

		// Load the HTML into cheerio
		const $ = cheerio.load(data)

		const components = await resolveComponents()
		const styles = new Set()

		for (const component of components) {
			if ($(component.name).length === 0) continue
			const initialHTML = component.html

			const elements = $(component.name)
			for (let i = 0; i < elements.length; i++) {
				const element = elements.eq(i)
				let replacedHtml = initialHTML

				replacedHtml = replacedHtml.replaceAll("<slot></slot>", element.html())

				// Get text between <style> tags in component.html & don't include the <style></style> in the final text
				const styleTags = replacedHtml.match(/<style[^>]*>[\s\S]*<\/style>/g)

				const attributes = Object.entries(element.attr())
				attributes.forEach((attr) => {
					// Replace {{ attributeName }} with the value of the attribute
					replacedHtml = replacedHtml.replace(
						`{{ ${attr[0]} }}`,
						`<snelle-${attr[0]}>${attr[1]}</snelle-${attr[0]}>`
					)
					// Add attributes to first element in component.html
					const firstElement = replacedHtml.match(/<[^>]*>/)
					if (firstElement) {
						replacedHtml = replacedHtml.replace(
							firstElement[0],
							`${firstElement[0].replace(">", "")} ${attr[0]}="${attr[1]}">`
						)
					}
				})

				styles.add(
					styleTags
						?.toString()
						.replace(/<style[^>]*>/g, "")
						.replace(/<\/style>/g, "")
				)

				replacedHtml = replacedHtml.replace(/<style[^>]*>[\s\S]*<\/style>/g, "")
				replacedHtml = replacedHtml.replace(/{{[^}]*}}/g, (match) => {
					const attr = match.replace(/{{|}}/g, "").trim()
					return `<snelle-${attr}></snelle-${attr}>`
				})

				// Replace the styles in component.html with styles

				element.replaceWith(replacedHtml)
			}
		}
		$("script").html(
			`function create(element) { 
    let val 
    const reactiveElement = document.querySelector("snelle-"+element)
	let initialState
	if (reactiveElement.childNodes[0] === undefined) {
		initialState = ""
	} else {
		initialState = reactiveElement.childNodes[0].data
	}

	if (!isNaN(initialState)) {
		initialState = Number(initialState)
	}

    if (reactiveElement) {
    return val = {
        state: initialState,
        effect: function(val) {},
        get value () {
            return this.state
        },
        set value (value) {
            this.state = value
            this.effect(value)
            reactiveElement.innerText = value
        },
        subscribe: function(fn) {
            this.effect = fn
        },
    }
}
}` + $("script").html()
		)
		$("head").append(`<style>${Array.from(styles).join("\n")}</style>`)

		// Write the modified HTML back to the file
		const outputDir = path.dirname(`.snelle/${file}`)
		
		// Only create directory if it's not src or public
		if (!outputDir.includes("src") && !outputDir.includes("public")) {
			await mkdir(outputDir, { recursive: true })
			await writeFile(`.snelle/${file}`, $.html(), "utf8")
		} else {
			let outputPath = file.split("/").slice(1).join("/")
			console.log(outputPath)
			// If the file name is test.html then it should create a folder called test that contains an index.html with the content of the file. This must only happen if the original file isn't already an index.html file.
			// Also it should consider where if it is a folder. If it is, it shouldn't create a folder with the same name.
			if (
				outputPath.endsWith(".html") &&
				!outputPath.includes("index.html") &&
				!outputPath.includes("/")
			) {
				outputPath = outputPath.split(".")[0]
				await mkdir(`.snelle/${outputPath}`, { recursive: true })
				outputPath = `${outputPath}/index.html`
			}

			await fsPromises.mkdir(".snelle", { recursive: true }).then(async () => {
				await writeFile(`.snelle/${outputPath}`, $.html(), "utf8")
			})
		}

		const timeTaken = Date.now() - time
		console.log(chalk(`!5∎∎∎ !aCompiled !e${file}!a in !9${timeTaken}ms!a.`))
	} catch (err) {
		console.error("Error processing the HTML file:", err)
	}
}

// Build all files in src directory
export async function buildAll() {
	async function getAllFiles(dirPath) {
		const files = readdirSync(dirPath)
		let arrayOfFiles = []

		for (const file of files) {
			const fullPath = path.join(dirPath, file)
			if (existsSync(fullPath)) {
				const stats = await fsPromises.stat(fullPath)
				if (stats.isDirectory()) {
					arrayOfFiles = arrayOfFiles.concat(await getAllFiles(fullPath))
				} else if (file.endsWith(".html")) {
					// Store relative path from src directory
					const relativePath = path.relative(path.join(process.cwd(), "src"), fullPath)
					arrayOfFiles.push(relativePath)
				}
			}
		}

		return arrayOfFiles
	}

	try {
		// Create .snelle directory if it doesn't exist
		if (!existsSync(".snelle")) {
			await mkdir(".snelle", { recursive: true })
		}

		const srcPath = path.join(process.cwd(), "src")
		if (!existsSync(srcPath)) {
			console.error("src directory does not exist")
			return
		}

		const files = await getAllFiles(srcPath)

		if (files && files.length > 0) {
			// Process files sequentially to avoid file system conflicts
			for (const file of files) {
				// Construct the proper file path for processing
				const fullPath = path.join(process.cwd(), "src", file)
				console.log(file)
				await buildApp(`src/${file}`)
			}
		} else {
			console.error("No HTML files found in src directory")
		}
	} catch (error) {
		console.error("Error processing files:", error)
	}	

	buildAssets()
}
export async function buildAssets() {
	if (!existsSync("public")) {
		await mkdir("public")
	}
	const files = readdirSync(path.join(process.cwd(), "public"))
	const outputDir = ".snelle/"
	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true })
	}
	if (files) {
		await Promise.all(
			files.map((file) =>
				writeFile(`${outputDir}/${file}`, readFileSync(`public/${file}`), "utf8")
			)
		)
	} else {
		console.error("No files in public directory")
	}
}
