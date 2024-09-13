import { DrawAxesOptions } from "./plot"

export type Point = [number, number] // [x,y]
export type Square = [Point, Point] // [[x,y],[dx,dy]]
export type Segment = [Point, Point] // [[x,y],[dx,dy]]

export type PictureElement = {
    type: "axes"
    options: DrawAxesOptions
}|{
    type: "line"
    color: string
    width: number
    closed: boolean
    arrows: boolean
    points: Point[]
}|{
    type: "squares"
    squares: Square[]
    fillColor: string
    drawColor: string
}|{
    type: "segments"
    color: string
    width: number
    arrow: boolean
    segments: Segment[]
}|{
    type: "points"
    color: string
    points: [number,number][]
}

export type Picture = PictureElement[]
  