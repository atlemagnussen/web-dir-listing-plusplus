import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { ConfigFolder } from "@common/types"

import "./audioHeader"
import "./audioPlayer"
import "./audioPlayList"
import "./buttons"
import "./components"
import "./vars.css"
import "./index.css"

@customElement('audio-app')
export class AudioApp extends LitElement {
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

    @property({attribute: false})
    config: ConfigFolder = {
        "title": "/monroe.institute.explorer.series.1/",
        "entries": [
            {
                "name": "Explorer.01.-.Communication.with.Non-Physical.Entities",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.01.-.Communication.with.Non-Physical.Entities.mp3"
            },
            {
                "name": "Explorer.02.-.An.Explorers.Past-Life.Regressions",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.02.-.An.Explorers.Past-Life.Regressions.mp3"
            },
            {
                "name": "Explorer.03.-.Consciousness.and.New.Technology",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.03.-.Consciousness.and.New.Technology.mp3"
            },
            {
                "name": "Explorer.04.-.Multi-Dimensional.Aspects.of.the.Self",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.04.-.Multi-Dimensional.Aspects.of.the.Self.mp3"
            },
            {
                "name": "Explorer.05.-.Introduction.to.Miranon",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.05.-.Introduction.to.Miranon.mp3"
            },
            {
                "name": "Explorer.06.-.Miranon.Levels.and.Planes.of.Existance",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.06.-.Miranon.Levels.and.Planes.of.Existance.mp3"
            },
            {
                "name": "Explorer.07.-.Awareness.of.True.Reality",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.07.-.Awareness.of.True.Reality.mp3"
            },
            {
                "name": "Explorer.08.-.Breaking.Through.Barriers",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.08.-.Breaking.Through.Barriers.mp3"
            },
            {
                "name": "Explorer.09.-.Earth.Changes",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.09.-.Earth.Changes.mp3"
            },
            {
                "name": "Explorer.10.-.Physical.Existancce-.Perceptions.From.the.Other.Side",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.10.-.Physical.Existancce-.Perceptions.From.the.Other.Side.mp3"
            },
            {
                "name": "Explorer.11.-.Responsibility.for.Self",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.11.-.Responsibility.for.Self.mp3"
            },
            {
                "name": "Explorer.12.-.Levels.of.Human.Consciousness",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.12.-.Levels.of.Human.Consciousness.mp3"
            },
            {
                "name": "Explorer.13.-.Miranon-.Human.Existance",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.13.-.Miranon-.Human.Existance.mp3"
            },
            {
                "name": "Explorer.14.-.Miranon-.The.Brain.and.Higher.Consciousness",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.14.-.Miranon-.The.Brain.and.Higher.Consciousness.mp3"
            },
            {
                "name": "Explorer.15.-.Energy.and.the.Physical.Body",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.15.-.Energy.and.the.Physical.Body.mp3"
            },
            {
                "name": "Explorer.16.-.Male-Female.Principles.Within.the.Self",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.16.-.Male-Female.Principles.Within.the.Self.mp3"
            },
            {
                "name": "Explorer.17.-.Patrick.-.A.Rescue.Mission",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.17.-.Patrick.-.A.Rescue.Mission.mp3"
            },
            {
                "name": "Explorer.18.-.Story.of.the.Creation",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.18.-.Story.of.the.Creation.mp3"
            },
            {
                "name": "Explorer.19.-.Love,.Fear.and.Christ.Consciousness",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.19.-.Love,.Fear.and.Christ.Consciousness.mp3"
            },
            {
                "name": "Explorer.20.-.Attachments.as.Stumbling.Blocks",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.20.-.Attachments.as.Stumbling.Blocks.mp3"
            },
            {
                "name": "Explorer.21.-.A.Meeting.with.Father.Time",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.21.-.A.Meeting.with.Father.Time.mp3"
            },
            {
                "name": "Explorer.22.-.Lessons.that.Man.Must.Learn",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.22.-.Lessons.that.Man.Must.Learn.mp3"
            },
            {
                "name": "Explorer.23.-.Robert.Monroe-.Life.as.Wave.Forms",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.23.-.Robert.Monroe-.Life.as.Wave.Forms.mp3"
            },
            {
                "name": "Explorer.24.-.Robert.Monroe-.Laboratory.Procedures",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.24.-.Robert.Monroe-.Laboratory.Procedures.mp3"
            },
            {
                "name": "Explorer.25.-.Importance.of.Thought.Forms",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.25.-.Importance.of.Thought.Forms.mp3"
            },
            {
                "name": "Explorer.26.-.Becoming.an.Explorer",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.26.-.Becoming.an.Explorer.mp3"
            },
            {
                "name": "Explorer.27.-.The.Origins.of.Man",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.27.-.The.Origins.of.Man.mp3"
            },
            {
                "name": "Explorer.28.-.Collective.Consciousness",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.28.-.Collective.Consciousness.mp3"
            },
            {
                "name": "Explorer.29.-.Aspects",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.29.-.Aspects.mp3"
            },
            {
                "name": "Explorer.30.-.Personal.Development",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.30.-.Personal.Development.mp3"
            },
            {
                "name": "Explorer.31.-.Entities.Energy.Streams.and.Information.Services",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.31.-.Entities.Energy.Streams.and.Information.Services.mp3"
            },
            {
                "name": "Explorer.32.-.Seeking.Personal.Guidance",
                "type": "file",
                "ext": "mp3",
                "webpath": "/file/monroe.institute.explorer.series.1/Explorer.32.-.Seeking.Personal.Guidance.mp3"
            }
        ]
    }

    constructor() {
        super()
        for (let i=0; i<30; i++)
            this.config.entries.push({name: `test ${i}`, ext: "mp3", type: "file", webpath: `http://localhost:8000/${i}.mp3`})
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
}