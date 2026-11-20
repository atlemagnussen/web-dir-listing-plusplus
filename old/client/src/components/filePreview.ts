import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"
import {Subscription} from "rxjs"
import { playingFile } from "@wdl/client/stores/fileStore.js"
import { FileOrDir } from "@wdl/common"

@customElement('file-preview')
export class FilePreview extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            width: 100%;
            max-width: 100%;
            height: auto;
            overflow: none;
        }
        * {
            box-sizing: border-box;
        }
    `
    sub: Subscription | null = null
    file: FileOrDir | null = null

    connectedCallback() {
        super.connectedCallback()
        this.sub = playingFile.subscribe(file => {
            this.file = file
            this.requestUpdate()
        })
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        if (this.sub) {
            this.sub.unsubscribe()
        }
    }
    
    render() {

        let isAudio = false
        if (this.file && this.file.ext)
            isAudio = this.file.mimeType.startsWith("audio")

        if (isAudio)
            return html`
                <audio-player></audio-player>
            `
        return html`
            <file-info .file=${this.file}></file-info>
    `
    }
}

