import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { search } from "../services/api"
import type { Entry } from "../services/types"
import "./entry-list"

@customElement("search-view")
export class SearchView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-m);
        }
        p {
            color: var(--wa-color-text-quiet);
        }
    `

    @state() private results?: Entry[]
    @state() private loading = false
    private timer = 0
    private query = ""

    firstUpdated() {
        document.title = "Search"
        this.renderRoot.querySelector("wa-input")?.focus()
    }

    private onInput(e: Event) {
        this.query = (e.target as HTMLInputElement).value
        clearTimeout(this.timer)
        this.timer = window.setTimeout(() => this.run(), 300)
    }

    private async run() {
        const q = this.query.trim()
        if (q.length < 2) {
            this.results = undefined
            return
        }
        this.loading = true
        try {
            const results = await search(q)
            if (q === this.query.trim()) this.results = results
        } finally {
            this.loading = false
        }
    }

    render() {
        return html`
            <wa-input placeholder="Search all libraries" with-clear @input=${this.onInput}>
                <wa-icon slot="start" name="magnifying-glass"></wa-icon>
            </wa-input>
            ${this.loading ? html`<wa-spinner></wa-spinner>` : null}
            ${this.results?.length === 0 ? html`<p>No matches.</p>` : null}
            ${this.results?.length
                ? html`<entry-list show-folder .entries=${this.results}></entry-list>`
                : null}
        `
    }
}
