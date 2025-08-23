import React, {useState} from 'react';
import { useNavigate } from 'react-router';  // Hook for navigation
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/login-styles.css';

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); 

    const handleLogin = (e) => {
        e.preventDefault();

        // check API credentials here to backend

        console.log('Username: ', username);
        console.log('Password: ', password);

        // if login successful redirect to home page (check with backend)
        // save login info so user doesn't have to login everytime if they choose to save login
        if(true /*must change check*/){
            navigate('/');
        }
    };

    const handleRegister = (e) => {
        navigate('/register'); // go to register page if user clicks register 
    };

    return(
        <div className='login-page'>
            <Header/>
            <main className='login-content'>
                <form onSubmit={handleLogin} className='login-form'>
                    <h1>Log in</h1>
                    <div className='input-container'>
                        <label htmlFor='username'>Username</label>
                        <input type='text' id='username' value={username} onChange={(e) => setUsername(e.target.value)} required/>
                    </div>

                    <div className='input-container'>
                        <label htmlFor='password'>Password</label>
                        <input type="password" id='password' value={password} onChange={(e) => setPassword(e.target.value)} required/>
                    </div>

                    <button type='submit'>Login</button>
                    <button type='button' onClick={handleRegister}>Create an account</button>
                </form>
            </main>

            <Footer/>
        </div>
    );
}

export default Login;