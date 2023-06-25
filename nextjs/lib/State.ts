import { ChangeEvent, ChangeEventHandler } from "react"

// [value, setValue] pairs
export type State<T> = [T, (cb: (newValue: T) => T) => void]

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

// map a function over a state [value, setValue]
// building the setState function for each element of the array
export function map<T,U>([value, setValue]: State<T[]>, f: (item: State<T>, i: number) => U): U[] {
    return value.map((item,i) => f([item, (setItem: (x:T)=> T) => setValue(value => value.map(item2 => item2===item ? setItem(item2) : item2))],i))
}
