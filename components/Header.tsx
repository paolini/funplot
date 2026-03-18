import { FaGithub, FaShareAlt, FaDownload } from 'react-icons/fa'
import { VERSION } from '@/app/info'

export default function Header({share, downloadPDF}:{
    share: () => void,
    downloadPDF: () => void,
}) {
return <div className="block">
    <div className="flex flex-row">
        <a className="flex font-bold mx-1" href="https://github.com/paolini/funplot">
            <FaGithub className="block me-1 mt-1"/>
            <span className="block">FunPlot {VERSION}</span>
        </a>
        <button 
            className="app-button"
            onClick={share}>
            <FaShareAlt className="app-icon"/>
            <span>share</span>
        </button>
        <button 
            className="app-button"
            onClick={downloadPDF}
            >
            <FaDownload className="app-icon"/>
            <span>pdf</span>
        </button>
    </div>
    </div>
}
