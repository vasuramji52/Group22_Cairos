import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setPassword] = useState('');

    const app_name = import.meta.env.VITE_DOMAIN || 'localhost';
    function buildPath(route: string): string {
        const env = import.meta.env.VITE_ENVIRONMENT || 'development';
        if (env === 'development') {
            return `http://localhost:5000/${route}`;
        } else {
            return `http://${app_name}:5000/${route}`;
        }
    }

    async function doLogin(event: any): Promise<void> {
        event.preventDefault();
        var obj = { login: loginName, password: loginPassword };
        var js = JSON.stringify(obj);

        console.log('Fetch URL:', buildPath('api/login'));

        try {
            const response = await fetch(buildPath('api/login'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

            var res = JSON.parse(await response.text());

            if (res.id <= 0) {
                setMessage('User/Password combination incorrect');
            }
            else {  
                var user = { firstName: res.firstName, lastName: res.lastName, id: res.id }
                localStorage.setItem('user_data', JSON.stringify(user));

                setMessage('');
                navigate('/cards');
;
            }
        }
        catch (error: any) {
            alert(error.toString());
            return;
        }
    };

    return (
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN</span><br />
            <input type="text" id="loginName" placeholder="Username" onChange={(e) => setLoginName(e.target.value)} /><br />
            <input type="password" id="loginPassword" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br />
            <input type="submit" id="loginButton" className="buttons" value="Do It"
                onClick={doLogin} />
            <span id="loginResult">{message}</span>
        </div>
    );
};
export default Login;