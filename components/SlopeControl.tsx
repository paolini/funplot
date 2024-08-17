import { get, State } from '@/lib/State'
import ColorBlock from './ColorBlock'
import Checkbox from './Checkbox'

export default function SlopeControl({value, color}:{
    value: State<boolean>,
    color: State<string>
}) {
return <div className="flex flex-row items-center">
    {get(value) && <ColorBlock className="flex mr-1" color={color} />}
    <Checkbox value={value}>draw slope field</Checkbox>
</div>
}
