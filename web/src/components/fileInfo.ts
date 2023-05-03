import { FileOrDir } from "@common/types"
import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"


@customElement('file-info')
export class FileInfo extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            width: 100%;
            max-width: 100%;
            overflow: none;
            --button-height: 3rem;
            --button-width: 3rem;
        }
        * {
            box-sizing: border-box;
        }
        .wrapper {
            padding: 0.5rem;
            gap: 0.5rem;
            display: flex;
            flex-direction: column;
            width: var(--default-width);
            max-width: var(--default-width);
            border: 1px solid var(--link-color);
        }
        file-ext-label {
            font-size: 1.4rem;
        }
    `

    @property({attribute: false})
    file: FileOrDir = { type: "file", name: "", ext: "", size: 0, path: ""}

    render() {
        return html`
            <div class="wrapper"> 
                <div class="section">
                    <label title="${this.file.name}">${this.file.name}</label>
                </div>
                <div class="section">
                    <div class="information">
                        
                        <div class="fileinfo">
                            ${this.file.ext ? html`
                                <file-ext-label ext="${this.file.ext}"></file-ext-label>
                                <a href="${this.file.path}" download filename="${this.file.name}">
                                    <download-button></download-button>
                                </a>
                            ` : ""}
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}
