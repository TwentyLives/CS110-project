import React, { useState, useEffect } from "react";

export default function Photos() {
  const [photos, setPhotos] = useState([]);

  // Fetch all posts on first render
  useEffect(() => {
    fetch("http://localhost:3002/posts")
      .then((res) => res.json())
      .then((data) => setPhotos(data))
      .catch((err) => console.error("Failed to fetch posts:", err));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:3002/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.url) {
        setPhotos((prev) => [data, ...prev]); // prepend new post
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Photos</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {photos.map((post, i) => (
          <img
            key={i}
            src={post.url}
            alt="uploaded"
            style={{
              width: "150px",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
