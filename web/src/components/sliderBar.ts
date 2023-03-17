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
        input {
            width: 100%;
        }
    `
    @property({attribute: false})
    duration = 0

    _value = 0
    
    set current(value) {
        this._value = Math.floor(value)
        this.requestUpdate()
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
            <input type="range" min="0" 
                max="${duration}"
                value=${this.current}
                @change=${this.changeEvent}
                @input=${this.inputEvent}>
        `
    }
}

