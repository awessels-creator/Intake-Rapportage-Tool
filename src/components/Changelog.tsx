import { useState, useEffect } from 'react'
import { HiTag, HiXMark, HiChevronDown } from 'react-icons/hi2'
import changelogData from '../changelog.json'

interface ChangeVersion {
  version: string
  date: string
  categories: {
    title: string
    items: string[]
  }[]
}

export default function Changelog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [showPatches, setShowPatches] = useState(false)
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    [changelogData.versions[0].version]: true
  })

  const versions = changelogData.versions as ChangeVersion[]
  const currentVersion = versions[0].version

  // Filter versions: always show if not a patch, or if showPatches is true.
  // A version is considered a patch if it has a second dot (e.g. X.Y.Z where Z > 0)
  const filteredVersions = versions.filter(v => {
    if (showPatches) return true
    const parts = v.version.split('.')
    const isPatch = parts.length > 2 && parts[2] !== '0'
    return !isPatch
  })

  // Handle modal animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }))
  }

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[250] flex items-center gap-2 px-3 py-1.5 bg-white border border-rule rounded-lg shadow-sm hover:bg-warm hover:shadow-md transition-all duration-200 cursor-pointer group"
      >
        <HiTag className="text-accent text-[0.9rem]" />
        <span className="text-[0.75rem] font-bold text-inkl">v{currentVersion}</span>
      </button>

      {/* Modal Overlay */}
      {isRendered && (
        <div 
          className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm transition-opacity duration-200 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={`bg-paper w-full max-w-md h-[600px] overflow-hidden rounded-xl shadow-xl flex flex-col border border-rule transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-rule bg-warm/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[1.1rem] font-bold text-ink">Update Historie</h2>
                  <p className="text-[0.7rem] text-inkl font-medium">Wat is er veranderd?</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-warm transition-colors cursor-pointer text-inkl"
                  aria-label="Sluiten"
                >
                  <HiXMark className="text-[1.2rem]" />
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    className="relative w-7 h-4 rounded-full bg-rule transition-colors duration-200 group-hover:bg-accent/20"
                    onClick={() => setShowPatches(!showPatches)}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${showPatches ? 'translate-x-3 !bg-accent' : ''}`} />
                  </div>
                  <span className="text-[0.65rem] font-bold text-inkl uppercase tracking-tight">Toon kleine updates</span>
                </label>
                {!showPatches && versions.length > filteredVersions.length && (
                  <span className="text-[0.6rem] text-accent font-medium italic">
                    +{versions.length - filteredVersions.length} verborgen
                  </span>
                )}
              </div>
            </div>

            {/* Content - Clean Accordion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredVersions.map((v) => {
                const isExpanded = !!expandedVersions[v.version]
                return (
                  <div 
                    key={v.version} 
                    className="border border-rule rounded-lg overflow-hidden bg-white"
                  >
                    <button
                      onClick={() => toggleVersion(v.version)}
                      className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left transition-colors duration-200 ${isExpanded ? 'bg-warm/30' : 'hover:bg-warm/20'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[0.85rem] font-bold text-ink">Versie {v.version}</span>
                        <span className="text-[0.7rem] text-inkl">{v.date}</span>
                      </div>
                      <HiChevronDown className={`text-inkl text-[0.9rem] transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                    </button>

                    <div 
                      className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-5 pt-2">
                          <div className="space-y-5">
                            {v.categories.map((cat) => (
                              <div key={cat.title}>
                                <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-accent mb-2.5">{cat.title}</h3>
                                <ul className="space-y-2">
                                  {cat.items.map((item, i) => (
                                    <li key={i} className="flex gap-2.5 text-[0.8rem] text-ink/80 leading-normal">
                                      <span className="text-accent mt-1.5 text-[0.4rem] shrink-0">●</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 bg-warm/10 text-center border-t border-rule">
              <p className="text-[0.65rem] text-inkl/50 font-medium tracking-wide uppercase">Intakerapportage • 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
