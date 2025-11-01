import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('slider-bar')
export class SliderBar extends LitElement {
    static styles = css`
        :host {
            display: block;
            overflow: none;
            width: 100%;
        }
        * {
            box-sizing: border-box;
        }
    `

    _duration = 0

    set duration(value) {
        this._duration = Math.ceil(value)
        this.requestUpdate()
    }
    get duration() {
        return this._duration
    }

    _value = 0
    
    @property({attribute: true, type: Number})
    set current(value) {
        this._value = Math.floor(value)
    }
    get current() {
        return this._value
    }

    get value() {
        return this._value
    }

    getValueFromInput(input: HTMLInputElement) {
        const valStr = input.value
        const valNum = parseFloat(valStr)
        return valNum
    }
    changeEvent(e: Event) {
        const value = this.getValueFromInput(e.target as HTMLInputElement)
        
        this.current = value
        const changeEvent = new Event("change", {
            bubbles: true,
            composed: true
        })
        this.dispatchEvent(changeEvent)
    }
    inputEvent(e: Event) {
        const value = this.getValueFromInput(e.target as HTMLInputElement)

        const tempEvent = new CustomEvent("temporary-change", {
            detail: value,
            bubbles: true,
            composed: true
        })
        this.dispatchEvent(tempEvent)
    }
    render() {
        let duration = this.duration
        if (!duration)
            duration = 100

        return html`
            <wa-slider size="large" value="50" label="Large"
                min="0"
                max="${duration}"
                value="${this.current}"
                @change=${this.changeEvent}
                @input=${this.inputEvent}
                with-tooltip>
            </wa-slider>
        `
    }
}
