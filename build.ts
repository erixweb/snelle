import { readFileSync, readdirSync, promises as fsPromises } from "fs"
import * as path from "path"
import * as cheerio from "cheerio"
import { chalk } from "./chalk"

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

async function resolveComponent(componentPath: string) {
	const html = await readFile(`components/${componentPath}`, "utf8")
	return html
}

// Read the HTML file
export async function buildApp(file: string) {
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
				
				replacedHtml = replacedHtml.replaceAll("<slot></slot>", element.html()!)
	
				// Get text between <style> tags in component.html & don't include the <style></style> in the final text
				const styleTags = replacedHtml.match(/<style[^>]*>[\s\S]*<\/style>/g)
	
				const attributes = Object.entries(element.attr()!)
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
		await mkdir(outputDir, { recursive: true })

		writeFile(`.snelle/${file}`, $.html(), "utf8")

		const timeTaken = Date.now() - time
		console.log(chalk(`!5∎∎∎ !aCompiled !e${file}!a in !9${timeTaken}ms!a.`))
	} catch (err) {
		console.error("Error processing the HTML file:", err)
	}
}

// Build all files in src directory
export async function buildAll() {
	const files = readdirSync("src")

	await Promise.all(files.map((file) => buildApp(`src/${file}`)))
}

buildAll()