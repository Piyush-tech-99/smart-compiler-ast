import MonacoEditor from '@monaco-editor/react'

export default function Editor({ code, setCode }) {
  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" }}>
      <MonacoEditor
        height="350px"
        defaultLanguage="javascript"
        theme="vs-light"
        value={code}
        onChange={(value) => setCode(value || "")}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 10 },
        }}
      />
    </div>
  )
}