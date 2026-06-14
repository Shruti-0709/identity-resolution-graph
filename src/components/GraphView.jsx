import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import {
  findClusters,
  getNodeColor,
  parseNodeId,
  resolveAll,
} from '../lib/resolution'

function buildGraphData(events, selectedNodeId) {
  const nodeSet = new Set()
  const links = []

  for (const event of events) {
    nodeSet.add(event.from)
    nodeSet.add(event.to)
    links.push({
      source: event.from,
      target: event.to,
      proof: event.proof,
      confidence: event.confidence,
      id: `${event.from}→${event.to}:${event.proof}`,
    })
  }

  const clusters = findClusters(events)
  const clusterByNode = new Map()
  clusters.forEach((cluster, index) => {
    cluster.forEach((nodeId) => clusterByNode.set(nodeId, index))
  })

  const selectedClusterKey = selectedNodeId
    ? clusters.find((c) => c.includes(selectedNodeId))
    : null

  const nodes = [...nodeSet].map((id) => {
    const parsed = parseNodeId(id)
    const inSelected =
      selectedClusterKey?.includes(id) ?? false
    const dimmed = selectedNodeId && !inSelected && id !== selectedNodeId

    return {
      id,
      label: parsed.label,
      type: parsed.type,
      clusterIndex: clusterByNode.get(id) ?? -1,
      color: getNodeColor(id),
      dimmed,
      highlighted: inSelected || id === selectedNodeId,
    }
  })

  return { nodes, links, clusters, selectedClusterKey }
}

export default function GraphView({ events, selectedNodeId, onNodeClick }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const [dimensions, setDimensions] = useState(null)

  const graphData = useMemo(
    () => buildGraphData(events, selectedNodeId),
    [events, selectedNodeId],
  )

  const persons = useMemo(() => resolveAll(events), [events])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDimensions({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const drawClusterBubbles = useCallback(
    (ctx, globalScale) => {
      const fg = graphRef.current
      if (!fg) return

      const nodeMap = new Map(graphData.nodes.map((n) => [n.id, n]))

      persons.forEach((person, index) => {
        if (person.cluster.length < 2) return

        const members = person.cluster
          .map((id) => nodeMap.get(id))
          .filter((n) => n && n.x != null && n.y != null)

        if (members.length < 2) return

        const xs = members.map((n) => n.x)
        const ys = members.map((n) => n.y)
        const cx = xs.reduce((a, b) => a + b, 0) / xs.length
        const cy = ys.reduce((a, b) => a + b, 0) / ys.length
        const maxDist =
          Math.max(...members.map((n) => Math.hypot(n.x - cx, n.y - cy))) +
          28 / globalScale

        const isSelected =
          selectedNodeId &&
          person.cluster.includes(selectedNodeId)

        const fillAlpha = isSelected ? 0.14 : 0.07
        const strokeAlpha = isSelected ? 0.35 : 0.18
        const hue = (index * 67) % 360

        ctx.beginPath()
        ctx.arc(cx, cy, maxDist, 0, 2 * Math.PI)
        ctx.fillStyle = `hsla(${hue}, 55%, 55%, ${fillAlpha})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${hue}, 55%, 55%, ${strokeAlpha})`
        ctx.lineWidth = 1.5 / globalScale
        ctx.stroke()
      })
    },
    [graphData.nodes, persons, selectedNodeId],
  )

  const paintNode = useCallback((node, ctx, globalScale) => {
    const radius = node.highlighted ? 7 : 5.5
    const alpha = node.dimmed ? 0.35 : 1

    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = node.color
    ctx.fill()

    if (node.highlighted) {
      ctx.strokeStyle = '#f8fafc'
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()
    }

    const fontSize = Math.max(10 / globalScale, 2.5)
    ctx.font = `${fontSize}px "IBM Plex Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = node.dimmed
      ? 'rgba(148, 163, 184, 0.6)'
      : 'rgba(226, 232, 240, 0.9)'
    ctx.fillText(node.label, node.x, node.y + radius + 2 / globalScale)
    ctx.globalAlpha = 1
  }, [])

  return (
    <div className="panel graph-panel" ref={containerRef}>
      <div className="panel-header">
        <h2>Identity Graph</h2>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-line solid" /> authoritative
          </span>
          <span className="legend-item">
            <span className="legend-line dashed" /> hint
          </span>
        </div>
      </div>
      <div className="graph-canvas">
        {dimensions && (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeId="id"
            nodeCanvasObject={paintNode}
            nodeCanvasObjectMode={() => 'replace'}
            linkColor={(link) =>
              link.confidence === 'authoritative'
                ? 'rgba(148, 163, 184, 0.55)'
                : 'rgba(251, 191, 36, 0.5)'
            }
            linkWidth={(link) =>
              link.confidence === 'authoritative' ? 1.5 : 1
            }
            linkLineDash={(link) =>
              link.confidence === 'hint' ? [6, 4] : null
            }
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            onNodeClick={onNodeClick}
            onRenderFramePre={drawClusterBubbles}
            backgroundColor="transparent"
            cooldownTicks={80}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}
      </div>
      <div className="type-legend">
        {[
          ['email', '#3b82f6'],
          ['github', '#22c55e'],
          ['slack', '#a855f7'],
          ['device', '#6b7280'],
          ['directory', '#f97316'],
        ].map(([type, color]) => (
          <span key={type} className="type-chip">
            <span className="type-dot" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  )
}
