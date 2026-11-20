import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { getAllAudioItems } from "../stores/database"
import { SavedAudio } from "@common/types"
import { goto } from "@app/services/locationLoader"
import { DialogResult } from "./dialogEl"

@customElement('history-viewer')
export class HistoryViewer extends LitElement {
    static styles = css`
        :host {
            display: block;
            overflow: none;
        }
        h3 {
            font-size: 1.17em;
            margin-block-start: 0;
            margin-block-end: 1rem;
        }
        a, a:visited {
            color: var(--link-color);
        }
    `
    @state()
    private audioItems: SavedAudio[] = []

    async getAll() {
        const items = await getAllAudioItems()
        this.audioItems = items
    }
    connectedCallback(): void {
        super.connectedCallback()
        this.getAll()
    }
    dispatchCustomEvent(name: string, detail: any) {
        const options = { detail, bubbles: true, composed: true}
        this.dispatchEvent(new CustomEvent(name, options))
    }
    gotoAndClose(e: Event) {
        goto(e)
        this.dispatchCustomEvent(DialogResult.dialogOkFromOutside, {"close": true})
    }
    render() {
        
        return html`
            <h3>Recently played</h3>

            ${this.audioItems.map(ai => {
                    if (ai.folderPath && ai.name && ai.ext) {
                        const filename = `${ai.name}.${ai.ext}`
                        const link = `${ai.folderPath}?file=${filename}`
                        return html`
                        <p>
                            <a href="${link}" @click=${this.gotoAndClose} title=${ai.folderPath}>${filename}</a>
                            <duration-viewer .duration=${ai.audioProcess}></duration-viewer>
                        </p>`
                    }
                    return html``
                }
            )}
        `
    }
}