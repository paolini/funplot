export interface Axes {
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    height: number,
    width: number,
    radius: number,

    x_pixel: (x: number) => number,
    y_pixel: (y: number) => number,  
  }
  
export type Point = [number, number] // [x,y]
export type Square = [Point, Point] // [[x,y],[dx,dy]]
export type Segment = [Point, Point] // [[x,y],[dx,dy]]

export type Line = {
    type: "line",
    closed: boolean,
    arrows: boolean,
    points: Point[]
} | {
    type: "squares",
    squares: Square[]
} | {
    type: "segments",
    arrow: boolean,
    segments: Segment[]
}

export type Lines = Line[]
  
  