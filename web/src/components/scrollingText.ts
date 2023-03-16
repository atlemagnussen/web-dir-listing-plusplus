import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import {classMap} from "lit/directives/class-map.js"

@customElement('scrolling-text')
export class ScrollingText extends LitElement {
    static styles = css`
        :host {
            width: 100%;
            max-width: 100%;
            display: block;
            height: 1.5rem;
        }
        * {
            box-sizing: border-box;
        }
        label {
            display: block;
            position: relative;
            width: 100%;
            max-width: 100%;
            overflow: hidden;
            height: 1.5rem;
            color: var(--winamp-green);
            cursor: pointer;
        }
        span {
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            position: absolute;
            white-space: nowrap;
        }
        span.scrolling {
            will-change: transform;
            animation: scroll-left 10s linear infinite;
        }
        @keyframes scroll-left {
            0% {
                transform: translateX(100%); 
            }
            100% {
                transform: translateX(-100%); 
            }
        }
    `
    @state()
    scrolling = false
    toggle() {
        this.scrolling = !this.scrolling
    }
    render() {
        const classes = { scrolling: this.scrolling }
        return html`
            <label @click=${this.toggle}>
                <span class=${classMap(classes)}>
                <slot></slot>
                </span>
            </label>
        `
    }
}

