import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import "./index.css"

type FileEntryType = "file" | "folder"
interface FileOrDir {
    type: FileEntryType
    name: string
    ext: string
    webpath: string
}

@customElement('audio-app')
export class AudioElement extends LitElement {
    
    @property({attribute: false})
    entries: FileOrDir[] = []
    
    render() {
        console.log("entries", this.entries)
        return html`
            <h1>Audio player</h1>
            <audio-player></audio-player>
        `
    }

    static styles = css`
    :host {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
    }
  `
}

// let entries: FileOrDir[] = []

// export const setEntries = (ent: FileOrDir[]) => {
//     entries = ent
//     console.log(ent)
// }

import "./audioPlayer"
