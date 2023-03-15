import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { ConfigFolder } from "@common/types"

import "./audioHeader"
import "./audioPlayer"
import "./audioPlayList"
import "./vars.css"
import "./index.css"

@customElement('audio-app')
export class AudioApp extends LitElement {
    
    @property({attribute: false})
    config: ConfigFolder = {
        title: "no title",
        entries: [{
            name: "debug-dev-mode.debug-dev-mode.debug-dev-mode.debug-dev-mode.mp3",
            ext: "mp3",
            webpath: "http://localhost:8000/debug.mp3",
            type: "file"
        }]
    }
    

    render() {
        console.log("config", this.config)
        return html`
            <header>
                <audio-header .title=${this.config.title}></audio-header>
            </header>
            
            <main>
                <audio-playlist .entries=${this.config.entries}></audio-playlist>
            </main>
            
            
            <footer>
                <audio-player></audio-player>
            </footer>
            
        `
    }

    static styles = css`
        :host {
            height: 100vh;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            grid-template-areas: 
                'header'
                'main'
                'footer';
        }
        
        header {
            grid-area: header;
        }
        
        main {
            overflow: auto;
            grid-area: main;
            max-width: 100vw;
            padding: 15px 5px 10px 5px;
            display: block;
        }
        
        footer {
            grid-area: footer;
        }
        a, a:visited {
            color: white;
        }
    `
}

// let entries: FileOrDir[] = []

// export const setEntries = (ent: FileOrDir[]) => {
//     entries = ent
//     console.log(ent)
// }
