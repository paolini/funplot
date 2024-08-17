export default function Errors({errors}:{
    errors: string[]
}) {
    if (errors.length===0) return null
    return <div className="bg-red-200">
        { errors.map((error,i) => <div className="" key={i}>{error}</div>)}
    </div>
}