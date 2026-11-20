import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('duration-viewer')
export class DurationViewer extends LitElement {
    static styles = css`
        :host {
            display: inline-block;
            overflow: none;
        }
        
    `
    @property({attribute: false})
    duration = 0
    render() {
        if (this.duration == 0)
            return html`<label>00:00</label>`

        const mins = Math.floor(this.duration / 60)
        const minsStr = mins.toString().padStart(2, '0')
        const secs = Math.floor(this.duration % 60)
        const secsStr = secs.toString().padStart(2, '0')
        return html`
            <label>${minsStr}:${secsStr}</label>
        `
    }
}

