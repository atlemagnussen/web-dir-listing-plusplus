import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { resetProgress, setFinished } from "../services/api"
import { continueItem } from "../services/actions"
import { baseName, formatDuration, stripExt } from "../services/format"
import { hrefFor, linkClick } from "../services/router"
import type { TrackedItem } from "../services/types"

/** One book/audiobook in the tracker: progress, continue, mark finished, reset. */
@customElement("tracked-card")
export class TrackedCard extends LitElement {
    static styles = css`
        :host {
            display: block;
        }
        .card {
            display: flex;
            gap: var(--wa-space-m);
            align-items: center;
            padding: var(--wa-space-s) var(--wa-space-m);
            border: 1px solid var(--wa-color-surface-border);
            border-radius: var(--wa-border-radius-m);
            background: var(--wa-color-surface-raised);
        }
        .kind {
            flex: none;
            font-size: 1.5rem;
            color: var(--wa-color-brand-on-quiet);
        }
        .body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: var(--wa-space-2xs);
        }
        .title {
            font-weight: var(--wa-font-weight-semibold);
            color: inherit;
            text-decoration: none;
            overflow-wrap: anywhere;
        }
        .title:hover {
            text-decoration: underline;
        }
        .meta {
            font-size: var(--wa-font-size-xs);
            color: var(--wa-color-text-quiet);
            overflow-wrap: anywhere;
        }
        wa-progress-bar {
            --track-height: 6px;
        }
        .actions {
            flex: none;
            display: flex;
            align-items: center;
            gap: var(--wa-space-2xs);
        }
    `

    @property({ attribute: false }) item!: TrackedItem

    render() {
        const i = this.item
        const pct = Math.round(i.fraction * 100)
        const titleHref = hrefFor(i.kind === "audiobook" && i.files > 1 ? i.path : i.kind === "book" ? i.path : i.folder)
        return html`
            <div class="card">
                <wa-icon class="kind" name=${i.kind === "book" ? "book" : "headphones"}></wa-icon>
                <div class="body">
                    <a class="title" href=${titleHref} @click=${linkClick}>${i.title}</a>
                    <wa-progress-bar value=${pct} label="Progress"></wa-progress-bar>
                    <div class="meta">${this.describe(i, pct)}</div>
                </div>
                <div class="actions">
                    ${i.finished
                        ? nothing
                        : html`<wa-button variant="brand" size="s" @click=${() => continueItem(i)}>
                              <wa-icon slot="start" name=${i.kind === "book" ? "book-open" : "play"}></wa-icon>
                              Continue
                          </wa-button>`}
                    <wa-dropdown @wa-select=${this.onAction}>
                        <wa-button slot="trigger" appearance="plain" size="s" title="More">
                            <wa-icon name="ellipsis-vertical" label="More"></wa-icon>
                        </wa-button>
                        ${i.finished
                            ? html`<wa-dropdown-item value="unfinish">Mark as not finished</wa-dropdown-item>`
                            : html`<wa-dropdown-item value="finish">Mark as finished</wa-dropdown-item>`}
                        <wa-dropdown-item value="reset" variant="danger">Reset progress</wa-dropdown-item>
                    </wa-dropdown>
                </div>
            </div>
        `
    }

    private describe(i: TrackedItem, pct: number) {
        const parts: string[] = []
        if (i.finished) parts.push("Finished")
        else parts.push(`${pct}%`)
        if (i.kind === "audiobook" && i.files > 1) {
            parts.push(`${i.finishedFiles} of ${i.files} files done`)
            if (!i.finished && i.currentPath) {
                const at = i.position ? ` at ${formatDuration(i.position)}` : ""
                parts.push(`next: ${stripExt(baseName(i.currentPath))}${at}`)
            }
        } else if (i.kind === "audiobook" && i.position && !i.finished) {
            parts.push(`${formatDuration(i.position)} of ${formatDuration(i.duration)}`)
        }
        parts.push(new Date(i.updatedAt).toLocaleDateString())
        return parts.join(" · ")
    }

    private async onAction(e: CustomEvent<{ item: { value: string } }>) {
        const action = e.detail.item.value
        if (action === "finish") await setFinished(this.item.path, true)
        else if (action === "unfinish") await setFinished(this.item.path, false)
        else if (action === "reset") {
            if (!confirm(`Reset progress for "${this.item.title}"?`)) return
            await resetProgress(this.item.path)
        }
    }
}
