import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthPage from "./Pages/Auth/Auth"
import AuthCallback from "./Pages/Auth/AuthCallback"
import Home from "./Pages/Home/Home"
import Chat from "./Pages/Chat/Chat"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<Chat/>} />
      </Routes>
    </BrowserRouter>

  )
}
export default App