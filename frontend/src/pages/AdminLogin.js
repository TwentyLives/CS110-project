import React, { useState } from "react";
import { useNavigate } from "react-router";
import "../styles/login-styles.css";

function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3002/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                // store the key in sessionStorage
                // gets deleted as soon as the tab/window is closed
                sessionStorage.setItem("adminKey", data.adminKey);
                navigate("/admin/dashboard");
            } else {
                alert("Invalid admin credentials.");
            }
        } catch (err) {
            console.error("Admin login failed:", err);
            alert("Could not connect to the server.");
        }
    };

    return (
        <div className="login-page">
            <main className="login-content">
                <form onSubmit={handleLogin} className="login-form">
                    <h1>Admin Login</h1>
                    <div className="input-container">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
            </main>
        </div>
    );
}

export default AdminLogin;
