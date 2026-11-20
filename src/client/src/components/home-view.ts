import { LitElement, css, html, nothing } from "lit"
import { customElement, state } from "lit/decorators.js"
import { getListing, getRecent } from "../services/api"
import { baseName } from "../services/format"
import type { Entry } from "../services/types"
import "./entry-list"

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
            font-size: var(--wa-font-size-l);
            margin: 0 0 var(--wa-space-s);
        }
    `

    @state() private roots: Entry[] = []
    @state() private recent: Entry[] = []

    async connectedCallback() {
        super.connectedCallback()
        document.title = "Home"
        const [roots, recent] = await Promise.all([getListing("/"), getRecent(10)])
        this.roots = roots.entries
        this.recent = recent.map(p => ({
            type: "file",
            name: baseName(p.path),
            path: p.path,
            size: 0,
            progress: p,
        }))
    }

    render() {
        return html`
            ${this.recent.length
                ? html`<section>
                      <h2>Continue</h2>
                      <entry-list show-folder .entries=${this.recent}></entry-list>
                  </section>`
                : nothing}
            <section>
                <h2>Libraries</h2>
                <entry-list .entries=${this.roots}></entry-list>
            </section>
        `
    }
}
