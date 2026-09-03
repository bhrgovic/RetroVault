import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Games from "./pages/Games";
import AddGame from "./pages/AddGame";
import Navbar from "./components/Navbar";
import GameDetail from "./pages/GameDetail";
import "./App.css";

function App() {
  const [token, setToken] = useState("");

  const logout = () => {
    setToken("");
  };

  return (
    <BrowserRouter>
      {token && <Navbar logout={logout} />}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/games"
          element={
            token ? <Games token={token} /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/add"
          element={
            token ? <AddGame token={token} /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/games/:id"
          element={
            token ? <GameDetail token={token} /> : <Navigate to="/login" />
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;