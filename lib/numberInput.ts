/** Parse a complete decimal, accepting either decimal separator and scientific notation. */
export function parseNumberInput(text: string): number|undefined {
    const normalized = text.trim().replace(',', '.')
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return
    const value = Number(normalized)
    return Number.isFinite(value) ? value : undefined
}
