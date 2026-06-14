/**
 * Identity resolution — pure logic.
 * Only authoritative edges form person clusters; hints are stored but never merged.
 */

class UnionFind {
  constructor(nodes) {
    this.parent = Object.fromEntries(nodes.map((n) => [n, n]))
    this.rank = Object.fromEntries(nodes.map((n) => [n, 0]))
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x])
    }
    return this.parent[x]
  }

  union(a, b) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA === rootB) return false

    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA
    } else {
      this.parent[rootB] = rootA
      this.rank[rootA] += 1
    }
    return true
  }
}

export function parseNodeId(nodeId) {
  const colon = nodeId.indexOf(':')
  if (colon === -1) return { type: 'unknown', label: nodeId, id: nodeId }
  return {
    type: nodeId.slice(0, colon),
    label: nodeId.slice(colon + 1),
    id: nodeId,
  }
}

export function buildGraph(events) {
  const nodeSet = new Set()
  const authoritativeEdges = []
  const hintEdges = []

  for (const event of events) {
    nodeSet.add(event.from)
    nodeSet.add(event.to)
    const edge = {
      ...event,
      id: `${event.from}→${event.to}:${event.proof}`,
    }
    if (event.confidence === 'authoritative') {
      authoritativeEdges.push(edge)
    } else {
      hintEdges.push(edge)
    }
  }

  return {
    nodes: [...nodeSet].sort(),
    authoritativeEdges,
    hintEdges,
    allEdges: [...authoritativeEdges, ...hintEdges],
  }
}

function clusterKey(nodes) {
  return [...nodes].sort().join('|')
}

/**
 * Build person clusters from authoritative edges only (union-find).
 * Nodes with no authoritative connections remain singleton clusters.
 */
export function findClusters(events) {
  const { nodes, authoritativeEdges } = buildGraph(events)
  const uf = new UnionFind(nodes)

  for (const edge of authoritativeEdges) {
    uf.union(edge.from, edge.to)
  }

  const groups = new Map()
  for (const node of nodes) {
    const root = uf.find(node)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root).push(node)
  }

  return [...groups.values()]
    .map((cluster) => [...cluster].sort())
    .sort((a, b) => a[0].localeCompare(b[0]))
}

/**
 * Resolve a single node: its authoritative cluster + hint edges touching it.
 */
export function resolve(nodeId, events) {
  const clusters = findClusters(events)
  const { hintEdges } = buildGraph(events)

  const cluster = clusters.find((c) => c.includes(nodeId)) ?? [nodeId]
  const clusterSet = new Set(cluster)

  const unresolvedHints = hintEdges.filter(
    (edge) => clusterSet.has(edge.from) || clusterSet.has(edge.to),
  )

  return { cluster, unresolvedHints }
}

/**
 * All resolved persons with their identifiers and attached hints.
 */
export function resolveAll(events) {
  const clusters = findClusters(events)
  const { hintEdges } = buildGraph(events)

  return clusters.map((cluster, index) => {
    const clusterSet = new Set(cluster)
    const unresolvedHints = hintEdges.filter(
      (edge) => clusterSet.has(edge.from) || clusterSet.has(edge.to),
    )
    const hasAuthoritativeLinks = cluster.length > 1

    return {
      id: clusterKey(cluster),
      personIndex: index + 1,
      cluster,
      identifiers: cluster.map(parseNodeId),
      unresolvedHints,
      isSingleton: cluster.length === 1,
      isUnresolvedIdentity:
        cluster.length === 1 &&
        unresolvedHints.length > 0 &&
        !hasAuthoritativeLinks,
    }
  })
}

/**
 * Detect whether adding an edge would merge separate clusters (for toast).
 */
export function detectMergeImpact(events, newEdge) {
  if (newEdge.confidence !== 'authoritative') {
    return { merges: false, clustersMerged: 0 }
  }

  const before = findClusters(events)
  const after = findClusters([...events, newEdge])

  const findClusterContaining = (clusters, nodeId) =>
    clusters.find((c) => c.includes(nodeId))

  const fromCluster = findClusterContaining(before, newEdge.from)
  const toCluster = findClusterContaining(before, newEdge.to)

  if (!fromCluster || !toCluster) {
    return { merges: false, clustersMerged: 0 }
  }

  if (clusterKey(fromCluster) === clusterKey(toCluster)) {
    return { merges: false, clustersMerged: 0 }
  }

  return {
    merges: true,
    clustersMerged: 2,
    beforeClusterCount: before.length,
    afterClusterCount: after.length,
  }
}

export const NODE_COLORS = {
  email: '#3b82f6',
  github: '#22c55e',
  slack: '#a855f7',
  device: '#6b7280',
  directory: '#f97316',
  unknown: '#94a3b8',
}

export function getNodeColor(nodeId) {
  const { type } = parseNodeId(nodeId)
  return NODE_COLORS[type] ?? NODE_COLORS.unknown
}
