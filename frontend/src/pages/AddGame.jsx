import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function AddGame({ token }) {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [platform, setPlatform] = useState("");
    const [year, setYear] = useState("");
    const [genre, setGenre] = useState("");
    const [romFile, setRomFile] = useState(null); // ✅ FIX

    const addGame = async () => {
        const formData = new FormData();

        formData.append("title", title);
        formData.append("platform", platform);
        formData.append("year", year);
        formData.append("genre", genre);

        if (romFile) {
            formData.append("rom", romFile);
        }

        await fetch(`${API_URL}/games/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                // ❌ DO NOT set Content-Type manually when using FormData
            },
            body: formData,
        });

        navigate("/games");
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

                <input
                    type="file"
                    onChange={(e) => setRomFile(e.target.files[0])}
                />

                <button onClick={addGame}>Save</button>
            </div>
        </div>
    );
}

export default AddGame;