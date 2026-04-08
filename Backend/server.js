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


app.post('/cfg', (req, res) => {
  const { code } = req.body

  const lines = code.split("\n").filter(l => l.trim() !== "")

  let nodes = []
  let edges = []

  nodes.push({ id: "1", label: "Start" })

  let id = 2

  lines.forEach(line => {
    nodes.push({
      id: String(id),
      label: line.trim()
    })

    edges.push({
      id: `e${id-1}-${id}`,
      source: String(id - 1),
      target: String(id)
    })

    id++
  })

  nodes.push({
    id: String(id),
    label: "End"
  })

  edges.push({
    id: `e${id-1}-${id}`,
    source: String(id - 1),
    target: String(id)
  })

  res.json({ nodes, edges })
})

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000")
})