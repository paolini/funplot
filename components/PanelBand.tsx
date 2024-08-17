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
                <FaTrash     className="inline border bg-blue-300 p-1 hover:border-black" onClick={evt => move(+0)} size="2em"/>
                <FaArrowUp   className="inline border bg-blue-300 p-1 hover:border-black" onClick={evt => move(-1)} size="2em"/>
                <FaArrowDown className="inline border bg-blue-300 p-1 hover:border-black" onClick={evt => move(+1)} size="2em"/>
            </div>
        }   
    </div>
}

