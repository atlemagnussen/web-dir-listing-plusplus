import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import type { ConfigFolder } from "@common/types"
import { content } from "@app/stores/filesStore"
import oidc from "@app/services/authentication"
import { authUser } from "./stores/userStore"
import "./dirHeader"
import "./filePreview"
import "./dirListing"
import "./buttons"
import "./components"
import "./vars.css"
import "./index.css"
import "./services/locationLoader"
import "./services/playerService"
import { AuthUser } from "./stores/userStore"

@customElement('dir-listing-app')
export class DirListingApp extends LitElement {
    static styles = css`
        :host {
            overflow: hidden;
            height: 100%;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            grid-template-areas:
                'header'
                'main'
                'footer';
        }
        * {
            box-sizing: border-box;
        }
        header {
            background: var(--secondary-background);
            grid-area: header;
            padding: 0.2rem;
            display: block;
            overflow: hidden;
        }

        main {
            overflow-x: hidden;
            overflow-y: auto;
            grid-area: main;
            padding: 0.5rem;
            display: block;
        }

        footer {
            grid-area: footer;
            max-width: 100vw;
            background: var(--secondary-background);
            padding: 0.2rem;
        }
        main::-webkit-scrollbar {
            width: 1em;
        }

        main::-webkit-scrollbar-track {
            box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        }

        main::-webkit-scrollbar-thumb {
            background-color: var(--magenta-dark);
            outline: 1px solid slategrey;
        }
    `

    @property({ attribute: false })
    config: ConfigFolder = {
        title: "audio lib loading",
        entries: []
    }

    @state()
    user: AuthUser = {}
    constructor() {
        super()
        content.subscribe(con => this.config = con)
        authUser.subscribe(u => {
            this.user = u
        })
        oidc.initialize()
    }

    async loginUser() {
        let user = await oidc.initialize()
        if (user == null)
            oidc.login()
    }
    render() {
        return html`
            <header>
                <dir-header .title=${this.config.title}></dir-header>
            </header>

            <main>
                ${this.user.accessToken ? html`
                    <span>Logged in: ${this.user.accessToken}</span>
                ` : html`
                    <span @click=${this.loginUser}>Not logged in</span>
                `}
                <dir-listing .entries=${this.config.entries}></dir-listing>
            </main>


            <footer>
                <file-preview></file-preview>
            </footer>

        `
  }
}
