> [!NOTE]  
> Are you running into any bugs? Do you have a suggestion? The [Discord server](https://sitecite.dantenl.com/r/discord) is the place!

# [v1.6.1](https://github.com/sitecite/server/pull/11) [2026-06-29]

* Improved installation instructions
* Added coloris.js and Arc to the credits

# [v1.6.0](https://github.com/sitecite/server/pull/10) [2026-06-27]

* Optimised code further
    - Authentications are now done via middleware instead of per endpoint on `/api/`
    - Combined various MySQL statemtns into one
    - Removed some lines from the CSS file
* Added a [credits page](https://sitecite.dantenl.com/credits)
* Instead of hard-coding some URLs, they are now managed via a single redirector. For example, a redirect to the Discord server would now be located at https://sitecite.dantenl.com/r/discord, instead of directly linking to the Discord server
* Improved logging to prevent leaking some private information
* The github repo now includes the `package-lock.json` file.
* The reset button is now always visible

## Bugs fixed

* Prevented race conditions for generating images
* Fixed an issue where long strings (for example with code) would be overflowing in both image generation and the overview of linked files
* Fixed an issue where the whitelist was broken for username accounts due to the switch to the `config.yaml` file
* Moved the MySQL pool out of the `server.js` file to prevent issues
* Removed `node` from the `package.json` file.

# [v.1.5.0](https://github.com/sitecite/server/pull/9) [2026-06-23]

* Added character escaping to the redirection page
* Added the user's background as a theme colour; meaning shared URLs will become even fancier when it is shared!
* Instead of `.env` and `config.yaml`, there are now `.env.example` and `example.config.yaml` files. Mainly to make local development easier.

# [v1.4.0](https://github.com/sitecite/server/pull/7) [2026-06-20]

* Added better logging
* Added some better code clarity

Most files have been updated this time, please let me know if you discover any bugs!

# [v1.3.2](https://github.com/sitecite/server/pull/6) [2026-06-18]

* Updated the privacy policy
    * added a clear disclaimer that this policy does not apply to self‑hosted or third‑party instances
    * added “Who we are” section identifying the data controller
    * added further clarity on the data we store, including extension behaviour
    * added cookies section (HTTPS‑signed session cookies, one‑hour maximum)
    * added further clarity regarding the use of third‑party sign‑ins (Google and Discord), with specific Google API data usage details
    * added service providers section (Cloudflare)
    * added legal basis for processing
    * added data retention details
    * added your rights (access, erasure, portability, etc.)
    * added data security statement
    * added international transfers section (UK hosting)
    * added children’s privacy statement
    * added how we will notify you of changes to this policy
    * fixed typographical issues and improved readability throughout

# [v1.3.1](https://github.com/sitecite/server/pull/5) [2026-06-16]

* Added links to the [Chrome extension](https://chromewebstore.google.com/detail/sitecite/nhadodoajmnpakkgidheifkfibphlghm)
* Depcrecated endpoint `/api/test` in favour of `/api/hello`. The `/api/test` endpoint will continue to work though, for the time being. The reason for deprecation is that both of these endpoints are so similar. It's easier to manage if they would be unified.

## Bugs fixed

* Fixed an issue where long URLs in the recently shortened URL section would make the grid wonky, by truncating long URLs
* If you had generated a number of links that is divisible by 10, the "Load more" button would show up even if there were no links to be generated.

# [v1.3.0](https://github.com/sitecite/server/pull/4) [2026-06-14]

* sitecite now gives a fancier error message when linked to an invalid code
* It is now possible to view shortened links, and to remove them as well or copy them again
* Added larger download buttons
* The 404 page now also shows when a link is invalid or it no longer exists
* Updated the stylesheet; Atkinson Hyperlegible Next is now the default font instead of a default sans-serif system font
* Updated package.json to v1.3.0
* Added support for Sign in with Google
* On the homepage, users can run `resetStyles()` to temporarily change the background and text colour to something readable
* The user ID and instance are outputted to the console, allowing users to get help more easily

# [v1.2.0](https://github.com/sitecite/server/pull/2) [2026-06-06]

* Added support for creating images with just text
* Added CORS policies for `/api/image` endpoint
* Updated package.json to v1.2.0

# [v1.1.0](https://github.com/sitecite/server/pull/1) [2026-06-04]

*I didn't originally create release notes; these have been created afterwards*

* Updated the README.md file to include clearer instructions
* Added extra information to the /public/index.html file, about what the project is and the ability to download it on the Mozilla add-on store
* Removed references to images on the 404 page for OpenGraph
* Added Impact as a font face
* Added the `config.yaml` file
* Added terms of service and privacy policy


## Bugs fixed

* The "Copy" button for the API key secret would be shown as enabled, even when "(hidden for security reasons)" was shown
