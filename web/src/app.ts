import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { ConfigFolder } from "@common/types"

import "./dirHeader"
import "./filePreview"
import "./dirListing"
import "./buttons"
import "./components"
import "./vars.css"
import "./index.css"

@customElement('dir-listing-app')
export class DirListingApp extends LitElement {
  static styles = css`
        :host {
            overflow: hidden;
            height: 100%;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            grid-template-areas:
                'header'
                'main'
                'footer';
        }
        * {
            box-sizing: border-box;
        }
        header {
            background: var(--secondary-background);
            grid-area: header;
            padding: 0.2rem;
            display: block;
            overflow: hidden;
        }

        main {
            overflow-x: hidden;
            overflow-y: auto;
            grid-area: main;
            padding: 0.5rem;
            display: block;
        }

        footer {
            grid-area: footer;
            max-width: 100vw;
            background: var(--secondary-background);
            padding: 0.2rem;
        }
        main::-webkit-scrollbar {
            width: 1em;
        }

        main::-webkit-scrollbar-track {
            box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        }

        main::-webkit-scrollbar-thumb {
            background-color: var(--magenta-dark);
            outline: 1px solid slategrey;
        }
    `

  @property({ attribute: false })
  config: ConfigFolder = {
    title: "xxx.yyy.zzz.xxx.yyy.zzz.xxx.yyy.zzz.xxx.yyy.zzz.xxx.yyy.zzz",
    entries: [{
      name: "Explorer.31.-.Entities.Energy.Streams.and.Information.xxx.yyy.zzz.xxx.yyy.zzz.xxx.yyy.zzz.xxx.yyy.zzz.xxx.yyy.zzz",
      ext: "pdf",
      size: 1024,
      path: "http://192.168.1.3:8000/file/monroe.institute.explorer.series.1/Explorer.31.-.Entities.Energy.Streams.and.Information.Services.mp3",
      type: "file"
    }, {
      name: "folder1",
      type: "folder",
      ext: "",
      size: 0,
      path: ""
    }]
  }

  constructor() {
    super()
    for (let i = 0; i < 30; i++)
      this.config.entries.push({ name: `test ${i}`, ext: "mp3", size: i*100, type: "file", path: `http://localhost:8000/${i}.mp3` })
  }

  render() {
    console.log("config", this.config.entries)
    return html`
            <header>
                <dir-header .title=${this.config.title}></dir-header>
            </header>

            <main>
                <dir-listing .entries=${this.config.entries}></dir-listing>
            </main>


            <footer>
                <file-preview></file-preview>
            </footer>

        `
  }
}
