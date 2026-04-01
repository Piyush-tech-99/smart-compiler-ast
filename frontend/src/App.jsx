import { useState } from "react"
import Editor from "./components/Editor"
import ASTViewer from "./components/ASTViewer"
import "./App.css"

function App() {
  const [code, setCode] = useState('console.log("hello")')
  const [output, setOutput] = useState("")
  const [tokens, setTokens] = useState([])
  const [semantic, setSemantic] = useState([])
  const [ir, setIR] = useState([])
  const [ast, setAst] = useState(null)

  //  RUN
  const runCode = async () => {
    try {
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      setOutput(data.output)
    } catch (err) {
      setOutput("Server error")
    }
  }

  //  TOKENS
  const getTokens = async () => {
    try {
      const res = await fetch("http://localhost:5000/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      setTokens(data)
    } catch (err) {
      setTokens(["Error fetching tokens"])
    }
  }

  //  AST (NO PAGE REFRESH)
  const getAST = async () => {
    try {
      const res = await fetch("http://localhost:5000/ast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      setAst(data)   
    } catch (err) {
      setAst(null)
    }
  }

  //  SEMANTIC
  const getSemantic = async () => {
    try {
      const res = await fetch("http://localhost:5000/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      setSemantic(data.errors || [data.error])
    } catch (err) {
      setSemantic(["Semantic error"])
    }
  }

  //  IR
  const getIR = async () => {
    try {
      const res = await fetch("http://localhost:5000/ir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      setIR(data)
    } catch (err) {
      setIR(["IR error"])
    }
  }

  return (
    <div className="app-container">
      <h1>💻 Smart Online Compiler And Abstract Syntax Tree Visualizer</h1>

      <div className="main">

        {/* LEFT SIDE */}
        <div className="card">
          <h3>✍️ Write your code</h3>

          <Editor code={code} setCode={setCode} />

          {/* FIXED BUTTONS (NO REFRESH) */}
          <div style={{ marginTop: "10px" }}>
            <button type="button" onClick={runCode}>Run</button>
            <button type="button" onClick={getTokens}>Tokens</button>
            <button type="button" onClick={getAST}>AST</button>
            <button type="button" onClick={getSemantic}>Semantic</button>
            <button type="button" onClick={getIR}>IR</button>
          </div>

          {/* OUTPUT */}
          <div className="output">
            <h4>📤 Output</h4>
            <pre>{output}</pre>
          </div>

          {/* TOKENS */}
          {tokens.length > 0 && (
            <div>
              <h4>🔤 Tokens</h4>
              <pre>{JSON.stringify(tokens, null, 2)}</pre>
            </div>
          )}

          {/* SEMANTIC */}
          {semantic.length > 0 && (
            <div>
              <h4>⚠️ Semantic</h4>
              <pre>{JSON.stringify(semantic, null, 2)}</pre>
            </div>
          )}

          {/* IR */}
          {ir.length > 0 && (
            <div>
              <h4>⚙️ IR</h4>
              <pre>{JSON.stringify(ir, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* RIGHT SIDE (AST SHOWS HERE) */}
        <div className="card">
          <h3>🌳 AST Visualization</h3>

          {ast && !ast.error ? (
            <ASTViewer treeData={ast} />
          ) : (
            <p>Click AST to generate tree</p>
          )}
        </div>

      </div>
    </div>
  )
}

export default App