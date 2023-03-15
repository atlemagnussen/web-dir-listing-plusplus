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
        }
        .wrapper {
            display: block;
            width: var(--default-width);
            max-width: var(--default-width);
        }
        @media only screen and (max-width: 640px) {
            .wrapper {
                width: 100%;
                max-width: 100%;
            }
        }
        a, a:visited {
            color: white;
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
                    return html`<p>
                        <a href="${e.name}/">${e.name}</a>
                    </p>`
                
                return html`<p>
                    <button @click=${() => this.play(e)}>${e.name}</button>
                </p>
                `
            })}
        `
    }
}

// let entries: FileOrDir[] = []

// export const setEntries = (ent: FileOrDir[]) => {
//     entries = ent
//     console.log(ent)
// }
