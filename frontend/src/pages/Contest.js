import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/contest.css";

export default function ContestPage() {
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [entries, setEntries] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await fetch("http://localhost:3002/contests");
        if (!res.ok) throw new Error("Failed to load contests");
        const data = await res.json();
        setContests(data);
      } catch (err) {
        console.error("Error fetching contests:", err);
      }
    };
    fetchContests();
  }, []);

  const loadContest = async (contestId) => {
    try {
      const res = await fetch(`http://localhost:3002/contests/${contestId}`);
      if (!res.ok) throw new Error("Failed to load contest");
      const data = await res.json();
      setSelectedContest(data);
      setEntries(data.entries || []);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching contest:", err);
    }
  };

  const handleLike = async (entryId) => {
    try {
      const res = await fetch(`http://localhost:3002/entries/${entryId}/like`, {
        method: "PATCH",
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === entryId ? { ...entry, likes: entry.likes + 1 } : entry
          )
        );
      }
    } catch (err) {
      console.error("Error liking entry:", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedContest) return;
    const storedUserId = sessionStorage.getItem("userId");
    const username = sessionStorage.getItem("username") || "Anonymous";

    try {
      const res = await fetch("http://localhost:3002/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newComment,
          contestId: selectedContest._id,
          userId: storedUserId,
          author: username,
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
    <div className="contest-container">
      <Header />

      <div className="main-content">
        {/* Contests */}
        <aside className="event-info">
          <h2>Photo Contests</h2>
          <div className="contest-list">
            {contests.map((contest) => (
              <button
                key={contest._id}
                className={`contest-btn ${
                  selectedContest?._id === contest._id ? "active" : ""
                }`}
                onClick={() => loadContest(contest._id)}
              >
                {contest.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Entries */}
        <section className="album-section">
          {selectedContest ? (
            <>
              <h3>{selectedContest.title}</h3>
              <p>{selectedContest.description}</p>
              <div className="photo-grid">
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <div key={entry.id} className="entry-card">
                      <img src={entry.url} alt="entry" className="album-photo" />
                      <button
                        className="like-btn"
                        onClick={() => handleLike(entry.id)}
                      >
                        ♡ {entry.likes}
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No entries yet.</p>
                )}
              </div>
            </>
          ) : (
            <p>Select a contest to view entries</p>
          )}
        </section>

        {/* Comments */}
        <aside className="comments-section">
          <h3>Comments</h3>
          <div className="comments-list">
            {comments.map((c, idx) => (
              <div key={idx} className="comment">
                <strong>{c.author}:</strong> {c.text}
              </div>
            ))}
          </div>
          {selectedContest && (
            <div className="comment-input">
              <textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button className="comment-send-btn" onClick={handleCommentSubmit}>
                Send
              </button>
            </div>
          )}
        </aside>
      </div>

      <Footer />
    </div>
  );
}
