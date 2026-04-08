import Editor from "@monaco-editor/react"

export default function CodeEditor({ code, setCode, language }) {
  return (
    <Editor
      height="300px"
      language={language}
      value={code}
      theme="vs-dark"
      onChange={(value) => {
        if (value !== undefined) {
          setCode(value)
        }
      }}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
        automaticLayout: true
      }}
    />
  )
}