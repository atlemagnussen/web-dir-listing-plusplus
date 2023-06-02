import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { getAllAudioItems } from "../stores/database"
import { SavedAudio } from "@common/types"

@customElement('history-viewer')
export class HistoryViewer extends LitElement {
    static styles = css`
        :host {
            display: inline-block;
            overflow: none;
        }
        h3 {
            font-size: 1.17em;
            margin-block-start: 0;
            margin-block-end: 1rem;
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
    
    render() {
        
        return html`
            <h3>Recently played</h3>

            ${this.audioItems.map(ai => {
                return html`
                    <p>
                        ${ai.filePath}
                        <duration-viewer .duration=${ai.audioProcess}></duration-viewer>
                    </p>`
                }
            )}
        `
    }
}

