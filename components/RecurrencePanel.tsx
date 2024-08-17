import { get, getField, State } from '@/lib/State'
import { FigureState, RecurrenceFigureState, Figure } from '@/lib/figures'
import PanelBand from './PanelBand'
import ColorBlock from './ColorBlock'
import Input from './Input'
import Errors from './Errors'

export default function RecurrencePanel({state, figure, active, move}: 
    {
        state: State<RecurrenceFigureState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const graphColor = getField(state,'graphColor')
    const webColor = getField(state,'webColor')
    const expr: State<string> = getField(state, 'expr')
    const start = getField(state, 'start')

    return <PanelBand 
                tex={figure.tex} 
                color={webColor} 
                active={active}
                move={n => move(figure.state, n)}
                >
        <div className="flex flex-row px-2 items-center">
            <ColorBlock className="flex mr-1" color={graphColor} />            <span>f(x)=</span>
            <Input expr={expr} />
            {Number.isNaN(get(start)) && <span>clicca sul grafico per selezionare il punto iniziale</span>}
            <Errors errors={figure.errors} />
        </div>
    </PanelBand>
}

