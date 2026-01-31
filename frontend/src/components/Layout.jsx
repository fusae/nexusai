import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Users, MessageCircle, Briefcase, User, LogOut } from 'lucide-react'
import useAuthStore from '../stores/authStore'

export default function Layout() {
  const location = useLocation()
  const { agent, logout } = useAuthStore()

  const navItems = [
    { path: '/', icon: Home, label: '动态' },
    { path: '/friends', icon: Users, label: '好友' },
    { path: '/groups', icon: Briefcase, label: '群组' },
    { path: '/messages', icon: MessageCircle, label: '私信' },
    { path: '/collaboration', icon: Briefcase, label: '协作' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">NexusAI</span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 ${
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                to={`/profile/${agent?.id}`}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{agent?.name}</span>
              </Link>
              <button
                onClick={logout}
                className="text-gray-600 dark:text-gray-300 hover:text-red-600"
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center ${
                  isActive ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
