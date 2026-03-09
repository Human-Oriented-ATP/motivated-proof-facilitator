import React, { JSX, useContext, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  NodeTypes,
  MarkerType,
  Position,
  Handle,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
// @ts-ignore
import '@xyflow/react/dist/style.css'
import { type ProofDiscoveryState, MoveKind } from '../core/ProofDiscoveryState'
import { ProofState } from '../core/ProofStateZod'
import { ProofState as ProofStateComponent } from './ProofState'
import { ProofDiscoveryStateContext, ProofStateIdContext } from '../core/ProofDiscoveryStateContext'

// alias for prop typing
export type ProofDiscoveryStateType = ProofDiscoveryState

// data attached to each React Flow node
interface ProofNodeData extends Record<string, unknown> {
  proofNodeId: number
  proofState: ProofState
  isCurrentNode: boolean
  isSolved: boolean
}

// local styles
const styles: Record<string, React.CSSProperties> = {
  edgeTooltip: {
    position: 'absolute' as const,
    bottom: '10px',
    left: '10px',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.75)',
    color: 'white',
    borderRadius: 6,
    maxWidth: '300px',
    fontSize: '0.85rem',
    pointerEvents: 'none',
    zIndex: 1000,
    whiteSpace: 'pre-wrap' as const,
  }
}

/** Props for the ProofDiscoveryGraphLoader component */
export type ProofDiscoveryGraphLoaderProps = {
    /** The proof discovery state to visualize */
    proofDiscoveryState: ProofDiscoveryStateType
}

/** Custom node component that displays a miniaturized proof state */
function ProofNode({ data }: { data: ProofNodeData }): JSX.Element {
  const { proofNodeId, proofState, isCurrentNode, isSolved } = data
  const { dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)

  return (
    <div
      style={{
        backgroundColor: isCurrentNode ? '#dbeafe' : '#ffffff',
        border: `3px solid ${isCurrentNode ? '#3b82f6' : isSolved ? '#22c55e' : '#d1d5db'}`,
        borderRadius: '12px',
        padding: '12px',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: isCurrentNode
          ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontSize: '11px',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={() => dispatchProofDiscoveryAction({ action: 'focus', nodeId: proofNodeId })}
    >
      {/* Invisible handles at both top and bottom for both source and target */}
      <Handle type="target" position={Position.Top}    id="target-top"    style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top}    id="source-top"    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ opacity: 0 }} />

      {/* Node ID Badge */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '12px',
          backgroundColor: isCurrentNode ? '#3b82f6' : isSolved ? '#22c55e' : '#9ca3af',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: 'bold',
          zIndex: 1,
        }}
      >
        {isCurrentNode ? '● Current' : isSolved ? '✓ Solved' : `State ${proofNodeId}`}
      </div>

      {/* Miniaturized Proof State */}
      <div
        style={{
          transform: 'scale(0.75)',
          transformOrigin: 'top left',
          width: '133%',
          overflow: 'visible',
          pointerEvents: 'none',
          paddingTop: '8px',
          marginBottom: '-75px',
        }}
      >
        <ProofStateIdContext.Provider value={{ proofNodeId, proofContextId: 0 }}>
          <ProofStateComponent proofState={proofState} />
        </ProofStateIdContext.Provider>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  proofNode: ProofNode,
}

/** Edge colors and styles per move kind */
const EDGE_STYLE = {
  strengthening: {
    stroke: '#16a34a',      // Forest green — productive deepening of the goal
    strokeWidth: 3,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#16a34a' },
  },
  weakening: {
    stroke: '#f97316',      // Orange — relaxing/retreating the goal
    strokeWidth: 3,
    strokeDasharray: '6,4',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
  },
  equivalence: {
    stroke: '#7c3aed',      // Violet — equivalent reformulation
    strokeWidth: 2.5,
    markerEnd: { type: MarkerType.Arrow, color: '#7c3aed' },
  },
  other: {
    stroke: '#94a3b8',      // Slate — unknown/other relation
    strokeWidth: 2,
    strokeDasharray: '5,5',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
} as Record<MoveKind, {
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  markerEnd: { type: MarkerType; color: string }
}>

/** Props for the ProofDiscoveryState component */
export type ProofDiscoveryStateProps = {
  proofDiscoveryState: ProofDiscoveryState
}

/**
 * Visualize a proof discovery state as an interactive graph using React Flow.
 *
 * Layout semantics (matching the proof-theory conventions):
 *   - Strengthening (newNode → parent in graphology): new node appears BELOW parent.
 *     Arrow direction: parent → strengthened child (downward).
 *   - Weakening (parent → newNode in graphology): new node appears ABOVE parent.
 *     Arrow direction: parent → weakened child (upward).
 *   - Equivalence: same vertical rank, bidirectional.
 *   - Within a rank, nodes are spread horizontally in discovery order (by node ID).
 */
export function ProofDiscoveryState({ proofDiscoveryState }: ProofDiscoveryStateProps): JSX.Element {
  const { graph, currentNodeId, isSolved } = proofDiscoveryState

  // Convert graphology nodes to React Flow nodes with computed layout
  const derivedNodes: Node<ProofNodeData>[] = useMemo(() => {
    const flowNodes: Node<ProofNodeData>[] = []

    graph.forEachNode((nodeId, attributes) => {
      const numericId = typeof nodeId === 'string' ? parseInt(nodeId) : nodeId as number

      flowNodes.push({
        id: nodeId.toString(),
        type: 'proofNode',
        position: { x: 0, y: 0 }, // overwritten by computeLayout
        data: {
          proofNodeId: numericId,
          proofState: attributes.proofState,
          isCurrentNode: numericId === currentNodeId,
          isSolved: isSolved && numericId === currentNodeId,
        },
        draggable: true,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })
    })

    return computeLayout(flowNodes, graph)
  }, [graph, currentNodeId, isSolved])

  // Convert graphology edges to React Flow edges with correct direction and handles
  const derivedEdges: Edge[] = useMemo(() => {
    const flowEdges: Edge[] = []

    graph.forEachEdge((edge, attributes, source, target, _sa, _ta, undirected) => {
      const kind: MoveKind = attributes.kind
      const es = EDGE_STYLE[kind] ?? EDGE_STYLE.other

      // Arrow direction: always parent → child.
      //   Strengthening (graphology: source=child, target=parent) → swap so arrow goes parent→child (down)
      //   Weakening     (graphology: source=parent, target=child) → keep  so arrow goes parent→child (up)
      //   Equivalence   (undirected)                              → straight, bidirectional
      let rfSource: string
      let rfTarget: string
      let sourceHandle: string
      let targetHandle: string

      if (undirected) {
        // Equivalence: straight line between the two nodes, centered handles
        rfSource = source.toString()
        rfTarget = target.toString()
        sourceHandle = 'source-bottom'
        targetHandle = 'target-top'
      } else if (kind === 'strengthening' || kind === 'other') {
        // Swap: child (graphology source) ← parent (graphology target)
        // Arrow goes from parent (above) DOWN to child (below)
        rfSource = target.toString()  // parent
        rfTarget = source.toString()  // child
        sourceHandle = 'source-bottom'  // exits from bottom of parent
        targetHandle = 'target-top'     // arrives at top of child
      } else {
        // Weakening: no swap, parent (graphology source) → child (graphology target)
        // Arrow goes from parent (below) UP to child (above)
        rfSource = source.toString()  // parent
        rfTarget = target.toString()  // child
        sourceHandle = 'source-top'    // exits from top of parent
        targetHandle = 'target-bottom' // arrives at bottom of child (which is above parent)
      }

      flowEdges.push({
        id: edge.toString(),
        source: rfSource,
        target: rfTarget,
        sourceHandle,
        targetHandle,
        type: undirected ? 'straight' : 'bezier',
        animated: false,
        style: {
          stroke: es.stroke,
          strokeWidth: es.strokeWidth,
          ...(es.strokeDasharray !== undefined ? { strokeDasharray: es.strokeDasharray } : {}),
        },
        ...(undirected ? {} : { markerEnd: es.markerEnd }),
        label: attributes.description,
        labelStyle: { fill: es.stroke, fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.92 },
        data: { reasoning: attributes.reasoning ?? '' },
      })
    })

    return flowEdges
  }, [graph])

  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges)
  const [hoveredEdgeReasoning, setHoveredEdgeReasoning] = useState<string | null>(null)
  const [rfInstance, setRfInstance] = useState<any>(null)

  // Preserve user-dragged positions; only update data/styling on existing nodes
  useEffect(() => {
    setNodes((currentNodes) => {
      const existingById = new Map(currentNodes.map((n) => [n.id, n]))
      return derivedNodes.map((node) => {
        const existing = existingById.get(node.id)
        if (!existing) return node
        return { ...node, position: existing.position }
      })
    })
  }, [derivedNodes, setNodes])

  useEffect(() => {
    setEdges(derivedEdges)
  }, [derivedEdges, setEdges])

  // Re-fit view when nodes are added
  const prevNodeCount = React.useRef(nodes.length)
  useEffect(() => {
    if (rfInstance && nodes.length !== prevNodeCount.current) {
      prevNodeCount.current = nodes.length
      rfInstance.fitView({ padding: 0.18, duration: 400 })
    }
  }, [nodes.length, rfInstance])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {hoveredEdgeReasoning && (
        <div style={styles.edgeTooltip}>
          {hoveredEdgeReasoning}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => {
          setRfInstance(instance)
          instance.fitView({ padding: 0.18 })
        }}
        onEdgeMouseEnter={(_e, edge) => {
          const reasoning = (edge.data as any)?.reasoning
          setHoveredEdgeReasoning(reasoning || null)
        }}
        onEdgeMouseLeave={() => setHoveredEdgeReasoning(null)}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.08}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        defaultEdgeOptions={{ type: 'bezier' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
    </div>
  )
}

/**
 * Tree layout with ancestor-aware overlap resolution.
 *
 * Rank semantics (y-axis):
 *   - Node 0 at rank 0.
 *   - Strengthening child (graphology: source=child, target=parent): rank = parent + 1 (below).
 *   - Weakening child     (graphology: source=parent, target=child): rank = parent − 1 (above).
 *   - Equivalence partner: same rank.
 *
 * Pass 1 (x-axis): Reingold-Tilford bottom-up subtree widths + top-down placement.
 *   Parents always lower IDs than children, so ascending ID = top-down order,
 *   descending ID = bottom-up order.
 *
 * Pass 2 (overlap fix): Weakenings can land at the same rank as unrelated ancestor
 *   nodes. After the tree layout a multi-pass per-rank sweep pushes overlapping
 *   pairs apart. Pairs that are ancestor/descendant are handled without touching
 *   the ancestor: only the descendant's own sub-subtree is shifted.
 */
function computeLayout(nodes: Node<ProofNodeData>[], graph: any): Node<ProofNodeData>[] {
  if (nodes.length === 0) return nodes

  const NODE_WIDTH    = 360  // approximate rendered width of a proof-node card
  const H_GAP         = 60   // horizontal gap between sibling subtrees
  const LEVEL_SPACING = 430  // vertical distance between ranks

  // ── Step 1: Ranks and parent→children (ascending ID = top-down) ──────────

  const ranks      = new Map<string, number>()
  const parentOf   = new Map<string, string>()
  const childrenOf = new Map<string, string[]>()

  for (const n of nodes) childrenOf.set(n.id, [])
  ranks.set('0', 0)

  const sorted = [...nodes].sort((a, b) => parseInt(a.id) - parseInt(b.id))

  for (let i = 1; i < sorted.length; i++) {
    const nodeId = sorted[i]!.id
    let rank: number | undefined
    let par: string | undefined

    graph.forEachEdge((_e: string, attrs: any, src: string, tgt: string,
                       _sa: any, _ta: any, undirected: boolean) => {
      const s = src.toString()
      const t = tgt.toString()
      if (s !== nodeId && t !== nodeId) return
      if (rank !== undefined) return

      if (undirected) {
        const other = s === nodeId ? t : s
        if (ranks.has(other)) { rank = ranks.get(other)!; par = other }
        return
      }

      const kind: MoveKind = attrs.kind
      if (kind === 'strengthening' || kind === 'other') {
        if (s === nodeId && ranks.has(t)) { rank = ranks.get(t)! + 1; par = t }
      } else if (kind === 'weakening') {
        if (t === nodeId && ranks.has(s)) { rank = ranks.get(s)! - 1; par = s }
      }
    })

    ranks.set(nodeId, rank ?? 0)
    if (par !== undefined) {
      parentOf.set(nodeId, par)
      childrenOf.get(par)!.push(nodeId)
    }
  }

  // ── Step 2: Subtree widths — bottom-up (descending ID = leaves first) ────

  const subtreeW = new Map<string, number>()

  for (let i = sorted.length - 1; i >= 0; i--) {
    const id   = sorted[i]!.id
    const kids = childrenOf.get(id)!
    subtreeW.set(id,
      kids.length === 0
        ? NODE_WIDTH
        : Math.max(NODE_WIDTH,
            kids.reduce((s, c) => s + subtreeW.get(c)!, 0) + (kids.length - 1) * H_GAP))
  }

  // ── Step 3: x positions — top-down, root centred at x = 0 ───────────────

  const xPos = new Map<string, number>()
  xPos.set('0', 0)

  for (const { id } of sorted) {
    const kids = childrenOf.get(id)!
    if (kids.length === 0) continue
    const px    = xPos.get(id) ?? 0
    const total = kids.reduce((s, c) => s + subtreeW.get(c)!, 0) + (kids.length - 1) * H_GAP
    let cursor  = px - total / 2
    for (const kid of kids) {
      xPos.set(kid, cursor + subtreeW.get(kid)! / 2)
      cursor += subtreeW.get(kid)! + H_GAP
    }
  }

  // ── Step 4: Build ancestor sets and descendant sets for overlap resolution

  // ancestors(v) = all layout-tree ancestors of v
  const ancestors = new Map<string, Set<string>>()
  for (const { id } of sorted) {
    const set = new Set<string>()
    let cur = parentOf.get(id)
    while (cur !== undefined) { set.add(cur); cur = parentOf.get(cur) }
    ancestors.set(id, set)
  }

  // descendants(v) = v plus all layout-tree descendants of v
  const descendants = new Map<string, Set<string>>()
  for (let i = sorted.length - 1; i >= 0; i--) {
    const id  = sorted[i]!.id
    const set = new Set<string>([id])
    for (const kid of childrenOf.get(id)!)
      for (const d of descendants.get(kid)!) set.add(d)
    descendants.set(id, set)
  }

  // ── Step 5: Per-rank overlap resolution (ancestor-aware, multi-pass) ─────

  const byRank      = new Map<number, string[]>()
  for (const { id } of sorted) {
    const r = ranks.get(id) ?? 0
    if (!byRank.has(r)) byRank.set(r, [])
    byRank.get(r)!.push(id)
  }

  const MIN_SPACING = NODE_WIDTH + H_GAP

  for (let pass = 0; pass < 12; pass++) {
    let changed = false

    for (const ids of byRank.values()) {
      // Sort by current x each pass (positions change during resolution)
      ids.sort((a, b) => xPos.get(a)! - xPos.get(b)!)

      for (let i = 1; i < ids.length; i++) {
        const lId = ids[i - 1]!
        const rId = ids[i]!
        const gap = xPos.get(rId)! - xPos.get(lId)!
        if (gap >= MIN_SPACING) continue

        changed = true
        const overlap = MIN_SPACING - gap

        const lIsAncOfR = ancestors.get(rId)!.has(lId)
        const rIsAncOfL = ancestors.get(lId)!.has(rId)

        if (lIsAncOfR) {
          // Left is ancestor of right: only shift right's own subtree rightward
          for (const d of descendants.get(rId)!) xPos.set(d, xPos.get(d)! + overlap)
        } else if (rIsAncOfL) {
          // Right is ancestor of left: only shift left's own subtree leftward
          for (const d of descendants.get(lId)!) xPos.set(d, xPos.get(d)! - overlap)
        } else {
          // Unrelated subtrees: split the push evenly
          const half = overlap / 2
          for (const d of descendants.get(lId)!) xPos.set(d, xPos.get(d)! - half)
          for (const d of descendants.get(rId)!) xPos.set(d, xPos.get(d)! + half)
        }
      }
    }

    if (!changed) break
  }

  // ── Step 6: Apply positions ───────────────────────────────────────────────

  for (const node of nodes) {
    node.position = {
      x: xPos.get(node.id) ?? 0,
      y: (ranks.get(node.id) ?? 0) * LEVEL_SPACING,
    }
  }

  return nodes
}
