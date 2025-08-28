import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import ImageViewer from "../components/ImageViewer";
import "../styles/album-page.css";
import "../styles/contest.css";
import { Link } from "react-router";

export default function ContestPage() {
  const { contestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEntry, setUserEntry] = useState(null);

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const isAdmin = sessionStorage.getItem("adminKey");

  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [usersToAdd, setUsersToAdd] = useState([]);

  const [enlargedImageIndex, setEnlargedImageIndex] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchContest = async () => {
      try {
        const res = await fetch(`http://localhost:3002/contests/${contestId}`);
        if (!res.ok) throw new Error("Failed to fetch contest");
        const data = await res.json();

        if (!isMounted) return;

        const safeContest = {
          ...data,
          creatorInfo: data.creatorInfo || { username: "Unknown", avatarUrl: "" },
          entries: data.entries || [],
          participantInfo: data.participantInfo || [],
        };

        setContest(safeContest);
        setEntries(safeContest.entries);

        const entryByUser = safeContest.entries.find(
          (e) => e.userInfo?.username === user?.username
        );
        setUserEntry(entryByUser || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await fetch(`http://localhost:3002/comments/contest/${contestId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setComments(data);
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      }
    };

    if (user) {
      fetchContest();
      fetchComments();
    }

    return () => {
      isMounted = false;
    };
  }, [contestId, user]);

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

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || userEntry) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", user.id);

    try {
      const res = await fetch(`http://localhost:3002/contests/${contestId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newEntry = {
          ...data.entry,
          userInfo: {
            username: user.username,
            avatarUrl: user.avatarUrl || "",
          },
          totalLikes: 0,
          likedByCurrentUser: false,
        };
        setEntries([...entries, newEntry]);
        setUserEntry(newEntry);
      } else {
        alert("Failed to submit entry.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeToggle = async (entry) => {
    if (!user) return;

    try {
      const res = await fetch(`http://localhost:3002/contests/${contestId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: user.id,
          entryUserId: entry.userId
        }),
      });

      if (res.ok) {
        // Fetch updated entries from the server
        const updatedContest = await fetch(`http://localhost:3002/contests/${contestId}`);
        const data = await updatedContest.json();
        setEntries(data.entries);
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handlePostComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch("http://localhost:3002/comments/contest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          userId: user.id,
          text: newCommentText,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments([...comments, newComment]);
        setNewCommentText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const res = await fetch(`http://localhost:3002/admin/comments/${commentId}`, {
          method: "DELETE",
          headers: { "x-admin-key": isAdmin },
        });
        if (res.ok) setComments(comments.filter((c) => c._id !== commentId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSelectUser = (userToAdd) => {
    if (!usersToAdd.some((u) => u.username === userToAdd.username)) {
      setUsersToAdd([...usersToAdd, userToAdd]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveTaggedUser = (userToRemove) => {
    setUsersToAdd(usersToAdd.filter((u) => u.username !== userToRemove.username));
  };

  const handleAddParticipants = async () => {
    if (usersToAdd.length === 0) return;

    const userIdsToAdd = usersToAdd.map((u) => u.id);

    try {
      const res = await fetch(`http://localhost:3002/contests/${contestId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIdsToAdd }),
      });

      if (res.ok) {
        const refreshed = await fetch(`http://localhost:3002/contests/${contestId}`);
        const data = await refreshed.json();
        setContest(data);
        setIsParticipantsModalOpen(false);
        setUsersToAdd([]);
      } else {
        alert("Failed to add participants.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading contest...</div>;
  if (!contest || !user) return <div>Contest not found.</div>;

  const creatorUsername = contest.creatorInfo?.username || "Unknown";
  const creatorAvatar = contest.creatorInfo?.avatarUrl || "";
  const isHost = creatorUsername === user.username;
  const isParticipant = contest.participantInfo?.some((p) => p.username === user.username);

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
          <h1>{contest.title}</h1>
          <p>{contest.description}</p>
          <div className="album-actions">
            {isHost && (
              <button className="add-participants-button" onClick={() => setIsParticipantsModalOpen(true)}>
                Invite Users +
              </button>
            )}
          </div>
        </div>

        <div className="album-content-grid">
          {/* Participants */}
          <div className="album-sidebar left-sidebar">
            <h3>Host</h3>
            <div className="host-info">
              {creatorAvatar ? (
                <img src={creatorAvatar} alt={creatorUsername} className="avatar-image large" />
              ) : (
                <div className="avatar-initial large">{creatorUsername.charAt(0).toUpperCase()}</div>
              )}
              <span className="host-name">{creatorUsername}</span>
            </div>
            <p className="album-creation-date">Created on {new Date(contest.createdAt).toLocaleDateString()}</p>

            <div className="participants-section">
              <h3>Participants</h3>
              <div className="participants-list">
                {contest.participantInfo?.map(p => (
                  <Link to={`/profile/${p._id}`} key={p.username} className="participant-item">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.username} className="avatar-image small" />
                    ) : (
                      <div className="avatar-initial small">{p.username.charAt(0).toUpperCase()}</div>
                    )}
                    <span>{p.username}</span>
                  </Link>
                )) || <p>No participants yet.</p>}
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="photo-viewer">
            <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: "none" }} accept="image/*" />
            <div className="photo-viewer-header">
              <h3>Entries</h3>
              {(isHost || isParticipant) && !userEntry && (
                <button className="add-photo-button" onClick={() => fileInputRef.current.click()}>
                  Submit Entry +
                </button>
              )}
            </div>
            {entries.length > 0 ? (
              <div className="photo-grid">
                {entries.map((entry, idx) => (
                  <div key={idx} className="entry-card">
                    <img
                      src={entry.url}
                      alt={`Entry ${idx + 1}`}
                      className="grid-photo"
                      onClick={() => {
                        setEnlargedImageIndex(idx);
                        setIsImageViewerOpen(true);
                      }}
                    />
                    <p className="entry-author">{entry.userInfo?.username || "Unknown"}</p>
                    <button
                      onClick={() => handleLikeToggle(entry)}
                      style={{
                        color: "blue",
                        border: "1px solid blue",
                        borderRadius: "4px",
                        marginTop: "4px",
                        cursor: "pointer",
                        background: "transparent",
                        padding: "2px 6px"
                      }}
                    >
                      {entry.likedByCurrentUser ? "♥" : "♡"} {entry.totalLikes}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-album-message"><p>No entries yet.</p></div>
            )}
          </div>

          {/* Comments */}
          <div className="album-sidebar right-sidebar">
            <h3>Comments</h3>
            <div className="comments-list">
              {comments?.length > 0 ? comments.map(comment => (
                <div key={comment._id} className="comment-container">
                  <div className="comment"><b>{comment.userInfo?.username || "Unknown"}:</b> {comment.text}</div>
                  {isAdmin && (
                    <div className="comment-menu">
                      <button className="comment-menu-button" onClick={() => setOpenCommentMenu(openCommentMenu === comment._id ? null : comment._id)}>⋮</button>
                      {openCommentMenu === comment._id && (
                        <div className="comment-menu-dropdown">
                          <button className="delete-comment-button" onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )) : <p>No comments yet. Be the first to comment!</p>}
            </div>
            <div className="comment-input-area">
              <textarea placeholder="Write a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}></textarea>
              <button onClick={handlePostComment}>Send Message</button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Modal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)}>
        <h2>Invite Participants</h2>
        <div className="form-group">
          <label>Search Users</label>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..." />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(u => (
                <div key={u.username} className="search-result-item" onClick={() => handleSelectUser(u)}>
                  {u.username}
                </div>
              ))}
            </div>
          )}
          <div className="tagged-users">
            {usersToAdd.map(u => (
              <span key={u.username} className="tagged-user-pill">
                {u.username}
                <button type="button" className="remove-tag-button" onClick={() => handleRemoveTaggedUser(u)}>&times;</button>
              </span>
            ))}
          </div>
        </div>
        <button onClick={handleAddParticipants} className="modal-submit-button">Add Participants</button>
      </Modal>

      {isImageViewerOpen && (
        <ImageViewer
          images={entries}
          startIndex={enlargedImageIndex}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}
    </div>
  );
}
