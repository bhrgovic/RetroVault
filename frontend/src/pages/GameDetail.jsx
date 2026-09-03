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

    const [artFile, setArtFile] = useState(null);
    const [saveFile, setSaveFile] = useState(null);
    const [error, setError] = useState("");
    const [version, setVersion] = useState(0);

    const authHeader = { Authorization: `Bearer ${token}` };

    const fetchGame = async () => {
        try {
            const res = await fetch(`${API_URL}/games/${id}`, { headers: authHeader });

            if (!res.ok) throw new Error("Failed to fetch game");

            const data = await res.json();

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
            setError(err.message);
        }
    };

    const updateGame = async () => {
        await fetch(`${API_URL}/games/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...authHeader,
            },
            body: JSON.stringify({
                title,
                platform,
                year: Number(year),
                genre,
            }),
        });

        navigate("/games");
    };

    const uploadFiles = async () => {
        if (!artFile && !saveFile) return;

        setError("");

        const formData = new FormData();
        if (artFile) formData.append("art", artFile);
        if (saveFile) formData.append("save", saveFile);

        const res = await fetch(`${API_URL}/games/${id}/upload`, {
            method: "POST",
            headers: authHeader,
            body: formData,
        });

        if (!res.ok) {
            const detail = await res.json().catch(() => ({}));
            setError(detail.detail || "Upload failed");
            return;
        }

        setArtFile(null);
        setSaveFile(null);
        setVersion(version + 1);
        fetchGame();
    };

    const removeArt = async () => {
        await fetch(`${API_URL}/games/${id}/art`, {
            method: "DELETE",
            headers: authHeader,
        });

        setVersion(version + 1);
        fetchGame();
    };

    const deleteSave = async (saveId) => {
        await fetch(`${API_URL}/games/saves/${saveId}`, {
            method: "DELETE",
            headers: authHeader,
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
                <h3>Cover Art</h3>

                {game.art_path ? (
                    <img
                        className="artPreview"
                        src={`${API_URL}/${game.art_path}?v=${version}`}
                        alt={`${game.title} cover art`}
                    />
                ) : (
                    <p>No cover art uploaded yet.</p>
                )}

                <label className="fileLabel">Upload or replace cover art</label>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => setArtFile(e.target.files[0])}
                />

                <label className="fileLabel">Upload a save file</label>
                <input
                    type="file"
                    onChange={(e) => setSaveFile(e.target.files[0])}
                />

                {error && <p className="formError">{error}</p>}

                <button onClick={uploadFiles} disabled={!artFile && !saveFile}>
                    Upload
                </button>

                {game.art_path && (
                    <button className="dangerButton" onClick={removeArt}>
                        Remove Cover Art
                    </button>
                )}
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
