import { setContent } from "@app/stores/fileSelectedStore"
import { getFolderContent } from "@app/stores/server"

const path = window.location.pathname
// const params = new URLSearchParams(window.location.search)

async function loadContentFromPath() {
    const content = await getFolderContent(path)
    console.log("content", content)
    setContent(content)
}

loadContentFromPath()
console.log(path)