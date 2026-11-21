import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { getAppInfo } from "../services/api"
import { currentPath, hrefFor, linkClick } from "../services/router"
import { player } from "../services/player"
import { StoreController } from "../services/store"
import type { AppInfo } from "../services/types"
import "./folder-view"
import "./home-view"
import "./search-view"
import "./audio-player"
import "./tracker-view"
import "./reader-view"
import { isEpub } from "../services/actions"

@customElement("app-shell")
export class AppShell extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            min-height: 100dvh;
        }
        header {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: var(--wa-space-s);
            padding: var(--wa-space-xs) var(--wa-space-m);
            padding-top: max(var(--wa-space-xs), env(safe-area-inset-top));
            background: var(--wa-color-surface-raised);
            border-bottom: 1px solid var(--wa-color-surface-border);
        }
        .logo {
            display: flex;
            align-items: center;
            gap: var(--wa-space-xs);
            color: inherit;
            text-decoration: none;
            font-weight: var(--wa-font-weight-semibold);
            white-space: nowrap;
        }
        .logo img {
            width: 1.75rem;
            height: 1.75rem;
        }
        .spacer {
            flex: 1;
        }
        .user {
            color: var(--wa-color-text-quiet);
            font-size: var(--wa-font-size-s);
        }
        main {
            box-sizing: border-box; /* the global rule in app.css doesn't reach into shadow DOM */
            flex: 1;
            width: 100%;
            max-width: 60rem;
            margin: 0 auto;
            padding: var(--wa-space-m);
        }
        :host([has-player]) main {
            padding-bottom: calc(var(--player-height) + var(--wa-space-l));
        }
        /* Reader: fill exactly one screen; the player (if any) sits below it instead of on top. */
        :host([reading]) {
            height: 100dvh;
            min-height: 0;
        }
        :host([reading]) main {
            max-width: none;
            padding: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
        }
        :host([reading]) reader-view {
            flex: 1;
        }
        :host([reading]) audio-player {
            position: static;
        }
        :host(:not([has-player])) audio-player {
            display: none;
        }
        audio-player {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10;
        }
        @media (max-width: 40rem) {
            .logo span,
            .user {
                display: none;
            }
        }
    `

    @state() private info?: AppInfo
    private path = new StoreController(this, currentPath)
    private playerState = new StoreController(this, player)

    async connectedCallback() {
        super.connectedCallback()
        this.info = await getAppInfo()
        document.title = this.info.title
    }

    updated() {
        const { entry, playing } = this.playerState.value
        const reading = isEpub(this.path.value)
        // Reading is another medium: a paused player gets out of the way (it comes back when you
        // leave the book). If audio is actually playing, keep its controls below the reader.
        const showPlayer = !!entry && (!reading || playing)
        this.toggleAttribute("has-player", showPlayer)
        this.toggleAttribute("reading", reading)
    }

    render() {
        const path = this.path.value
        return html`
            <header>
                <a class="logo" href="/" @click=${linkClick}>
                    <img src="/logo.svg" alt="" />
                    <span>${this.info?.title ?? ""}</span>
                </a>
                <div class="spacer"></div>
                <wa-button appearance="plain" size="s" href=${hrefFor("/tracker")} @click=${linkClick}
                    title="My books">
                    <wa-icon name="book-bookmark" label="My books"></wa-icon>
                </wa-button>
                <wa-button appearance="plain" size="s" href=${hrefFor("/search")} @click=${linkClick}
                    title="Search">
                    <wa-icon name="magnifying-glass" label="Search"></wa-icon>
                </wa-button>
                <span class="user">${this.info?.user.name ?? ""}</span>
                <wa-button appearance="plain" size="s" href="/auth/logout" title="Log out">
                    <wa-icon name="right-from-bracket" label="Log out"></wa-icon>
                </wa-button>
            </header>
            <main>${this.renderView(path)}</main>
            <audio-player></audio-player>
        `
    }

    private renderView(path: string) {
        if (path === "/")
            return html`<home-view></home-view>`
        if (path === "/search")
            return html`<search-view></search-view>`
        if (path === "/tracker")
            return html`<tracker-view></tracker-view>`
        if (isEpub(path))
            return html`<reader-view .path=${path}></reader-view>`
        return html`<folder-view .path=${path}></folder-view>`
    }
}
