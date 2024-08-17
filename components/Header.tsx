import { FaGithub, FaShareAlt, FaDownload } from 'react-icons/fa'
import { VERSION } from '@/app/info'
import { State, get, update } from '@/lib/State'
import {IPanel, newPanel} from '@/lib/funplot'
import Coords from '@/lib/Coords'

export default function Header({panelsPair, share, downloadPDF, cursor}:{
    panelsPair: State<IPanel[]>,
    share: () => void,
    downloadPDF: () => void,
    cursor: State<Coords>
}) {
return <div className="block">
    <div className="flex flex-row">
        <a className="flex font-bold mx-1" href="https://github.com/paolini/funplot">
            <FaGithub className="block me-1 mt-1"/>
            <span className="block">FunPlot {VERSION}</span>
        </a>
        <select 
            value="" 
            className="border mx-1 bg-gray-300 hover:bg-gray-400 text-gray-800" 
            onChange={evt => update(panelsPair, panels => [...panels, newPanel(evt.target.value)])}
        >
            <option value="" disabled={true}>choose plot type</option>
            <option value="graph">graph y=f(x)</option>
            <option value="graph_inverted">graph x=f(y)</option>
            <option value="implicit">level curve f(x,y)=0</option>
            <option value="ode">ODE equation</option>
            <option value="system">ODE system</option>
            <option value="" disabled={true}>-------</option>
            <option value="parameter">new parameter</option>
        </select>
        <button 
            className="border mx-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 rounded inline-flex items-center"
            onClick={share}>
            <FaShareAlt className="mt-1 mx-1 btn"/>
            <span>share</span>
        </button>
        <button 
            className="border mx-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 rounded inline-flex items-center"
            onClick={downloadPDF}
            >
            <FaDownload className="mt-1 mx-1 button"/>
            <span>pdf</span>
        </button>
        <span>x={get(cursor).x}</span><span className="ms-2">y={get(cursor).y}</span>
    </div>
    </div>
}
