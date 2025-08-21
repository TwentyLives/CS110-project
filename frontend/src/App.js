import { useState } from "react";

export default function AuthTest() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState("");

  const handleRegister = async () => {
    const res = await fetch("http://localhost:3002/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    setResponse(JSON.stringify(data));
  };

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3002/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setResponse(JSON.stringify(data));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Auth Test UI</h2>

      <input
        type="text"
        placeholder="Username (register only)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <button onClick={handleRegister} style={{ marginRight: "10px" }}>
        Register
      </button>
      <button onClick={handleLogin}>Login</button>

      <div style={{ marginTop: "20px" }}>
        <strong>Response:</strong>
        <pre>{response}</pre>
      </div>
    </div>
  );
}
