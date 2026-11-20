// Minimal types for the parts of foliate-js (plain JS, no typings) that reader-view uses.
declare module "foliate-js/view.js" {
    export interface TocItem {
        label: string
        href: string
        subitems?: TocItem[]
    }

    export interface Book {
        metadata?: { title?: string | Record<string, string>; author?: unknown }
        toc?: TocItem[]
        dir?: string
    }

    export interface RelocateDetail {
        fraction: number
        cfi: string
        tocItem?: TocItem
        location?: { current: number; next: number; total: number }
    }

    export interface Renderer extends HTMLElement {
        setStyles?(css: string): void
        next(): Promise<void>
        prev(): Promise<void>
    }

    export class View extends HTMLElement {
        book: Book
        renderer: Renderer
        lastLocation?: RelocateDetail
        open(book: string | File | Blob): Promise<void>
        close(): void
        init(opts: { lastLocation?: string; showTextStart?: boolean }): Promise<void>
        goTo(target: string | number): Promise<unknown>
        goToFraction(fraction: number): Promise<void>
        getSectionFractions(): number[]
        goLeft(): Promise<void>
        goRight(): Promise<void>
        prev(): Promise<void>
        next(): Promise<void>
    }
}
