import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { downloadUrl, resetProgress, setFinished, zipUrl } from "../services/api"
import { isEpub, openEntry } from "../services/actions"
import { formatDuration, formatSize, isAudio, parentPath } from "../services/format"
import { player } from "../services/player"
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
        const isLink = e.type !== "file" || isEpub(e.path)
        const main = html`
            <wa-icon name=${current && this.playerState.value.playing ? "volume-high" : iconFor(e)}></wa-icon>
            <div class="text">
                <div class="name">${e.name}</div>
                ${this.renderMeta(e, current)}
            </div>`

        return html`
            <li class=${current ? "current" : ""}>
                ${isLink
                    ? html`<a class="main" href=${hrefFor(e.path)} @click=${linkClick}>${main}</a>`
                    : html`<button class="main" @click=${() => this.open(e)}>${main}</button>`}
                ${e.type === "folder"
                    ? html`<wa-button appearance="plain" size="s" href=${zipUrl(e.path)} download
                            title="Download folder as zip">
                            <wa-icon name="file-zipper" label="Download zip"></wa-icon>
                        </wa-button>`
                    : nothing}
                ${e.type === "file" && e.progress
                    ? html`<wa-dropdown @wa-select=${(ev: CustomEvent<{ item: { value: string } }>) => this.onAction(e, ev)}>
                            <wa-button slot="trigger" appearance="plain" size="s" title="Progress">
                                <wa-icon name="ellipsis-vertical" label="Progress actions"></wa-icon>
                            </wa-button>
                            ${e.progress.finished
                                ? html`<wa-dropdown-item value="unfinish">Mark as not finished</wa-dropdown-item>`
                                : html`<wa-dropdown-item value="finish">Mark as finished</wa-dropdown-item>`}
                            <wa-dropdown-item value="reset">Reset progress</wa-dropdown-item>
                        </wa-dropdown>`
                    : nothing}
                ${e.type === "file"
                    ? html`<wa-button appearance="plain" size="s" href=${downloadUrl(e.path)} download
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

        if (e.tracked) {
            const t = e.tracked
            parts.push(t.finished
                ? html`<span class="finished"><wa-icon name="check"></wa-icon> Finished</span>`
                : html`<wa-progress-bar value=${t.fraction * 100}></wa-progress-bar>
                      <span>${Math.round(t.fraction * 100)}% · ${t.finishedFiles}/${t.files}</span>`)
        }

        const state = this.playerState.value
        const p = e.progress
        if (current && state.duration > 0) {
            parts.push(html`
                <wa-progress-bar value=${(state.position / state.duration) * 100}></wa-progress-bar>
                <span>${formatDuration(state.position)} / ${formatDuration(state.duration)}</span>`)
        } else if (p?.finished) {
            parts.push(html`<span class="finished"><wa-icon name="check"></wa-icon> Finished</span>`)
        } else if (p && p.fraction != null) {
            parts.push(html`
                <wa-progress-bar value=${p.fraction * 100}></wa-progress-bar>
                <span>${p.position !== undefined ? formatDuration(p.position) : `${Math.round(p.fraction * 100)}%`}</span>`)
        }
        return parts.length ? html`<div class="meta">${parts}</div>` : nothing
    }

    private open(e: Entry) {
        // Mixed-folder lists (search) don't hold the siblings: openEntry loads the folder.
        openEntry(e, this.showFolder ? undefined : this.entries)
    }

    private async onAction(e: Entry, ev: CustomEvent<{ item: { value: string } }>) {
        const action = ev.detail.item.value
        if (action === "finish") await setFinished(e.path, true)
        else if (action === "unfinish") await setFinished(e.path, false)
        else if (action === "reset") await resetProgress(e.path)
    }
}
