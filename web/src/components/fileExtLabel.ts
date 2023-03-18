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
            color: var(--filetype-color);
            border: 1px solid var(--filetype-color);
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
