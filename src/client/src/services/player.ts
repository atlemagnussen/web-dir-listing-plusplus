import { fileUrl, getProgress, saveProgress } from "./api"
import { baseName, isAudio, parentPath, stripExt } from "./format"
import { Store } from "./store"
import type { Entry } from "./types"

/**
 * Audio playback, independent of which folder is being browsed.
 * Position is stored on the server per user (see ProgressStore.cs), so it follows you between devices.
 */

export interface PlayerState {
    entry?: Entry
    /** Audio files in the folder the current entry was started from. Used for next/previous. */
    queue: Entry[]
    playing: boolean
    position: number
    duration: number
    rate: number
    autoplayNext: boolean
}

const SAVE_INTERVAL_MS = 15_000
const SKIP_BACK = 15
const SKIP_FORWARD = 30
export const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]

const audio = new Audio()
audio.preload = "metadata"

export const player = new Store<PlayerState>({
    queue: [],
    playing: false,
    position: 0,
    duration: 0,
    rate: readNumber("wdl.rate", 1),
    autoplayNext: localStorage.getItem("wdl.autoplayNext") !== "false",
})

function patch(p: Partial<PlayerState>) {
    player.set({ ...player.value, ...p })
}

let lastSaved = 0
let pendingSeek: number | undefined

export async function play(entry: Entry, queue: Entry[] = []) {
    const current = player.value.entry
    if (current?.path === entry.path) {
        togglePlay()
        return
    }
    if (current)
        await save()

    patch({
        entry,
        queue: queue.filter(isAudio),
        position: 0,
        duration: 0,
    })

    // Resume from the server-side position unless the file was finished.
    let progress = entry.progress
    if (!progress) {
        try {
            progress = await getProgress(entry.path)
        } catch {
            progress = undefined
        }
    }
    pendingSeek = progress && !progress.finished ? progress.position : undefined

    audio.src = fileUrl(entry.path)
    audio.playbackRate = player.value.rate
    updateMediaSession(entry)
    try {
        await audio.play()
    } catch (err) {
        console.warn("play() was blocked", err)
    }
}

export function togglePlay() {
    if (!player.value.entry) return
    if (audio.paused) audio.play()
    else audio.pause()
}

export function seek(seconds: number) {
    if (!player.value.entry) return
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds))
}

export const skipBack = () => seek(audio.currentTime - SKIP_BACK)
export const skipForward = () => seek(audio.currentTime + SKIP_FORWARD)

export function setRate(rate: number) {
    audio.playbackRate = rate
    localStorage.setItem("wdl.rate", String(rate))
    patch({ rate })
}

export function setAutoplayNext(on: boolean) {
    localStorage.setItem("wdl.autoplayNext", String(on))
    patch({ autoplayNext: on })
}

function neighbour(offset: number) {
    const { entry, queue } = player.value
    if (!entry) return undefined
    const i = queue.findIndex(e => e.path === entry.path)
    return i < 0 ? undefined : queue[i + offset]
}

export function next() {
    const n = neighbour(1)
    if (n) play({ ...n, progress: undefined }, player.value.queue)
}

export function previous() {
    // Like most players: restart the track unless we're at its very beginning.
    if (audio.currentTime > 5) {
        seek(0)
        return
    }
    const p = neighbour(-1)
    if (p) play({ ...p, progress: undefined }, player.value.queue)
}

export const hasNext = () => !!neighbour(1)
export const hasPrevious = () => !!neighbour(-1)

async function save(finished = false, keepalive = false) {
    const entry = player.value.entry
    if (!entry || !isFinite(audio.duration)) return
    lastSaved = Date.now()
    try {
        await saveProgress({
            path: entry.path,
            position: finished ? audio.duration : audio.currentTime,
            duration: audio.duration,
            finished,
        }, keepalive)
    } catch (err) {
        console.warn("Could not save progress", err)
    }
}

audio.addEventListener("loadedmetadata", () => {
    if (pendingSeek && pendingSeek < audio.duration - 5)
        audio.currentTime = pendingSeek
    pendingSeek = undefined
    patch({ duration: audio.duration, position: audio.currentTime })
})

audio.addEventListener("timeupdate", () => {
    patch({ position: audio.currentTime })
    updatePositionState()
    if (!audio.paused && Date.now() - lastSaved > SAVE_INTERVAL_MS)
        save()
})

audio.addEventListener("play", () => patch({ playing: true }))
audio.addEventListener("pause", () => {
    patch({ playing: false })
    if (!audio.ended) save()
})
audio.addEventListener("seeked", () => save())
audio.addEventListener("ended", async () => {
    patch({ playing: false })
    await save(true)
    if (player.value.autoplayNext) next()
})

// Last chance to persist the position when the phone locks the tab or the page is closed.
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save(false, true)
})
window.addEventListener("pagehide", () => save(false, true))

// Lock screen / headset / car controls.
function updateMediaSession(entry: Entry) {
    if (!("mediaSession" in navigator)) return
    const folder = baseName(parentPath(entry.path))
    navigator.mediaSession.metadata = new MediaMetadata({
        title: stripExt(entry.name),
        album: folder,
        artwork: [{ src: "/logo.svg", type: "image/svg+xml", sizes: "any" }],
    })
}

function updatePositionState() {
    if (!("mediaSession" in navigator) || !isFinite(audio.duration)) return
    try {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            position: Math.min(audio.currentTime, audio.duration),
            playbackRate: audio.playbackRate,
        })
    } catch {
        // Some browsers throw on transient invalid states; ignore.
    }
}

if ("mediaSession" in navigator) {
    const ms = navigator.mediaSession
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ["play", () => audio.play()],
        ["pause", () => audio.pause()],
        ["seekbackward", d => seek(audio.currentTime - (d.seekOffset ?? SKIP_BACK))],
        ["seekforward", d => seek(audio.currentTime + (d.seekOffset ?? SKIP_FORWARD))],
        ["seekto", d => d.seekTime !== undefined && seek(d.seekTime)],
        ["previoustrack", () => previous()],
        ["nexttrack", () => next()],
    ]
    for (const [action, handler] of handlers) {
        try {
            ms.setActionHandler(action, handler)
        } catch {
            // Action not supported by this browser.
        }
    }
}

function readNumber(key: string, fallback: number) {
    const v = Number(localStorage.getItem(key))
    return isFinite(v) && v > 0 ? v : fallback
}
