import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "../styles/friends.css";

function Friends() {
  const { user } = useAuth();

  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [recs, setRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        setError(null);

        const [followingRes, followersRes, recsRes] = await Promise.all([
          fetch(`http://localhost:3002/following/${user.id}`),
          fetch(`http://localhost:3002/followers/${user.id}`),
          fetch(`http://localhost:3002/recommendations/${user.id}`),
        ]);

        if (!followingRes.ok || !followersRes.ok || !recsRes.ok) {
          throw new Error("One or more requests failed");
        }

        const [followingData, followersData, recsData] = await Promise.all([
          followingRes.json(),
          followersRes.json(),
          recsRes.json(),
        ]);

        setFollowing(followingData);
        setFollowers(followersData);
        setRecs(recsData);
      } catch (err) {
        console.error("Failed to fetch follow data:", err);
        setError("Couldn't fetch data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  const handleFollow = async (targetId) => {
    if (!user || !user.id) return;

    try {
      const res = await fetch(`http://localhost:3002/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, followId: targetId }),
      });

      if (res.ok) {
        const followedUser = recs.find((r) => r.id === targetId);
        if (followedUser) {
          setFollowing((prev) => [...prev, followedUser]);
          setRecs((prev) => prev.filter((r) => r.id !== targetId));
        }
      } else {
        console.warn("Follow request failed");
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  const handleUnfollow = async (targetId) => {
    if (!user || !user.id) return;

    try {
      const res = await fetch(`http://localhost:3002/unfollow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, unfollowId: targetId }),
      });

      if (res.ok) {
        setFollowing((prev) => prev.filter((f) => f.id !== targetId));
      } else {
        console.warn("Unfollow request failed");
      }
    } catch (err) {
      console.error("Error unfollowing user:", err);
    }
  };

  const handleRemoveFollower = async (followerId) => {
    if (!user || !user.id) return;

    try {
      const res = await fetch("http://localhost:3002/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, removeId: followerId }),
      });

      if (res.ok) {
        setFollowers((prev) => prev.filter((f) => f.id !== followerId));
      } else {
        console.warn("Remove follower request failed");
      }
    } catch (err) {
      console.error("Error removing follower:", err);
    }
  };

  const renderUserCard = (p, showFollowButton = false, showUnfollowButton = false, showRemoveButton = false) => {
    const hasAvatar = p.pfp && p.pfp.trim() !== "";

    return (
      <div key={p.id} className="friend-card">
        {hasAvatar ? (
          <img src={p.pfp} alt={p.username || p.name} className="avatar-image small" />
        ) : (
          <div className="avatar-initial small">{(p.username || p.name).charAt(0).toUpperCase()}</div>
        )}
        <div className="friend-info">
          <span>{p.username || p.name}</span>
        </div>
        <div className="friend-actions">
          {showFollowButton && (
            <button className="request-btn" onClick={() => handleFollow(p.id)}>Follow</button>
          )}
          {showUnfollowButton && (
            <button className="request-btn" onClick={() => handleUnfollow(p.id)}>Unfollow</button>
          )}
          {showRemoveButton && (
            <button className="request-btn remove" onClick={() => handleRemoveFollower(p.id)}>Remove</button>
          )}
        </div>
      </div>
    );
  };

  if (!user) return <div>Loading user info...</div>;
  if (isLoading) return <div>Loading follow data...</div>;

  return (
    <div className="friends-page-container">
      <Header />
      <main className="main-content">
        {error && <p className="error">{error}</p>}

        {/* Following */}
        <div className="friends-column">
          <h3>Following</h3>
          <div className="friends-list">
            {following.length
              ? following.map((f) => renderUserCard(f, false, true))
              : <p>No following data.</p>}
          </div>
        </div>

        {/* Followers */}
        <div className="friends-column">
          <h3>Followers</h3>
          <div className="friends-list">
            {followers.length
              ? followers.map((f) => renderUserCard(f, false, false, true))
              : <p>No followers data.</p>}
          </div>
        </div>

        {/* Recommendations */}
        <div className="friends-column">
          <h3>Recommended</h3>
          <div className="friends-list">
            {recs.length
              ? recs.map((r) => renderUserCard(r, true))
              : <p>No recommendations available.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Friends;
