
import { ConfigFolder } from "@wdl/common"
import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { content } from "./stores/fileStore.js"
import auth from "@wdl/client/services/authentication.js"
import { AuthUser, authUser } from "@wdl/client/stores/user.js"

@customElement("app-shell")
export class AppShell extends LitElement {

  static styles = css`
    :host {

      font-size: 1rem;
      line-height: 1.3;
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: 4rem 1fr auto; 
      grid-template-areas:
          "nav topbar"
          "nav main"
          "nav footer";
      height: 100%;
      overflow: hidden;
      background: var(--wa-color-surface-default);
      color: var(--wa-color-text-normal);
      -webkit-font-smoothing: antialiased;
    }
    #btn-toggle-menu {
      display: none;
    }
    left-menu {
        max-width: 20rem;
        grid-area: nav;
    }
    @media only screen and (max-width: 800px) {
      left-menu {
        display: none;
        position: fixed;
        &.show {
          z-index: 1000;
          display: block;
          left: 4rem;
        }
      }
      #btn-toggle-menu {
        display: block;
      }
    }
    footer {
      max-height: 10rem;
      grid-area: footer;
    }
    header {
      .topbar-left-group {
        width: 3rem;
        height: 3rem;
      }
      &.topbar {
          grid-area: topbar;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.75rem;
          border-bottom: 1px solid var(--wa-color-brand-border-quiet);
          height: var(--app-shell-topbar-height);
          box-sizing: border-box;
          position: sticky;
          top: 0;
      }
    }

    main {
        grid-area: main;
        overflow: auto;
        padding: 1rem 1.2rem 1.6rem;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
    }

    wa-button {
        font-size: 1rem
    }
  `
  @state()
  private leftMenuShowing = false
  toggleLeftMenu() {
    this.leftMenuShowing = !this.leftMenuShowing
  }

  @state()
  user: AuthUser = {}

  @state()
  conf: ConfigFolder = {
    title: "Ello",
    entries: []
  }

  connectedCallback(): void {
    super.connectedCallback()
    content.subscribe(c => this.conf = c)
    authUser.subscribe(u => this.user = u)
  }

  render() {
    return html`
      <left-menu class="${this.leftMenuShowing ? 'show' : ''}"></left-menu>
      <header class="topbar">
        <wa-button size="small" appearance="plain" id="btn-toggle-menu"
          @click=${this.toggleLeftMenu}>
          <wa-icon name="bars" label="Toggle navigation"></wa-icon>
        </wa-button>
        <div class="topbar-left-group">
          <a class="logo" href="/">
            <slot name="logo"></slot>
          </a>
        </div>
        <div>
          ${this.user.userName}
        </div>
        <wa-avatar @click=${auth.login}
          label="WA" shape="circle">
        </wa-avatar>
      </header>

      <main>
        <dir-listing .entries=${this.conf.entries}></dir-listing>
      </main>

      <footer>
        <file-preview></file-preview>
      </footer>
    `
  }
}
