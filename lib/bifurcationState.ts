import type {FigureState, RecurrenceFigureState} from './figures'

/** Swept values, seeds and viewport changes preserve ink; changing the formula resets it. */
export function bifurcationSignature(states: FigureState[], recurrence: RecurrenceFigureState, parameter: string) {
    return JSON.stringify([recurrence.expr,
        parameter, states.filter(state => state.type === 'parameter')
            .map(state => [state.name, state.name === parameter ? null : state.expr])])
}

/** One column per visible pixel, bounded even when the previous click is far off-screen. */
export function bifurcationRange(from: number | null, to: number, step: number): number[] {
    if (!Number.isFinite(to)) return []
    if (from === null || !Number.isFinite(from) || from === to || !Number.isFinite(step) || step <= 0) return [to]
    const distance = to - from
    const intervals = Math.min(2000, Math.max(1, Math.ceil(Math.abs(distance) / step)))
    return Array.from({length: intervals + 1}, (_, i) => {
        if (i === 0) return from
        if (i === intervals) return to
        const t = i / intervals
        return Number.isFinite(distance) ? from + distance * t : from * (1 - t) + to * t
    })
}
