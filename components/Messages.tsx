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
                const type = get(message).type
                return <li className={`app-message app-message--${type}`} key={i}>
                    <span className="app-message-close" onClick={() => remove<IMessage>(messages, message)}>[x]</span>
                    <span>{get(message).message}</span>
                </li>
            })
        }
    </ul>
}