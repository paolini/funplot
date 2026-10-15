import {useId, useState} from 'react'

import {State, get, set} from '@/lib/State'
import {parseNumberInput} from '@/lib/numberInput'

export default function InputNumber({expr, size, right, label, validate}: {
    expr: State<number>,
    size?: number,
    right?: boolean,
    label?: string,
    validate?: (value: number) => string|undefined,
}) {
    const value = get(expr)
    const [draft, setDraft] = useState(String(value))
    const [dirty, setDirty] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const errorId = useId()
    const text = dirty ? draft : String(value)
    const parsed = parseNumberInput(text)
    const error = submitted
        ? parsed === undefined ? 'Enter a finite number.' : validate?.(parsed)
        : undefined

    function commit() {
        if (!dirty) return
        if (parsed === undefined || validate?.(parsed)) {
            setSubmitted(true)
            return
        }
        set(expr, parsed)
        setDraft(String(parsed))
        setDirty(false)
        setSubmitted(false)
    }

    return <span className="inline-flex flex-col">
        <input
            className={`app-input ${error ? 'app-input--error' : ''}`}
            style={{textAlign: right ? 'right' : 'left'}}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={text}
            onChange={evt => {
                setDraft(evt.target.value)
                setDirty(true)
                setSubmitted(false)
            }}
            onBlur={commit}
            onKeyDown={evt => {
                if (evt.key === 'Enter') {
                    evt.preventDefault()
                    commit()
                } else if (evt.key === 'Escape') {
                    evt.preventDefault()
                    setDraft(String(value))
                    setDirty(false)
                    setSubmitted(false)
                }
            }}
            size={size}
        />
        {error && <span id={errorId} role="alert" className="text-sm text-red-700">{error}</span>}
    </span>
}
