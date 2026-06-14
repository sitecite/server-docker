# sitecite (docker)

Welcome to sitecite! If you wish to merely check it out, use [the website](https://sitecite.dantenl.com). It's currently available for Firefox, [download it from the Mozilla store!](https://addons.mozilla.org/en-GB/firefox/addon/sitecite/)

This repo is mainly intended for if you wish to self host AND run it with Docker. A bare-metal install version is available [here](https://github.com/sitecite/server)

**Need help?** You can join the [Discord server](https://discord.gg/rPBE2B7dng) or create an issue on the Github page.

# Features

![Image showing the Firefox browser with the homepage page of sitecite at sitecite.dantenl.com](https://sitecite.dantenl.com/screenshots/firefox_sitecite_website.png)

sitecite allows you to share (and customise!) quotations from websites. For example, if you're having a conversation on Discord and need to reference something from Wikipedia, you can use sitecite for this! Simply highlight the text, press the keybind on the extension or right click and click "Quote selected text" and you'll get a handy-dandy link that you can share with your friends that shows your selected text through an image and links directly to your Wikipedia page!

## Requirements

You need to have the following ready to go on your system:

* Docker Engine (20+ recommended)
* Docker Compose V2 (```docker compose``` command)
* cURL (Pre-installed on most macOS/Linux systems)

> On Windows and Mac, you can install Docker Desktop, which includes Docker and Docker Compose.

# Docker Installation Instructions



### Step 1) 
Make an empty folder somewhere on your system where you would like to install sitecite.

```bash
mkdir sitecite
cd sitecite
```

### Step 2) 
Download all the required files using cURL:

```bash
curl -O https://raw.githubusercontent.com/sitecite/server-docker/main/.env \
     -O https://raw.githubusercontent.com/sitecite/server-docker/main/config.yaml \
     -O https://raw.githubusercontent.com/sitecite/server-docker/main/whitelist.js \
     -O https://raw.githubusercontent.com/sitecite/server-docker/main/docker-compose.yml
```

### Step 3) 
Open the `docker-compose.yml` file and configure your MySQL credentials. 

> ⚠️ **IMPORTANT:** The database credentials must match in BOTH services!

The web-app container connects to the db container using these values. If you change them in one place, you must update them in both services, or the application will not be able to connect to the database.

You do not need to change the `MYSQL_USER` or `MYSQL_DATABASE`, but you can if you like. While you can use the default credentials, we strongly recommend changing the password for security. If you just want to test sitecite, you can skip this step.

#### Example for web-app container:
```yaml
MYSQL_HOST=db
MYSQL_USER=sitecite
MYSQL_PASSWORD=fkP7pZ2hD1cA5wpdzx6HI75Fli7yu9f0XQ85SLT1
MYSQL_DATABASE=sitecite
```

#### Example for db container:
```yaml
MYSQL_ROOT_PASSWORD: "fkP7pZ2hD1cA5wpdzx6HI75Fli7yu9f0XQ85SLT1"
MYSQL_DATABASE: "sitecite"
MYSQL_USER: "sitecite"
MYSQL_PASSWORD: "fkP7pZ2hD1cA5wpdzx6HI75Fli7yu9f0XQ85SLT1"
```

### Step 4)

After that, you should check out `config.yaml`. This file has one important key: the host. This is wherever sitecite will be located publicly. This should be the full URL (including https://) and it should not end with a slash (`/`).



### Step 5) 
While in the same directory as your `docker-compose.yml` file, start the container with the command:

```bash
docker compose up -d
```

Give Docker 30 seconds to start everything up, then you should be able to access it on `http://localhost:9404`. (replace `9404` if you chose a different port of course.) To try it out, open it on your browser or you can try sending a GET request with something like cURL.

```
curl -H "Content-type: application/json" 'http://localhost:9404/api/hello'
```

This should give you something like this in return:

```json
{
    "success":true,
    "message":"hii! :3",
    "data": {
        "google":false,
        "discord":true,
        "username":true
    }
}
```

If you got something that looks like a JSON, then all is well! :D

After which, you'll need to get your website running on the chosen port.
