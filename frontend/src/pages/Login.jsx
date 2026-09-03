import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Login({ setToken }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username,
        password,
      }),
    });

    if (!res.ok) return alert("Login failed");

    const data = await res.json();
    setToken(data.access_token);
    navigate("/games");
  };

  return (
    <div className="centeredCard">
        <div className="authCard">
      <h1>RetroVault</h1>
      <h2>Login</h2>

      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

      <button onClick={login}>Login</button>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
      </div>
    </div>
  );
}

export default Login;