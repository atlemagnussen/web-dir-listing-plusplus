import { LitElement, css, html, nothing } from "lit"
import { customElement, state } from "lit/decorators.js"
import { formatDuration, parentPath, stripExt } from "../services/format"
import {
    RATES, hasNext, hasPrevious, next, player, previous, seek, setAutoplayNext, setRate,
    skipBack, skipForward, togglePlay,
} from "../services/player"
import { hrefFor, linkClick } from "../services/router"
import { StoreController } from "../services/store"

@customElement("audio-player")
export class AudioPlayer extends LitElement {
    static styles = css`
        :host {
            display: block;
            background: var(--wa-color-surface-raised);
            border-top: 1px solid var(--wa-color-surface-border);
            box-shadow: var(--wa-shadow-l);
            padding: var(--wa-space-s) var(--wa-space-m);
            padding-bottom: max(var(--wa-space-s), env(safe-area-inset-bottom));
        }
        :host([hidden]) {
            display: none;
        }
        .inner {
            max-width: 60rem;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-2xs);
        }
        .title {
            display: flex;
            align-items: baseline;
            gap: var(--wa-space-s);
            min-width: 0;
        }
        .title strong {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .title a {
            color: var(--wa-color-text-quiet);
            font-size: var(--wa-font-size-s);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .timeline {
            display: flex;
            align-items: center;
            gap: var(--wa-space-s);
            font-size: var(--wa-font-size-xs);
            font-variant-numeric: tabular-nums;
            color: var(--wa-color-text-quiet);
        }
        input[type="range"] {
            flex: 1;
            accent-color: var(--wa-color-brand-fill-loud);
            min-width: 0;
        }
        .controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--wa-space-xs);
        }
        .controls .play {
            font-size: 1.5rem;
        }
        .side {
            position: absolute;
        }
        .extras {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: var(--wa-font-size-s);
        }
    `

    private state = new StoreController(this, player)
    /** While dragging the slider, show the drag position instead of the playing position. */
    @state() private scrubbing?: number

    updated() {
        this.hidden = !this.state.value.entry
    }

    render() {
        const s = this.state.value
        if (!s.entry) return nothing
        const folder = parentPath(s.entry.path)
        const position = this.scrubbing ?? s.position

        return html`
            <div class="inner">
                <div class="title">
                    <strong title=${s.entry.name}>${stripExt(s.entry.name)}</strong>
                    <a href=${hrefFor(folder)} @click=${linkClick}>${folder.split("/").pop()}</a>
                </div>
                <div class="timeline">
                    <span>${formatDuration(position)}</span>
                    <input type="range" min="0" step="1"
                        aria-label="Position"
                        .max=${String(s.duration || 0)}
                        .value=${String(position)}
                        @input=${(e: Event) => (this.scrubbing = Number((e.target as HTMLInputElement).value))}
                        @change=${(e: Event) => {
                            seek(Number((e.target as HTMLInputElement).value))
                            this.scrubbing = undefined
                        }} />
                    <span>-${formatDuration(Math.max(0, s.duration - position))}</span>
                </div>
                <div class="controls">
                    <wa-button appearance="plain" ?disabled=${!hasPrevious() && s.position < 5} @click=${previous}>
                        <wa-icon name="backward-step" label="Previous"></wa-icon>
                    </wa-button>
                    <wa-button appearance="plain" @click=${skipBack}>
                        <wa-icon name="rotate-left" label="Back 15 seconds"></wa-icon>
                    </wa-button>
                    <wa-button class="play" appearance="filled" variant="brand" pill @click=${togglePlay}>
                        <wa-icon name=${s.playing ? "pause" : "play"} label=${s.playing ? "Pause" : "Play"}></wa-icon>
                    </wa-button>
                    <wa-button appearance="plain" @click=${skipForward}>
                        <wa-icon name="rotate-right" label="Forward 30 seconds"></wa-icon>
                    </wa-button>
                    <wa-button appearance="plain" ?disabled=${!hasNext()} @click=${next}>
                        <wa-icon name="forward-step" label="Next"></wa-icon>
                    </wa-button>
                </div>
                <div class="extras">
                    <wa-switch size="s" .checked=${s.autoplayNext}
                        @change=${(e: Event) => setAutoplayNext((e.target as HTMLInputElement).checked)}>
                        Play next automatically
                    </wa-switch>
                    <wa-button size="s" appearance="outlined" @click=${this.cycleRate} title="Playback speed">
                        ${s.rate}×
                    </wa-button>
                </div>
            </div>
        `
    }

    private cycleRate() {
        const i = RATES.indexOf(this.state.value.rate)
        setRate(RATES[(i + 1) % RATES.length])
    }
}
