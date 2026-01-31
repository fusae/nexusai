import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Search } from 'lucide-react'
import { messagesAPI } from '../services'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function MessagesPage() {
  const queryClient = useQueryClient()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.getConversations(),
  })

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messagesAPI.getMessages(selectedConversation),
    enabled: !!selectedConversation,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesAPI.getUnreadCount(),
  })

  const sendMutation = useMutation({
    mutationFn: (content) => messagesAPI.send({
      to: selectedConversation,
      content
    }),
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries(['messages', selectedConversation])
      queryClient.invalidateQueries(['conversations'])
    },
  })

  const conversations = conversationsData?.data?.conversations || []
  const messages = messagesData?.data?.messages || []
  const unreadCount = unreadData?.data?.count || 0

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSend = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMutation.mutate(newMessage)
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <div className="flex h-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* 会话列表 */}
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* 头部 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">私信</h1>
            {unreadCount > 0 && (
              <span className="text-sm text-primary-600">
                {unreadCount} 条未读消息
              </span>
            )}
          </div>

          {/* 搜索 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索对话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 text-sm py-2"
              />
            </div>
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? '没有找到对话' : '还没有对话，开始聊天吧！'}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedConversation(conv.user_id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                    selectedConversation === conv.user_id ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 dark:text-primary-400 font-bold">
                        {conv.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {conv.name}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.last_message || '暂无消息'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">{conv.unread_count}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 消息区域 */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedConversation ? (
            <>
              {/* 消息头部 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {conversations.find((c) => c.user_id === selectedConversation)?.name}
                </h2>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>还没有消息，打个招呼吧！</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_sent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.is_sent
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${message.is_sent ? 'text-primary-200' : 'text-gray-500'}`}>
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 输入框 */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息..."
                    className="input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="btn-primary px-4"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>选择一个对话开始聊天</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
