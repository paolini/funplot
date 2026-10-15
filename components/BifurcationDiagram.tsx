import {useState, useEffect, useCallback, useImperativeHandle, type Ref, type ReactNode} from 'react'
import type {FigureState, ParameterState, RecurrenceFigureState} from '@/lib/figures'
import type {Axes, ContextWrapper} from '@/lib/plot'
import type {Picture} from '@/lib/picture'
import {draw} from '@/lib/funplot'
import {createPlotWorker} from '@/lib/createPlotWorker'
import BifurcationRecorder from '@/lib/BifurcationRecorder'
import {bifurcationSignature} from '@/lib/bifurcationState'
import Canvas from './Canvas'

export type BifurcationHandle = {sample: (states: FigureState[], parameter: string, value: number) => void}

export default function BifurcationDiagram({states, figureIndex, axes, choose, ref}: {
    states: FigureState[],
    figureIndex: number,
    axes: Axes,
    choose: (parameter: string, value: number) => void,
    ref: Ref<BifurcationHandle>,
}) {
    const parameters = states.filter((state): state is ParameterState => state.type === 'parameter')
    const [selected, setSelected] = useState(parameters[0].name)
    const parameter = parameters.find(parameter => parameter.name === selected) ?? parameters[0]
    const recurrence = states[figureIndex] as RecurrenceFigureState
    return <section style={{maxWidth: '100%'}} aria-label="Bifurcation diagram">
        <RecordedDiagram key={bifurcationSignature(states, recurrence, parameter.name)}
            ref={ref} recurrence={recurrence} parameter={parameter} axes={axes} figureIndex={figureIndex} choose={choose}>
            <div className="flex items-center gap-2">
                <h2>Bifurcation diagram</h2>
                {parameters.length > 1
                    ? <select className="app-select" aria-label="Bifurcation parameter" value={parameter.name}
                        onChange={event => setSelected(event.target.value)}>
                        {parameters.map((parameter, i) => <option key={i} value={parameter.name}>{parameter.name}</option>)}
                      </select>
                    : <span>({parameter.name})</span>}
            </div>
        </RecordedDiagram>
    </section>
}

function RecordedDiagram({recurrence, parameter, axes: mainAxes, figureIndex, choose, ref, children}: {
    recurrence: RecurrenceFigureState,
    parameter: ParameterState,
    axes: Axes,
    figureIndex: number,
    choose: (parameter: string, value: number) => void,
    ref: Ref<BifurcationHandle>,
    children: ReactNode,
}) {
    const [history, setHistory] = useState<{picture: Picture, samples: number, points: number}>(
        {picture: [], samples: 0, points: 0})
    const [pending, setPending] = useState(0)
    const [error, setError] = useState('')
    const [recorder] = useState(() => new BifurcationRecorder(createPlotWorker(), picture => {
        setHistory(history => ({picture: history.picture.concat(picture), samples: history.samples + 1,
            points: history.points + picture.reduce((count, element) => count + (element.type === 'points' ? element.points.length : 0), 0)}))
        setError('')
    }, error => setError(String(error)), setPending))
    useEffect(() => () => recorder.clear(), [recorder])
    useImperativeHandle(ref, () => ({sample(states, name, value) {
        if (name !== parameter.name || !Number.isFinite(recurrence.start)) return
        recorder.record(states, {figureIndex, parameterName: name, value})
    }}), [recorder, parameter.name, recurrence.start, figureIndex])

    const plot = useCallback((ctx: ContextWrapper) => {
        draw(ctx, [{type: 'axes', options: {labels: {x: parameter.name, y: 'x'}}}, ...history.picture], {})
    }, [history.picture, parameter.name])

    return <>
        <BifurcationViewport key={`${parameter.min}:${parameter.max}`} parameter={parameter} mainAxes={mainAxes}
            plot={plot} choose={choose} />
        {children}
        <div className="flex items-center gap-2">
            <button className="app-button" onClick={() => {
                recorder.clear()
                setHistory({picture: [], samples: 0, points: 0})
                setPending(0)
                setError('')
            }}>Clear samples</button>
            <span role="status">Samples: {history.samples} · points: {history.points}{pending ? ` · pending: ${pending}` : ''}</span>
        </div>
        <p>{Number.isFinite(recurrence.start)
            ? 'Move the slider or click here to add samples. Drag or pinch to explore.'
            : 'Choose an initial point on the cobweb diagram first.'}</p>
        {error && <p role="alert">{error}</p>}
    </>
}

/** Changing the slider bounds refits the viewport without clearing recorded samples. */
function BifurcationViewport({parameter, mainAxes, plot, choose}: {
    parameter: ParameterState,
    mainAxes: Axes,
    plot: (ctx: ContextWrapper) => void,
    choose: (parameter: string, value: number) => void,
}) {
    const [axes, setAxes] = useState<Axes>(() => ({
        x: (parameter.min + parameter.max) / 2, rx: (parameter.max - parameter.min) / 2,
        y: mainAxes.x, ry: mainAxes.rx,
    }))
    return <Canvas axes={axes} setAxes={setAxes} isometric={false} width={480}
        label={`Bifurcation diagram for ${parameter.name}`} plot={plot}
        click={point => choose(parameter.name, point.x)} />
}
