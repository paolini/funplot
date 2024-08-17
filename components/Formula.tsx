import 'katex/dist/katex.min.css'
import TeX from '@matejmazur/react-katex'
import { State, get, set } from '@/lib/State'

export default function Formula({tex,active}:{
    tex: string,
    active: State<boolean>
}) {
    if (get(active)) return <TeX 
            className="px-1 hover:bg-blue-300 border border-blue-200 hover:border-blue-400 rounded" 
            math={tex} 
            onClick={() => set(active, false)}
            block />
    else return <TeX 
            className="hover:bg-blue-300 hover:border rounded" 
            math={tex} 
            onClick={() => set(active, true)}
        />
}

