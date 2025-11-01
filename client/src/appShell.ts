
import { html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"

import "./appShell.css"

@customElement("app-shell")
export class AppShell extends LitElement {

  @state()
  private _collapsed = false

  private _toggleNav = () => {
    this._collapsed = !this._collapsed
  }

  protected updated() {

    if (this._collapsed) this.setAttribute("collapsed", "")
    else this.removeAttribute("collapsed")
  }

  render() {
    return html`
      <header class="topbar">
        <div class="topbar-left-group">
          <slot name="logo"></slot>
          <wa-button
            size="small"
            appearance="plain" 
            @click=${this._toggleNav}
            title="Toggle navigation"
            aria-label="Toggle navigation"
            aria-expanded=${this._collapsed ? "false" : "true"}
          >
            <wa-icon name="bars" label="Toggle navigation"></wa-icon>
          </wa-button>
        </div>
        <theme-selector></theme-selector>
        <a href="user">
          <wa-avatar label="WA" shape="circle">
          </wa-avatar>
        </a>
      </header>

      <main>
        <p>Hello</p>
      </main>
    `
  }
}
