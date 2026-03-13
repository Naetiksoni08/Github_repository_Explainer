import { useEffect } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'

function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token")
        const user = params.get("user");

        if (token && user) {
            const parsedUser = JSON.parse(user)
            localStorage.setItem("token", token)
            localStorage.setItem("user", user)
            
            // Unique ID prevents duplicate toasts in Strict Mode
            toast.success(`Welcome ${parsedUser.name}`, { id: 'auth-success' });
            
            setTimeout(() => navigate("/home"), 500)
        } else {
            navigate("/auth");
        }
    }, [navigate])

    return <div className="loading-screen">Authenticating...</div>
}

export default AuthCallback