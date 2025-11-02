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


    @property({attribute: true})
    mimeType = ""

    render() {
        if (!this.ext)
            return html`<label></label>`

        let variant: 'brand' | 'neutral' | 'success' | 'warning' | 'danger' = 'brand'
        if (this.mimeType.startsWith("audio"))
            variant = "success"
        if (this.mimeType.startsWith("video"))
            variant = "warning"
        if (this.mimeType.startsWith("application"))
            variant = "danger"
        return html`
            <wa-badge appearance="outlined" variant="${variant}">${this.ext}</wa-badge>
        `
    }
}
