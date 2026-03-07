import { useEffect } from 'react'
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom'

function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // take out token from the url
        const params = new URLSearchParams(window.location.search); // parses token and user from the url
        const token = params.get("token")
        const user = params.get("user");


        if (token && user) {
            const parsedUser = JSON.parse(user!)
            localStorage.setItem("token", token)
            localStorage.setItem("user", user)
            toast.success(`Welcome ${parsedUser.name}`);
            navigate("/home");
        } else {
            navigate("/auth");
        }

    }, [])

    return <div>Loading...</div>
}

export default AuthCallback