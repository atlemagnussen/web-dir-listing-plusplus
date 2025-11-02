import { LitElement, css, html, nothing } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { ref, Ref, createRef } from "lit/directives/ref.js"
import {Subscription} from "rxjs"
import { playingFile, autoPlayEnabled, setAutoPlay, setPlayingState, playingState } from "@wdl/client/stores/fileStore.js"
import { SliderBar } from "./sliderBar.js"
import * as db from "@wdl/client/stores/database.js"
import { PlayingState } from "@wdl/common"

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
        download-button, open-button {
            --button-height: 1.4rem;
            --button-width: 1.4rem;
        }
        history-button {
            --button-height: 2rem;
            --button-width: 2rem;
        }
    `
    subs: Subscription[] = []
    audioRef: Ref<HTMLAudioElement> = createRef()

    @state()
    autoPlay = false

    connectedCallback() {
        super.connectedCallback()
        this.subs.push(playingFile.subscribe(file => {
            this.url = file.path
            this.label = file.name
            this.ext = file.ext
            this.playingState == "paused"
            this.currentTime = 0
            db.getAudioItem(this.url).then(v => {
                if (v && v.audioProcess) {
                    if (!this.audioRef.value)
                        return
                    const audio = this.audioRef.value
                    this.currentTime = v.audioProcess
                    audio.currentTime = this.currentTime
                }
            })
        }))
        this.subs.push(autoPlayEnabled.subscribe(ap => this.autoPlay = ap))
        this.subs.push(playingState.subscribe(state => {
            this.playingState = state
            if (state == "playing")
                this.saveProgressWhilePlaying()
            else
                this.stopSavingProgress()
        }))
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        if (this.subs.length > 0) {
            this.subs.map(s => s.unsubscribe())
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
    playingState: PlayingState = "paused"

    get filename() {
        return `${this.label}.${this.ext}`
    }

    saveAudioProgress() {
        db.saveAudioItem(this.url, this.currentTime)
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
        if (this.playingState == "paused" || this.playingState == "ended")
            audio.play()
        else {
            audio.pause()
            this.saveAudioProgress()
        }
    }

    loadedMetaData() {
        if (!this.audioRef.value)
            return
        const audioEl = this.audioRef.value
        this.duration = audioEl.duration
        if (this.currentTime > 0)
            audioEl.currentTime = this.currentTime // might be saved progress
        this.playingState = "paused"

        if (this.autoPlay) {
            setTimeout(() => {
                audioEl.play()
            }, 500)
        }
    }
    currentTimeUpdate() {
        if (!this.audioRef.value)
            return
        this.currentTime = this.audioRef.value.currentTime
    }
    
    tempTimeChange(e: CustomEvent) {
        const value = e.detail as number
        this.currentTime = value
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
                @play=${() => setPlayingState("playing")}
                @pause=${() => setPlayingState("paused")}
                @ended=${() => setPlayingState("ended")}
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
                        ${this.playingState == "ended" || this.playingState == "paused" ? 
                            html`
                              <wa-button variant="neutral" appearance="outlined" @click=${this.togglePlay}>
                                <wa-icon name="play" label="Home"></wa-icon>
                                </wa-button>
                            ` : 
                            html`
                                <wa-button variant="neutral" appearance="outlined" @click=${this.togglePlay}>
                                    <wa-icon name="pause" label="Home"></wa-icon>
                                </wa-button>
                            `
                        }
                    </div>
                    <div class="information">
                        <scrolling-text>${label}</scrolling-text>
                        <div class="fileinfo">
                            ${this.ext ? html`
                                <file-ext-label ext="${this.ext}"></file-ext-label>
                                <a href="${this.url}" download filename="${this.filename}">
                                    <wa-icon name="download" label="download"></wa-icon>
                                </a>
                                <a href="${this.url}" target="_blank">
                                    <wa-icon name="up-right-from-square"></wa-icon>
                                </a>
                                
                                <wa-checkbox id="autoplay" @change=${(e:any) => setAutoPlay(e.target.checked)}
                                    .checked=${this.autoPlay}>
                                    Autoplay
                                </wa-checkbox>
                            ` : nothing}
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}

