import React, { useEffect, JSX, FC } from "react"
import { SigmaContainer, useLoadGraph, useRegisterEvents } from "@react-sigma/core"
// import "@react-sigma/core/lib/style.css"
import Graph from "graphology"
import forceLayout from "graphology-layout-force"
import { ProofDiscoveryState as ProofDiscoveryStateType, ProofNode, MoveDescription } from "../core/ProofDiscoveryState"

/** Props for the ProofDiscoveryGraphLoader component */
export type ProofDiscoveryGraphLoaderProps = {
    /** The proof discovery state to visualize */
    proofDiscoveryState: ProofDiscoveryStateType
}

/**
 * Internal component that loads the graph into Sigma.
 * Must be rendered inside a SigmaContainer.
 */
const ProofDiscoveryGraphLoader: FC<ProofDiscoveryGraphLoaderProps> = ({ proofDiscoveryState }) => {
    const loadGraph = useLoadGraph()
    const registerEvents = useRegisterEvents()

    useEffect(() => {
        // Create a new graph for visualization with less strict typing
        const visualGraph = new Graph()

        // Copy nodes from the original graph
        proofDiscoveryState.graph.forEachNode((node, attributes) => {
            visualGraph.addNode(node, {
                ...attributes,
                x: Math.random() * 100,
                y: Math.random() * 100
            })
        })

        // Copy edges from the original graph
        proofDiscoveryState.graph.forEachEdge((edge, attributes, source, target, sourceAttributes, targetAttributes, undirected) => {
            if (undirected) {
                visualGraph.addUndirectedEdge(source, target, attributes)
            } else {
                visualGraph.addDirectedEdge(source, target, attributes)
            }
        })

        // Apply force layout
        forceLayout.assign(visualGraph, {
            maxIterations: 100,
            settings: {
                gravity: 1,
                attraction: 0.0005,
                repulsion: 0.1,
                inertia: 0.6
            }
        })

        // Style nodes
        visualGraph.forEachNode((node) => {
            const isCurrentNode = node === String(proofDiscoveryState.currentNodeId)

            visualGraph.setNodeAttribute(node, 'size', 10)
            visualGraph.setNodeAttribute(node, 'color', isCurrentNode ? '#2563eb' : '#94a3b8')
            visualGraph.setNodeAttribute(node, 'label', `Node ${node}`)
        })

        // Style edges based on move kind
        visualGraph.forEachEdge((edge) => {
            const attributes = visualGraph.getEdgeAttributes(edge) as MoveDescription
            const moveKind = attributes.kind

            switch (moveKind) {
                case "strengthening":
                    visualGraph.setEdgeAttribute(edge, 'color', '#10b981')
                    visualGraph.setEdgeAttribute(edge, 'size', 2)
                    break
                case "weakening":
                    visualGraph.setEdgeAttribute(edge, 'color', '#f59e0b')
                    visualGraph.setEdgeAttribute(edge, 'size', 2)
                    break
                case "equivalence":
                    visualGraph.setEdgeAttribute(edge, 'color', '#8b5cf6')
                    visualGraph.setEdgeAttribute(edge, 'size', 2)
                    break
                case "other":
                    visualGraph.setEdgeAttribute(edge, 'color', '#9ca3af')
                    visualGraph.setEdgeAttribute(edge, 'size', 1)
                    break
            }
        })

        // Load the graph into sigma
        loadGraph(visualGraph)

        // Register click events
        registerEvents({
            clickNode: (event: { node: string }) => {
                console.log('Clicked node:', event.node)
            }
        })
    }, [proofDiscoveryState, loadGraph, registerEvents])

    return null
}

/** Props for the ProofDiscoveryState component */
export type ProofDiscoveryStateProps = {
    /** The proof discovery state to visualize */
    proofDiscoveryState: ProofDiscoveryStateType
    /** Optional width of the container (default: 800px) */
    width?: string
    /** Optional height of the container (default: 600px) */
    height?: string
}

/**
 * Renders a ProofDiscoveryState as an interactive graph using react-sigma.
 * 
 * The graph uses a force-directed layout where:
 * - Nodes represent proof states
 * - Edges represent transitions between states (strengthening, weakening, equivalence, or other)
 * - The current node is highlighted in blue
 * - Different edge types have different colors
 * 
 * @param props - `ProofDiscoveryStateProps`
 * @returns A JSX element containing the rendered graph
 */
export function ProofDiscoveryState({
    proofDiscoveryState,
    width = "800px",
    height = "600px"
}: ProofDiscoveryStateProps): JSX.Element {
    return (
        <SigmaContainer
            graph={Graph}
            style={{ height, width }}
            settings={{
                renderEdgeLabels: false,
                defaultNodeColor: '#94a3b8',
                defaultEdgeColor: '#9ca3af'
            }}
        >
            <ProofDiscoveryGraphLoader proofDiscoveryState={proofDiscoveryState} />
        </SigmaContainer>
    )
}
