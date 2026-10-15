import type Coords from './Coords'
import type { Axes } from './plot'
import { translateAxes, zoomAxes } from './plot'

type Viewport = {width: number, height: number}
type Baseline = {axes: Axes, viewport: Viewport, center: Coords, distance: number}

/** Track one pan or pinch, rebasing whenever fingers are added or removed. */
export default class CanvasGesture {
    private pointers = new Map<number, Coords>()
    private baseline: Baseline|null = null
    private moved = false

    private geometry() {
        const [first, second] = Array.from(this.pointers.values())
        return second ? {
            center: {x: (first.x + second.x) / 2, y: (first.y + second.y) / 2},
            distance: Math.hypot(first.x - second.x, first.y - second.y),
        } : {center: first, distance: 0}
    }

    private rebase(axes: Axes, viewport: Viewport) {
        this.baseline = this.pointers.size ? {axes, viewport, ...this.geometry()} : null
    }

    begin(id: number, point: Coords, axes: Axes, viewport: Viewport) {
        if (!this.pointers.size) this.moved = false
        this.pointers.set(id, point)
        // A multi-finger gesture must never insert a point when the fingers lift.
        if (this.pointers.size > 1) this.moved = true
        this.rebase(axes, viewport)
    }

    move(id: number, point: Coords): Axes|undefined {
        if (!this.pointers.has(id) || !this.baseline) return
        this.pointers.set(id, point)
        const {axes, viewport, center: start, distance: initialDistance} = this.baseline
        const {center, distance} = this.geometry()
        const dx = center.x - start.x
        const dy = center.y - start.y
        if (Math.hypot(dx, dy) > 3) this.moved = true
        if (!this.moved || viewport.width <= 0 || viewport.height <= 0) return
        let factor = 1
        if (this.pointers.size > 1) {
            // Coincident fingers have no usable scale; resume from a fresh baseline.
            if (initialDistance < 1) {
                this.rebase(axes, viewport)
                return
            }
            if (distance < 1) return
            factor = distance / initialDistance
        }
        const anchor = {
            x: axes.x + (2 * start.x / viewport.width - 1) * axes.rx,
            y: axes.y - (2 * start.y / viewport.height - 1) * axes.ry,
        }
        const zoomed = zoomAxes(axes, factor, anchor.x, anchor.y)
        if (factor !== 1 && zoomed === axes) return
        const result = translateAxes(zoomed,
            -dx * 2 * zoomed.rx / viewport.width,
            dy * 2 * zoomed.ry / viewport.height)
        if (Object.values(result).every(Number.isFinite)) return result
    }

    end(id: number, axes: Axes, viewport: Viewport, cancelled = false): boolean {
        if (!this.pointers.has(id)) return false
        const tap = !cancelled && !this.moved && this.pointers.size === 1
        if (cancelled) this.moved = true
        this.pointers.delete(id)
        this.rebase(axes, viewport)
        return tap
    }
}
