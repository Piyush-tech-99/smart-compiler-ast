import Tree from "react-d3-tree"

export default function ASTViewer({ treeData }) {

  if (!treeData || treeData.error) {
    return <p>No AST available</p>
  }

  const convert = (node) => {
    if (!node || typeof node !== "object") return null

    let children = []

    for (let key in node) {
      const value = node[key]

      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v && typeof v === "object") {
            const child = convert(v)
            if (child) children.push(child)
          }
        })
      } else if (typeof value === "object" && value !== null) {
        const child = convert(value)
        if (child) children.push(child)
      }
    }

    return {
      name: node.type || node.name || "node",
      children: children
    }
  }

  const tree = convert(treeData)

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Tree
        data={tree}
        orientation="vertical"
        translate={{ x: 350, y: 50 }}
        separation={{ siblings: 2, nonSiblings: 2 }}
        nodeSize={{ x: 200, y: 120 }}
        zoomable
      />
    </div>
  )
}