import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { FileOrDir } from "@common/types"
import { setPlayingFile } from "./stores/fileSelectedStore"
import { goto } from "./services/locationLoader"

@customElement('dir-listing')
export class DirListing extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
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
            padding: 0;
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 0.5rem;
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
    `

    @property({attribute: false})
    entries: FileOrDir[] = []

    play(e: FileOrDir) {
        setPlayingFile(e)
    }
    render() {
        return html`
            <div class="wrapper">
                ${this.renderContent()}
            </div>
        `
    }
    renderContent() {
        
        if (this.entries.length === 0) {
            return html`<h2>No entries</h2>`
        }
        return html`
            ${this.entries.map(e => {
                if (e.type == "root")
                return html`
                    <p class="folderlink">
                        <a class="link" @click=${goto} href="${e.name}/">${e.name}</a>
                        <home-button title="Root lib folder"></home-button>
                    </p>`
                    
                if (e.type == "folder")
                    return html`
                    <p class="folderlink">
                        <a class="link" @click=${goto} href="${e.name}/">${e.name}</a>
                        <a href="${e.path}" download="${e.name}.zip" title="download folder as zip">
                            <download-button></download-button>
                        </a>
                    </p>`
                
                return html`
                    <p class="filelink">
                        <file-link @click=${() => this.play(e)} .name=${e.name}></file-link>
                        <file-size-label size=${e.size}></file-size-label>
                        <file-ext-label ext="${e.ext}"></file-ext-label>
                        <a href="${e.path}" download="${e.name}.${e.ext}" title="download file">
                            <download-button></download-button>
                        </a>
                    </p>
                `
            })}
        `
    }
}
