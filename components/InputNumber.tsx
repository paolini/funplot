import {useState} from 'react'

import {State,get,set} from '@/lib/State'

export default function InputNumber({expr,size,right}:{
    expr: State<number>,
    size?: number,
    right?: boolean,
}){
    const value = useState<string>(`${get(expr)}`)
    const error=useState<boolean>(false)
    return <input 
        className={`h-8 border p-1 ${get(error)?'bg-red-300':'bg-blue-100'}`}
        style={{textAlign: right?'right':'left'}}
        type="text" 
        value={get(value)} 
        onChange={(evt) => {
            const s = evt.target.value
            const v = parseFloat(s)
            if (isNaN(v)) {
                set(error, true)
            } else {
                set(error, false)
                set(value, s)
                set(expr, v)
            }
        }}
        size={size || undefined}
    />
}
