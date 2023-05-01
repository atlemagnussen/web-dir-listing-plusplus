import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('file-size-label')
export class FileSizeLabel extends LitElement {
    static styles = css`
        :host {
            display: inline-block;
            overflow: none;
        }
        label.filetype {
            color: var(--filetype-color);
            border: 1px solid var(--filetype-color);
            padding: 0.1rem;
            margin: 0;
        }
    `
    @property({attribute: true})
    size = 0

    formatSize() {
        if (this.size < 512)
            return `${this.size} b`
        
        const kb = 1024
        const mb = 1024
        if (this.size < (mb))
            return `${this.size/kb} kb`
        
        return `${this.size/mb} mb`
    }

    render() {
        if (!this.size)
            return html`<label>0</label>`

        return html`
            <label class="filetype">${this.formatSize()}</label>
        `
    }
}
