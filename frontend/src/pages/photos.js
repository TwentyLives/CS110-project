import React, { useState, useEffect } from "react";

const TEST_USER_ID = "68a937b0cb5e7dca2ba93558"; // hardcoded user ID

export default function Photos() {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");

  // Fetch all posts of user
  useEffect(() => {
    fetch(`http://localhost:3002/posts/${TEST_USER_ID}`)
      .then((res) => res.json())
      .then((data) => setPhotos(data))
      .catch((err) => console.error("Failed to fetch posts:", err));

    fetch(`http://localhost:3002/albums/${TEST_USER_ID}`)
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Failed to fetch albums:", err));
  }, []);

  // Upload a new post
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", TEST_USER_ID);

    try {
      const res = await fetch("http://localhost:3002/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPhotos((prev) => [data, ...prev]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  // Create album
  const handleCreateAlbum = async () => {
    try {
      const res = await fetch("http://localhost:3002/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: TEST_USER_ID, albumTitle }),
      });
      const data = await res.json();
      alert(`Album created: ${data.albumId}`);
      setAlbumTitle("");
    } catch (err) {
      console.error("Failed to create album:", err);
    }
  };
  // Upload photo to a specific album
const handleAlbumUpload = async (e, albumId) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("userId", TEST_USER_ID);

  try {
    const res = await fetch(`http://localhost:3002/albums/${albumId}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.post) {
      alert("Photo added to album!");
      // Refresh albums so new photo shows up
      const refreshed = await fetch(`http://localhost:3002/albums/${TEST_USER_ID}`);
      const albumsData = await refreshed.json();
      setAlbums(albumsData);
    }
  } catch (err) {
    console.error("Album upload failed:", err);
  }
};

  // Post a comment
  const handleComment = async () => {
    try {
      const res = await fetch("http://localhost:3002/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPostId,
          userId: TEST_USER_ID,
          text: commentText,
        }),
      });
      const data = await res.json();
      alert("Comment posted");
      setComments((prev) => [...prev, data]);
      setCommentText("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Load comments for a post
  const loadComments = async (postId) => {
    setSelectedPostId(postId);
    try {
      const res = await fetch(`http://localhost:3002/comments/${postId}`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Photos</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />

      <h2>Create Album</h2>
      <input
        type="text"
        placeholder="Album title"
        value={albumTitle}
        onChange={(e) => setAlbumTitle(e.target.value)}
      />
      <button onClick={handleCreateAlbum}>Create Album</button>

      <h2>User Photos</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {photos.map((post) => (
          <div key={post._id} style={{ border: "1px solid #ccc", padding: "5px" }}>
            <img
              src={post.url}
              alt="uploaded"
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <button onClick={() => loadComments(post._id)}>Load Comments</button>
          </div>
        ))}
      </div>

      {selectedPostId && (
        <div style={{ marginTop: "20px" }}>
          <h3>Comments for Post {selectedPostId}</h3>
          {comments.map((c) => (
            <div key={c._id}>
              <b>{c.userId}</b>: {c.text}
            </div>
          ))}
          <input
            type="text"
            placeholder="Write a comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button onClick={handleComment}>Post Comment</button>
        </div>
      )}

      <h2>Albums</h2>
<ul>
  {albums.map((album) => (
    <li key={album._id} style={{ marginBottom: "20px" }}>
      <b>{album.Title}</b> ({album.albumPosts?.length || 0} posts)
      
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleAlbumUpload(e, album._id)}
        />
      </div>

      {/* Show album posts if they exist */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
        {album.albumPosts?.map((post, idx) => (
          <img
            key={idx}
            src={post.url}
            alt="album post"
            style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "6px" }}
          />
        ))}
      </div>
    </li>
  ))}
</ul>
    </div>
  );
}
