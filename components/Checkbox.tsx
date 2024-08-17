import { get, State, onChangeBoolean } from '@/lib/State'

export default function Checkbox({value, children}:{
    value: State<boolean>,
    children: any,
}) {
    return <label className="flex flex-row items-center mx-1">
        <input className="mr-1" type="checkbox" checked={get(value)} onChange={onChangeBoolean(value)} />
        {children}
    </label>
}

