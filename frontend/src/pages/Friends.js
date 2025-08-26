import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/friends.css";

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [invites, setInvites] = useState([]);
  const [recs, setRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [friendsRes, invitesRes, recsRes] = await Promise.all([
          fetch(`http://localhost:3002/api/friends/curr`),
          fetch(`http://localhost:3002/api/friends/invites`),
          fetch(`http://localhost:3002/api/friends/recommends`),
        ]);

        const [friendsData, invitesData, recsData] = await Promise.all([
          friendsRes.json(),
          invitesRes.json(),
          recsRes.json(),
        ]);

        setFriends(friendsData);
        setInvites(invitesData);
        setRecs(recsData);
      } catch (err) {
        console.error("Failed to fetch friends data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleRemoveFriend = async (id) => {
    try {
      const res = await fetch(`http://localhost:3002/api/friends/remove/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFriends(friends.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };

  const handleAcceptInvite = async (id) => {
    try {
      const res = await fetch(`http://localhost:3002/api/friends/accept/${id}`, {
        method: "POST",
      });
      if (res.ok) {
        const accepted = invites.find((inv) => inv.id === id);
        if (accepted) {
          setFriends([...friends, accepted]);
          setInvites(invites.filter((inv) => inv.id !== id));
        }
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  const handleIgnoreInvite = async (id) => {
    try {
      const res = await fetch(`/http://localhost:3002/api/friends/ignore/${id}`, {
        method: "POST",
      });
      if (res.ok) {
        setInvites(invites.filter((inv) => inv.id !== id));
      }
    } catch (err) {
      console.error("Error ignoring invite:", err);
    }
  };

  const handleRequestFriend = async (id) => {
    try {
      const res = await fetch(`/http://localhost:3002/friends/request/${id}`, {
        method: "POST",
      });
      if (res.ok) {
        setRecs(recs.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Error requesting friend:", err);
    }
  };

  if (isLoading) {
    return <div>Loading friends...</div>;
  }

  return (
    <div className="friends-page-container">
      <Header />
      <main className="main-content">
        {/* Current Friends */}
        <div className="friends-column">
          <h3>Current Friends</h3>
          <div className="friends-list">
            {friends.length > 0 ? (
              friends.map((f) => (
                <div key={f.id} className="friend-card">
                  <img src={f.pfp || "default-pfp.png"} alt={f.name} />
                  <div className="friend-info">
                    <span>{f.name}</span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFriend(f.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No friends yet.</p>
            )}
          </div>
        </div>

        {/* Invites */}
        <div className="friends-column">
          <h3>Invites</h3>
          <div className="friends-list">
            {invites.length > 0 ? (
              invites.map((inv) => (
                <div key={inv.id} className="friend-card">
                  <img src={inv.pfp || "default-pfp.png"} alt={inv.name} />
                  <div className="friend-info">
                    <span>{inv.name}</span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAcceptInvite(inv.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="ignore-btn"
                      onClick={() => handleIgnoreInvite(inv.id)}
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No invites.</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="friends-column">
          <h3>Recommended Friends</h3>
          <div className="friends-list">
            {recs.length > 0 ? (
              recs.map((r) => (
                <div key={r.id} className="friend-card">
                  <img src={r.pfp || "default-pfp.png"} alt={r.name} />
                  <div className="friend-info">
                    <span>{r.name}</span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="request-btn"
                      onClick={() => handleRequestFriend(r.id)}
                    >
                      Request
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No recommendations.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default FriendsPage;
