import type {FigureState} from './figures'
import type {AxesWrapper} from './plot'
import type {Picture} from './picture'
import type {FigurePresentation, PlotRequest, PlotResponse} from './plotScene'

export interface PlotWorker {
    onmessage: ((event: MessageEvent<PlotResponse>) => void) | null
    onerror: ((event: ErrorEvent) => void) | null
    onmessageerror: ((event: MessageEvent) => void) | null
    postMessage: (request: PlotRequest) => void
    terminate: () => void
}

/** One calculation at a time. Aborting kills the thread, including synchronous mathjs work. */
export default class PlotWorkerClient {
    private worker: PlotWorker | null = null
    private nextId = 0
    private pending: {id: number, reject: (error: Error) => void} | null = null

    constructor(private createWorker: () => PlotWorker) {}

    compute(states: FigureState[], viewport: AxesWrapper, signal?: AbortSignal,
        prepared?: (figures: FigurePresentation[]) => void): Promise<Picture> {
        if (signal?.aborted) return Promise.reject(new DOMException('Calculation cancelled', 'AbortError'))
        this.cancel()
        return new Promise((resolve, reject) => {
            const id = ++this.nextId
            const cleanup = () => {
                signal?.removeEventListener('abort', abort)
                this.pending = null
            }
            const fail = (error: Error) => {
                cleanup()
                this.stopWorker()
                reject(error)
            }
            const abort = () => fail(new DOMException('Calculation cancelled', 'AbortError'))
            this.pending = {id, reject: fail}
            signal?.addEventListener('abort', abort, {once: true})
            try {
                const worker = this.worker ??= this.createWorker()
                worker.onmessage = ({data}) => {
                    // Also reject queued events from a terminated/replaced worker.
                    if (this.pending?.id !== id || data.id !== id) return
                    if (data.type === 'prepared') prepared?.(data.figures)
                    else if (data.type === 'error') fail(new Error(data.message))
                    else {
                        cleanup()
                        resolve(data.picture)
                    }
                }
                worker.onerror = event => {
                    event.preventDefault()
                    if (this.pending?.id === id) fail(new Error(event.message || 'Unable to start plot worker'))
                }
                worker.onmessageerror = () => {
                    if (this.pending?.id === id) fail(new Error('Unable to read plot worker result'))
                }
                const {xMin, xMax, yMin, yMax, width, height, radius} = viewport
                worker.postMessage({id, states, viewport: {xMin, xMax, yMin, yMax, width, height, radius}})
            } catch (error) {
                fail(error instanceof Error ? error : new Error(String(error)))
            }
        })
    }

    private cancel() {
        this.pending?.reject(new DOMException('Calculation cancelled', 'AbortError'))
    }

    private stopWorker() {
        if (!this.worker) return
        this.worker.onmessage = null
        this.worker.onerror = null
        this.worker.onmessageerror = null
        this.worker.terminate()
        this.worker = null
    }

    // Safe to reuse after cleanup (React Strict Mode mounts effects twice in development).
    dispose() {
        this.cancel()
        this.stopWorker()
    }
}
