import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"

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
        
        input[type=range] {
            height: 2rem;
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
        }
        input[type=range]:focus {
            outline: none;
        }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 14px;
            cursor: pointer;
            animate: 0.2s;
            /* box-shadow: 4px 4px 5px var(--box-shadow); */
            background: var(--slider-track);
            border-radius: 6px;
            border: 3px solid var(--slider-border);
        }
        input[type=range]::-webkit-slider-thumb {
            /* box-shadow: 1px 1px 2px var(--box-shadow); */
            border: 2px solid var(--slider-thumb-border);
            height: 30px;
            width: 30px;
            border-radius: 0px;
            background: var(--slider-thumb);
            cursor: pointer;
            -webkit-appearance: none;
            margin-top: -10.5px;
        }
        input[type=range]:focus::-webkit-slider-runnable-track {
            background: var(--slider-track);
        }
        input[type=range]::-moz-range-track {
            width: 100%;
            height: 14px;
            cursor: pointer;
            animate: 0.2s;
            /* box-shadow: 4px 4px 5px var(--box-shadow); */
            background: var(--slider-track);
            border-radius: 6px;
            border: 3px solid var(--slider-border);
        }
        input[type=range]::-moz-range-thumb {
            /* box-shadow: 1px 1px 2px var(--box-shadow); */
            border: 2px solid var(--slider-thumb-border);
            height: 30px;
            width: 30px;
            border-radius: 0px;
            background: var(--slider-thumb);
            cursor: pointer;
        }
        input[type=range]::-ms-track {
            width: 100%;
            height: 14px;
            cursor: pointer;
            animate: 0.2s;
            background: transparent;
            border-color: transparent;
            color: transparent;
        }
        input[type=range]::-ms-fill-lower {
            background: var(--slider-track);
            border: 3px solid var(--slider-border);
            border-radius: 12px;
            /* box-shadow: 4px 4px 5px var(--box-shadow); */
        }
        input[type=range]::-ms-fill-upper {
            background: var(--slider-track);
            border: 3px solid var(--slider-border);
            border-radius: 12px;
            /* box-shadow: 4px 4px 5px var(--box-shadow); */
        }
        input[type=range]::-ms-thumb {
            margin-top: 1px;
            /* box-shadow: 1px 1px 2px var(--box-shadow); */
            border: 2px solid var(--slider-thumb-border);
            height: 30px;
            width: 30px;
            border-radius: 0px;
            background: var(--slider-thumb);
            cursor: pointer;
        }
        input[type=range]:focus::-ms-fill-lower {
            background: var(--slider-track);
        }
        input[type=range]:focus::-ms-fill-upper {
            background: var(--slider-track);
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

