import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { Navigate } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Photos from "./pages/photos";
import AlbumPage from "./pages/AlbumPage";
import ProfilePage from "./pages/ProfilePage";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("eventSnapUser");
    console.log("Ran private route!");
    if (token) {
        return children;
    } else {
        return <Navigate to="/login" />;
    }
};

function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Home />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/album/:albumId"
                    element={
                        <PrivateRoute>
                            <AlbumPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile/:userId"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/photos" element={<Photos />} />
            </Routes>
        </Router>
    );
}

export default App;
