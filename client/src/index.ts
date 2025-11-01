import "./appShell.js"
import "./design/waLoader.js"
import "./components"
import { AppShell } from "./appShell.js"
import { setContent } from "./stores/fileStore.js"

import oidcService from "./services/authentication.js"
oidcService.initialize()

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
    
    setContent({
        title: "Ello",
        entries: [
        {
            name: "Test",
            type: "root",
            ext: "",
            mimeType: "",
            size: 0,
            path: "test"
        },
        {
            name: "Folder",
            type: "folder",
            ext: "",
            mimeType: "",
            size: 0,
            path: "folder"
        },
        {
            name: "File",
            type: "file",
            ext: "mp3",
            mimeType: "audio",
            size: 1000,
            path: "file.mp3"
        }
        ]
    })

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