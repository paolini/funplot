import { ChangeEvent, ChangeEventHandler } from "react"

export type SetState<T> = (cb: (newValue: T) => T) => void

// [value, setValue] pairs
export type State<T> = [T, SetState<T>]

// get the value of a state [value, setValue]
export function get<T>([value, setValue]: State<T>): T {
    return value
}

// get the field of a state [value, setValue]
export function getField<T,K extends keyof T>([value, setValue]: State<T>, field: K): State<T[K]> {
    return [value[field], (cb: (newValue: T[K]) => T[K]) => setValue(value => ({...value, [field]: cb(value[field])}))]
}

// set the value of a state [value, setValue]
// with a constant value 
export function set<T>([value, setValue]: State<T>, newValue: T) {
    setValue(() => newValue)
}

// set the value of a state [value, setValue]
// with a function of the current value
export function update<T>([value, setValue]: State<T>, cb: (newValue: T) => T) {
    setValue(cb)
}

// onChange event handler of input for a string state [value, setValue]
export function onChange([value, setValue]: State<string>): ChangeEventHandler<HTMLInputElement> {
    return (evt: ChangeEvent<HTMLInputElement>) => setValue(_ => evt.target.value)
}

export function onChangeBoolean([value, setValue]: State<boolean>): ChangeEventHandler<HTMLInputElement> {
    return (evt: ChangeEvent<HTMLInputElement>) => setValue(_ => evt.target.checked)
}


// map a function over a state [value, setValue]
// building the setState function for each element of the array
export function map<T,U>([value, setValue]: State<T[]>, f: (item: State<T>, i: number) => U): U[] {
    return value.map((item,i) => f([item, (setItem: (x:T)=> T) => setValue(value => value.map(item2 => item2===item ? setItem(item2) : item2))],i))
}

// maybe you have an array of states [value, setValue]
// which is not omogeneous in type.
// then if you know the type of an element you 
// can extract the [value, setValue] pair for that element
export function extract<T,U>(arrayPair: State<(T|U)[]>, value: U): State<U> {
    const [values, setValues] = arrayPair
    const setValue: SetState<U> = cb => setValues(values => values.map(
        (item: T|U) => item===value ? cb(item) : item
    ))
    return [ value, setValue]
}

// remove an element from an array state
export function remove<T>([values, setValues]: State<T[]>, value: State<T>) {
    setValues(values => values.filter(item => item!==get(value)))
}