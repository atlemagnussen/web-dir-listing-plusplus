import type { ReactiveController, ReactiveControllerHost } from "lit"

type Listener<T> = (value: T) => void

/** Minimal observable value. */
export class Store<T> {
    private listeners = new Set<Listener<T>>()

    constructor(private current: T) {}

    get value() {
        return this.current
    }

    set(value: T) {
        this.current = value
        for (const l of this.listeners) l(value)
    }

    subscribe(listener: Listener<T>) {
        this.listeners.add(listener)
        listener(this.current)
        return () => this.listeners.delete(listener)
    }
}

/** Re-renders a Lit host whenever the store changes: `private x = new StoreController(this, store)`. */
export class StoreController<T> implements ReactiveController {
    value: T
    private unsubscribe?: () => void

    constructor(private host: ReactiveControllerHost, private store: Store<T>) {
        this.value = store.value
        host.addController(this)
    }

    hostConnected() {
        this.unsubscribe = this.store.subscribe(v => {
            this.value = v
            this.host.requestUpdate()
        })
    }

    hostDisconnected() {
        this.unsubscribe?.()
    }
}
