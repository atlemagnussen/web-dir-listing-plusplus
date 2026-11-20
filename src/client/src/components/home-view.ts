import { LitElement, css, html, nothing } from "lit"
import { customElement, state } from "lit/decorators.js"
import { getListing, getTracker, progressChanged } from "../services/api"
import { hrefFor, linkClick } from "../services/router"
import type { Entry, TrackedItem } from "../services/types"
import "./entry-list"
import "./tracked-card"

const CONTINUE_COUNT = 4

/** Libraries + "continue where you left off". */
@customElement("home-view")
export class HomeView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-xl);
        }
        h2 {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            font-size: var(--wa-font-size-l);
            margin: 0 0 var(--wa-space-s);
        }
        h2 a {
            font-size: var(--wa-font-size-s);
            font-weight: normal;
        }
        .list {
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-s);
        }
    `

    @state() private roots: Entry[] = []
    @state() private inProgress: TrackedItem[] = []
    private unsubscribe?: () => void

    connectedCallback() {
        super.connectedCallback()
        document.title = "Home"
        getListing("/").then(l => (this.roots = l.entries))
        this.unsubscribe = progressChanged.subscribe(async () => {
            this.inProgress = (await getTracker()).inProgress
        })
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.unsubscribe?.()
    }

    render() {
        return html`
            ${this.inProgress.length
                ? html`<section>
                      <h2>
                          Continue
                          <a href=${hrefFor("/tracker")} @click=${linkClick}>All my books</a>
                      </h2>
                      <div class="list">
                          ${this.inProgress.slice(0, CONTINUE_COUNT).map(i => html`<tracked-card .item=${i}></tracked-card>`)}
                      </div>
                  </section>`
                : nothing}
            <section>
                <h2>Libraries</h2>
                <entry-list .entries=${this.roots}></entry-list>
            </section>
        `
    }
}
