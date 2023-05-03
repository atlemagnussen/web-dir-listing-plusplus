import { FileOrDir } from "@common/types"
import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"


@customElement('file-info')
export class FileInfo extends LitElement {
    static styles = css`
        :host {
            
        }
    `

    @property({attribute: false})
    file: FileOrDir = { type: "file", name: "", ext: "", size: 0, path: ""}

    render() {
        return html`
            <span title="${this.file.name}">${this.file.name}</span>
        `
    }
}
