import { get, update, State } from '@/lib/State'
import Coords from '@/lib/Coords'

export default function Points({points, gridPoints}: 
    {points: State<Coords[]>, gridPoints: boolean}) {
    return <div className="flex flex-wrap">
    { get(points).length > 0 
        ? get(points).map((p,i) =>  
        <span 
            key={i} 
            className="online hover:line-through hover:bg-blue-300 mr-1"
            onClick={() => update(points, points => points.filter((_,j) => i!==j))}
        >({Math.round(p.x*100)/100}, {Math.round(p.y*100)/100})</span>)
        : (!gridPoints && <span className="online bg-red-300"> click on picture to draw an integral line or check &apos;fill plane&apos;
          </span>)
    }
    </div>
}
