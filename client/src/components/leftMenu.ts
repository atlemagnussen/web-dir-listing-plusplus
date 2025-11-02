
import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { content } from "@wdl/client/stores/fileStore.js"
import { ConfigFolder } from "@wdl/common"
import { goto } from "@wdl/client/services/locationLoader.js"

interface NamedLink {
  name: string
  path: string
}

@customElement("left-menu")
export class AppShell extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      padding: var(--wa-space-l);
      background: var(--wa-color-surface-raised);
    }
  `
  @state()
  config: ConfigFolder = { title: "", entries: [] }

  connectedCallback(): void {
    super.connectedCallback()
    content.subscribe(c => this.config = c)
  }
  renderBreadCrumb() {

    let pathSplit = location.pathname.split("/")
    document.title = decodeURI(location.pathname)
    pathSplit = pathSplit.filter(p => p)

    let link = "/"
    let links = pathSplit.map(p => {
      link = `${link}${p}/`
      const namedLink: NamedLink = {
        name: decodeURI(p),
        path: link
      }
      return namedLink

    })
    
    return html`
      <wa-breadcrumb>
        <wa-breadcrumb-item>
          <wa-icon slot="start" name="house"></wa-icon>
          <a href="/" @click=${goto} slot="end">
              Home
            </a>
        </wa-breadcrumb-item>
        ${links.map(l => html`
          <wa-breadcrumb-item href=${l.path}>
            <a href="${l.path}" @click=${goto} slot="end">
              ${l.name}
            </a>
          </wa-breadcrumb-item>
        `)}
      </wa-breadcrumb>
    `
  }
  render() {
    const title = decodeURI(this.config.title)  
    document.title = title

    return this.renderBreadCrumb()
  }
}
