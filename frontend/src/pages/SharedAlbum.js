import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/shared-album.css";

function SharedAlbum() {
    const [albumId, setAlbumId] = useState(null);
    const [eventInfo, setEventInfo] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        // when clicking on an shared album, save the id to session storage called "currentAlbumId"
        const storedAlbumId = sessionStorage.getItem("currentAlbumId");
        if (!storedAlbumId) return;
        setAlbumId(storedAlbumId);

        const fetchAlbum = async () => {
            try {
                const res = await fetch(`http://localhost:3002/albums/${storedAlbumId}`);
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }
                const data = await res.json();

                setEventInfo({
                    title: data.title,
                    description: data.description,
                    author: data.author,
                    eventPhoto: data.eventPhoto
                });
                setPhotos(data.photos || []);
                setComments(data.comments || []);
            } catch (err) {
                console.error("Failed to fetch album:", err);
            }
        };

        fetchAlbum();
    }, []);

    // Upload comment
    const handleAddComment = async () => {
        if (newComment.trim() === "" || !albumId) return;

        try {
            const res = await fetch(`http://localhost:3002/albums/${albumId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newComment })
            });

            if (res.ok) {
                const savedComment = await res.json();
                setComments([...comments, savedComment]);
                setNewComment("");
            } else {
                const errorData = await res.json();
                console.error("Error posting comment:", errorData.error || "Unknown error");
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <div className="shared-album-container">
            <Header />

            <div className="main-content">
                {/* Event Info */}
                <aside className="event-info">
                    {eventInfo ? (
                        <>
                            <img
                                src={eventInfo.eventPhoto}
                                alt="Event Cover"
                                className="event-photo"
                            />
                            <h2>{eventInfo.title}</h2>
                            <div className="event-author">
                                <img
                                    src="https://placehold.co/50x50?text=👤"
                                    alt="Author Avatar"
                                    className="author-avatar"
                                />
                                <span className="author-name">
                                    Posted by {eventInfo.author}
                                </span>
                            </div>
                            <p>{eventInfo.description}</p>
                        </>
                    ) : (
                        <p>Loading event...</p>
                    )}
                </aside>

                {/* Album */}
                <section className="album-section">
                    <h3>Shared Album</h3>
                    <div className="photo-grid">
                        {photos.map((photo, idx) => (
                            <img
                                key={idx}
                                src={photo}
                                alt={`Album ${idx}`}
                                className="album-photo"
                            />
                        ))}
                    </div>
                </section>

                {/* Comments */}
                <aside className="comments-section">
                    <h3>Comments</h3>
                    <div className="comments-list">
                        {comments.map((c) => (
                            <div key={c.id} className="comment">
                                <strong>{c.user}:</strong> {c.text}
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
                    </div>
                    <button className="comment-send-btn" onClick={handleAddComment}>
                        Send
                    </button>
                </aside>
            </div>

            <Footer />
        </div>
    );
}

export default SharedAlbum;
