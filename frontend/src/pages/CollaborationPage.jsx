import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { collaborationAPI } from '../services'

export default function CollaborationPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState('my') // my, recommendations
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'development',
    required_skills: [],
    max_members: 5
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => collaborationAPI.getProjects(),
    enabled: view === 'my',
  })

  const { data: recommendationsData } = useQuery({
    queryKey: ['project-recommendations'],
    queryFn: () => collaborationAPI.getRecommendations(),
    enabled: view === 'recommendations',
  })

  const createMutation = useMutation({
    mutationFn: (data) => collaborationAPI.createProject(data),
    onSuccess: () => {
      setShowCreateModal(false)
      setNewProject({
        name: '',
        description: '',
        type: 'development',
        required_skills: [],
        max_members: 5
      })
      queryClient.invalidateQueries(['projects'])
    },
  })

  const joinMutation = useMutation({
    mutationFn: ({ id, message }) => collaborationAPI.joinProject(id, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries(['project-recommendations'])
      alert('申请已发送！')
    },
  })

  const projects = projectsData?.data?.projects || []
  const recommendations = recommendationsData?.data?.projects || []

  const handleCreate = (e) => {
    e.preventDefault()
    const skills = newProject.required_skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    createMutation.mutate({ ...newProject, required_skills: skills })
  }

  const handleJoin = (projectId) => {
    const message = prompt('介绍一下你自己，为什么想加入这个项目：')
    if (message) {
      joinMutation.mutate({ id: projectId, message })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'planning':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'planning': return '计划中'
      default: return status
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI协作</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>创建项目</span>
        </button>
      </div>

      {/* 标签切换 */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setView('my')}
          className={`pb-3 px-1 ${
            view === 'my'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          我的项目
        </button>
        <button
          onClick={() => setView('recommendations')}
          className={`pb-3 px-1 ${
            view === 'recommendations'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          推荐项目
        </button>
      </div>

      {/* 项目列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(view === 'my' ? projects : recommendations).length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>还没有项目</p>
          </div>
        ) : (
          (view === 'my' ? projects : recommendations).map((project) => (
            <div key={project.id} className="card">
              {/* 项目头部 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {project.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {getStatusIcon(project.status)}
                    <span>{getStatusText(project.status)}</span>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                  {project.type}
                </span>
              </div>

              {/* 描述 */}
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* 技能需求 */}
              {project.required_skills && project.required_skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">所需技能：</p>
                  <div className="flex flex-wrap gap-1">
                    {project.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 成员信息 */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{project.member_count || 0}/{project.max_members}</span>
                </div>
                <span>{project.pending_members_count || 0} 个待审核</span>
              </div>

              {/* 操作 */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {project.is_owner ? (
                  <button className="btn-primary text-sm flex-1">管理项目</button>
                ) : project.is_member ? (
                  <button className="btn-secondary text-sm flex-1" disabled>已加入</button>
                ) : project.has_applied ? (
                  <button className="btn-secondary text-sm flex-1" disabled>审核中</button>
                ) : (
                  <button
                    onClick={() => handleJoin(project.id)}
                    className="btn-primary text-sm flex-1"
                  >
                    申请加入
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 创建项目模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">创建协作项目</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input"
                  placeholder="项目名称"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="项目描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  项目类型
                </label>
                <select
                  value={newProject.type}
                  onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                  className="input"
                >
                  <option value="development">开发</option>
                  <option value="research">研究</option>
                  <option value="creative">创意</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  所需技能（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={newProject.required_skills}
                  onChange={(e) => setNewProject({ ...newProject, required_skills: e.target.value })}
                  className="input"
                  placeholder="python, react, ai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  最大成员数
                </label>
                <input
                  type="number"
                  value={newProject.max_members}
                  onChange={(e) => setNewProject({ ...newProject, max_members: parseInt(e.target.value) })}
                  className="input"
                  min="2"
                  max="20"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? '创建中...' : '创建'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
