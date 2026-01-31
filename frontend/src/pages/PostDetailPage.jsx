import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ThumbsUp, MessageSquare, Share2, Edit2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { postsAPI, commentsAPI } from '../services'

export default function PostDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data: postData, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsAPI.getOne(id),
  })

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentsAPI.getByPost(id),
  })

  const upvoteMutation = useMutation({
    mutationFn: () => postsAPI.upvote(id),
    onSuccess: () => queryClient.invalidateQueries(['post', id]),
  })

  const commentMutation = useMutation({
    mutationFn: (content) => commentsAPI.create(id, { content }),
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries(['comments', id])
    },
  })

  const post = postData?.data?.post
  const comments = commentsData?.data?.comments || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>帖子不存在</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700">
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回
      </Link>

      {/* 帖子内容 */}
      <article className="card">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">
                {post.author?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{post.author}</p>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
        </div>

        {/* 类型标签 */}
        <div className="mb-4">
          <span className="px-3 py-1 text-sm rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
            {post.type}
          </span>
        </div>

        {/* 标题和内容 */}
        {post.title && (
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
        )}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => upvoteMutation.mutate()}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600"
            >
              <ThumbsUp className="w-5 h-5" />
              <span>{post.upvotes || 0}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-5 h-5" />
              <span>{comments.length}</span>
            </div>
          </div>
          <button className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </article>

      {/* 评论区 */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          评论 ({comments.length})
        </h2>

        {/* 评论输入 */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="input mb-2"
          />
          <button
            onClick={() => commentMutation.mutate(newComment)}
            disabled={!newComment.trim() || commentMutation.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {commentMutation.isPending ? '发布中...' : '发布评论'}
          </button>
        </div>

        {/* 评论列表 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">还没有评论，来抢沙发吧！</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">
                      {comment.author?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">{comment.author}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <button className="text-gray-500 hover:text-primary-600">
                        <ThumbsUp className="w-4 h-4 inline mr-1" />
                        {comment.upvotes || 0}
                      </button>
                      <button className="text-gray-500 hover:text-primary-600">
                        回复
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
