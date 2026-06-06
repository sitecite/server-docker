// TODO:
// allow customisation of site
// show created urls

// if token? show extra things


/**
 * Fetches from a link using a GET request, with built-in error handling
 * @param {string} url The url to fetch from
 * @returns {Promise<object>} The result
 */
async function fetchUrl(url) {
	return new Promise(async (resolve, reject) => {
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Response status: ${response.status}`);
				reject(false)
			}

			const result = await response.json();
			resolve(result)
			return
		} catch (e) {
			console.error(e.message);
			reject(false)
		}
	})
}
/**
 * Sends a post request. Mainly intended for local use.
 * @param {string} url The URL to post to
 * @param {object} body The JSON dictionary of what to post
 * @returns 
 */
function postUrl(url, body) {
	return new Promise(async (resolve, reject) => {
		try {
			const response = await fetch(url,
				{
					method: "POST",
					body: JSON.stringify(body),
					headers: {
						"Content-type": "application/json",
					},
				})

			const result = await response.json()
			resolve(result)
			return
		} catch (e) {
			console.error(e.message)
			reject(false)
		}
	})
}

/**
 * Clears all options in a select menu
 * @param {HTMLSelectElement} selectElement 
 */
function clearSelect(selectElement) {
	var i, L = selectElement.options.length - 1;
	for (i = L; i >= 0; i--) {
		selectElement.remove(i);
	}
}

/**
 * Update the document styles.
 */
async function fetchStyles() {
	const styles = await fetchUrl("../api/style")

	// load style selector

	document.getElementById("bg-color").value = "#" + styles.data.bg_color
	document.getElementById("bg-color").dispatchEvent(new Event('input', { bubbles: true }));
	document.getElementById("color").value = "#" + styles.data.color
	document.getElementById("color").dispatchEvent(new Event('input', { bubbles: true }));

	// load actual styles
	document.documentElement.style.setProperty('--background', "#" + styles.data.bg_color);
	document.documentElement.style.setProperty('--color', "#" + styles.data.color);

	// load fonts
	const fonts = await fetchUrl("../api/fontlist")
	const fontSelector = document.getElementById("font-selector")

	// remove all options so something new can be added
	// that way no duplicated should ever be able to be added
	clearSelect(fontSelector)

	var selectedFontFileRegular
	var selectedFontFileItalic
	var selectedFontBackup

	fonts.data.fontList.forEach(font => {
		var option = document.createElement("option")
		option.text = font.name
		if (styles.data.font == font.name) {
			option.selected = true
			selectedFontFileRegular = font.file_regular
			selectedFontFileItalic = font.file_italic
			selectedFontBackup = font.type
		}
		fontSelector.add(option)
	})

	// console.log(sel)
	const fontFile = new FontFace(
		styles.data.font,
		`url(../fonts/${selectedFontFileRegular})`
	)

	document.fonts.add(fontFile)

	const fontFileItalic = new FontFace(
		styles.data.font,
		`url(../fonts/${selectedFontFileItalic})`,
		{
			"style": "italic"
		}
	)

	document.fonts.add(fontFileItalic)
	document.documentElement.style.setProperty('--font-family', "'"+styles.data.font+"',"+selectedFontBackup);
}

async function main() {
	const hello = await fetchUrl("../api/hello")
	document.getElementById("copy-button").disabled = true
	if(hello.success) {

		// configure what things show up
		if (hello.data.discord) {
			document.getElementById("discord-login").style.display = "block"
		}

		if (hello.data.username) {
			document.getElementById("login-form").style.display = "flex"
		}
	}

	const status = await fetchUrl("../api/status")
	if (status.success) {
		document.getElementById("account-section").style.display = "block"
		document.getElementById("sign-in-btns").style.display = "none"
		document.getElementById("login-form").style.display = "none"
		document.getElementById("sign-out-btns").style.display = "block"
	}

	if (status.data) {
		// user is signed in
		// fetch styles
		await fetchStyles()

		// console.log(styles)
	}
}

main()

//* Coloris setup
document.querySelectorAll('.coloris-text').forEach(input => {
	input.addEventListener('click', e => {
		Coloris({
			alpha: false,
			// defaultColor: "#000000",
		});
	});
});

document.querySelectorAll('.coloris-background').forEach(input => {
	input.addEventListener('click', e => {
		Coloris({
			alpha: false,
			// defaultColor: "#f6f6f6",
		});
	});
});

//* Handling form
document.getElementById("color-form").addEventListener("submit", async input => {
	// store new stored colours
	input.preventDefault()

	const textColor = document.getElementById("color").value
	const backgroundColor = document.getElementById("bg-color").value
	const selectedFont = document.getElementById("font-selector").value

	const updateStyle = await postUrl("/api/style", {
		color: textColor,
		backgroundColor: backgroundColor,
		font: selectedFont
	})
	if (updateStyle.success) {
		await fetchStyles()
	}
})

document.getElementById("color-form").addEventListener("reset", async input => {
	// reset the color input
	input.preventDefault()
	const updateStyle = await postUrl("/api/style", {
		color: "#000000",
		backgroundColor: "#f6f6f6",
		font: "Atkinson Hyperlegible Next"
	})
	if (updateStyle.success) {
		await fetchStyles()
	}
})

//* Handling of extension API key 
document.getElementById("regenerate").addEventListener("click", async input  => {
	// regenerated the extension api key 
	input.preventDefault()
	const generateSecret = await postUrl("/api/token/create", {})
	if (generateSecret.success) {
		document.getElementById("secret").textContent = generateSecret.data.token
		document.getElementById("secret").style.fontStyle = "normal"
		document.getElementById("copy-button").disabled = false
	}
})

document.getElementById("copy-button").addEventListener("click", () => {
	const text = document.getElementById("secret").textContent
	try {
		navigator.clipboard.writeText(text)

		document.getElementById("copy-button").textContent = "done"
		// rest to regular text after 2.5s
		setTimeout(() => {
			document.getElementById("copy-button").textContent = "copy"
		}, 2500);
	} catch(e) {
		// for some reason, can't copy
		alert("Could not copy key to your clipboard!")
		console.error(e)
	}
})

//* Handle sign in/up form
document.getElementById("login-form").addEventListener("submit", async input => {
	input.preventDefault()

	const submitter = event.submitter;
	const action = submitter?.value;
	// signin or signup?

	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	
	const messageDiv = document.getElementById("message")

	if(!username || !password) {
		messageDiv.textContent("Username and password are required")
		return
	}
	const usernameRegex = /[^A-z0-9_-]/
	if (action === "signup" && usernameRegex.test(username)) {
		// contains unwanted characters
		messageDiv.textContent = "Username can only contain letters A-Z, numbers, _ and -."
		return
	}

	const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,}$/

	if (action === "signup" && !passwordRegex.test(password)) {
		// password is not in strict requirements
		messageDiv.textContent = "Password must be at least 8 characters long and must contain one uppercase letter, one lowercase letter, one number and one special character."
		return
	} 

	// send data over

	const authenticator = await postUrl("./account/"+action, {
		username: username,
		password: password
	})

	if(!authenticator.success) {
		messageDiv.textContent = authenticator.message
		return
	} else {
		window.location.reload();
	}
})

// document.getElementById("secret").textContent = '•'.repeat(32)
