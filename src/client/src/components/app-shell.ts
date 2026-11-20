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
            flex: 1;
            width: 100%;
            max-width: 60rem;
            margin: 0 auto;
            padding: var(--wa-space-m);
        }
        :host([has-player]) main {
            padding-bottom: calc(var(--player-height) + var(--wa-space-l));
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
        this.toggleAttribute("has-player", !!this.playerState.value.entry)
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
                <wa-button appearance="plain" size="small" href=${hrefFor("/search")} @click=${linkClick}
                    title="Search">
                    <wa-icon name="magnifying-glass" label="Search"></wa-icon>
                </wa-button>
                <span class="user">${this.info?.user.name ?? ""}</span>
                <wa-button appearance="plain" size="small" href="/auth/logout" title="Log out">
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
        return html`<folder-view .path=${path}></folder-view>`
    }
}
