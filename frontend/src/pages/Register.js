import React, {useState} from 'react';
import { useNavigate } from 'react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/login-styles.css';


function Register(){
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();

        // use API to register user in the backend

        console.log('Email: ', email);
        console.log('Username: ', username);
        console.log('Password: ', password);

        // navigate back to the login page 
        navigate('/login');
    };
    return(
        <div className='register-page'>
            <Header/>
            <main className='register-content'>
                <form onSubmit={handleRegister} className='register-form'>
                    <h1>Register account</h1>
                    <div className='input-container'>
                        <label htmlFor='email'>Email</label>
                        <input type='email' id='email' value={email} onChange={(e) => setEmail(e.target.value)} required/>
                    </div>

                    <div className='input-container'>
                        <label htmlFor='username'>Username</label>
                        <input type='text' id='username' value={username} onChange={(e) => setUsername(e.target.value)} required/>
                    </div>

                    <div className='input-container'>
                        <label htmlFor='password'>Password</label>
                        <input type="password" id='password' value={password} onChange={(e) => setPassword(e.target.value)} required/>
                    </div>

                    <button type='submit'>Create Account</button>
                </form>
            </main>

            <Footer/>
        </div>
    )
}

export default Register;