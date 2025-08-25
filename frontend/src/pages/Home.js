import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import "../styles/home-styles.css";

const AlbumCard = ({ album }) => {
    const coverImage =
        album.albumPosts && album.albumPosts.length > 0
            ? album.albumPosts[0].url
            : "https://placehold.co/600x400/a7a7a7/ffffff?text=Empty+Album";

    return (
        <Link to={`/album/${album._id}`} className="album-card">
            <img src={coverImage} alt={album.Title} className="album-cover-image" />
            <div className="album-info">
                <h3 className="album-title">{album.Title}</h3>
            </div>
        </Link>
    );
};

function Home() {
    const { user } = useAuth();
    const [myAlbums, setMyAlbums] = useState([]);
    const [taggedAlbums, setTaggedAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState("");

    useEffect(() => {
        if (user) {
            fetch(`http://localhost:3002/albums/${user.id}`)
                .then((res) => res.json())
                .then((allAlbums) => {
                    const owned = allAlbums.filter((album) => album.userId === user.id);
                    const shared = allAlbums.filter((album) => album.userId !== user.id);
                    setMyAlbums(owned);
                    setTaggedAlbums(shared);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Failed to fetch albums: ", err);
                    setIsLoading(false);
                });
        }
    }, [user]);

    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!newAlbumTitle.trim()) return;

        try {
            const response = await fetch("http://localhost:3002/albums", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    albumTitle: newAlbumTitle,
                }),
            });

            if (response.ok) {
                const newAlbumData = await response.json();
                const newAlbum = {
                    _id: newAlbumData.albumId,
                    Title: newAlbumTitle,
                    userId: user.id,
                    albumPosts: [], // starts empty
                };
                setMyAlbums([newAlbum, ...myAlbums]);
                setNewAlbumTitle("");
                setIsModalOpen(false);
            } else {
                alert("Failed to create album.");
            }
        } catch (err) {
            console.error("Error creating album:", err);
        }
    };

    return (
        <div className="app-container">
            <Header />
            <main className="main-feed">
                <div className="home-header">
                    <h1>Your Albums</h1>
                    <button className="add-album-button" onClick={() => setIsModalOpen(true)}>
                        Add +
                    </button>
                </div>

                <div className="feed-content">
                    {isLoading ? (
                        <p>Loading albums...</p>
                    ) : (
                        <>
                            <div className="album-section">
                                <h2>Your Albums</h2>
                                {myAlbums.length > 0 ? (
                                    <div className="album-grid">
                                        {myAlbums.map((album) => (
                                            <AlbumCard key={album._id} album={album} />
                                        ))}
                                    </div>
                                ) : (
                                    <p>You haven't created any albums yet.</p>
                                )}
                            </div>
                            <div className="album-section">
                                <h2>Albums Shared With You</h2>
                                {taggedAlbums.length > 0 ? (
                                    <div className="album-grid">
                                        {taggedAlbums.map((album) => (
                                            <AlbumCard key={album._id} album={album} />
                                        ))}
                                    </div>
                                ) : (
                                    <p>No albums have been shared with you yet.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleCreateAlbum}>
                        <h2>Create New Album</h2>
                        <div className="form-group">
                            <label>Album Title</label>
                            <input
                                type="text"
                                value={newAlbumTitle}
                                onChange={(e) => setNewAlbumTitle(e.target.value)}
                                placeholder="e.g., Summer Vacation"
                                required
                            />
                        </div>
                        <button type="submit" className="modal-submit-button">
                            Create Album
                        </button>
                    </form>
                </Modal>
            </main>
            <Footer />
        </div>
    );
}

export default Home;
