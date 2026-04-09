import { useState } from "react"
import Editor from "./components/Editor"
import ASTViewer from "./components/ASTViewer"
import CFGViewer from "./components/CFGViewer"
import "./App.css"

function App() {
  const [code, setCode] = useState(() => 'console.log("hello")')
  const [output, setOutput] = useState("")
  const [ast, setAst] = useState(null)
  const [cfg, setCFG] = useState(null)
  const [tokens, setTokens] = useState([])
  const [semantic, setSemantic] = useState([])
  const [ir, setIR] = useState([])
  const [language, setLanguage] = useState("javascript")
  const [error, setError] = useState("")

  const runCode = async () => {
    resetAll()
    const res = await fetch("http://localhost:5000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setOutput("")
    } else {
      setOutput(data.output)
    }
  }

  const getAST = async () => {
    const res = await fetch("http://localhost:5000/ast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setAst(null)
    } else {
      setError("")
      setAst(data)
    }
  }

  const getCFG = async () => {
    const res = await fetch("http://localhost:5000/cfg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setCFG(null)
    } else {
      setError("")
      setCFG(data)
    }
  }

  const getTokens = async () => {
    const res = await fetch("http://localhost:5000/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setTokens([])
    } else {
      setError("")
      setTokens(data)
    }
  }

  const getSemantic = async () => {
    const res = await fetch("http://localhost:5000/semantic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setSemantic([])
    } else {
      setError("")
      setSemantic(data.errors || [])
    }
  }

  const getIR = async () => {
    const res = await fetch("http://localhost:5000/ir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setIR([])
    } else {
      setError("")
      setIR(data)
    }
  }

  const resetAll = () => {
    setError("")
    setTokens([])
    setSemantic([])
    setIR([])
  }

  return (
    <div className="app-container">
      <h1>💻 Smart Online Compiler with AST & CFG Visualization</h1>

      <div className="main">

        {/* LEFT SIDE */}
        <div className="card">
          <h3>✍️ Code</h3>

          <select onChange={(e) => setLanguage(e.target.value)}>
            <option value="javascript">JavaScript</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <Editor code={code} setCode={setCode} language={language} />

          <div style={{ marginTop: "10px" }}>
            <button type="button" onClick={runCode}>Run</button>
            <button type="button" onClick={getAST}>AST</button>
            <button type="button" onClick={getCFG}>CFG</button>
            <button type="button" onClick={getTokens}>Tokens</button>
            <button type="button" onClick={getSemantic}>Semantic</button>
            <button type="button" onClick={getIR}>IR</button>
          </div>

          {/* OUTPUT */}
          <div className="output">
            <h4>Output</h4>
            <pre>
              {error ? `❌ ${error}` : output}
            </pre>
          </div>

          {/* ONLY SHOW IF NO ERROR */}
          {!error && tokens.length > 0 && (
            <div>
              <h4>Tokens</h4>
              <pre>{JSON.stringify(tokens, null, 2)}</pre>
            </div>
          )}

          {!error && semantic.length > 0 && (
            <div>
              <h4>Semantic</h4>
              <pre>{JSON.stringify(semantic, null, 2)}</pre>
            </div>
          )}

          {!error && ir.length > 0 && (
            <div>
              <h4>IR</h4>
              <pre>{JSON.stringify(ir, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="card">
          <h3>🌳 AST (Abstract Syntax Tree)</h3>
          {ast && !error ? <ASTViewer treeData={ast} /> : <p>No AST available</p>}

          <h3>🔀 CFG (Control Flow Graph)</h3>
          {cfg && !error ? <CFGViewer data={cfg} /> : <p>No CFG available</p>}
        </div>

      </div>
    </div>
  )
}

export default App