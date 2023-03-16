import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"

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
        }
        span {
            will-change: transform;
            left: 0;
            top: 0;
            animation: scroll-left 10s linear infinite;
            width: 100%;
            max-width: 100%;
            position: absolute;
            white-space: nowrap;
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
    
    render() {
        return html`
            <label>
                <span>
                <slot></slot>
                </span>
            </label>
        `
    }
}
