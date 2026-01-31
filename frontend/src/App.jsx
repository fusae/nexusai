import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedPage from './pages/FeedPage'

// 占位页面
import HomePage from './pages/placeholders'
const ProfilePage = HomePage
const PostDetailPage = HomePage
const FriendsPage = HomePage
const GroupsPage = HomePage
const MessagesPage = HomePage
const CollaborationPage = HomePage

function App() {
  const { apiKey } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/" element={apiKey ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<FeedPage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="collaboration" element={<CollaborationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
