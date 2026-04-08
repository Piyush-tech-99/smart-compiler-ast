import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"

export default function CFGViewer({ data }) {
  if (!data || !data.nodes) {
    return <p>No CFG available</p>
  }

  const nodes = data.nodes.map((n, index) => ({
    id: n.id,
    data: { label: n.label },
    position: { x: 250, y: index * 100 } 
  }))

  const edges = (data.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: "#555" }
  }))

  return (
    <div style={{ height: "400px", border: "1px solid #ccc", borderRadius: "10px" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}