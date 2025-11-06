import React, { useState } from 'react';
import { buildPath } from './path';
import { storeToken } from '../tokenStorage';
import {jwtDecode} from 'jwt-decode';

interface DecodedToken {
  firstName: string;
  lastName: string;
  userId: string; // or whatever field your backend encodes
  iat: number;
  [key: string]: any;
}

function Login() {
  const [message, setMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setPassword] = useState('');

  async function doLogin(e: any): Promise<void> {
    e.preventDefault();

    // IMPORTANT: backend expects { email, password }
    const body = JSON.stringify({
      email: loginEmail,
      password: loginPassword
    });

    try {
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const res = await response.json();

      // backend might respond with { error: '...' }
      if (res.error) {
        setMessage(res.error); // e.g. "Invalid email or password"
        return;
      }

      // backend should respond with { token: "..." }
      const { token } = res;
      if (!token) {
        setMessage('No token returned from server');
        return;
      }

      // save token (localStorage, etc.)
      storeToken(token);

      // decode token so we can grab user data
      const decoded = jwtDecode<DecodedToken>(token);

      // pull useful fields out
      const firstName = decoded.firstName;
      const lastName = decoded.lastName;
      const userId = decoded.userId || decoded.id || decoded.userID;

      if (!userId) {
        console.warn('No userId in token payload:', decoded);
      }

      // stash user info for the rest of the app
      const user = { firstName, lastName, id: userId };
      localStorage.setItem('user_data', JSON.stringify(user));

      // clear message + redirect
      setMessage('');
      window.location.href = '/cards';
    } catch (err: any) {
      console.error(err);
      setMessage('Server error. Try again.');
    }
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span>
      <br />
      Email:{' '}
      <input
        type="text"
        id="loginEmail"
        placeholder="Email"
        onChange={(e) => setLoginEmail(e.target.value)}
      />
      <br />
      Password:{' '}
      <input
        type="password"
        id="loginPassword"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="submit"
        id="loginButton"
        className="buttons"
        value="Log In"
        onClick={doLogin}
      />
      <span id="loginResult">{message}</span>
    </div>
  );
}

export default Login;
