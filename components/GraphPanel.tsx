import { get, getField, State } from '@/lib/State'
import { FigureState, GraphFigureState, Figure } from '@/lib/figures'
import PanelBand from './PanelBand'
import Input from './Input'
import Errors from './Errors'

export default function GraphPanel({state, figure, active, move}: 
    {
        state: State<GraphFigureState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    return <PanelBand 
                tex={figure.tex} 
                color={color} 
                active={active}
                move={n => move(figure.state, n)}
                >
        <div className="flex flex-row px-2 items-center">
            <span>{get(state).inverted?'x=f(y)=':'y=f(x)='}</span>
            <Input expr={expr} />
            <Errors errors={figure.errors} />
        </div>
    </PanelBand>
  }

