import { FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa'

import { get, State } from '@/lib/State'
import Separator from './Separator'
import ColorBlock from './ColorBlock'
import Formula from './Formula'

export default function PanelBand({active, color, children, tex, move}:{
    active: State<boolean>,
    color?: State<string>,
    tex: string
    children: any,
    move: (n: number) => void,
}) {
    return <div className="flex flex-row items-center">
        <ColorBlock color={color} active={active}/>
        <Formula tex={tex} active={active}/>
        {get(active) && <Separator />}
        {get(active) && children}
        {get(active) &&
            <div>
                <button className="app-button app-icon-button" onClick={evt => move(+0)} aria-label="delete">
                    <FaTrash className="app-icon" />
                </button>
                <button className="app-button app-icon-button" onClick={evt => move(-1)} aria-label="move-up">
                    <FaArrowUp className="app-icon" />
                </button>
                <button className="app-button app-icon-button" onClick={evt => move(+1)} aria-label="move-down">
                    <FaArrowDown className="app-icon" />
                </button>
            </div>
        }   
    </div>
}

