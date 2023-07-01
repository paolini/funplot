import { State, get, map, remove } from '@/lib/State'

export interface IMessage {
    type: 'info' | 'error' | 'warning',
    message: string,
}

export default function Messages({messages}: {
    messages: State<IMessage[]>
}) {
    return <ul>
        {
            map(messages, (message, i) => {
                const color = {
                    'info': 'white', 
                    'error': 'red', 
                    'warning': 'yellow'}[get(message).type]
                return <li className={`bg-${color} m-1 rounded`} key={i}>
                <span className="m-1 border hover:cursor-pointer hover:border-black" onClick={
                    () => remove<IMessage>(messages, message)
                }>[x]</span>
                {get(message).message}
            </li>})
        }
    </ul>
}