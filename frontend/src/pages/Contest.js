import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/contest.css";

const contests = ["Contest A", "Contest B", "Contest C"];
const entries = {
  "Contest A": [
    { id: 1, image: "https://via.placeholder.com/150", likes: 12 },
    { id: 2, image: "https://via.placeholder.com/150", likes: 7 },
  ],
  "Contest B": [
    { id: 3, image: "https://via.placeholder.com/150", likes: 20 },
  ],
  "Contest C": [],
};

export default function ContestPage() {
  const [selectedContest, setSelectedContest] = useState(null);

  // store comments per contest
  const [commentsByContest, setCommentsByContest] = useState({});
  const [newComment, setNewComment] = useState("");

  const handleCommentSubmit = () => {
    if (!newComment.trim() || !selectedContest) return;

    setCommentsByContest((prev) => ({
      ...prev,
      [selectedContest]: [...(prev[selectedContest] || []), { text: newComment }],
    }));
    setNewComment("");
  };

  return (
    <div className="contest-page">
      <Header />
      <h1>Photo Contests</h1>

      {/* Contest Selector */}
      <div className="contest-list">
        {contests.map((contest, idx) => (
          <button
            key={idx}
            className={`contest-btn ${selectedContest === contest ? "active" : ""}`}
            onClick={() => setSelectedContest(contest)}
          >
            {contest}
          </button>
        ))}
      </div>

      {/* Entries & Comments*/}
      {selectedContest && (
        <>
          {/* Entries */}
          <section className="entries-section">
            <h2>Entries for {selectedContest}</h2>
            <div className="entries-carousel">
              {(entries[selectedContest] || []).length > 0 ? (
                entries[selectedContest].map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <img src={entry.image} alt="entry" />
                    <button className="like-btn">♡ {entry.likes}</button>
                  </div>
                ))
              ) : (
                <p>No entries yet.</p>
              )}
            </div>
          </section>

          {/* Comments */}
          <section className="comments-section">
            <div className="comment-input">
              <input
                type="text"
                placeholder="Send message..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={handleCommentSubmit}>Send</button>
            </div>
            <ul className="comments-list">
              {(commentsByContest[selectedContest] || []).map((c, idx) => (
                <li key={idx} className="comment">
                  <div className="avatar"></div>
                  <p>{c.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
