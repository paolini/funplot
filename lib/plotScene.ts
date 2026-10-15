import {createFigure, type FigureState, type Figure} from './figures'
import type {AxesWrapper} from './plot'
import type {Picture} from './picture'

/** Only plain data crosses the worker boundary, never compiled functions or a canvas. */
export type FigurePresentation = Pick<Figure, 'tex' | 'errors'>
export type PanelFigure = FigurePresentation & {state: FigureState}

export type PlotRequest = {
    id: number
    states: FigureState[]
    viewport: AxesWrapper
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
    prepared(figures.map(({tex, errors}) => ({tex, errors})))

    let picture: Picture = [{type: 'axes', options: {labels: {x: 'x', y: 'y'}}}]
    for (const figure of figures) picture = picture.concat(await figure.plot(viewport, parameters))
    return picture
}
