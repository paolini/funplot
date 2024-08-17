import {State,getField} from '@/lib/State'
import {Figure} from '@/lib/figures'
import { FigureState, ImplicitFigureState } from '@/lib/figures'
import PanelBand from './PanelBand'
import Input from './Input'
import Errors from './Errors'

export default function ImplicitPanel({state, figure, active, move}: 
    {
        state: State<ImplicitFigureState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    return <PanelBand 
                color={color} 
                active={active} 
                tex={figure.tex}
                move={n => move(figure.state, n)}
            >
        <span>f(x,y)=</span>
        <Input expr={expr} />
        <Errors errors={figure.errors}/>
    </PanelBand>
  }
