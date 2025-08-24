import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router'; 
import { Navigate } from 'react-router';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SharedAlbum from './pages/SharedAlbum';

const PrivateRoute = ({ children }) => {
    // verify login info saved here using localStorage or something else
    console.log("Ran private route!");
    const login = true;
    if(login){
        return children;
    } else {
        return <Navigate to="/login"/>;
    }
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path='/' element={
                    <PrivateRoute>
                        <Home/>
                    </PrivateRoute>}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/sharedalbum" element={<SharedAlbum />} />
            </Routes>
        </Router>
    );
}

export default App;