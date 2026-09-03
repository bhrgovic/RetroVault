import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function GameDetail({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState(null);

    const [title, setTitle] = useState("");
    const [platform, setPlatform] = useState("");
    const [year, setYear] = useState("");
    const [genre, setGenre] = useState("");

    const fetchGame = async () => {
        try {
            const res = await fetch(`${API_URL}/games/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to fetch game");

            const data = await res.json();

            // Ensure saves is always an array
            const safeGame = {
                ...data,
                saves: data.saves || [],
            };

            setGame(safeGame);
            setTitle(safeGame.title);
            setPlatform(safeGame.platform);
            setYear(safeGame.year);
            setGenre(safeGame.genre);
        } catch (err) {
            console.error(err);
        }
    };

    const updateGame = async () => {
        await fetch(`${API_URL}/games/${id}`, {
            method: "PUT",
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

        navigate("/games");
    };

    const deleteSave = async (saveId) => {
        await fetch(`${API_URL}/games/saves/${saveId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        fetchGame();
    };

    useEffect(() => {
        fetchGame();
    }, [id]);

    if (!game) return <div className="content">Loading...</div>;

    return (
        <div className="content">
            <h2>Edit Game</h2>

            <div className="formCard">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                />
                <input
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="Platform"
                />
                <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year"
                />
                <input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Genre"
                />

                <button onClick={updateGame}>Save Changes</button>
            </div>

            <div className="formCard">
                <h3>Save Files</h3>

                {game.saves.length === 0 ? (
                    <p>No saves uploaded yet.</p>
                ) : (
                    <ul>
                        {game.saves.map((save) => (
                            <li key={save.id}>
                                {save.file_path}
                                <button
                                    onClick={() => deleteSave(save.id)}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default GameDetail;