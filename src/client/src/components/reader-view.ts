import { LitElement, css, html, nothing } from "lit"
import { customElement, property, query, state } from "lit/decorators.js"
import "foliate-js/view.js"
import type { RelocateDetail, TocItem, View } from "foliate-js/view.js"
import { downloadUrl, fileUrl, getProgress, notifyProgressChanged, saveProgress, setFinished } from "../services/api"
import { parentPath, stripExt, baseName } from "../services/format"
import { hrefFor, linkClick } from "../services/router"

const SAVE_DELAY_MS = 2000
const FONT_SIZES = [80, 90, 100, 110, 120, 135, 150, 175, 200]

function readFontSize() {
    try {
        const v = Number(localStorage.getItem("wdl.reader.fontSize"))
        return FONT_SIZES.includes(v) ? v : 100
    } catch {
        return 100
    }
}

/** Styles injected into the book's documents. Based on foliate-js' own reader. */
const bookCss = (fontSize: number) => `
    @namespace epub "http://www.idpf.org/2007/ops";
    html {
        color-scheme: light dark;
        font-size: ${fontSize}% !important;
    }
    @media (prefers-color-scheme: dark) {
        a:link { color: lightblue; }
    }
    p, li, blockquote, dd {
        line-height: 1.5;
        text-align: justify;
        hyphens: auto;
        widows: 2;
    }
    [align="left"] { text-align: left; }
    [align="right"] { text-align: right; }
    [align="center"] { text-align: center; }
    pre { white-space: pre-wrap !important; }
    aside[epub|type~="footnote"], aside[epub|type~="endnote"], aside[epub|type~="note"], aside[epub|type~="rearnote"] {
        display: none;
    }
`

/**
 * EPUB reader (foliate-js). The reading position (CFI) and fraction are stored as progress
 * on the server, so a book opens where you left it on any device.
 *
 * Security: book content runs in same-origin iframes; the app's CSP (Program.cs) blocks book scripts.
 */
@customElement("reader-view")
export class ReaderView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }
        .bar {
            display: flex;
            align-items: center;
            gap: var(--wa-space-2xs);
            padding: var(--wa-space-2xs) var(--wa-space-s);
            background: var(--wa-color-surface-raised);
        }
        .top {
            border-bottom: 1px solid var(--wa-color-surface-border);
        }
        .bottom {
            border-top: 1px solid var(--wa-color-surface-border);
            font-size: var(--wa-font-size-xs);
            color: var(--wa-color-text-quiet);
        }
        .title {
            flex: 1;
            min-width: 0;
            font-weight: var(--wa-font-weight-semibold);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .book {
            flex: 1;
            min-height: 0;
            position: relative;
        }
        foliate-view {
            display: block;
            width: 100%;
            height: 100%;
        }
        .status {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: var(--wa-space-s);
            color: var(--wa-color-text-quiet);
        }
        input[type="range"] {
            flex: 1;
            min-width: 0;
            accent-color: var(--wa-color-brand-fill-loud);
        }
        .where {
            min-width: 0;
            max-width: 40%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .font-size {
            font-variant-numeric: tabular-nums;
            font-size: var(--wa-font-size-xs);
            min-width: 2.5rem;
            text-align: center;
        }
        wa-drawer::part(body) {
            padding: 0;
        }
        .toc ol {
            list-style: none;
            margin: 0;
            padding-left: var(--wa-space-m);
        }
        .toc > ol {
            padding: var(--wa-space-s);
        }
        .toc a {
            display: block;
            padding: var(--wa-space-2xs) var(--wa-space-xs);
            border-radius: var(--wa-border-radius-s);
            color: inherit;
            text-decoration: none;
        }
        .toc a:hover {
            background: var(--wa-color-surface-lowered);
        }
        .toc a.current {
            background: var(--wa-color-brand-fill-quiet);
            font-weight: var(--wa-font-weight-semibold);
        }
        @media (max-width: 40rem) {
            .hide-small {
                display: none;
            }
        }
    `

    @property() path = ""

    @state() private bookTitle = ""
    @state() private toc: TocItem[] = []
    @state() private location?: RelocateDetail
    @state() private fontSize = readFontSize()
    @state() private loading = true
    @state() private error?: string
    @state() private finished = false
    @state() private tocOpen = false

    @query(".book") private container!: HTMLElement

    private view?: View
    private saveTimer = 0
    private dirty = false

    willUpdate(changed: Map<string, unknown>) {
        if (changed.has("path") && this.path) this.open()
    }

    connectedCallback() {
        super.connectedCallback()
        document.addEventListener("keydown", this.onKey)
        document.addEventListener("visibilitychange", this.onHidden)
        window.addEventListener("pagehide", this.onHidden)
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        document.removeEventListener("keydown", this.onKey)
        document.removeEventListener("visibilitychange", this.onHidden)
        window.removeEventListener("pagehide", this.onHidden)
        this.save()
        this.view?.close()
        this.view?.remove()
    }

    private async open() {
        const path = this.path
        this.loading = true
        this.error = undefined
        this.bookTitle = stripExt(baseName(path))
        document.title = this.bookTitle
        await this.updateComplete

        this.view?.close()
        this.view?.remove()
        const view = document.createElement("foliate-view") as View
        this.view = view
        this.container.append(view)

        try {
            const [progress] = await Promise.all([
                getProgress(path).catch(() => undefined),
                view.open(fileUrl(path)),
            ])
            if (this.path !== path) return

            view.renderer.setAttribute("flow", "paginated")
            view.renderer.setAttribute("margin", "32px")
            view.renderer.setAttribute("gap", "6%")
            view.renderer.setAttribute("max-inline-size", "720px")
            view.renderer.setStyles?.(bookCss(this.fontSize))
            view.addEventListener("relocate", this.onRelocate as EventListener)
            view.addEventListener("load", this.onSectionLoad as EventListener)

            const title = view.book.metadata?.title
            const titleText = typeof title === "string" ? title : title ? Object.values(title)[0] : undefined
            if (titleText) {
                this.bookTitle = titleText
                document.title = titleText
            }
            this.toc = view.book.toc ?? []
            this.finished = progress?.finished ?? false

            await view.init({ lastLocation: progress?.locator, showTextStart: !progress?.locator })
        } catch (err) {
            console.error(err)
            this.error = `Could not open this book (${err instanceof Error ? err.message : err})`
        } finally {
            this.loading = false
        }
    }

    private onRelocate = (e: CustomEvent<RelocateDetail>) => {
        this.location = e.detail
        this.dirty = true
        clearTimeout(this.saveTimer)
        this.saveTimer = window.setTimeout(() => this.save(), SAVE_DELAY_MS)
    }

    /** Keyboard and tap-to-turn inside the book's iframes (events there don't reach our document). */
    private onSectionLoad = (e: CustomEvent<{ doc: Document }>) => {
        const doc = e.detail.doc
        doc.addEventListener("keydown", this.onKey)
        doc.addEventListener("click", (ev: MouseEvent) => {
            if ((ev.target as Element).closest?.("a")) return
            if (doc.getSelection()?.toString()) return
            // In paginated mode the iframe is wider than the screen (one column per page) and scrolled,
            // so map the click through the iframe's on-screen position to the visible book area.
            const frame = doc.defaultView?.frameElement
            const book = this.container.getBoundingClientRect()
            if (!frame || !book.width) return
            const x = frame.getBoundingClientRect().left + ev.clientX
            const rel = (x - book.left) / book.width
            if (rel < 0.3) this.view?.goLeft()
            else if (rel > 0.7) this.view?.goRight()
        })
    }

    private onKey = (e: KeyboardEvent) => {
        if (!this.view || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
        if ((e.target as HTMLElement)?.closest?.("input, textarea")) return
        if (e.key === "ArrowLeft" || e.key === "PageUp") this.view.goLeft()
        else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") this.view.goRight()
        else return
        e.preventDefault()
    }

    private onHidden = () => {
        if (document.visibilityState === "hidden") this.save(true)
    }

    private async save(keepalive = false) {
        clearTimeout(this.saveTimer)
        if (!this.dirty || !this.location) return
        this.dirty = false
        const firstSave = !this.savedOnce
        try {
            await saveProgress({
                path: this.path,
                locator: this.location.cfi,
                fraction: this.location.fraction,
                finished: this.finished,
            }, keepalive)
            this.savedOnce = true
            if (firstSave) notifyProgressChanged()
        } catch (err) {
            this.dirty = true
            console.warn("Could not save reading position", err)
        }
    }
    private savedOnce = false

    private setFontSize(delta: number) {
        const i = FONT_SIZES.indexOf(this.fontSize)
        const next = FONT_SIZES[Math.min(FONT_SIZES.length - 1, Math.max(0, i + delta))]
        this.fontSize = next
        try {
            localStorage.setItem("wdl.reader.fontSize", String(next))
        } catch {
            // private mode etc.
        }
        this.view?.renderer.setStyles?.(bookCss(next))
    }

    private async toggleFinished() {
        this.finished = !this.finished
        await this.save()
        await setFinished(this.path, this.finished)
    }

    private goToToc(href: string) {
        this.tocOpen = false
        this.view?.goTo(href)
    }

    render() {
        const loc = this.location
        const pct = loc ? Math.round(loc.fraction * 100) : 0
        const nearEnd = (loc?.fraction ?? 0) > 0.97
        return html`
            <div class="bar top">
                <wa-button appearance="plain" size="s" href=${hrefFor(parentPath(this.path))} @click=${linkClick}
                    title="Back to folder">
                    <wa-icon name="arrow-left" label="Back"></wa-icon>
                </wa-button>
                <span class="title" title=${this.bookTitle}>${this.bookTitle}</span>
                <wa-button appearance="plain" size="s" @click=${() => this.setFontSize(-1)} title="Smaller text">
                    <wa-icon name="minus" label="Smaller text"></wa-icon>
                </wa-button>
                <span class="font-size">${this.fontSize}%</span>
                <wa-button appearance="plain" size="s" @click=${() => this.setFontSize(1)} title="Larger text">
                    <wa-icon name="plus" label="Larger text"></wa-icon>
                </wa-button>
                <wa-button appearance="plain" size="s" ?disabled=${!this.toc.length}
                    @click=${() => (this.tocOpen = true)} title="Contents">
                    <wa-icon name="list" label="Contents"></wa-icon>
                </wa-button>
                <wa-button class="hide-small" appearance="plain" size="s" href=${downloadUrl(this.path)} download
                    title="Download">
                    <wa-icon name="download" label="Download"></wa-icon>
                </wa-button>
            </div>

            <div class="book">
                ${this.loading || this.error
                    ? html`<div class="status">
                          ${this.error ? html`<p>${this.error}</p>` : html`<wa-spinner></wa-spinner>`}
                      </div>`
                    : nothing}
            </div>

            <div class="bar bottom">
                <wa-button appearance="plain" size="s" @click=${() => this.view?.goLeft()} title="Previous page">
                    <wa-icon name="chevron-left" label="Previous page"></wa-icon>
                </wa-button>
                <input type="range" min="0" max="1" step="0.001" aria-label="Position in book"
                    .value=${String(loc?.fraction ?? 0)}
                    @change=${(e: Event) => this.view?.goToFraction(Number((e.target as HTMLInputElement).value))} />
                <span class="where">${pct}%${loc?.tocItem?.label ? html` · ${loc.tocItem.label}` : nothing}</span>
                ${nearEnd || this.finished
                    ? html`<wa-button size="s" variant=${this.finished ? "success" : "brand"}
                          appearance=${this.finished ? "outlined" : "filled"} @click=${this.toggleFinished}>
                          ${this.finished ? "Finished ✓" : "Mark finished"}
                      </wa-button>`
                    : nothing}
                <wa-button appearance="plain" size="s" @click=${() => this.view?.goRight()} title="Next page">
                    <wa-icon name="chevron-right" label="Next page"></wa-icon>
                </wa-button>
            </div>

            <wa-drawer label="Contents" placement="start" ?open=${this.tocOpen}
                @wa-after-hide=${() => (this.tocOpen = false)}>
                <nav class="toc">${this.renderToc(this.toc)}</nav>
            </wa-drawer>
        `
    }

    private renderToc(items: TocItem[]): unknown {
        const current = this.location?.tocItem?.href
        return html`<ol>
            ${items.map(item => html`<li>
                <a href="#" class=${item.href === current ? "current" : ""}
                    @click=${(e: Event) => {
                        e.preventDefault()
                        this.goToToc(item.href)
                    }}>${item.label}</a>
                ${item.subitems?.length ? this.renderToc(item.subitems) : nothing}
            </li>`)}
        </ol>`
    }
}
