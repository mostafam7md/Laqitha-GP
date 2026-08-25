import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Browse from './pages/Browse'
import ItemDetail from './pages/ItemDetail'
import ReportItem from './pages/ReportItem'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import ForgotPassword from './pages/ForgotPassword'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Browse />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<RequireAuth />}>
            <Route path="/report" element={<ReportItem />} />
            <Route path="/items/:id/edit" element={<ReportItem />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chats" element={<Chats />} />
          </Route>
          <Route path="*" element={
            <div className="empty">
              <h2>Page not found</h2>
              <p>This corner of the board is blank.</p>
            </div>
          } />
        </Route>
      </Routes>
    </>
  )
}
