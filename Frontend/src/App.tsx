import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AuthPage from "./Pages/Auth/Auth"
import AuthCallback from "./Pages/Auth/AuthCallback"
import Home from "./Pages/Home/Home"
import Chat from "./Pages/Chat/Chat"


function App() {

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token")
    if (!token) return <Navigate to="/auth" replace />
    return children
  }
  return (


    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>

  )
}
export default App