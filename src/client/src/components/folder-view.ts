import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { NotFoundError, getListing, progressChanged } from "../services/api"
import { isAudio } from "../services/format"
import { play } from "../services/player"
import { hrefFor, linkClick } from "../services/router"
import type { Listing } from "../services/types"
import "./entry-list"
import "./tracked-card"

@customElement("folder-view")
export class FolderView extends LitElement {
    static styles = css`
        :host {
            display: block;
        }
        h1 {
            font-size: var(--wa-font-size-xl);
            margin: var(--wa-space-s) 0 var(--wa-space-m);
            overflow-wrap: anywhere;
        }
        .empty,
        .error {
            color: var(--wa-color-text-quiet);
        }
        wa-breadcrumb-item::part(label) {
            overflow-wrap: anywhere;
        }
        tracked-card,
        .play-all {
            margin-bottom: var(--wa-space-m);
        }
    `

    @property() path = "/"
    @state() private listing?: Listing
    @state() private error?: string
    @state() private loading = false

    private unsubscribe?: () => void

    willUpdate(changed: Map<string, unknown>) {
        if (changed.has("path")) this.load()
    }

    connectedCallback() {
        super.connectedCallback()
        // Refresh progress shown in the list when a track finishes or a book is marked etc.
        let first = true
        this.unsubscribe = progressChanged.subscribe(() => {
            if (!first) this.load(true)
            first = false
        })
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.unsubscribe?.()
    }

    private async load(quiet = false) {
        const path = this.path
        this.loading = !quiet
        this.error = undefined
        try {
            const listing = await getListing(path)
            if (path !== this.path) return // navigated away meanwhile
            this.listing = listing
            document.title = listing.title
        } catch (err) {
            this.listing = undefined
            this.error = err instanceof NotFoundError ? "Folder not found" : String(err)
        } finally {
            this.loading = false
        }
    }

    render() {
        const segments = this.path.split("/").filter(Boolean)
        return html`
            <wa-breadcrumb>
                <wa-breadcrumb-item href="/" @click=${linkClick}>
                    <wa-icon name="house" label="Home"></wa-icon>
                </wa-breadcrumb-item>
                ${segments.slice(0, -1).map((s, i) => {
                    const p = "/" + segments.slice(0, i + 1).join("/")
                    return html`<wa-breadcrumb-item href=${hrefFor(p)} @click=${linkClick}>${s}</wa-breadcrumb-item>`
                })}
            </wa-breadcrumb>
            <h1>${segments.at(-1) ?? ""}</h1>
            ${this.renderBody()}
        `
    }

    private renderBody() {
        if (this.error) return html`<p class="error">${this.error}</p>`
        if (!this.listing) return this.loading ? html`<wa-spinner></wa-spinner>` : null
        if (this.listing.entries.length === 0) return html`<p class="empty">This folder is empty.</p>`
        const entries = this.listing.entries
        const audio = entries.filter(isAudio)
        return html`
            ${this.listing.tracked
                ? html`<tracked-card .item=${this.listing.tracked}></tracked-card>`
                : audio.length > 1
                  ? html`<wa-button class="play-all" variant="brand" @click=${() => play(audio[0], entries)}>
                        <wa-icon slot="start" name="play"></wa-icon>
                        Play from the beginning
                    </wa-button>`
                  : null}
            <entry-list .entries=${entries}></entry-list>`
    }
}
