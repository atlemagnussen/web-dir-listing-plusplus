import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import {ref, createRef, Ref} from "lit/directives/ref.js"

import "./audioPlayer"
import { AudioPlayer } from "./audioPlayer"
import "./index.css"

type FileEntryType = "file" | "folder"
interface FileOrDir {
    type: FileEntryType
    name: string
    ext: string
    webpath: string
}

@customElement('audio-app')
export class AudioApp extends LitElement {
    
    @property({attribute: false})
    entries: FileOrDir[] = []
    
    audioPlayerRef: Ref<AudioPlayer> = createRef()

    // _click(e: MouseEvent) {
    //     console.log("click", e)
    // }
    // constructor() {
    //     super()
    //     this.addEventListener("click", (e) => this._click(e))
    // }
    play(entry: FileOrDir) {
        console.log("play entry", entry)
        if (!this.audioPlayerRef.value)
            return
        
        this.audioPlayerRef.value.label = entry.name
        this.audioPlayerRef.value.url = entry.webpath
        this.audioPlayerRef.value.ext = entry.ext
    }

    render() {
        
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
            <audio-player ${ref(this.audioPlayerRef)}></audio-player>
        `
    }

    static styles = css`
        :host {
            display: block;
        }
        a {
            color: white;
        }
        a:visited {
            color: lightblue
        }
    `
}

// let entries: FileOrDir[] = []

// export const setEntries = (ent: FileOrDir[]) => {
//     entries = ent
//     console.log(ent)
// }
