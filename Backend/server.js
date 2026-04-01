const express = require('express')
const cors = require('cors')
const acorn = require('acorn')
const { VM } = require('vm2')

const app = express()
app.use(cors())
app.use(express.json())

app.post('/run', (req, res) => {
  const { code } = req.body

  let logs = []

  const vm = new VM({
    timeout: 1000,
    sandbox: {
      console: {
        log: (...args) => logs.push(args.join(" "))
      }
    }
  })

  try {
    const result = vm.run(code)

    res.json({
      output: logs.length ? logs.join("\n") : String(result)
    })
  } catch (e) {
    res.json({ output: e.toString() })
  }
})

// AST
app.post('/ast', (req, res) => {
  try {
    const ast = acorn.parse(req.body.code, { ecmaVersion: 'latest' })
    res.json(ast)
  } catch (e) {
    res.json({ error: e.toString() })
  }
})

//  TOKENS
app.post('/tokens', (req, res) => {
  try {
    const tokenizer = acorn.tokenizer(req.body.code, { ecmaVersion: 'latest' })
    let tokens = []

    for (let token of tokenizer) {
      tokens.push({
        type: token.type.label,
        value: token.value
      })
    }

    res.json(tokens)
  } catch (e) {
    res.json({ error: e.toString() })
  }
})

//  SEMANTIC 
app.post('/semantic', (req, res) => {
  try {
    const ast = acorn.parse(req.body.code, { ecmaVersion: 'latest' })

    let declaredVars = new Set()
    let builtInFuncs = new Set(["console", "log"])
    let errors = []

    function traverse(node) {
      if (!node || typeof node !== 'object') return

      // Variable Declaration
      if (node.type === 'VariableDeclaration') {
        node.declarations.forEach(d => {
          declaredVars.add(d.id.name)
        })
      }

      // Identifier usage
      if (node.type === 'Identifier') {
        if (!declaredVars.has(node.name) && !builtInFuncs.has(node.name)) {
          errors.push(`Variable '${node.name}' is not declared`)
        }
      }

      // Function Call
      if (node.type === 'CallExpression') {

        if (node.callee.type === 'Identifier') {
          let funcName = node.callee.name
          if (!builtInFuncs.has(funcName)) {
            errors.push(`Function '${funcName}' is not defined`)
          }
        }

        if (node.callee.type === 'MemberExpression') {
          let obj = node.callee.object.name
          let prop = node.callee.property.name

          if (obj !== "console" || prop !== "log") {
            errors.push(`Unknown function '${obj}.${prop}'`)
          }
        }
      }

      for (let key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse)
        } else {
          traverse(node[key])
        }
      }
    }

    traverse(ast)

    res.json({
      errors: errors.length ? errors : ["No semantic errors"]
    })

  } catch (e) {
    res.json({ error: e.toString() })
  }
})

app.post('/ir', (req, res) => {
  try {
    const ast = acorn.parse(req.body.code, { ecmaVersion: 'latest' })

    let ir = []
    let temp = 1

    function generate(node) {
      if (!node) return ""

      //  Variable Declaration
      if (node.type === 'VariableDeclaration') {
        node.declarations.forEach(d => {
          let val = generate(d.init)
          ir.push(`${d.id.name} = ${val}`)
        })
      }

      //  Assignment Expression 
      if (node.type === 'AssignmentExpression') {
        let left = generate(node.left)
        let right = generate(node.right)

        ir.push(`${left} = ${right}`)
        return left
      }

      //  Binary Expression
      if (node.type === 'BinaryExpression') {
        let left = generate(node.left)
        let right = generate(node.right)

        let t = `t${temp++}`
        ir.push(`${t} = ${left} ${node.operator} ${right}`)
        return t
      }

      //  Identifier
      if (node.type === 'Identifier') {
        return node.name
      }

      //  Literal
      if (node.type === 'Literal') {
        return node.value
      }

      //  Expression Statement
      if (node.type === 'ExpressionStatement') {
        return generate(node.expression)
      }

      //  Function Call
      if (node.type === 'CallExpression') {
        let funcName = ""

        if (node.callee.type === 'MemberExpression') {
          funcName = `${node.callee.object.name}.${node.callee.property.name}`
        } else {
          funcName = node.callee.name
        }

        let args = node.arguments.map(arg => generate(arg)).join(", ")
        ir.push(`call ${funcName} ${args}`)
      }

      return ""
    }

    ast.body.forEach(generate)

    res.json(ir.length ? ir : ["No IR generated"])

  } catch (e) {
    res.json({ error: e.toString() })
  }
})

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000")
})