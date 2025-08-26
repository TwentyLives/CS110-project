import React, { useState } from "react";
import "../styles/header.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router";
import Search from "./Search";

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-left">
                    <Link to="/" className="header-title">
                        Event Snap
                    </Link>
                    {user && (
                        <nav className="header-nav">
                            <Link to="/">Home</Link>
                            <Link to="/contests">Contests</Link>
                            <Link to="/friends">Follows</Link>
                        </nav>
                    )}
                </div>

                {user && (
                    <div className="header-center">
                        <Search />
                    </div>
                )}

                {user ? (
                    <div className="header-right">
                        <div className="avatar-menu">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt="User Avatar"
                                    className="avatar-image"
                                    onClick={() => setDropdownVisible(!dropdownVisible)}
                                />
                            ) : (
                                <div className="avatar-initial" onClick={() => setDropdownVisible(!dropdownVisible)}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {dropdownVisible && (
                                <div className="dropdown">
                                    <Link to={`/profile/${user.id}`} onClick={() => setDropdownVisible(false)}>
                                        Profile
                                    </Link>
                                    <button onClick={handleLogout}>Sign Out</button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="header-right" /> // empty div for layout purposes
                )}
            </div>
        </header>
    );
}

export default Header;
