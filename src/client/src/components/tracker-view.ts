import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { getTracker, progressChanged } from "../services/api"
import type { Tracker } from "../services/types"
import "./tracked-card"

/** Everything started or finished, per book. */
@customElement("tracker-view")
export class TrackerView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-xl);
        }
        h1 {
            font-size: var(--wa-font-size-xl);
            margin: var(--wa-space-s) 0 0;
        }
        h2 {
            font-size: var(--wa-font-size-l);
            margin: 0 0 var(--wa-space-s);
        }
        .list {
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-s);
        }
        p {
            color: var(--wa-color-text-quiet);
        }
    `

    @state() private tracker?: Tracker
    private unsubscribe?: () => void

    connectedCallback() {
        super.connectedCallback()
        document.title = "My books"
        this.unsubscribe = progressChanged.subscribe(() => this.load())
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.unsubscribe?.()
    }

    private async load() {
        this.tracker = await getTracker()
    }

    render() {
        if (!this.tracker) return html`<wa-spinner></wa-spinner>`
        const { inProgress, finished } = this.tracker
        return html`
            <h1>My books</h1>
            <section>
                <h2>In progress</h2>
                ${inProgress.length
                    ? html`<div class="list">${inProgress.map(i => html`<tracked-card .item=${i}></tracked-card>`)}</div>`
                    : html`<p>Nothing in progress. Start an audiobook or open an EPUB.</p>`}
            </section>
            <section>
                <h2>Finished</h2>
                ${finished.length
                    ? html`<div class="list">${finished.map(i => html`<tracked-card .item=${i}></tracked-card>`)}</div>`
                    : html`<p>Nothing finished yet.</p>`}
            </section>
        `
    }
}
