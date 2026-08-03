import { useEffect, useState } from 'react'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import type { NavigateFunction } from 'react-router-dom'

interface UseAppInitParams {
    handleSessionClick: (session: any) => void
    fetchSession: () => Promise<void>
    navigate: NavigateFunction
}

export function useAppInit({ handleSessionClick, fetchSession, navigate }: UseAppInitParams) {
    const [user, setUser] = useState<any>(null)
    const [githubRepos, setGithubRepos] = useState<any[]>([])

    useEffect(() => {
        const init = async () => {
            const storedUser = localStorage.getItem("user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null
            if (parsedUser) setUser(parsedUser)

            const savedSession = localStorage.getItem("activeSession")
            if (savedSession) {
                handleSessionClick({ sessionId: savedSession })
            }

            if (parsedUser?.githubId) {
                const res = await api.get('/api/github/repos', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                setGithubRepos(res.data.data)
            }

            fetchSession()
        }
        init()
    }, [])

    const handleLogout = () => {
        toast.success("Logged out successfully")
        setTimeout(() => {
            localStorage.clear()
            navigate("/auth")
        }, 1000)
    }

    return { user, githubRepos, handleLogout }
}