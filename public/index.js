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

		if (hello.data.google) {
			document.getElementById("google-login").style.display = "block"
		}

		if (hello.data.username) {
			document.getElementById("login-form").style.display = "flex"
		}
	}

	// check if user is signed in
	const status = await fetchUrl("../api/status")
	if (status.success) {
		// user is signed in
		document.getElementById("account-section").style.display = "block"
		document.getElementById("sign-in-btns").style.display = "none"
		document.getElementById("login-form").style.display = "none"
		document.getElementById("sign-out-btns").style.display = "block"
		
		// load styles user chose
		await fetchStyles()

		// load recently generated urls
		await loadUrls()
	}

	console.log("%cHey there!", "font-size: 2em")
	console.log(`If you're asked to share this for a support request, please share the following data:

User ID: ${status.data.id}
Instance: ${window.location.origin}

If you can't change the background and/or text colour, you can fill in resetStyles() and press enter!`
	)

}

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

var offset = 0
async function loadUrls() {
	// define the offset, if it hasn't already been defined
	// this is used for the "load more" button
	// fetch 10 most recent shortened links
	const recentUrls = await fetchUrl("/api/getlinks?offset="+offset)
	
	if(!recentUrls.success) {
		// something went wront
		alert("Could not fetch URLS.")
		console.error(recentUrls)
		return
	}

	if(recentUrls.data.links.length) {
		// if there are any urls, it means we can hide the default prompt
		document.getElementById("intro-item").style.display = "none"
	}

	// add urls to the document
	recentUrls.data.links.forEach(url => {
		const urlObj = new URL(url.link)
		const host = urlObj.host
		document.getElementById("link-grid").innerHTML += `
			<div class="item bordered">
                <div class="item-text">${url.text}</div>
                <div class="item-management">
                    <a href="/l/${url.code}" target="_blank" rel="noopener noreferrer">${host}</a>
                    <div>
                        <button class='_copyUrl bordered' data-code='${url.code}'>copy</button>
                        <button class='_deleteUrl bordered' data-code='${url.code}'>&times;</button>
                    </div>
                </div>
            </div>
		`
	});

	// add 10 to offset
	offset += 10

	if(recentUrls.data.total <= offset) {
		// if there are less than or exactly offset amount of links remaining,
		// then no extra links are there, meaning the disable button should be disabled
		document.getElementById("load-more-button").disabled = true
	}

	// add listener for the copy
	document.querySelectorAll("._copyUrl").forEach(copyButton => {
		copyButton.addEventListener("click", (event) => copyUrl(event))
	});

	// add listener for the removal
	document.querySelectorAll("._deleteUrl").forEach(deleteButton => {
		deleteButton.addEventListener("click", (event) => removeUrl(event))
	});

}

document.getElementById("load-more-button").addEventListener("click", loadUrls)

// handle copy url
function copyUrl(button) {
	// get code from the dataset
	const code = button.srcElement.dataset.code

	// craft the redirection url
	const currentUrl = new URL(window.location.href)
	const redirectUrl = currentUrl.origin + "/l/" + code
	// copy this to clipboard
	try {
		navigator.clipboard.writeText(redirectUrl)

		button.srcElement.textContent = "done"
		// rest to regular text after 2.5s
		setTimeout(() => {
			button.srcElement.textContent = "copy"
		}, 2500);
	} catch (e) {
		// for some reason, can't copy
		alert("Could not copy key to your clipboard!")
		console.error(e)
	}
}

// handle removing a url
async function removeUrl(button) {
	// get code from the dataset
	const code = button.srcElement.dataset.code

	// try and remove it
	const removeRequest = await postUrl("/api/removeurl", {
		code: code
	})

	if(!removeRequest.success) {
		// something went wrong
		alert("Error: "+removeRequest.message)
		return
	}

	// remove one from offset, so that nothing should get skipped
	offset -= 1

	button.srcElement.textContent = "done"
	// rest to regular text after 2.5s
	setTimeout(() => {
		// remove the entire item
		button.srcElement.closest(".item").remove()

	}, 2500);
}

/**
 * If you fucked up, you can temporary change the background and text colour to readable values.
 */ 
function resetStyles() {
	// reset styles for the silly people who fucked up and made background and text the same
	document.documentElement.style.setProperty('--background', "#fff");
	document.documentElement.style.setProperty('--color', "#000");
	console.log("✅ Background and text colour reset; please choose new values and click 'Save'. These changes are temporary.")
}


// main function
main()
