import React, { JSX, useContext, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  NodeTypes,
  MarkerType,
  Position,
  Handle,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
// @ts-ignore
import '@xyflow/react/dist/style.css'
import { ProofDiscoveryState, MoveKind } from '../core/ProofDiscoveryState'
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
    strokeDasharray: undefined,
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
    strokeDasharray: undefined,
    markerEnd: { type: MarkerType.Arrow, color: '#7c3aed' },
  },
  other: {
    stroke: '#94a3b8',      // Slate — unknown/other relation
    strokeWidth: 2,
    strokeDasharray: '5,5',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
} satisfies Record<MoveKind, {
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
          strokeDasharray: es.strokeDasharray,
        },
        markerEnd: undirected ? undefined : es.markerEnd,
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
        <Controls />
      </ReactFlow>
    </div>
  )
}

/**
 * Compute node positions based on proof-theoretic rank:
 *   - Node 0 at rank 0 (vertical center of the discovery).
 *   - Strengthening child: rank(parent) + 1 → placed BELOW parent (y increases).
 *   - Weakening child:     rank(parent) - 1 → placed ABOVE parent (y decreases).
 *   - Equivalence partner: same rank.
 *
 * Nodes are processed in discovery order (by numeric ID) so that when we compute
 * a node's rank, its parent (always a lower ID) already has an assigned rank.
 * Within the same rank, nodes are spread horizontally in discovery order.
 */
function computeLayout(nodes: Node<ProofNodeData>[], graph: any): Node<ProofNodeData>[] {
  if (nodes.length === 0) return nodes

  const ranks = new Map<string, number>()
  ranks.set('0', 0)

  // Sort by numeric ID so parents are always processed before children
  const sorted = [...nodes].sort((a, b) => parseInt(a.id) - parseInt(b.id))

  for (let i = 1; i < sorted.length; i++) {
    const nodeId = sorted[i].id
    let rank: number | undefined

    // Iterate all edges to find the one that connects this node to its parent
    graph.forEachEdge((_edge: string, attrs: any, source: string, target: string, _sa: any, _ta: any, undirected: boolean) => {
      const src = source.toString()
      const tgt = target.toString()

      // Only consider edges involving this node
      if (src !== nodeId && tgt !== nodeId) return
      // Rank already determined
      if (rank !== undefined) return

      if (undirected) {
        // Equivalence: same rank as the other (already-ranked) node
        const other = src === nodeId ? tgt : src
        if (ranks.has(other)) rank = ranks.get(other)!
        return
      }

      const kind: MoveKind = attrs.kind
      if (kind === 'strengthening' || kind === 'other') {
        // graphology: source=child, target=parent
        // This node is the child (source); parent is target
        if (src === nodeId && ranks.has(tgt)) {
          rank = ranks.get(tgt)! + 1  // child is one rank BELOW parent
        }
      } else if (kind === 'weakening') {
        // graphology: source=parent, target=child
        // This node is the child (target); parent is source
        if (tgt === nodeId && ranks.has(src)) {
          rank = ranks.get(src)! - 1  // child is one rank ABOVE parent
        }
      }
    })

    ranks.set(nodeId, rank ?? 0)
  }

  // Group nodes by rank
  const byRank = new Map<number, Node<ProofNodeData>[]>()
  for (const node of nodes) {
    const r = ranks.get(node.id) ?? 0
    if (!byRank.has(r)) byRank.set(r, [])
    byRank.get(r)!.push(node)
  }

  const LEVEL_SPACING = 430  // vertical distance between ranks
  const NODE_SPACING = 380   // horizontal distance within a rank

  for (const [rank, rankNodes] of byRank) {
    // Spread horizontally in discovery order
    rankNodes.sort((a, b) => parseInt(a.id) - parseInt(b.id))
    const xStart = -((rankNodes.length - 1) * NODE_SPACING) / 2
    rankNodes.forEach((node, idx) => {
      node.position = { x: xStart + idx * NODE_SPACING, y: rank * LEVEL_SPACING }
    })
  }

  return nodes
}
