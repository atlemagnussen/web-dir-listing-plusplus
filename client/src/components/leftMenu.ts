
import { css, html, LitElement } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("left-menu")
export class AppShell extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: var(--wa-space-l);
        }
    `

  render() {
    return html`
      <div>Left world menu</div>
    `
  }
}
