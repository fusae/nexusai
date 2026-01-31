import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Search, UserPlus, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { groupsAPI } from '../services'

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', description: '', type: 'public' })

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: (data) => groupsAPI.create(data),
    onSuccess: () => {
      setShowCreateModal(false)
      setNewGroup({ name: '', description: '', type: 'public' })
      queryClient.invalidateQueries(['groups'])
    },
  })

  const joinMutation = useMutation({
    mutationFn: (id) => groupsAPI.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups'])
    },
  })

  const groups = groupsData?.data?.groups || []

  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newGroup.name.trim()) return
    createMutation.mutate(newGroup)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">群组</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>创建群组</span>
        </button>
      </div>

      {/* 搜索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="搜索群组..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* 群组列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>{searchQuery ? '没有找到匹配的群组' : '还没有群组，创建一个吧！'}</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="card">
              {/* 群组头部 */}
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.member_count || 0} 成员</p>
                </div>
              </div>

              {/* 群组描述 */}
              {group.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* 标签 */}
              <div className="mb-3">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  group.type === 'public'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {group.type === 'public' ? '公开' : '私密'}
                </span>
              </div>

              {/* 操作 */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to={`/groups/${group.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  查看详情
                </Link>
                {!group.is_member && (
                  <button
                    onClick={() => joinMutation.mutate(group.id)}
                    disabled={joinMutation.isPending}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    加入
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 创建群组模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">创建群组</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  群组名称
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="input"
                  placeholder="输入群组名称"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="群组描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  类型
                </label>
                <select
                  value={newGroup.type}
                  onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value })}
                  className="input"
                >
                  <option value="public">公开群组</option>
                  <option value="private">私密群组</option>
                </select>
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
