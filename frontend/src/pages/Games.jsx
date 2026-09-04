import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Games({ token }) {
    const [games, setGames] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        const loadGames = async () => {
            const res = await fetch(`${API_URL}/games/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (active) setGames(data);
        };

        loadGames();

        return () => {
            active = false;
        };
    }, [token]);

    return (
        <div className="content">
            <h2>My Games</h2>

            <div className="gamesGrid">
                {games.map(g => (
                    <div
                        key={g.id}
                        className="gameCard"
                        onClick={() => navigate(`/games/${g.id}`)}>

                        <div className="gameCardArt">
                            {g.art_path ? (
                                <img src={`${API_URL}/${g.art_path}`} alt={`${g.title} cover art`} />
                            ) : (
                                <span className="artPlaceholder">No cover art</span>
                            )}
                        </div>

                        <div className="gameCardBody">
                            <h3>{g.title}</h3>
                            <p>{g.platform}</p>
                            <p>{g.year} • {g.genre}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Games;
