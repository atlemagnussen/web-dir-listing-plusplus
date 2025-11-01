
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
      grid-template-rows: 4rem; 
      grid-template-areas:
          "nav topbar"
          "nav main"
          "nav footer";
      height: 100vh;
      overflow: hidden;
      background: var(--wa-color-surface-default);
      color: var(--wa-color-text-normal);
      -webkit-font-smoothing: antialiased;

      left-menu {
          width: 20rem;
          grid-area: nav;
      }

      footer {
        height: 10rem;
        grid-area: footer;
      }
      header {
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

          .topbar #topbar-right {
              display: inline-flex;
              align-items: center;
              gap: .75rem;
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

      .dev-placeholder {
          opacity: 0.5;
          font-size: 1rem;
          font-style: italic;
      }

      wa-button {
          font-size: 1rem
      }
  }
  `
  
  private _collapsed = false

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
  protected updated() {
    if (this._collapsed)
      this.setAttribute("collapsed", "")
    else
      this.removeAttribute("collapsed")
  }

  render() {
    return html`
      <left-menu></left-menu>
      <header class="topbar">
        <div class="topbar-left-group">
          <div class="logo">
            <slot name="logo"></slot>
          </div>
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
        <p>Foot</p>
        <file-preview></file-preview>
      </footer>
    `
  }
}
