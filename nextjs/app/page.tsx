import Image from 'next/image'

export default function Home() {
  return <main className="flex flex-col flex-1 bg-blue-500">
    <h1 className="">Funplot</h1>
    <div className="block">
      <select className="border">
          <option disabled value="">new plot (select type)</option>
          <option value="graph">graph y=f(x)</option>
          <option value="graph_inverted">graph x=f(y)</option>
          <option value="implicit">level curve f(x,y)=0</option>
          <option value="ode_equation">ODE equation</option>
          <option value="ode_system">ODE system</option>
      </select>
    </div>
    <div className="block">    
    <span>x={"..."}</span>, <span>y={"..."}</span>
    </div>
    <div className="flex-1 border-2 border-black h-8">  
    <canvas className="h-full w-full" />
    </div>
    </main>
}
