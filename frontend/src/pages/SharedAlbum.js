import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/shared-album.css";

function SharedAlbum() {
    const [albumId, setAlbumId] = useState(null);
    const [album, setAlbum] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [uploadFile, setUploadFile] = useState(null);

    useEffect(() => {
        const storedAlbumId = sessionStorage.getItem("currentAlbumId");
        const storedUserId = sessionStorage.getItem("userId");
        if (!storedAlbumId || !storedUserId) return;

        setAlbumId(storedAlbumId);

        const fetchAlbum = async () => {
            try {
                const res = await fetch(`http://localhost:3002/albums/${storedAlbumId}`);
                if (!res.ok) throw new Error(`Server error: ${res.status}`);

                const albums = await res.json();
                const foundAlbum = albums.find((a) => a._id === storedAlbumId);

                if (foundAlbum) {
                    setAlbum(foundAlbum);
                    setPhotos(foundAlbum.albumPosts || []);
                    setComments(foundAlbum.comments || []);
                }
            } catch (err) {
                console.error("Failed to fetch album:", err);
            }
        };

        fetchAlbum();
    }, []);

    const handleUploadPhoto = async () => {
        if (!uploadFile || !albumId) return;

        const storedUserId = sessionStorage.getItem("userId");
        if (!storedUserId) {
            alert("You must be logged in to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("image", uploadFile);
        formData.append("userId", storedUserId);

        try {
            const res = await fetch(`http://localhost:3002/albums/${albumId}/upload`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setPhotos((prev) => [...prev, data.post]);
                setUploadFile(null);
            } else {
                console.error("Failed to upload image");
            }
        } catch (err) {
            console.error("Error uploading photo:", err);
        }
    };

    const handleAddComment = async () => {
        if (newComment.trim() === "" || !albumId) return;

        const storedUserId = sessionStorage.getItem("userId");
        const storedUsername = sessionStorage.getItem("username");

        try {
            const res = await fetch(`http://localhost:3002/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: newComment,
                    postId: albumId,
                    userId: storedUserId,
                    author: storedUsername
                }),
            });

            if (res.ok) {
                const savedComment = await res.json();
                setComments((prev) => [...prev, savedComment]);
                setNewComment("");
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    return (
        <div className="shared-album-container">
            <Header />

            <div className="main-content">
                <aside className="event-info">
                    {album ? (
                        <>
                            <h2>{album.Title}</h2>
                            <p>{album.description}</p>
                            <p>Author: {album.author}</p>
                        </>
                    ) : (
                        <p>Loading album...</p>
                    )}
                </aside>

                <section className="album-section">
                    <h3>Shared Album</h3>
                    <div className="upload-box">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                        />
                        <button onClick={handleUploadPhoto}>Upload</button>
                    </div>

                    <div className="photo-grid">
                        {photos.map((photo, idx) => (
                            <img
                                key={idx}
                                src={photo.url}
                                alt={`Album ${idx}`}
                                className="album-photo"
                            />
                        ))}
                    </div>
                </section>

                <aside className="comments-section">
                    <h3>Comments</h3>
                    <div className="comments-list">
                        {comments.map((c, idx) => (
                            <div key={idx} className="comment">
                                <strong>{c.author}:</strong> {c.text}
                            </div>
                        ))}
                    </div>
                    <div className="comment-input">
                        <input
                            type="text"
                            className="comment-box"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button className="comment-send-btn" onClick={handleAddComment}>
                            Send
                        </button>
                    </div>
                </aside>
            </div>

            <Footer />
        </div>
    );
}

export default SharedAlbum;
