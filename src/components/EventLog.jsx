import { useState } from 'react'
import { detectMergeImpact } from '../lib/resolution'

const PROOF_TYPES = [
  'oauth',
  'sso_record',
  'git_config',
  'corp_directory',
  'name_similarity',
  'same_network',
  'manual_review',
]

export default function EventLog({ events, onAddEvent }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [proof, setProof] = useState('oauth')
  const [confidence, setConfidence] = useState('authoritative')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedFrom = from.trim()
    const trimmedTo = to.trim()
    if (!trimmedFrom || !trimmedTo) return

    const newEvent = {
      from: trimmedFrom,
      to: trimmedTo,
      proof,
      confidence,
    }

    const mergeImpact = detectMergeImpact(events, newEvent)
    onAddEvent(newEvent, mergeImpact)

    setFrom('')
    setTo('')
  }

  const reversed = [...events].reverse()

  return (
    <div className="panel event-panel">
      <div className="panel-header">
        <h2>Event Log</h2>
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          From
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="email:alice@company.com"
          />
        </label>
        <label>
          To
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="github:alice-dev"
          />
        </label>
        <label>
          Proof type
          <select value={proof} onChange={(e) => setProof(e.target.value)}>
            {PROOF_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
          >
            <option value="authoritative">authoritative</option>
            <option value="hint">hint</option>
          </select>
        </label>
        <button type="submit" className="submit-btn">
          Add edge
        </button>
      </form>

      <div className="event-log">
        <div className="event-log-header">
          <span>{events.length} edges</span>
        </div>
        <div className="event-log-list">
          {reversed.map((event, i) => (
            <div
              key={`${event.from}→${event.to}:${event.proof}:${events.length - i}`}
              className="event-entry"
            >
              <span
                className={`event-badge ${event.confidence === 'authoritative' ? 'auth' : 'hint'}`}
              >
                {event.confidence === 'authoritative' ? '✓ authoritative' : '~ hint'}
              </span>
              <div className="event-body">
                <span className="event-nodes">
                  {event.from} → {event.to}
                </span>
                <span className="event-proof">{event.proof}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
