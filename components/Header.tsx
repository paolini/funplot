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
            className="border mx-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 rounded inline-flex items-center"
            onClick={share}>
            <FaShareAlt className="mt-1 mx-1 btn"/>
            <span>share</span>
        </button>
        {/*
        <button 
            className="border mx-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 rounded inline-flex items-center"
            onClick={downloadPDF}
            >
            <FaDownload className="mt-1 mx-1 button"/>
            <span>pdf</span>
        </button>
        */}
    </div>
    </div>
}
