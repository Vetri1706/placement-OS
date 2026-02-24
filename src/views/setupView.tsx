import { useState } from "react"

export default function SetupView({ onComplete }: any) {
  const [name, setName] = useState("")

  const handleStart = () => {
    window.appStore.set("profile", { name })
    onComplete()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass p-8 rounded-xl w-96">
        <h1 className="text-xl font-bold mb-4">Welcome 🚀</h1>

        <input
          placeholder="Your name"
          className="w-full p-2 rounded mb-4 bg-transparent border"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleStart}
          className="neon-button w-full py-2 rounded"
        >
          Start
        </button>
      </div>
    </div>
  )
}