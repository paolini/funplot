import { useState } from 'react'
import { HexColorPicker } from "react-colorful"
import { get, update, set, State } from '@/lib/State'

export default function ColorBlock({color, active, className}:{
    color?: State<string>,
    active?: State<boolean>,
    className?: string,
}) {
    const open = useState<boolean>(false)
    const isActive = active ? get(active) : true
    const theColor = color ? get(color) : "#000"
    return <div className="inline">
        <div 
            className={`${className||""} w-5 h-5 ${color?'rounded':'rounded-full'} m-1`} 
            style={{background: theColor}}
            onClick={() => (isActive?update(open, open => !open):(active && set(active, true)))}
        />
        {isActive && get(open) && color && <HexColorPicker 
            className=""
            color={theColor} 
            onChange={_ => set(color, _)} 
            />}
    </div>
}

