import Tree from "react-d3-tree"

export default function ASTViewer({ treeData }) {

  //  SAFE CHECK
  if (!treeData || treeData.error) {
    return <p>No AST available</p>
  }

  //  CONVERT ACORN AST → TREE FORMAT
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
      name: node.type || "node",
      children: children
    }
  }

  let tree

  try {
    tree = convert(treeData)
  } catch (err) {
    return <p>Error rendering AST</p>
  }

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Tree
        data={tree}
        orientation="vertical"
        zoomable
        translate={{ x: 250, y: 50 }}
      />
    </div>
  )
}