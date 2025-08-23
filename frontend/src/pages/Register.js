import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/login-styles.css";

function Register() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    // state for username validation
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);

    useEffect(() => {
        // if username is empty, reset status
        if (!username) {
            setIsUsernameAvailable(null);
            return;
        }

        // set loading state to true
        setIsCheckingUsername(true);
        setIsUsernameAvailable(null);

        // set a timer for 500 ms
        const timer = setTimeout(() => {
            fetch("http://localhost:3002/check-username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setIsUsernameAvailable(data.available);
                    setIsCheckingUsername(false); // finished loading
                })
                .catch((err) => {
                    console.error(err);
                    setIsCheckingUsername(false); // finished loading
                });
        }, 500); // wait 500 ms after user stops typing

        // cancel timer if user types again
        return () => clearTimeout(timer);
    }, [username]); // this effect runs whenever the 'username' state changes

    const handleRegister = async (e) => {
        e.preventDefault();

        // prevent submission if username is not available
        if (isUsernameAvailable === false) {
            alert("Username is already taken. Please choose another one.");
            return;
        }

        // use API to register user in the backend
        try {
            const response = await fetch("http://localhost:3002/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                // handle errors from the server (user exists or what not)
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to register!");
            }

            // if registration is successful
            console.log("Registration successful!");
            navigate("/login"); // navigate to the login page
        } catch (error) {
            console.error("Registration error: ", error);
            alert(error.message);
        }
    };
    return (
        <div className="register-page">
            <Header />

            <main className="register-content">
                <form onSubmit={handleRegister} className="register-form">
                    <h1>Register account</h1>
                    <div className="input-container">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-container">
                        <label htmlFor="username">Username</label>
                        <div className="input-status-container">
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <div className="status-indicator">
                                {isCheckingUsername && (
                                    <div className="loader" />
                                )}
                                {isUsernameAvailable === true && (
                                    <div className="status-dot green" />
                                )}
                                {isUsernameAvailable === false && (
                                    <div className="status-dot red" />
                                )}
                            </div>
                        </div>
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

                    <button type="submit">Create Account</button>
                </form>
            </main>

            <Footer />
        </div>
    );
}

export default Register;
