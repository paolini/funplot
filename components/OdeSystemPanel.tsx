import { get, getField, State } from '@/lib/State'
import { FigureState, OdeSystemFigureState, Figure } from '@/lib/figures'
import PanelBand from './PanelBand'
import SlopeControl from './SlopeControl'
import Separator from './Separator'
import Points from './Points'
import Checkbox from './Checkbox'
import Input from './Input'
import Errors from './Errors'

export default function OdeSystemPanel({state, figure, active, move} : {
    state: State<OdeSystemFigureState>,
    figure: Figure,
    active: State<boolean>
    move: (f: FigureState, n: number) => void,
}) {
const color = getField(state,'color')
const slopeColor = getField(state,'slopeColor')
const exprX: State<string> = getField(state, 'exprX')
const exprY: State<string> = getField(state, 'exprY')
const drawSlope: State<boolean> = getField(state, 'drawSlope')
const gridPoints: State<boolean> = getField(state, 'gridPoints') 
const points = getField(state, 'points')

return <PanelBand 
            active={active} 
            tex={figure.tex} 
            color={color}
            move={(n: number) => move(figure.state, n)}
        >
    <div className="flex flex-col">
        <div className="flex flex-row">
            <table><tbody>
                <tr>
                    <td className="text-right min-w-max whitespace-nowrap">
                    x&apos; = f(x,y) 
                    </td>
                    <td className="min-w-max whitespace-nowrap">
                    = <Input expr={exprX} />
                    </td>
                </tr>
                <tr>
                    <td className="text-right min-w-max whitespace-nowrap">
                    y&apos; = g(x,y) 
                    </td>
                    <td className="min-w-max whitespace-nowrap">
                    = <Input expr={exprY} />
                    </td>
                </tr></tbody>
            </table>
            <Separator />
            <SlopeControl value={drawSlope} color={slopeColor} />
            <Checkbox value={gridPoints}>fill plane</Checkbox>
            <Errors errors={figure.errors} />
        </div>
        <Points points={points} gridPoints={get(gridPoints)} />
    </div>
</PanelBand>
}

