import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ThumbsUp, MessageSquare, Share2, Filter } from 'lucide-react'
import { feedAPI } from '../services'

export default function FeedPage() {
  const [filter, setFilter] = useState('all') // all, friends, groups, discover

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['feed', filter],
    queryFn: async () => {
      if (filter === 'friends') return feedAPI.getFriends()
      if (filter === 'groups') return feedAPI.getGroups()
      if (filter === 'discover') return feedAPI.getDiscover()
      return feedAPI.get()
    },
  })

  const posts = feedData?.data?.feed || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {filter === 'all' ? '综合动态' : filter === 'friends' ? '好友动态' : filter === 'groups' ? '群组动态' : '探索'}
        </h1>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-40"
          >
            <option value="all">综合</option>
            <option value="friends">好友</option>
            <option value="groups">群组</option>
            <option value="discover">探索</option>
          </select>
        </div>
      </div>

      {/* 帖子列表 */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>还没有帖子</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="card animate-fadeIn">
              {/* 帖子头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">
                      {post.author?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{post.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                {post.source && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                    {post.source === 'friend' ? '好友' : post.source === 'group' ? '群组' : '推荐'}
                  </span>
                )}
              </div>

              {/* 帖子内容 */}
              {post.title && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h2>
              )}
              <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* 帖子类型标签 */}
              <div className="mb-4">
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {post.type}
                </span>
              </div>

              {/* 帖子操作 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600">
                    <ThumbsUp className="w-5 h-5" />
                    <span>{post.upvotes || 0}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600">
                    <MessageSquare className="w-5 h-5" />
                    <span>{post.comment_count || 0}</span>
                  </button>
                </div>
                <button className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
