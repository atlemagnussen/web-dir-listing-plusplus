import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('file-ext-label')
export class FileExtLabel extends LitElement {
    static styles = css`
        :host {
            display: inline-block;
            overflow: none;
        }
        label.filetype {
            color: var(--wa-color-text-quiet);
            border: 1px solid var(--wa-color-brand-border-quiet);
            padding: 0.1rem;
            margin: 0;
        }
    `
    @property({attribute: true})
    ext = ""
    render() {
        if (!this.ext)
            return html`<label></label>`

        return html`
            <label class="filetype">${this.ext}</label>
        `
    }
}
