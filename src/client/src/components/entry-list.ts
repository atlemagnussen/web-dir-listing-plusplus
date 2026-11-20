import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { downloadUrl, fileUrl, getListing, zipUrl } from "../services/api"
import { formatDuration, formatSize, isAudio, parentPath } from "../services/format"
import { player, play } from "../services/player"
import { hrefFor, linkClick } from "../services/router"
import { StoreController } from "../services/store"
import type { Entry } from "../services/types"

const ICONS: Record<string, string> = {
    epub: "book",
    pdf: "file-pdf",
    zip: "file-zipper",
    jpg: "file-image",
    jpeg: "file-image",
    png: "file-image",
    webp: "file-image",
    txt: "file-lines",
}

function iconFor(e: Entry) {
    if (e.type === "root") return "hard-drive"
    if (e.type === "folder") return "folder"
    if (isAudio(e)) return "file-audio"
    if (e.mimeType?.startsWith("video/")) return "file-video"
    return ICONS[e.ext ?? ""] ?? "file"
}

/** List of folders and files. Clicking an audio file plays it with the other audio files as queue. */
@customElement("entry-list")
export class EntryList extends LitElement {
    static styles = css`
        :host {
            display: block;
        }
        ul {
            list-style: none;
            margin: 0;
            padding: 0;
            border: 1px solid var(--wa-color-surface-border);
            border-radius: var(--wa-border-radius-m);
            overflow: hidden;
        }
        li {
            display: flex;
            align-items: center;
            gap: var(--wa-space-s);
            padding: var(--wa-space-xs) var(--wa-space-s);
            min-height: 3.25rem;
        }
        li + li {
            border-top: 1px solid var(--wa-color-surface-border);
        }
        li.current {
            background: var(--wa-color-brand-fill-quiet);
        }
        .main {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: var(--wa-space-s);
            color: inherit;
            text-decoration: none;
            cursor: pointer;
            padding: var(--wa-space-2xs) 0;
            background: none;
            border: none;
            font: inherit;
            text-align: left;
        }
        .main > wa-icon {
            flex: none;
            font-size: 1.25rem;
            color: var(--wa-color-brand-on-quiet);
            width: 1.5rem;
        }
        .text {
            min-width: 0;
            flex: 1;
        }
        .name {
            overflow-wrap: anywhere;
        }
        .meta {
            display: flex;
            align-items: center;
            gap: var(--wa-space-s);
            font-size: var(--wa-font-size-xs);
            color: var(--wa-color-text-quiet);
        }
        .meta wa-progress-bar {
            --track-height: 4px;
            width: 5rem;
        }
        .finished {
            color: var(--wa-color-success-on-quiet);
        }
        wa-button::part(base) {
            padding-inline: var(--wa-space-xs);
        }
    `

    @property({ attribute: false }) entries: Entry[] = []
    /** Show the parent folder under each name (search results, recent). */
    @property({ type: Boolean, attribute: "show-folder" }) showFolder = false

    private playerState = new StoreController(this, player)

    render() {
        return html`<ul>${this.entries.map(e => this.renderEntry(e))}</ul>`
    }

    private renderEntry(e: Entry) {
        const current = this.playerState.value.entry?.path === e.path
        const isDir = e.type !== "file"
        const main = html`
            <wa-icon name=${current && this.playerState.value.playing ? "volume-high" : iconFor(e)}></wa-icon>
            <div class="text">
                <div class="name">${e.name}</div>
                ${this.renderMeta(e, current)}
            </div>`

        return html`
            <li class=${current ? "current" : ""}>
                ${isDir
                    ? html`<a class="main" href=${hrefFor(e.path)} @click=${linkClick}>${main}</a>`
                    : html`<button class="main" @click=${() => this.open(e)}>${main}</button>`}
                ${e.type === "folder"
                    ? html`<wa-button appearance="plain" size="small" href=${zipUrl(e.path)} download
                            title="Download folder as zip">
                            <wa-icon name="file-zipper" label="Download zip"></wa-icon>
                        </wa-button>`
                    : nothing}
                ${e.type === "file"
                    ? html`<wa-button appearance="plain" size="small" href=${downloadUrl(e.path)} download
                            title="Download">
                            <wa-icon name="download" label="Download"></wa-icon>
                        </wa-button>`
                    : nothing}
            </li>`
    }

    private renderMeta(e: Entry, current: boolean) {
        const parts = []
        if (this.showFolder)
            parts.push(html`<span>${parentPath(e.path)}</span>`)
        if (e.type === "file")
            parts.push(html`<span>${formatSize(e.size)}</span>`)

        const state = this.playerState.value
        const p = e.progress
        if (current && state.duration > 0) {
            parts.push(html`
                <wa-progress-bar value=${(state.position / state.duration) * 100}></wa-progress-bar>
                <span>${formatDuration(state.position)} / ${formatDuration(state.duration)}</span>`)
        } else if (p?.finished) {
            parts.push(html`<span class="finished"><wa-icon name="check"></wa-icon> Finished</span>`)
        } else if (p && p.fraction !== undefined) {
            parts.push(html`
                <wa-progress-bar value=${p.fraction * 100}></wa-progress-bar>
                <span>${p.position !== undefined ? formatDuration(p.position) : `${Math.round(p.fraction * 100)}%`}</span>`)
        }
        return parts.length ? html`<div class="meta">${parts}</div>` : nothing
    }

    private async open(e: Entry) {
        if (isAudio(e) || (this.showFolder && !e.mimeType)) {
            await this.playWithFolderQueue(e)
            return
        }
        // TODO: in-app EPUB reader. Until then: let the browser handle it.
        window.open(fileUrl(e.path), "_blank")
    }

    /**
     * Mixed-folder lists (search, recent) don't hold the siblings, so load the parent
     * folder to get the queue for next/previous and a fresh progress value.
     */
    private async playWithFolderQueue(e: Entry) {
        if (!this.showFolder) {
            play(e, this.entries)
            return
        }
        const folder = await getListing(parentPath(e.path))
        const fresh = folder.entries.find(f => f.path === e.path)
        if (fresh && isAudio(fresh))
            play(fresh, folder.entries)
        else
            window.open(fileUrl(e.path), "_blank")
    }
}
