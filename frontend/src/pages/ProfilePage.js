import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import "../styles/profile-page.css";

// AlbumCard component
const AlbumCard = ({ album }) => {
    const coverImage =
        album.albumPosts && album.albumPosts.length > 0
            ? album.albumPosts[0].url
            : "https://placehold.co/600x400/a7a7a7/ffffff?text=Empty+Album";

    return (
        <Link to={`/album/${album._id}`} className="album-card">
            <img src={coverImage} alt={album.Title} className="album-cover-image" />
            <div className="album-info">
                <h3 className="album-title">{album.Title}</h3>
            </div>
        </Link>
    );
};

function ProfilePage() {
    const { userId } = useParams();
    const { user: loggedInUser, login } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- NEW: State for the edit modal ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editAvatarFile, setEditAvatarFile] = useState(null);

    const isOwner = loggedInUser && loggedInUser.id === userId;

    useEffect(() => {
        fetch(`http://localhost:3002/profile/${userId}`)
            .then((res) => res.json())
            .then((data) => {
                setProfileData(data);
                setEditUsername(data.user.username);
                setEditBio(data.user.bio || "");
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch profile data:", err);
                setIsLoading(false);
            });
    }, [userId]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("username", editUsername);
        formData.append("bio", editBio);
        if (editAvatarFile) {
            formData.append("avatar", editAvatarFile);
        }

        try {
            const response = await fetch(`http://localhost:3002/profile/${userId}`, {
                method: "PUT",
                body: formData,
            });

            if (response.ok) {
                const updatedData = await response.json();
                // refresh the profile data to show the changes
                setProfileData((prev) => ({
                    ...prev,
                    user: { ...prev.user, ...updatedData.updateData },
                }));
                // update the user in the global context if the username changed
                login({ ...loggedInUser, ...updatedData.updateData });
                setIsEditModalOpen(false); // close the modal
            } else {
                alert("Failed to update profile.");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
        }
    };

    if (isLoading) return <div>Loading profile...</div>;
    if (!profileData) return <div>Profile not found.</div>;

    const { user, albums } = profileData;

    return (
        <div className="profile-page-container">
            <Header />
            <main className="profile-page-main">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <img
                            src={
                                user.avatarUrl ||
                                `https://placehold.co/150x150/7f9cf5/ffffff?text=${user.username
                                    .charAt(0)
                                    .toUpperCase()}`
                            }
                            alt="User Avatar"
                            className="avatar-image"
                        />
                    </div>
                    <div className="profile-info">
                        <h1>{user.username}</h1>
                        <p className="profile-bio">{user.bio || "This user has not set a bio yet."}</p>
                        {isOwner && (
                            <button
                                className="edit-profile-button"
                                onClick={() => setIsEditModalOpen(true)} // open the modal
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-albums-section">
                    <h2>Albums</h2>
                    {albums.length > 0 ? (
                        <div className="album-grid">
                            {albums.map((album) => (
                                <AlbumCard key={album._id} album={album} />
                            ))}
                        </div>
                    ) : (
                        <p>{isOwner ? "You are" : "This user is"} not part of any albums yet.</p>
                    )}
                </div>
            </main>
            <Footer />

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <form onSubmit={handleProfileUpdate}>
                    <h2>Edit Your Profile</h2>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Profile Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => setEditAvatarFile(e.target.files[0])} />
                    </div>
                    <button type="submit" className="modal-submit-button">
                        Save Changes
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default ProfilePage;
