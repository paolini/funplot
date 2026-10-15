import type {FigureState} from './figures'
import type Coords from './Coords'

/** Interaction changes state on the UI thread; formula evaluation stays in the worker. */
export function figureClick(state: FigureState, point: Coords): FigureState {
    switch (state.type) {
        case 'ode':
        case 'system':
            return {...state, points: [...state.points, point]}
        case 'recurrence':
            return {...state, start: point.x}
        default:
            return state
    }
}
