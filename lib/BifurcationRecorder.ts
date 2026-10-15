import type PlotWorkerClient from './PlotWorkerClient'
import type {FigureState} from './figures'
import type {Picture} from './picture'
import type {BifurcationSample} from './plotScene'

const viewport = {xMin: 0, xMax: 1, yMin: 0, yMax: 1, width: 1, height: 1, radius: 1}

/** Unlike live plotting, every slider event must finish: queue samples instead of debouncing them. */
export default class BifurcationRecorder {
    private queue: {states: FigureState[], sample: BifurcationSample}[] = []
    private seen = new Set<number>()
    private generation = 0
    private running = false

    constructor(private computer: Pick<PlotWorkerClient, 'compute' | 'dispose'>,
        private result: (picture: Picture, value: number) => void,
        private error: (error: unknown) => void,
        private pending: (count: number) => void = () => {}) {}

    record(states: FigureState[], sample: BifurcationSample) {
        if (!Number.isFinite(sample.value) || this.seen.has(sample.value)) return
        this.seen.add(sample.value)
        this.queue.push({states, sample})
        this.pending(this.queue.length + Number(this.running))
        if (!this.running) void this.drain(this.generation)
    }

    private async drain(generation: number) {
        this.running = true
        while (this.queue.length && generation === this.generation) {
            const job = this.queue.shift()!
            try {
                const picture = await this.computer.compute(job.states, viewport, undefined, undefined, job.sample)
                if (generation !== this.generation) return
                this.result(picture, job.sample.value)
            } catch (error) {
                if (generation !== this.generation) return
                this.seen.delete(job.sample.value)
                this.error(error)
            }
            this.pending(this.queue.length)
        }
        if (generation === this.generation) this.running = false
    }

    clear() {
        this.generation++
        this.queue = []
        this.seen.clear()
        this.running = false
        this.computer.dispose()
    }
}
