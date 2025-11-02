import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { FileOrDir } from "@wdl/common"
import { goto, gotoSelectFile } from "@wdl/client/services/locationLoader.js"

@customElement('dir-listing')
export class DirListing extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: left;
            max-width: 100%;
            width: 100%;
        }
        .wrapper {
            display: block;
            width: var(--default-width);
            max-width: var(--default-width);
        }
        * {
            box-sizing: border-box;
        }
        .filelink, .folderlink {
            max-width: 100%;
            width: 100%;
            padding: var(--wa-space-xs);
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: var(--wa-space-xs);
        }
        audio-link, .link {
            flex: 1 1 auto;
        }
        @media only screen and (max-width: 1024px) {
            .wrapper {
                width: 100%;
                max-width: 100%;
            }
        }
        @media only screen and (max-width: 640px) {
            file-size-label {
                display: none;
            }
        }
        a, a:visited {
            color: white;
        }
        file-ext-label {
            --filetype-color: var(--yellow-dark);
            font-size: 0.7rem;
        }
        file-size-label {
            --filetype-color: var(--yellow-dark);
            font-size: 0.9rem;
        }
        download-button, home-button {
            width: 1.4rem;
            height: 1.4rem;
        }
        home-button {
            --btn-color: var(--cardinal-blue);
        }
    `

    @property({attribute: false})
    entries: FileOrDir[] = []

    dispatchCustomEvent(name: string, detail: any) {
        const options = { detail, bubbles: true, composed: true}
        this.dispatchEvent(new CustomEvent(name, options))
    }
    selectFile(file: FileOrDir) {
        gotoSelectFile(file)
    }

    render() {
        return html`
            <div class="wrapper">
                ${this.renderContent()}
            </div>
        `
    }
    renderContent() {
        
        if (!this.entries || this.entries.length === 0) {
            return html`<h2>No entries</h2>`
        }
        return html`
            ${this.entries.map(e => {
                if (e.type == "root")
                return html`
                    <p class="folderlink">
                        <wa-icon name="house" label="Home"></wa-icon>
                        <a class="link" @click=${goto} href="${e.name}/">${e.name}</a>
                    </p>`
                    
                if (e.type == "folder")
                    return html`
                    <p class="folderlink">
                        <wa-icon name="folder" label="folder"></wa-icon>
                        <a class="link" @click=${goto} href="${e.name}/">${e.name}</a>
                        <a href="${e.path}" download="${e.name}.zip" title="download folder as zip">
                            <wa-icon name="download" label="download"></wa-icon>
                        </a>
                    </p>`
                
                return html`
                    <p class="filelink">
                        <file-link @click=${() => this.selectFile(e)} .name=${e.name}></file-link>
                        <file-size-label size=${e.size}></file-size-label>
                        <file-ext-label ext="${e.ext}" mimeType=${e.mimeType}></file-ext-label>
                        <a href="${e.path}" download="${e.name}.${e.ext}" title="download file">
                            <wa-icon name="download" label="download"></wa-icon>
                        </a>
                    </p>
                `
            })}
        `
    }
}
