import { Link } from "react-router-dom";

function Navbar({ logout }) {
  return (
    <nav className="navbar">
      <div className="navLeft">
        <Link to="/games">My Games</Link>
        <Link to="/add">Add Game</Link>
      </div>

      <div className="navRight">
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;