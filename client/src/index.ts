import "./appShell.js"
import "./design/waLoader.js"

import oidcService from "./services/authentication.js"
oidcService.initialize()

import { authUser } from "./stores/user.js"

import { AppShell } from "./appShell.js"

authUser.subscribe(user => {
    if (user.userName) {
        console.log(`Logged in: ${user.userName}`)
    }
})

function removeLoadingScreen() {
    const loadingScreen = document.querySelector("section#loading-screen") as HTMLDivElement
    loadingScreen.style.display = "none"

    const logoSvg = document.querySelector("figure#logo-loading") as HTMLDivElement
    logoSvg.id = "logo-nav"
    logoSvg.slot = "logo"

    const appShell = new AppShell()

    document.body.removeChild(loadingScreen)
    document.body.appendChild(appShell)
    appShell.appendChild(logoSvg)
}

async function bootstrap() {
    
    await sleep(500)
    if (!document.startViewTransition)
        removeLoadingScreen()
    else
        document.startViewTransition(() => removeLoadingScreen())
}

function sleep(time = 100) {
    return new Promise((resolve) => {
        setTimeout(() => resolve("hello"), time)
    })
}

bootstrap()