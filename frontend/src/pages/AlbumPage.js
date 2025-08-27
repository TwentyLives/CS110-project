import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImageViewer from "../components/ImageViewer";
import Modal from "../components/Modal";
import "../styles/album-page.css";
import { Link } from "react-router";

function AlbumPage() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [album, setAlbum] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState("");

    const [openCommentMenu, setOpenCommentMenu] = useState(null); // track which menu is open
    const isAdmin = sessionStorage.getItem("adminKey"); // check if the user is an admin

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);

    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [usersToAdd, setUsersToAdd] = useState([]);

    const fileInputRef = useRef(null);

    useEffect(() => {
        // fetch album details
        fetch(`http://localhost:3002/album/${albumId}`)
            .then((res) => res.json())
            .then((data) => {
                setAlbum(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch album:", err);
                setIsLoading(false);
            });

        // fetch comments for this album
        fetch(`http://localhost:3002/comments/album/${albumId}`)
            .then((res) => res.json())
            .then((data) => setComments(data))
            .catch((err) => console.error("Failed to fetch comments:", err));
    }, [albumId]);

    // effect for searching users
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`http://localhost:3002/users/search?query=${searchQuery}`)
                .then((res) => res.json())
                .then((data) => setSearchResults(data))
                .catch((err) => console.error(err));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handlePostComment = async () => {
        if (!newCommentText.trim()) return;

        try {
            const response = await fetch("http://localhost:3002/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    albumId: albumId, // send the albumId
                    userId: user.id,
                    text: newCommentText,
                }),
            });

            if (response.ok) {
                const newComment = await response.json();
                // add the new comment to the list to show it instantly
                setComments([...comments, newComment]);
                setNewCommentText(""); // clear the input box
            } else {
                alert("Failed to post comment.");
            }
        } catch (err) {
            console.error("Error posting comment:", err);
        }
    };

    // delete comment for admins
    const handleDeleteComment = async (commentId) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                const response = await fetch(`http://localhost:3002/admin/comments/${commentId}`, {
                    method: "DELETE",
                    headers: {
                        "x-admin-key": isAdmin, // send the admin key for authorization
                    },
                });

                if (response.ok) {
                    // remove the comment from the state to update the UI instantly
                    setComments(comments.filter((c) => c._id !== commentId));
                } else {
                    alert("Failed to delete comment.");
                }
            } catch (err) {
                console.error("Error deleting comment:", err);
            }
        }
    };

    const handleRemoveTaggedUser = (userToRemove) => {
        setUsersToAdd(usersToAdd.filter((u) => u.id !== userToRemove.id));
    };
    const handleSelectUser = (userToAdd) => {
        if (!usersToAdd.some((u) => u.id === userToAdd.id)) {
            setUsersToAdd([...usersToAdd, userToAdd]);
        }
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleAddParticipants = async () => {
        if (usersToAdd.length === 0) return;

        const userIdsToAdd = usersToAdd.map((u) => u.id);

        try {
            const response = await fetch(`http://localhost:3002/album/${albumId}/participants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIdsToAdd }),
            });

            if (response.ok) {
                // refresh album data to show new participants
                const refreshed = await fetch(`http://localhost:3002/album/${albumId}`);
                const data = await refreshed.json();
                setAlbum(data);
                setIsParticipantsModalOpen(false);
                setUsersToAdd([]);
            } else {
                alert("Failed to add participants.");
            }
        } catch (err) {
            console.error("Error adding participants:", err);
        }
    };

    // handle adding a new photo
    const handleAddPhoto = async (event) => {
        const files = event.target.files; // this is now a list of files
        if (!files || files.length === 0) return;

        // loop through each selected file and upload it
        for (const file of files) {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("userId", user.id);

            try {
                const response = await fetch(`http://localhost:3002/albums/${albumId}/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    // update the album state after each successful upload
                    // to show photos appearing one by one
                    setAlbum((prevAlbum) => ({
                        ...prevAlbum,
                        albumPosts: [...prevAlbum.albumPosts, data.post],
                    }));
                } else {
                    alert(`Failed to upload ${file.name}.`);
                }
            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
            }
        }
    };

    // function to contrlo the image viewer
    const openImageViewer = (index) => {
        setViewerStartIndex(index);
        setIsViewerOpen(true);
    };

    const closeImageViewer = () => {
        setIsViewerOpen(false);
    };

    if (isLoading) {
        return <div>Loading album...</div>;
    }

    if (!album) {
        return <div>Album not found.</div>;
    }

    return (
        <div className="album-page-container">
            <Header />
            <main className="album-page-main">
                <div className="album-navigation">
                    <button onClick={() => navigate(-1)} className="back-button">
                        &larr; Back to Feed
                    </button>
                </div>

                <div className="album-title-block">
                    <h1>{album.Title}</h1>
                    <div className="album-actions">
                        <button className="add-participants-button" onClick={() => setIsParticipantsModalOpen(true)}>
                            Add Participants +
                        </button>
                    </div>
                </div>

                <div className="album-content-grid">
                    {/* Left Sidebar: Host Info */}
                    <div className="album-sidebar left-sidebar">
                        <h3>Host</h3>
                        <div className="host-info">
                            {album.authorInfo.avatarUrl ? (
                                <img
                                    src={album.authorInfo.avatarUrl}
                                    alt={album.authorInfo.username}
                                    className="avatar-image large"
                                />
                            ) : (
                                <div className="avatar-initial large">
                                    {album.authorInfo.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="host-name">{album.authorInfo.username}</span>
                        </div>

                        <p className="album-creation-date">
                            Created on {new Date(album.createdAt).toLocaleDateString()}
                        </p>
                        {/* Participants List*/}
                        <div className="participants-section">
                            <h3>Participants</h3>
                            <div className="participants-list">
                                {album.participantInfo.map((p) => (
                                    <Link to={`/profile/${p._id}`} key={p._id} className="participant-item">
                                        {p.avatarUrl ? (
                                            <img src={p.avatarUrl} alt={p.username} className="avatar-image small" />
                                        ) : (
                                            <div className="avatar-initial small">
                                                {p.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span>{p.username}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center: Photo Viewer */}
                    <div className="photo-viewer">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAddPhoto}
                            style={{ display: "none" }}
                            accept="image/*"
                            multiple // allows selecting multiple files
                        />
                        <div className="photo-viewer-header">
                            <h3>Photos</h3>
                            <button className="add-photo-button" onClick={() => fileInputRef.current.click()}>
                                Add Photo +
                            </button>
                        </div>
                        {album.albumPosts && album.albumPosts.length > 0 ? (
                            <div className="photo-grid">
                                {album.albumPosts.map((post, index) => (
                                    <img
                                        key={index}
                                        src={post.url}
                                        alt={`Album content ${index + 1}`}
                                        className="grid-photo"
                                        onClick={() => openImageViewer(index)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-album-message">
                                <p>This album is empty!</p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Comments */}
                    <div className="album-sidebar right-sidebar">
                        <h3>Comments</h3>
                        <div className="comments-list">
                            {comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment._id} className="comment-container">
                                        <div className="comment">
                                            <b>{comment.userInfo.username}:</b> {comment.text}
                                        </div>
                                        {/* admin only delete menu */}
                                        {isAdmin && (
                                            <div className="comment-menu">
                                                <button
                                                    className="comment-menu-button"
                                                    onClick={() =>
                                                        setOpenCommentMenu(
                                                            openCommentMenu === comment._id ? null : comment._id
                                                        )
                                                    }
                                                >
                                                    &#x22EE;
                                                </button>
                                                {openCommentMenu === comment._id && (
                                                    <div className="comment-menu-dropdown">
                                                        <button
                                                            className="delete-comment-button"
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                        <div className="comment-input-area">
                            <textarea
                                placeholder="Write a comment..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                            ></textarea>
                            <button onClick={handlePostComment}>Send Message</button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            <Modal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)}>
                <h2>Add Participants</h2>
                <div className="form-group">
                    <label>Tag Friends</label>
                    <div className="user-search-container">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for users..."
                        />
                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map((u) => (
                                    <div key={u.id} className="search-result-item" onClick={() => handleSelectUser(u)}>
                                        {u.username}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="tagged-users">
                        {usersToAdd.map((u) => (
                            <span key={u.id} className="tagged-user-pill">
                                {u.username}
                                <button
                                    type="button"
                                    className="remove-tag-button"
                                    onClick={() => handleRemoveTaggedUser(u)}
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
                <button onClick={handleAddParticipants} className="modal-submit-button">
                    Add to Album
                </button>
            </Modal>

            {isViewerOpen && (
                <ImageViewer images={album.albumPosts} startIndex={viewerStartIndex} onClose={closeImageViewer} />
            )}
        </div>
    );
}

export default AlbumPage;
