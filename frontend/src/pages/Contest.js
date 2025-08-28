import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import "../styles/home-styles.css";
import "../styles/contest.css";

const ContestCard = ({ contest }) => {
  const contestImage =
    contest.entries && contest.entries.length > 0
      ? contest.entries[0].url
      : "https://placehold.co/600x400/a7a7a7/ffffff?text=Empty+Contest";

  return (
    <Link to={`/contests/${contest._id}`} className="album-card">
      <img
        src={contestImage}
        alt={contest.title}
        className="album-cover-image"
      />
      <div className="album-info">
        <h3 className="album-title">{contest.title}</h3>
        <p>{contest.description?.substring(0, 100) || "No description"}...</p>
      </div>
    </Link>
  );
};


export default function ContestsPage() {
  const { user } = useAuth();
  const [ownedContests, setOwnedContests] = useState([]);
  const [sharedContests, setSharedContests] = useState([]);
  const [otherContests, setOtherContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContestTitle, setNewContestTitle] = useState("");
  const [newContestDesc, setNewContestDesc] = useState("");

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await fetch("http://localhost:3002/contests");
        if (!res.ok) throw new Error("Failed to fetch contests");
        const data = await res.json();

        if (!user) return;

        const owned = data.filter(c => c.creatorId === user.id);

        const shared = data.filter(c => {
          if (Array.isArray(c.participantInfo)) {
            return c.participantInfo.some(p => p.username === user.username);
          }
          return false;
        });

        const others = data
          .filter(c => c.creatorId !== user.id && !shared.includes(c))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setOwnedContests(owned);
        setSharedContests(shared);
        setOtherContests(others);
      } catch (err) {
        console.error("Error fetching contests:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContests();
  }, [user]);

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (!newContestTitle.trim()) return;

    try {
      const res = await fetch("http://localhost:3002/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newContestTitle,
          description: newContestDesc,
          creatorId: user.id,
        }),
      });

      if (res.ok) {
        const savedContest = await res.json();
        setOwnedContests([savedContest, ...ownedContests]);
        setNewContestTitle("");
        setNewContestDesc("");
        setIsModalOpen(false);
      } else {
        alert("Failed to create contest.");
      }
    } catch (err) {
      console.error("Error creating contest:", err);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-feed">
        <div className="home-header">
          <h1>Contests</h1>
          <button className="add-album-button" style={{ marginLeft: "5rem" }} onClick={() => setIsModalOpen(true)}>
            Add +
          </button>
        </div>

        <div className="feed-content">
          {isLoading ? (
            <p>Loading contests...</p>
          ) : (
            <>
              <div className="album-section">
                <h2>Your Contests</h2>
                {ownedContests.length > 0 ? (
                  <div className="album-grid">
                    {ownedContests.map((contest) => (
                      <ContestCard key={contest._id} contest={contest} />
                    ))}
                  </div>
                ) : (
                  <p>You haven't created any contests yet.</p>
                )}
              </div>

              <div className="album-section">
                <h2>Contests Shared With You</h2>
                {sharedContests.length > 0 ? (
                  <div className="album-grid">
                    {sharedContests.map((contest) => (
                      <ContestCard key={contest._id} contest={contest} />
                    ))}
                  </div>
                ) : (
                  <p>No contest invites have been sent to you yet.</p>
                )}
              </div>

              <div className="album-section">
                <h2>Other Contests</h2>
                {otherContests.length > 0 ? (
                  <div className="album-grid">
                    {otherContests.map((contest) => (
                      <ContestCard key={contest._id} contest={contest} />
                    ))}
                  </div>
                ) : (
                  <p>No other contests available.</p>
                )}
              </div>
            </>
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCreateContest}>
            <h2>Create New Contest</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newContestTitle}
                onChange={(e) => setNewContestTitle(e.target.value)}
                placeholder="Contest Title"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newContestDesc}
                onChange={(e) => setNewContestDesc(e.target.value)}
                placeholder="Contest Description"
              />
            </div>
            <button type="submit" className="modal-submit-button">
              Create Contest
            </button>
          </form>
        </Modal>
      </main>
      <Footer />
    </div>
  );
}
