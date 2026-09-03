import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function AddGame({ token }) {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [platform, setPlatform] = useState("");
    const [year, setYear] = useState("");
    const [genre, setGenre] = useState("");
    const [romFile, setRomFile] = useState(null);
    const [artFile, setArtFile] = useState(null);
    const [artPreview, setArtPreview] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const pickArt = (file) => {
        setArtFile(file);
        setArtPreview(file ? URL.createObjectURL(file) : "");
    };

    const addGame = async () => {
        setError("");
        setBusy(true);

        try {
            const createRes = await fetch(`${API_URL}/games/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    platform,
                    year: Number(year),
                    genre,
                }),
            });

            if (!createRes.ok) throw new Error("Could not create the game");

            const game = await createRes.json();

            if (romFile || artFile) {
                const formData = new FormData();
                if (romFile) formData.append("rom", romFile);
                if (artFile) formData.append("art", artFile);

                const uploadRes = await fetch(`${API_URL}/games/${game.id}/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const detail = await uploadRes.json().catch(() => ({}));
                    throw new Error(detail.detail || "The game was created but the files could not be uploaded");
                }
            }

            navigate("/games");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="content">
            <h2>Add Game</h2>

            <div className="formCard">
                <input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <input
                    placeholder="Platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                />

                <input
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                />

                <input
                    placeholder="Genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                />

                <label className="fileLabel">ROM file</label>
                <input
                    type="file"
                    onChange={(e) => setRomFile(e.target.files[0])}
                />

                <label className="fileLabel">Cover art</label>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => pickArt(e.target.files[0])}
                />

                {artPreview && (
                    <img className="artPreview" src={artPreview} alt="Cover art preview" />
                )}

                {error && <p className="formError">{error}</p>}

                <button onClick={addGame} disabled={busy}>
                    {busy ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}

export default AddGame;
