import { useCallback, useState } from 'react'
import GraphView from './components/GraphView'
import ClusterPanel from './components/ClusterPanel'
import EventLog from './components/EventLog'
import { seedEvents } from './lib/seedData'
import './App.css'

function Toast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className={`toast ${message.type}`} role="status">
      <span>{message.text}</span>
      <button type="button" className="toast-dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  )
}

export default function App() {
  const [events, setEvents] = useState(seedEvents)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((text, type = 'info') => {
    setToast({ text, type })
    const timer = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(timer)
  }, [])

  const handleAddEvent = useCallback(
    (newEvent, mergeImpact) => {
      setEvents((prev) => [...prev, newEvent])

      if (newEvent.confidence === 'hint') {
        showToast(
          'Edge parked as unresolved — insufficient proof to merge identities',
          'warning',
        )
      } else if (mergeImpact.merges) {
        showToast(
          `${mergeImpact.clustersMerged} identities merged into 1 person`,
          'success',
        )
      }
    },
    [showToast],
  )

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Identity Resolution</h1>
          <p className="subtitle">
            Proven edges form persons. Hints never silently merge identities.
          </p>
        </div>
        <div className="header-stats">
          <span className="stat">
            <strong>{events.length}</strong> edges
          </span>
        </div>
      </header>

      <main className="workspace">
        <GraphView
          events={events}
          selectedNodeId={selectedNodeId}
          onNodeClick={(node) =>
            setSelectedNodeId((prev) => (prev === node.id ? null : node.id))
          }
        />
        <ClusterPanel
          events={events}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        <EventLog events={events} onAddEvent={handleAddEvent} />
      </main>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
