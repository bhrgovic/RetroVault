import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function fileName(path, marker) {
    const base = (path || "").split("/").pop();
    const token = `_${marker}_`;
    const index = base.indexOf(token);

    return index === -1 ? base : base.slice(index + token.length);
}

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
    const [romFile, setRomFile] = useState(null);
    const [error, setError] = useState("");
    const [version, setVersion] = useState(0);

    const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const fetchGame = useCallback(async () => {
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
    }, [id, authHeader]);

    const downloadFile = async (url, suggestedName) => {
        setError("");

        const res = await fetch(url, { headers: authHeader });

        if (!res.ok) {
            const detail = await res.json().catch(() => ({}));
            setError(detail.detail || "Download failed");
            return;
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = suggestedName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);
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
        if (!artFile && !saveFile && !romFile) return;

        setError("");

        const formData = new FormData();
        if (artFile) formData.append("art", artFile);
        if (saveFile) formData.append("save", saveFile);
        if (romFile) formData.append("rom", romFile);

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
        setRomFile(null);
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
    }, [fetchGame]);

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
                <h3>ROM</h3>

                {game.rom_path ? (
                    <div className="fileRow">
                        <span className="fileName">{fileName(game.rom_path, "rom")}</span>
                        <button
                            className="smallButton"
                            onClick={() =>
                                downloadFile(
                                    `${API_URL}/games/${game.id}/rom`,
                                    fileName(game.rom_path, "rom")
                                )
                            }
                        >
                            Download
                        </button>
                    </div>
                ) : (
                    <p>No ROM uploaded yet.</p>
                )}
            </div>

            <div className="formCard">
                <h3>Save Files</h3>

                {game.saves.length === 0 ? (
                    <p>No saves uploaded yet.</p>
                ) : (
                    <ul className="fileList">
                        {game.saves.map((save) => (
                            <li key={save.id} className="fileRow">
                                <span className="fileName">
                                    {fileName(save.file_path, "save")}
                                </span>

                                <span className="fileActions">
                                    <button
                                        className="smallButton"
                                        onClick={() =>
                                            downloadFile(
                                                `${API_URL}/games/saves/${save.id}/download`,
                                                fileName(save.file_path, "save")
                                            )
                                        }
                                    >
                                        Download
                                    </button>

                                    <button
                                        className="smallButton dangerButton"
                                        onClick={() => deleteSave(save.id)}
                                    >
                                        Delete
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
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

                {game.art_path && (
                    <button className="dangerButton" onClick={removeArt}>
                        Remove Cover Art
                    </button>
                )}
            </div>

            <div className="formCard">
                <h3>Upload Files</h3>

                <label className="fileLabel">ROM file</label>
                <input type="file" onChange={(e) => setRomFile(e.target.files[0])} />

                <label className="fileLabel">Save file</label>
                <input type="file" onChange={(e) => setSaveFile(e.target.files[0])} />

                <label className="fileLabel">Cover art</label>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => setArtFile(e.target.files[0])}
                />

                {error && <p className="formError">{error}</p>}

                <button onClick={uploadFiles} disabled={!artFile && !saveFile && !romFile}>
                    Upload
                </button>
            </div>
        </div>
    );
}

export default GameDetail;
