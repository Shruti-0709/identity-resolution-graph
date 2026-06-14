import { getNodeColor, parseNodeId, resolve, resolveAll } from '../lib/resolution'

function IdentifierRow({ nodeId }) {
  const { type, label } = parseNodeId(nodeId)
  return (
    <div className="identifier-row">
      <span className="identifier-type" style={{ color: getNodeColor(nodeId) }}>
        {type}
      </span>
      <span className="identifier-label">{label}</span>
    </div>
  )
}

function HintEdge({ edge }) {
  const from = parseNodeId(edge.from)
  const to = parseNodeId(edge.to)
  return (
    <div className="hint-edge">
      <span className="hint-warning">⚠ unresolved — proof insufficient</span>
      <div className="hint-detail">
        <span>
          {from.type}:{from.label}
        </span>
        <span className="hint-arrow">→</span>
        <span>
          {to.type}:{to.label}
        </span>
      </div>
      <span className="hint-proof">
        {edge.proof} <em>(hint)</em>
      </span>
    </div>
  )
}

function PersonCard({ person, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`person-card ${isSelected ? 'selected' : ''} ${person.isUnresolvedIdentity ? 'unresolved' : ''}`}
      onClick={() => onSelect(person.cluster[0])}
    >
      <div className="person-card-header">
        <span className="person-label">
          Person {person.personIndex}
          {person.isSingleton && person.unresolvedHints.length > 0 && (
            <span className="badge badge-hint">unresolved</span>
          )}
        </span>
        <span className="person-count">
          {person.cluster.length} identifier{person.cluster.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="identifier-list">
        {person.cluster.map((nodeId) => (
          <IdentifierRow key={nodeId} nodeId={nodeId} />
        ))}
      </div>
      {person.unresolvedHints.length > 0 && (
        <div className="person-hints-preview">
          {person.unresolvedHints.length} pending hint
          {person.unresolvedHints.length !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  )
}

export default function ClusterPanel({ events, selectedNodeId, onSelectNode }) {
  const allPersons = resolveAll(events)

  if (selectedNodeId) {
    const { cluster, unresolvedHints } = resolve(selectedNodeId, events)
    const personIndex =
      allPersons.findIndex((p) => p.cluster.includes(selectedNodeId)) + 1

    return (
      <div className="panel cluster-panel">
        <div className="panel-header">
          <h2>Cluster Detail</h2>
          <button
            type="button"
            className="text-btn"
            onClick={() => onSelectNode(null)}
          >
            Show all
          </button>
        </div>

        <div className="cluster-detail">
          <div className="cluster-detail-header">
            <h3>Person {personIndex || '—'}</h3>
            <span className="cluster-meta">
              {cluster.length} resolved identifier{cluster.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="identifier-list detail">
            {cluster.map((nodeId) => (
              <IdentifierRow key={nodeId} nodeId={nodeId} />
            ))}
          </div>

          {unresolvedHints.length > 0 ? (
            <div className="hints-section">
              <h4>Unresolved hints</h4>
              <p className="hints-note">
                These edges are visible in the graph but do not merge identities.
              </p>
              {unresolvedHints.map((edge) => (
                <HintEdge key={edge.id} edge={edge} />
              ))}
            </div>
          ) : (
            <p className="no-hints">No unresolved hints attached to this cluster.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel cluster-panel">
      <div className="panel-header">
        <h2>Resolved Persons</h2>
        <span className="panel-count">{allPersons.length} clusters</span>
      </div>

      <div className="person-list">
        {allPersons.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            isSelected={false}
            onSelect={onSelectNode}
          />
        ))}
      </div>

      <p className="panel-footnote">
        Click a node in the graph or a person card to inspect unresolved hints.
      </p>
    </div>
  )
}
