import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { ref, Ref, createRef } from "lit/directives/ref.js"
import {Subscription} from "rxjs"
import { playingFile } from "../stores/fileSelectedStore"
import { SliderBar } from "./sliderBar"
import * as db from "../stores/database"
import dialog from "../components/dialogEl"

type PlayingState = "playing" | "paused" | "stopped"

@customElement('audio-player')
export class AudioPlayer extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            width: 100%;
            max-width: 100%;
            height: 7rem;
            overflow: none;
            --button-height: 3rem;
            --button-width: 3rem;
        }
        * {
            box-sizing: border-box;
        }
        .wrapper {
            padding: 0.5rem;
            gap: 0.5rem;
            display: flex;
            flex-direction: column;
            width: var(--default-width);
            max-width: var(--default-width);
            border: 1px solid var(--link-color);
        }
        .section {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            align-items: center;
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
        
        slider-bar {
            flex: 1 1 auto;
        }
        .fileinfo {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            gap: 1rem;
        }
        download-button {
            --button-height: 1.3rem;
            --button-width: 1.3rem;
        }
    `
    sub: Subscription | null = null
    audioRef: Ref<HTMLAudioElement> = createRef()

    connectedCallback() {
        super.connectedCallback()
        this.sub = playingFile.subscribe(file => {
            this.url = file.path
            this.label = file.name
            this.ext = file.ext
            this.playingState == "stopped"
            this.currentTime = 0
            db.getAudioItem(this.url).then(v => {
                if (v && v.audioProcess) {
                    if (!this.audioRef.value)
                        return
                    const audio = this.audioRef.value
                    this.currentTime = v.audioProcess
                    audio.currentTime
                }
            })
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

    get filename() {
        return `${this.label}.${this.ext}`
    }

    saveAudioProgress() {
        db.saveAudioItem({ filePath: this.url, audioProcess: this.currentTime })
        console.log("savedAudioProgress", this.currentTime)
    }

    intervalId = 0
    saveProgressWhilePlaying() {
        this.intervalId = window.setInterval(() => {
            this.saveAudioProgress()
        }, 1000)
    }
    stopSavingProgress() {
        if (this.intervalId)
            window.clearInterval(this.intervalId)
    }
    togglePlay() {
        if (!this.audioRef.value)
            return
        const audio = this.audioRef.value
        if (this.playingState == "paused" || this.playingState == "stopped")
            audio.play()
        else {
            audio.pause()
            this.saveAudioProgress()
        }
    }

    loadedMetaData() {
        if (!this.audioRef.value)
            return
        this.duration = this.audioRef.value.duration
        if (this.currentTime > 0)
            this.audioRef.value.currentTime = this.currentTime // might be saved progress
        this.playingState = "stopped"
    }
    currentTimeUpdate() {
        if (!this.audioRef.value)
            return
        this.currentTime = this.audioRef.value.currentTime
    }
    setState(state: PlayingState) {
        this.playingState = state
        if (state == "playing")
            this.saveProgressWhilePlaying()
        else
            this.stopSavingProgress()
    }
    tempTimeChange(e: CustomEvent) {
        const value = e.detail as number
        this.currentTime = value
    }
    openHistory() {
        dialog.openHtml({
            hideOkBtn: true,
            title: "history"
        }, "<history-viewer></history-viewer>")
    }
    displayBufferedAmount = () => {
        if (!this.audioRef.value)
            return
        const audio = this.audioRef.value
        const bufferedAmount = Math.floor(audio.buffered.end(audio.buffered.length - 1))
        console.log("bufferedAmount", bufferedAmount)
        //audioPlayerContainer.style.setProperty('--buffered-width', `${(bufferedAmount / seekSlider.max) * 100}%`);
    }
    seek(e: Event) {
        if (!this.audioRef.value)
            return
        const audio = this.audioRef.value
        const slider = e.target as SliderBar
        audio.currentTime = slider.value
        this.currentTime = slider.value
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
                @timeupdate=${this.currentTimeUpdate}>
            </audio>
            <div class="wrapper">
                <div class="section">
                    <duration-viewer .duration=${this.currentTime}></duration-viewer>
                    <slider-bar .duration=${this.duration}
                        .current=${this.currentTime}
                        @change=${this.seek}
                        @temporary-change=${this.tempTimeChange}>
                    </slider-bar>
                    <duration-viewer .duration=${this.duration}></duration-viewer>
                </div>
                <div class="section">
                    <div class="controls">
                        ${this.playingState == "stopped" || this.playingState == "paused" ? 
                            html`<play-button @click=${this.togglePlay}></play-button>` : 
                            html`<pause-button @click=${this.togglePlay}></pause-button>`
                        }
                        <history-button @click=${this.openHistory}></history-button>
                    
                    </div>
                    <div class="information">
                        <scrolling-text>${label}</scrolling-text>
                        <div class="fileinfo">
                            ${this.ext ? html`
                                <file-ext-label ext="${this.ext}"></file-ext-label>
                                <a href="${this.url}" download filename="${this.filename}">
                                    <download-button></download-button>
                                </a>
                            ` : ""}
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}

