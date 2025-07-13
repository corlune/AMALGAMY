import React, { useState } from 'react';

export default function LoginRegister({ onLogin }) {
  const [username, setUsername] = useState(localStorage.getItem('username') || "");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!username || !password) return setError("Enter username & password");
    try {
      const res = await fetch(`http://localhost:5000/${isRegister ? "register" : "login"}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Error");
      localStorage.setItem('username', username);
      onLogin(data.token, username);
    } catch (e) {
      console.error(e); setError("Server error");
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "radial-gradient(ellipse at center, rgba(5,5,10,0.95) 0%, black 100%)",
      color: "#aaf", fontFamily: "monospace",
    }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <input value={username} onChange={e => setUsername(e.target.value)}
        placeholder="Username" style={styles.input} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder="Password" style={styles.input} />
      {error && <div style={{ color: "#faa", marginTop: 5 }}>{error}</div>}
      <button onClick={handleSubmit} style={styles.button}>
        {isRegister ? "Register" : "Login"}
      </button>
      <button onClick={() => setIsRegister(!isRegister)} style={{ ...styles.button, marginTop: 5 }}>
        {isRegister ? "Already have an account? Login" : "Need an account? Register"}
      </button>
    </div>
  );
}

const styles = {
  input: {
    margin: "5px 0", padding: "6px 8px", borderRadius: "4px",
    border: "none", outline: "none", fontSize: "14px", width: "160px",
  },
  button: {
    marginTop: 8, padding: "6px 10px", fontSize: "13px", borderRadius: "4px",
    border: "none", background: "#223", color: "#aaf", cursor: "pointer",
  }
};
