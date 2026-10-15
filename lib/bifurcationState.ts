import type {FigureState, RecurrenceFigureState} from './figures'

/** Swept values, seeds and viewport changes preserve ink; changing the formula resets it. */
export function bifurcationSignature(states: FigureState[], recurrence: RecurrenceFigureState, parameter: string) {
    return JSON.stringify([recurrence.expr,
        parameter, states.filter(state => state.type === 'parameter')
            .map(state => [state.name, state.name === parameter ? null : state.expr])])
}
