import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import "../styles/home-styles.css";
import "../styles/admin-styles.css";

function AdminDashboard() {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const adminKey = sessionStorage.getItem("adminKey");
        fetch("http://localhost:3002/admin/albums", {
            headers: {
                "x-admin-key": adminKey, // send the secret key for authorization
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setAlbums(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch albums:", err);
                setIsLoading(false);
            });
    }, []);

    const handleDelete = async (albumId) => {
        if (window.confirm("Are you sure you want to permanently delete this album?")) {
            const adminKey = sessionStorage.getItem("adminKey");
            try {
                const response = await fetch(`http://localhost:3002/admin/albums/${albumId}`, {
                    method: "DELETE",
                    headers: {
                        "x-admin-key": adminKey,
                    },
                });
                if (response.ok) {
                    // remove the deleted album from the state to update the UI
                    setAlbums(albums.filter((a) => a._id !== albumId));
                } else {
                    alert("Failed to delete album.");
                }
            } catch (err) {
                console.error("Error deleting album:", err);
            }
        }
    };

    if (isLoading) return <p>Loading albums...</p>;

    return (
        <div className="main-feed">
            <div className="home-header">
                <h1>Admin Dashboard</h1>
            </div>
            <div className="album-grid">
                {albums.map((album) => (
                    <div key={album._id} className="album-card admin-card">
                        <Link to={`/album/${album._id}`}>
                            <img
                                src={
                                    album.albumPosts && album.albumPosts.length > 0
                                        ? album.albumPosts[0].url
                                        : "https://placehold.co/600x400/a7a7a7/ffffff?text=Empty"
                                }
                                alt={album.Title}
                                className="album-cover-image"
                            />
                            <div className="album-info">
                                <h3 className="album-title">{album.Title}</h3>
                            </div>
                        </Link>
                        <div className="admin-actions">
                            <button
                                className="menu-button"
                                onClick={() => setOpenMenuId(openMenuId === album._id ? null : album._id)}
                            >
                                &#x22EE;
                            </button>
                            {openMenuId === album._id && (
                                <div className="admin-menu-dropdown">
                                    <button className="delete-button" onClick={() => handleDelete(album._id)}>
                                        Delete Album
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminDashboard;
