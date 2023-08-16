export type Point = [number, number] // [x,y]
export type Square = [Point, Point] // [[x,y],[dx,dy]]
export type Segment = [Point, Point] // [[x,y],[dx,dy]]

export type Line = {
    type: "line",
    color: string,
    width: number,
    closed: boolean,
    arrows: boolean,
    points: Point[]
} | {
    type: "squares",
    squares: Square[]
} | {
    type: "segments",
    color: string,
    width: number,
    arrow: boolean,
    segments: Segment[]
}

export type Lines = Line[]
  