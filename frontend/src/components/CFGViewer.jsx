import ReactFlow, { Background, Controls } from "reactflow"
import dagre from "dagre"
import "reactflow/dist/style.css"

const nodeWidth = 150
const nodeHeight = 50

const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 120,
    ranksep: 150
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

export default function CFGViewer({ data }) {
  if (!data || !data.nodes) return <p>No CFG available</p>

  let nodes = data.nodes.map((n) => ({
    id: n.id,
    data: { label: n.label },
    position: { x: 0, y: 0 }
  }))

  let edges = data.edges.map((e) => {
    let style = { stroke: "#555" }

    if (e.type === "loop") {
      style = { stroke: "red", strokeWidth: 2 }
    }

    if (e.type === "branch") {
      style = { stroke: "blue" }
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      label: e.label,
      animated: true,
      style
    }
  })

  const layouted = getLayoutedElements(nodes, edges)

  return (
    <div style={{ height: "700px", border: "1px solid #ccc", borderRadius: "10px" }}>
      <ReactFlow nodes={layouted.nodes} edges={layouted.edges} fitView>
        <Background gap={25} />
        <Controls />
      </ReactFlow>
    </div>
  )
}