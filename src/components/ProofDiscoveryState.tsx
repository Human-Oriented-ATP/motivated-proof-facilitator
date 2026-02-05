import React, { JSX, useContext, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
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
import { ProofState as ProofStateComponent } from './ProofState'
import { ProofDiscoveryStateContext, ProofStateIdContext } from '../core/ProofDiscoveryStateContext'

/** Props for custom node component */
type ProofNodeData = {
  proofNodeId: number
  proofState: any
  isCurrentNode: boolean
  isSolved: boolean
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
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
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
        {isCurrentNode ? '● Current' : isSolved ? '✓ Solved' : `Node ${proofNodeId}`}
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

/** Get color and style for edge based on move kind */
function getEdgeStyle(moveKind: MoveKind): { 
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  markerEnd: { type: MarkerType; color: string }
} {
  switch (moveKind) {
    case 'strengthening':
      return {
        stroke: '#10b981', // Green
        strokeWidth: 3,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
      }
    case 'weakening':
      return {
        stroke: '#f59e0b', // Orange
        strokeWidth: 3,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      }
    case 'equivalence':
      return {
        stroke: '#8b5cf6', // Purple
        strokeWidth: 3,
        markerEnd: { type: MarkerType.Arrow, color: '#8b5cf6' },
      }
    case 'other':
      return {
        stroke: '#9ca3af', // Gray
        strokeWidth: 2,
        strokeDasharray: '5,5',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
      }
  }
}

/** Props for ProofDiscoveryState component */
export type ProofDiscoveryStateProps = {
  proofDiscoveryState: ProofDiscoveryState
}

/**
 * Visualize a proof discovery state as an interactive graph using React Flow.
 * 
 * Converts a graphology graph into React Flow format, with:
 * - Miniaturized proof states as nodes
 * - Color-coded edges based on move kind
 * - Current node highlighted
 * - Auto-layout using dagre algorithm
 * 
 * @param props - ProofDiscoveryStateProps
 * @returns JSX element containing the React Flow graph
 */
export function ProofDiscoveryState({ proofDiscoveryState }: ProofDiscoveryStateProps): JSX.Element {
  const { graph, currentNodeId, isSolved } = proofDiscoveryState

  // Convert graphology nodes to React Flow nodes
  const derivedNodes: Node<ProofNodeData>[] = useMemo(() => {
    const flowNodes: Node<ProofNodeData>[] = []
    
    graph.forEachNode((nodeId, attributes) => {
      const numericId = typeof nodeId === 'string' ? parseInt(nodeId) : nodeId
      
      flowNodes.push({
        id: nodeId.toString(),
        type: 'proofNode',
        position: { x: numericId * 450, y: 0 }, // Temporary positioning
        data: {
          proofNodeId: numericId,
          proofState: attributes.proofState,
          isCurrentNode: numericId === currentNodeId,
          isSolved: isSolved && numericId === currentNodeId,
        },
        draggable: true,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })
    })

    // Simple hierarchical layout
    const layouted = simpleLayout(flowNodes, graph)
    
    return layouted
  }, [graph, currentNodeId, isSolved])

  // Convert graphology edges to React Flow edges
  const derivedEdges: Edge[] = useMemo(() => {
    const flowEdges: Edge[] = []
    
    graph.forEachEdge((edge, attributes, source, target, _sourceAttributes, _targetAttributes, undirected) => {
      const moveKind = attributes.kind
      const edgeStyle = getEdgeStyle(moveKind)
      
        flowEdges.push({
          id: edge.toString(),
        source: source.toString(),
        target: target.toString(),
        type: undirected ? 'straight' : 'smoothstep',
        animated: attributes.kind === 'strengthening',
        style: {
          stroke: edgeStyle.stroke,
          strokeWidth: edgeStyle.strokeWidth,
          strokeDasharray: edgeStyle.strokeDasharray,
        },
        markerEnd: undirected ? undefined : edgeStyle.markerEnd,
        label: attributes.description,
        labelStyle: {
          fill: edgeStyle.stroke,
          fontWeight: 600,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
        zIndex: 10,
      })
    })
    
    return flowEdges
  }, [graph])

  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges)

  useEffect(() => {
    setNodes((currentNodes) => {
      const existingById = new Map(currentNodes.map((node) => [node.id, node]))
      return derivedNodes.map((node) => {
        const existing = existingById.get(node.id)
        if (!existing) return node

        return {
          ...node,
          position: existing.position,
        }
      })
    })
  }, [derivedNodes, setNodes])

  useEffect(() => {
    setEdges(derivedEdges)
  }, [derivedEdges, setEdges])

  return (
    <div style={{ width: '100%', height: '800px', border: '2px solid #e5e7eb', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isCurrentNode) return '#3b82f6'
            if (node.data.isSolved) return '#22c55e'
            return '#d1d5db'
          }}
          style={{
            backgroundColor: '#f9fafb',
          }}
        />
      </ReactFlow>
      
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 5,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Edge Types</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '3px', backgroundColor: '#10b981' }} />
            <span>Strengthening</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '3px', backgroundColor: '#f59e0b' }} />
            <span>Weakening</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '3px', backgroundColor: '#8b5cf6' }} />
            <span>Equivalence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '2px', backgroundColor: '#9ca3af', backgroundImage: 'repeating-linear-gradient(90deg, #9ca3af 0, #9ca3af 5px, transparent 5px, transparent 10px)' }} />
            <span>Other</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple layout algorithm for positioning nodes
 * Uses a basic hierarchical approach based on graph structure
 */
function simpleLayout(nodes: Node<ProofNodeData>[], graph: any): Node<ProofNodeData>[] {
  if (nodes.length === 0) return nodes

  // Calculate levels using BFS from node 0
  const levels = new Map<string, number>()
  const queue: string[] = ['0']
  levels.set('0', 0)
  
  while (queue.length > 0) {
    const current = queue.shift()!
    const currentLevel = levels.get(current)!
    
    // Get all neighbors
    try {
      graph.forEachOutboundNeighbor(parseInt(current), (neighbor: number) => {
        const neighborStr = neighbor.toString()
        if (!levels.has(neighborStr)) {
          levels.set(neighborStr, currentLevel + 1)
          queue.push(neighborStr)
        }
      })
      
      graph.forEachInboundNeighbor(parseInt(current), (neighbor: number) => {
        const neighborStr = neighbor.toString()
        if (!levels.has(neighborStr)) {
          levels.set(neighborStr, currentLevel + 1)
          queue.push(neighborStr)
        }
      })
    } catch (e) {
      // Node might not have neighbors
    }
  }
  
  // Position nodes by level
  const nodesByLevel = new Map<number, Node[]>()
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })
  
  // Arrange nodes with proper spacing
  const levelSpacing = 500
  const nodeSpacing = 200
  
  nodesByLevel.forEach((levelNodes, level) => {
    const yOffset = -(levelNodes.length - 1) * nodeSpacing / 2
    levelNodes.forEach((node, index) => {
      node.position = {
        x: level * levelSpacing,
        y: yOffset + index * nodeSpacing,
      }
    })
  })
  
  return nodes
}
