import { getListing } from "./api"
import { isAudio, parentPath } from "./format"
import { play } from "./player"
import { navigate } from "./router"
import type { Entry, TrackedItem } from "./types"

export const isEpub = (path: string) => path.toLowerCase().endsWith(".epub")

/** Opens a file: audio plays with its folder as queue, EPUB opens the reader, anything else a new tab. */
export async function openEntry(entry: Entry, siblings?: Entry[]) {
    if (isEpub(entry.path)) {
        navigate(entry.path)
        return
    }
    if (!siblings || !entry.mimeType) {
        // Search/tracker results don't carry the folder: load it for the queue and fresh progress.
        const folder = await getListing(parentPath(entry.path))
        siblings = folder.entries
        entry = folder.entries.find(e => e.path === entry.path) ?? entry
    }
    if (isAudio(entry)) {
        play(entry, siblings)
        return
    }
    window.open(`/api/file/${entry.path.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`, "_blank")
}

/** "Continue" on a tracked book: resume the current chapter file, or open the reader. */
export async function continueItem(item: TrackedItem) {
    if (item.kind === "book") {
        navigate(item.path)
        return
    }
    const target = item.currentPath ?? item.path
    await openEntry({ type: "file", name: "", path: target, size: 0 })
}
