import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { FileOrDir } from "@common/types"
import { setPlayingFile } from "./audioState"

@customElement('audio-playlist')
export class AudioPlayList extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            max-width: 100%;
            
        }
        .wrapper {
            display: block;
            width: var(--default-width);
            max-width: var(--default-width);
        }
        * {
            box-sizing: border-box;
        }
        .filelink {
            max-width: 100%;
            width: 100%;
            padding: 0;
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 0.5rem;
        }
        audio-link {
            flex: 1 1 auto;
        }
        @media only screen and (max-width: 1024px) {
            .wrapper {
                width: 100%;
                max-width: 100%;
            }
        }
        a, a:visited {
            color: white;
        }
        file-ext-label {
            --filetype-color: var(--yellow-dark);
            font-size: 0.7rem;
        }
    `

    @property({attribute: false})
    entries: FileOrDir[] = []

    play(e: FileOrDir) {
        console.log("now play", e)
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
                if (e.type == "folder")
                    return html`
                    <p>
                        <a href="${e.name}/">${e.name}</a>
                    </p>`
                
                return html`
                <p class="filelink">
                    <audio-link @click=${() => this.play(e)} .name=${e.name}></audio-link>
                    <file-ext-label ext="${e.ext}"></file-ext-label>
                </p>
                `
            })}
        `
    }
}
