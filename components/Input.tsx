import {State,get,onChange} from '@/lib/State'

export default function Input({expr,size,right}:{
    expr: State<string>,
    size?: number,
    right?: boolean,
}){
    return <input 
        className="h-8 border p-1 bg-blue-100" 
        style={{textAlign: right?'right':'left'}}
        type="text" 
        value={get(expr)} 
        onChange={onChange(expr)} 
        size={size || undefined}
    />
}

