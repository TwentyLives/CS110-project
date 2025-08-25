import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { Navigate } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AlbumPage from "./pages/AlbumPage";
import ProfilePage from "./pages/ProfilePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("eventSnapUser");
    const adminKey = sessionStorage.getItem("adminKey");
    console.log("Ran private route!");
    console.log(children.type);
    // only allow admin to access AlbumPage and no other pages that use private route
    if (token || (adminKey && children.type.name === "AlbumPage")) {
        return children;
    } else {
        return <Navigate to="/login" />;
    }
};

const AdminRoute = ({ children }) => {
    const adminKey = sessionStorage.getItem("adminKey");
    return adminKey ? children : <Navigate to="/admin/login" />;
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

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
