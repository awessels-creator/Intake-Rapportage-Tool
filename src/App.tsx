import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    window.location.replace('/Intake-Rapportage-Tool/juli-2026/')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Intakerapportage</h1>
        <p className="text-gray-500">Verplaats naar de nieuwe versie...</p>
        <a 
          href="/Intake-Rapportage-Tool/juli-2026/" 
          className="text-blue-600 underline mt-2 inline-block"
        >
          Klik hier als je niet automatisch wordt doorgestuurd
        </a>
      </div>
    </div>
  )
}
