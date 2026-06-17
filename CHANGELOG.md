# [v1.3.1](https://github.com/sitecite/server/pull/5) [2026-6-16]

* Added links to the [Chrome extension](https://chromewebstore.google.com/detail/sitecite/nhadodoajmnpakkgidheifkfibphlghm)
* Depcrecated endpoint `/api/test` in favour of `/api/hello`. The `/api/test` endpoint will continue to work though, for the time being. The reason for deprecation is that both of these endpoints are so similar. It's easier to manage if they would be unified.

## Bugs fixed

* Fixed an issue where long URLs in the recently shortened URL section would make the grid wonky, by truncating long URLs
* If you had generated a number of links that is divisible by 10, the "Load more" button would show up even if there were no links to be generated.

# [v1.3.0](https://github.com/sitecite/server/pull/4) [2026-6-14]

* sitecite now gives a fancier error message when linked to an invalid code
* It is now possible to view shortened links, and to remove them as well or copy them again
* Added larger download buttons
* The 404 page now also shows when a link is invalid or it no longer exists
* Updated the stylesheet; Atkinson Hyperlegible Next is now the default font instead of a default sans-serif system font
* Updated package.json to v1.3.0
* Added support for Sign in with Google
* On the homepage, users can run `resetStyles()` to temporarily change the background and text colour to something readable
* The user ID and instance are outputted to the console, allowing users to get help more easily

# [v1.2.0](https://github.com/sitecite/server/pull/2) [2026-6-6]

* Added support for creating images with just text
* Added CORS policies for `/api/image` endpoint
* Updated package.json to v1.2.0

# [v1.1.0](https://github.com/sitecite/server/pull/1) [2026-5-4]

*I didn't originally create release notes; these have been created afterwards*

* Updated the README.md file to include clearer instructions
* Added extra information to the /public/index.html file, about what the project is and the ability to download it on the Mozilla add-on store
* Removed references to images on the 404 page for OpenGraph
* Added Impact as a font face
* Added the `config.yaml` file
* Added terms of service and privacy policy


## Bugs fixed

* The "Copy" button for the API key secret would be shown as enabled, even when "(hidden for security reasons)" was shown
