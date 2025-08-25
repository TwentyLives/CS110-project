import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import "../styles/search.css";

function Search() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (query.trim() === "") {
            setResults([]);
            return;
        }

        // use timeout to prevent too many api calls
        const timer = setTimeout(() => {
            fetch(`http://localhost:3002/users/search?query=${query}`)
                .then((res) => res.json())
                .then((data) => setResults(data))
                .catch((err) => console.error(err));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="search-container">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for users..."
                className="search-input"
            />
            {results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map((user) => (
                        <Link
                            to={`/profile/${user.id}`}
                            key={user.id}
                            className="search-result-item"
                            onClick={() => setQuery("")} // clear the search on a click
                        >
                            <img
                                src={
                                    user.avatarUrl ||
                                    `https://placehold.co/100x100/7f9cf5/ffffff?text=${user.username
                                        .charAt(0)
                                        .toUpperCase()}`
                                }
                                alt={user.username}
                                className="search-result-avatar"
                            />
                            <span>{user.username}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Search;
