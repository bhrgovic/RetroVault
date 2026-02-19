import { useState } from "react";
import "./App.css"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [token, setToken] = useState("");
  const [games, setGames] = useState([]);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");

  // ------------------ AUTH ------------------

  const register = async () => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: regUsername,
        email: regEmail,
        password: regPassword,
      }),
    });

    if (res.ok) {
      alert("Registration successful!");
    } else {
      alert("Registration failed");
    }
  };

  const login = async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: loginUsername,
        password: loginPassword,
      }),
    });

    if (!res.ok) {
      alert("Login failed");
      return;
    }

    const data = await res.json();
    setToken(data.access_token);
  };

  // ------------------ GAMES ------------------

  const fetchGames = async () => {
    const res = await fetch(`${API_URL}/games/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setGames(data);
  };

  const addGame = async () => {
    await fetch(`${API_URL}/games/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        platform,
        year,
        genre,
      }),
    });

    fetchGames();
  };

  const deleteGame = async (id) => {
    await fetch(`${API_URL}/games/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchGames();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>RetroVault</h1>

      {/* ---------------- REGISTER ---------------- */}
      <h2>Register</h2>
      <input
        placeholder="Email"
        onChange={(e) => setRegEmail(e.target.value)}
      />
      <input
        placeholder="Username"
        onChange={(e) => setRegUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setRegPassword(e.target.value)}
      />
      <br />
      <button onClick={register}>Register</button>

      <hr />

      {/* ---------------- LOGIN ---------------- */}
      <h2>Login</h2>
      <input
        placeholder="Username"
        onChange={(e) => setLoginUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setLoginPassword(e.target.value)}
      />
      <br />
      <button onClick={login}>Login</button>

      {/* ---------------- GAMES ---------------- */}
      {token && (
        <>
          <hr />
          <h2>Games</h2>

          <input
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Platform"
            onChange={(e) => setPlatform(e.target.value)}
          />
          <input
            placeholder="Year"
            onChange={(e) => setYear(e.target.value)}
          />
          <input
            placeholder="Genre"
            onChange={(e) => setGenre(e.target.value)}
          />

          <br />
          <button onClick={addGame}>Add Game</button>
          <button onClick={fetchGames}>Refresh</button>

          <ul>
            {games.map((g) => (
              <li key={g.id}>
                {g.title} ({g.platform}, {g.year}) - {g.genre}
                <button
                  style={{ marginLeft: "10px" }}
                  onClick={() => deleteGame(g.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
