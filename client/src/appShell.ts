
import { html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"

import "./components/leftMenu.js"
import "./appShell.css"

@customElement("app-shell")
export class AppShell extends LitElement {

  @state()
  private _collapsed = false

  private _toggleNav = () => {
    this._collapsed = !this._collapsed
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  protected updated() {

    if (this._collapsed) this.setAttribute("collapsed", "")
    else this.removeAttribute("collapsed")
  }

  protected firstUpdated(): void {
    this._slotTheLogo()
  }

  private _slotTheLogo() {
    const hostChildren = Array.from(this.children)
    hostChildren.forEach((node) => {
      if ((node as HTMLElement).id == "digilean-logo-nav") {
        const target = this.querySelector("#logo-slot")
        if (target) {
          target.appendChild(node)
        }
      }
    })
  }

  render() {
    return html`
      <left-menu .minimized=${this._collapsed}>
        <div id="logo-slot" slot="logo"></div>
      </left-menu>

      <header class="topbar">
        <div class="topbar-left-group">
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
