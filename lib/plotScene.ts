import {createFigure, type FigureState, type Figure} from './figures'
import type {AxesWrapper} from './plot'
import type {Picture} from './picture'
import {plotBifurcation} from './plotRecurrence'

export type BifurcationSample = {figureIndex: number, parameterName: string, value: number}

/** Only plain data crosses the worker boundary, never compiled functions or a canvas. */
export type FigurePresentation = Pick<Figure, 'tex' | 'errors'>
export type PanelFigure = FigurePresentation & {state: FigureState}

export type PlotRequest = {
    id: number
    states: FigureState[]
    viewport: AxesWrapper
    sample?: BifurcationSample
}

export type PlotResponse =
    | {id: number, type: 'prepared', figures: FigurePresentation[]}
    | {id: number, type: 'picture', picture: Picture}
    | {id: number, type: 'error', message: string}

/** Shared by the browser worker and regression tests. No DOM or drawing operations. */
export async function calculateScene(
    states: FigureState[],
    viewport: AxesWrapper,
    prepared: (figures: FigurePresentation[]) => void = () => {},
): Promise<Picture> {
    const names = states.filter(state => state.type === 'parameter').map(state => state.name)
    const figures = states.map(state => createFigure(state, names))
    const parameters = Object.fromEntries(names.map(name => [name, 0]))
    for (const figure of figures) figure.eval(parameters)
    const errorCounts = figures.map(figure => figure.errors.length)
    prepared(figures.map(({tex, errors}) => ({tex, errors})))

    let picture: Picture = [{type: 'axes', options: {labels: {x: 'x', y: 'y'}}}]
    for (const figure of figures) picture = picture.concat(await figure.plot(viewport, parameters))
    // Some expressions are valid at x=0 but fail elsewhere in the visible domain.
    if (figures.some((figure, i) => figure.errors.length !== errorCounts[i])) {
        prepared(figures.map(({tex, errors}) => ({tex, errors})))
    }
    return picture
}

export function calculateBifurcationSample(states: FigureState[], sample: BifurcationSample): Picture {
    const state = states[sample.figureIndex]
    if (state?.type !== 'recurrence' || !Number.isFinite(state.start)) {
        throw new Error('Choose an initial point on the cobweb diagram first.')
    }
    const parameterStates = states.filter(state => state.type === 'parameter')
    if (!parameterStates.some(state => state.name === sample.parameterName)) {
        throw new Error('The bifurcation parameter is no longer available.')
    }
    const names = parameterStates.map(state => state.name)
    const parameters = Object.fromEntries(names.map(name => [name, 0]))
    for (const parameter of parameterStates) {
        const figure = createFigure(parameter.name === sample.parameterName
            ? {...parameter, expr: String(sample.value)} : parameter, names)
        figure.eval(parameters)
        if (figure.errors.length) throw new Error(figure.errors.join('; '))
    }
    const figure = createFigure(state, names)
    if (!figure.compiledExpr || figure.errors.length) throw new Error(figure.errors.join('; '))
    const variables = {...parameters, x: state.start}
    return plotBifurcation(x => {
        variables.x = x
        return figure.compiledExpr!.evaluate(variables)
    }, sample.value, state.start, state.webColor)
}
