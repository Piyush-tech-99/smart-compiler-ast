import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"

export default function CFGViewer({ data }) {
  if (!data || !data.nodes) {
    return <p>No CFG available</p>
  }

  const nodes = data.nodes.map((n, index) => ({
    id: n.id,
    data: { label: n.label },

    position: {
      x: 250 + (index % 2 === 0 ? 0 : 40), 
      y: index * 100
    }
  }))

  const edges = (data.edges || []).map((e) => {
    let edgeType = "default"
    let style = { stroke: "#555" }

    if (e.type === "loop") {
      edgeType = "smoothstep"
      style = { stroke: "red", strokeWidth: 2 }
    }

    if (e.type === "branch") {
      edgeType = "smoothstep"
      style = { stroke: "blue" }
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: edgeType,
      label: e.label,
      animated: true,
      style,

      sourcePosition: "right",
      targetPosition: "right"
    }
  })

  return (
    <div style={{ height: "400px", border: "1px solid #ccc", borderRadius: "10px" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}