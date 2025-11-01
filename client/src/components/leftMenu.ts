
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
      display: block;
      padding: var(--wa-space-l);
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
      <h1>
        ${links.map((p) =>
          html`
            <a @click=${goto} href="${p.path}">${p.name}/</a>`
          )}
      </h1>
    `
  }

  render() {
    const title = decodeURI(this.config.title)  
    document.title = title

    if (location.pathname == "/")
      return html`
        <h1>${title}</h1>`
    
    return this.renderBreadCrumb()
  }
}
