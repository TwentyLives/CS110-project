import React, { useState } from "react";
import { useNavigate } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/login-styles.css";
import { useAuth } from "../context/AuthContext";

function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3002/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json(); // get response data
                login({ token: data.token, username: username, id: data.userId });
                console.log("Login successful.");
                navigate("/");
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Login failed. Please try again.");
            }
        } catch (err) {
            console.error("Login request failed: ", err);
            alert("Could not connect to the server. Please try again later!");
        }
    };

    const handleRegister = (e) => {
        navigate("/register"); // go to register page if user clicks register
    };

    return (
        <div className="login-page">
            <Header />
            <main className="login-content">
                <form onSubmit={handleLogin} className="login-form">
                    <h1>Log in</h1>
                    <div className="input-container">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-container">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit">Login</button>
                    <button type="button" onClick={handleRegister}>
                        Create an account
                    </button>
                </form>
            </main>

            <Footer />
        </div>
    );
}

export default Login;
