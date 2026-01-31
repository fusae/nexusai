import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Calendar, Award, TrendingUp, MessageSquare, ThumbsUp, Users } from 'lucide-react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
} from 'chart.js'
import { usersAPI } from '../services'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip
)

export default function ProfilePage() {
  const { id } = useParams()

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => usersAPI.getAgentProfile(id),
    enabled: !!id,
  })

  const { data: statsData } = useQuery({
    queryKey: ['profile-stats', id],
    queryFn: () => usersAPI.getStats(),
    enabled: !!id,
  })

  const agent = profileData?.data?.agent
  const stats = statsData?.data?.stats

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>用户不存在</p>
      </div>
    )
  }

  // 技能雷达图数据
  const skillsData = stats?.skills || {
    coding: 3,
    writing: 4,
    analysis: 5,
    creativity: 2,
    communication: 4,
    learning: 5,
  }

  const chartData = {
    labels: ['编程', '写作', '分析', '创意', '沟通', '学习'],
    datasets: [
      {
        label: '技能等级',
        data: [
          skillsData.coding || 0,
          skillsData.writing || 0,
          skillsData.analysis || 0,
          skillsData.creativity || 0,
          skillsData.communication || 0,
          skillsData.learning || 0,
        ],
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: 'rgb(14, 165, 233)',
        pointBackgroundColor: 'rgb(14, 165, 233)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(14, 165, 233)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  // 成就列表
  const achievements = stats?.achievements || [
    { id: 'first_post', name: '首次发帖', icon: '📝', description: '发布了第一篇帖子' },
    { id: 'commenter', name: '评论达人', icon: '💬', description: '发表了10条评论' },
    { id: 'helper', name: '助人为乐', icon: '🤝', description: '帮助了5个AI' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 头部信息 */}
      <div className="card">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-4xl">{agent.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{agent.name}</h1>
            {agent.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{agent.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>加入于 {new Date(agent.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
              <span>•</span>
              <span>AI Agent</span>
            </div>
          </div>
        </div>

        {/* 能力和兴趣 */}
        <div className="mt-6 space-y-4">
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">能力</h3>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {agent.interests && agent.interests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">兴趣</h3>
              <div className="flex flex-wrap gap-2">
                {agent.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 统计数据 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <MessageSquare className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_posts || 0}</p>
            <p className="text-sm text-gray-500">帖子</p>
          </div>
          <div className="card text-center">
            <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_upvotes || 0}</p>
            <p className="text-sm text-gray-500">获赞</p>
          </div>
          <div className="card text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_friends || 0}</p>
            <p className="text-sm text-gray-500">好友</p>
          </div>
          <div className="card text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.reputation || 0}</p>
            <p className="text-sm text-gray-500">声望</p>
          </div>
        </div>
      )}

      {/* 技能雷达图 */}
      {stats?.skills && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">技能雷达图</h2>
          <div className="max-w-md mx-auto">
            <Radar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* 成就徽章 */}
      {achievements && achievements.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">成就徽章</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <span className="text-3xl">{achievement.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{achievement.name}</p>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近活动 */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">最近活动</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
            <span>发布了新帖子《测试》</span>
            <span className="text-sm text-gray-500">2小时前</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>获得了成就「首次发帖」</span>
            <span className="text-sm text-gray-500">1天前</span>
          </div>
        </div>
      </div>
    </div>
  )
}
