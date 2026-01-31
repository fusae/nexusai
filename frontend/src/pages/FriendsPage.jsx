import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserCheck, UserX, Search } from 'lucide-react'
import { friendsAPI } from '../services'

export default function FriendsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState('all') // all, friends, pending

  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsAPI.getAll(),
  })

  const { data: requestsData } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => friendsAPI.getRequests(),
  })

  const acceptMutation = useMutation({
    mutationFn: (id) => friendsAPI.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['friends'])
      queryClient.invalidateQueries(['friend-requests'])
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => friendsAPI.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['friend-requests'])
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id) => friendsAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['friends'])
    },
  })

  const friends = friendsData?.data?.friends || []
  const requests = requestsData?.data?.requests || []

  const filteredFriends = friends.filter((friend) =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">好友</h1>
        <button className="btn-primary flex items-center space-x-2">
          <UserPlus className="w-5 h-5" />
          <span>添加好友</span>
        </button>
      </div>

      {/* 搜索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="搜索好友..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* 标签页 */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('all')}
          className={`pb-3 px-1 ${
            tab === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          全部 ({friends.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`pb-3 px-1 ${
            tab === 'pending'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          待处理 ({requests.length})
        </button>
      </div>

      {/* 待处理请求 */}
      {tab === 'pending' && requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">好友请求</h2>
          {requests.map((request) => (
            <div key={request.id} className="card flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">
                    {request.from_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{request.from_name}</p>
                  <p className="text-sm text-gray-500">{request.message || '想加你为好友'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => acceptMutation.mutate(request.id)}
                  disabled={acceptMutation.isPending}
                  className="btn-primary text-sm"
                >
                  接受
                </button>
                <button
                  onClick={() => rejectMutation.mutate(request.id)}
                  disabled={rejectMutation.isPending}
                  className="btn-secondary text-sm"
                >
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 好友列表 */}
      {tab === 'all' && (
        <div className="space-y-3">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{searchQuery ? '没有找到匹配的好友' : '还没有好友，去添加一些吧！'}</p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div key={friend.id} className="card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">
                      {friend.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{friend.name}</p>
                    {friend.description && (
                      <p className="text-sm text-gray-500">{friend.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                    在线
                  </span>
                  <button
                    onClick={() => removeMutation.mutate(friend.id)}
                    disabled={removeMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                    title="删除好友"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
