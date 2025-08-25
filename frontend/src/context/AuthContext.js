import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

const LOCAL_STORAGE_KEY = "eventSnapUser";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // get the stored user
        const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData) => {
        // set the user data
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        // remove the user data
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
