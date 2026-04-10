const express = require('express')
const cors = require('cors')
const acorn = require('acorn')
const { VM } = require('vm2')

const app = express()
app.use(cors())
app.use(express.json())

app.post('/run', async (req, res) => {
  const { code, language } = req.body

  try {
    if (language === "javascript") {
      let logs = []

      const vm = new VM({
        timeout: 1000,
        sandbox: {
          console: {
            log: (...args) => logs.push(args.join(" "))
          }
        }
      })

      vm.run(code)

      return res.json({
        output: logs.join("\n") || "No output"
      })
    }

    let finalCode = code
    if (language === "java") {
      finalCode = code.replace(/class\s+\w+/, "class Main")
    }

    const langMap = { c: 50, cpp: 54, java: 62 }

    const submit = await fetch("https://ce.judge0.com/submissions?base64_encoded=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: finalCode,
        language_id: langMap[language]
      })
    })

    const { token } = await submit.json()

    await new Promise(r => setTimeout(r, 2000))

    const result = await fetch(`https://ce.judge0.com/submissions/${token}?base64_encoded=false`)
    const data = await result.json()

    return res.json({
      output: data.stdout || data.stderr || data.compile_output || "No output"
    })

  } catch (e) {
    return res.json({ output: e.toString() })
  }
})


app.post('/ast', (req, res) => {
  const { code, language } = req.body

  try {
    if (language === "javascript") {
      const ast = acorn.parse(code, { ecmaVersion: 'latest' })
      return res.json(ast)
    }

    const lines = code.split("\n").filter(l => l.trim() !== "")

    let ast = {
      name: "Program",
      children: []
    }

    lines.forEach(line => {
      let node = { name: "", children: [] }

      if (line.includes("#include")) node.name = "Preprocessor"
      else if (line.includes("main")) node.name = "FunctionDeclaration"
      else if (line.includes("printf") || line.includes("cout") || line.includes("System.out")) node.name = "PrintStatement"
      else if (line.includes("return")) node.name = "ReturnStatement"
      else node.name = "Statement"

      node.children.push({ name: line.trim() })
      ast.children.push(node)
    })

    return res.json(ast)

  } catch (e) {
    res.json({ error: e.toString() })
  }
})


app.post('/tokens', (req, res) => {
  const { code, language } = req.body

  try {
    if (language === "javascript") {
      const tokenizer = acorn.tokenizer(code, { ecmaVersion: 'latest' })
      let tokens = []

      for (let token of tokenizer) {
        tokens.push({
          type: token.type.label,
          value: token.value || token.type.label
        })
      }

      return res.json(tokens)
    }

    const words = code.split(/\s+/)

    const tokens = words.map(w => ({
      type: "token",
      value: w
    }))

    res.json(tokens)

  } catch (e) {
    res.json({ error: e.toString() })
  }
})


app.post('/semantic', (req, res) => {
  const { code, language } = req.body

  try {
    let errors = []
    const lines = code.split("\n")

    if (language !== "javascript") {
      lines.forEach((line, i) => {
        const t = line.trim()

        if (
          t &&
          !t.endsWith(";") &&
          !t.endsWith("{") &&
          !t.endsWith("}") &&
          !t.startsWith("#")
        ) {
          errors.push(`Line ${i + 1}: Missing semicolon`)
        }
      })
    }

    if (code.trim() === "") {
      errors.push("Empty program")
    }

    if (language === "javascript") {
      try {
        acorn.parse(code, { ecmaVersion: 'latest' })
      } catch (e) {
        errors.push(e.message)
      }
    }

    res.json({
      errors: errors.length ? errors : ["No semantic errors"]
    })

  } catch (e) {
    res.json({ errors: [e.toString()] })
  }
})


app.post('/ir', (req, res) => {
  const { code } = req.body

  const lines = code.split("\n").filter(l => l.trim() !== "")

  let ir = []
  let t = 1

  lines.forEach(line => {
    ir.push(`t${t++}: ${line.trim()}`)
  })

  res.json(ir)
})


// 🔥 FINAL CFG (NO OVERLAP FIX)
app.post('/cfg', (req, res) => {
  const { code } = req.body

  const lines = code.split("\n").filter(l => l.trim() !== "")

  let nodes = []
  let edges = []
  let id = 1
  let edgeId = 1

  function createNode(label) {
    const node = { id: String(id++), label }
    nodes.push(node)
    return node.id
  }

  function createEdge(source, target, label = "", type = "straight") {
    edges.push({
      id: `e${edgeId++}`,
      source,
      target,
      label,
      type,
      animated: type === "loop",
      curvature: type === "loop" ? 0.5 : 0 // 👈 key fix
    })
  }

  const start = createNode("Start")
  let prev = start

  let stack = []

  lines.forEach(line => {
    const trimmed = line.trim()

    // LOOP
    if (trimmed.startsWith("for") || trimmed.startsWith("while")) {
      const cond = createNode(trimmed)
      createEdge(prev, cond)

      stack.push({
        type: "loop",
        condition: cond
      })

      prev = cond
      return
    }

    const current = createNode(trimmed)
    createEdge(prev, current)

    // LOOP BODY
    if (stack.length > 0) {
      let top = stack[stack.length - 1]
      if (top.type === "loop") {
        createEdge(top.condition, current, "true", "branch")
      }
    }

    // LOOP END
    if (trimmed === "}") {
      let last = stack.pop()
      if (last && last.type === "loop") {

        // 🔥 CURVED LEFT LOOP EDGE
        createEdge(current, last.condition, "loop", "loop")

        const exit = createNode("Exit Loop")
        createEdge(last.condition, exit, "false", "branch")

        prev = exit
        return
      }
    }

    prev = current
  })

  const end = createNode("End")
  createEdge(prev, end)

  res.json({ nodes, edges })
})


// 🚀 SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000")
})