import type PlotWorkerClient from './PlotWorkerClient'
import type {FigureState} from './figures'
import type {Picture} from './picture'
import type {BifurcationSample} from './plotScene'

const viewport = {xMin: 0, xMax: 1, yMin: 0, yMax: 1, width: 1, height: 1, radius: 1}

/** Unlike live plotting, every slider event must finish: queue samples instead of debouncing them. */
export default class BifurcationRecorder {
    private queue: {states: FigureState[], sample: BifurcationSample, key: string}[] = []
    private seen = new Set<string>()
    private generation = 0
    private running = false

    constructor(private computer: Pick<PlotWorkerClient, 'compute' | 'dispose'>,
        private result: (picture: Picture, value: number | null) => void,
        private error: (error: unknown) => void,
        private pending: (count: number) => void = () => {}) {}

    record(states: FigureState[], sample: BifurcationSample) {
        const state = states[sample.figureIndex]
        const parameter = states.find(state => state.type === 'parameter' && state.name === sample.parameterName)
        const expression = parameter?.type === 'parameter' ? parameter.expr : ''
        const currentValue = expression.trim() && Number.isFinite(Number(expression)) ? Number(expression) : ['expression', expression]
        const key = JSON.stringify([sample.value ?? currentValue, state?.type === 'recurrence' ? state.start : null])
        if ((sample.value !== null && !Number.isFinite(sample.value)) || this.seen.has(key)) return
        this.seen.add(key)
        this.queue.push({states, sample, key})
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
                this.seen.delete(job.key)
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
