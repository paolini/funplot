import type {FigureState, RecurrenceFigureState} from './figures'

/** Changing the swept value or viewport preserves ink; changing the dynamical system resets it. */
export function bifurcationSignature(states: FigureState[], recurrence: RecurrenceFigureState, parameter: string) {
    return JSON.stringify([recurrence.expr, Number.isFinite(recurrence.start) ? recurrence.start : null,
        parameter, states.filter(state => state.type === 'parameter')
            .map(state => [state.name, state.name === parameter ? null : state.expr])])
}
