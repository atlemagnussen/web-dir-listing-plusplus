export function formatDuration(seconds?: number) {
    if (seconds === undefined || !isFinite(seconds)) return "--:--"
    const s = Math.max(0, Math.floor(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = String(s % 60).padStart(2, "0")
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

export function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    const units = ["KB", "MB", "GB", "TB"]
    let v = bytes / 1024
    let i = 0
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024
        i++
    }
    return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

export const baseName = (path: string) => path.split("/").filter(Boolean).pop() ?? ""

export const parentPath = (path: string) => {
    const parts = path.split("/").filter(Boolean)
    parts.pop()
    return "/" + parts.join("/")
}

export const stripExt = (name: string) => name.replace(/\.[^.]+$/, "")

export const isAudio = (e: { mimeType?: string }) => !!e.mimeType?.startsWith("audio/")
