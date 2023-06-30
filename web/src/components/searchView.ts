import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { searchFile } from "@app/services/search"
import { FileOrDir } from "@common/types"


@customElement('search-view')
export class SearchView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            overflow: none;
        }
        h3 {
            font-size: 1.17em;
            margin-block-start: 0;
            margin-block-end: 1rem;
        }
        a, a:visited {
            color: var(--link-color);
        }
        .search-box {
            display: flex;
            flex-direction: row;
        }
        input {
            flex: 1 1 auto;
        }
    `
    @state()
    files: FileOrDir[] = []
    private searchTerm = ""

    async search() {
        const res = await searchFile(this.searchTerm)
        this.files = res
    }

    inputChangeEvent(e: any) {
        this.searchTerm = e.target.value
    }
    keyPressEvent(e: any) {
        if (e.key === "Enter") {
            e.preventDefault()
            this.search()
        }
    }
    render() {
        
        return html`
            <div class="search-box">
                <input type="text" @input=${this.inputChangeEvent} @keypress=${this.keyPressEvent} />
                <search-button @click=${this.search}></search-button>
            </div>
            <dir-listing .entries=${this.files}></dir-listing>
        `
    }
}

