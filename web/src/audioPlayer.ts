import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { ref, Ref, createRef } from "lit/directives/ref.js"
import {Subscription} from "rxjs"
import { playingFile } from "./audioState"

type PlayingState = "playing" | "paused" | "stopped"

@customElement('audio-player')
export class AudioPlayer extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            width: 100%;
            max-width: 100%;
            height: 4rem;
            overflow: none;
            --button-height: 3rem;
            --button-width: 3rem;
        }
        .wrapper {
            padding: 0.5rem;
            display: flex;
            flex-direction: row;
            gap: 1rem;
            width: var(--default-width);
            max-width: var(--default-width);
            border: 1px solid var(--link-color);
        }
        @media only screen and (max-width: 1024px) {
            .wrapper {
                width: 100%;
                max-width: 100%;
            }
        }
        .controls {
            display: inline-flex;
            flex-direction: row;
        }
        .information {
            flex: 1 1 auto;
            display: inline-flex;
            flex-direction: column;
        }
        label {
            overflow: hidden;
            text-overflow: ellipsis;
        }
        label.filetype {
            color: var(--filetype-color);
            border: 1px solid var(--filetype-color);
            padding: 0.1rem;
        }
    `
    sub: Subscription | null = null
    audioRef: Ref<HTMLAudioElement> = createRef()

    connectedCallback() {
        super.connectedCallback()
        this.sub = playingFile.subscribe(file => {
            this.url = file.webpath
            this.label = file.name
            this.ext = file.ext
            this.playingState == "stopped"
        })
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        if (this.sub) {
            this.sub.unsubscribe()
        }
    }
    @property({attribute: true})
    url = ""
    
    @property({attribute: true})
    label = ""

    @property({attribute: true})
    ext = ""

    @state()
    duration = 0

    @state()
    currentTime = 0

    @state()
    playingState: PlayingState = "stopped"

    togglePlay() {
        if (!this.audioRef.value)
            return
        const audio = this.audioRef.value
        if (this.playingState == "paused" || this.playingState == "stopped")
            audio.play()
        else
            audio.pause()
    }

    loadedMetaData() {
        if (!this.audioRef.value)
            return
        this.duration = this.audioRef.value.duration
        
    }
    currentTimeUpdate() {
        if (!this.audioRef.value)
            return
        this.currentTime = this.audioRef.value.currentTime
    }
    setState(state: PlayingState) {
        this.playingState = state
    }
    render() {
        let label = this.label
        if (!this.url || !this.ext)
            label = "Not playing anything"
            
        return html`
            <audio ${ref(this.audioRef)}
                src="${this.url}"
                type="${this.ext}"
                preload="metadata"
                @loadedmetadata=${this.loadedMetaData}
                @play=${() => this.setState("playing")}
                @pause=${() => this.setState("paused")}
                @ended=${() => this.setState("stopped")}
                @suspend=${() => this.setState("stopped")}
                @timeupdate=${this.currentTimeUpdate}>
            </audio>
            <div class="wrapper">
                <div class="controls">
                    ${this.playingState == "stopped" || this.playingState == "paused" ? 
                        html`<play-button @click=${this.togglePlay}></play-button>` : 
                        html`<pause-button @click=${this.togglePlay}></pause-button>`
                    }
                    
                </div>
                <div class="information">
                    <scrolling-text>${label}</scrolling-text>
                    <div class="time">
                        <duration-viewer .duration=${this.currentTime}></duration-viewer>
                        <span>/</span>
                        <duration-viewer .duration=${this.duration}></duration-viewer>
                        ${this.ext ? html`
                            <label class="filetype">${this.ext}</label>
                        ` : ""}
                    </div>
                </div>
            </div>
        `
    }
}

