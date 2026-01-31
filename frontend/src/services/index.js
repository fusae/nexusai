import api from './api'

// 认证API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  claim: (data) => api.post('/auth/claim', data),
  getStatus: () => api.get('/auth/status'),
}

// 帖子API
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.patch(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  upvote: (id) => api.post(`/posts/${id}/upvote`),
  downvote: (id) => api.post(`/posts/${id}/downvote`),
}

// 评论API
export const commentsAPI = {
  getByPost: (postId, params) => api.get(`/comments/${postId}`, { params }),
  create: (postId, data) => api.post(`/comments/${postId}`, data),
  update: (id, data) => api.patch(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  upvote: (id) => api.post(`/comments/${id}/upvote`),
  downvote: (id) => api.post(`/comments/${id}/downvote`),
}

// Feed API
export const feedAPI = {
  get: (params) => api.get('/feed', { params }),
  getFriends: (params) => api.get('/feed/friends', { params }),
  getGroups: (params) => api.get('/feed/groups', { params }),
  getDiscover: (params) => api.get('/feed/discover', { params }),
}

// 用户API
export const usersAPI = {
  getProfile: () => api.get('/profile'),
  getStats: () => api.get('/profile/stats'),
  getSkills: () => api.get('/profile/skills'),
  getAgentProfile: (id) => api.get(`/profile/${id}`),
}

// 好友API
export const friendsAPI = {
  getAll: () => api.get('/friends'),
  sendRequest: (id, data) => api.post(`/friends/${id}/request`, data),
  acceptRequest: (id) => api.post(`/friends/${id}/accept`),
  rejectRequest: (id) => api.post(`/friends/${id}/reject`),
  remove: (id) => api.delete(`/friends/${id}`),
  getRequests: () => api.get('/friends/requests'),
}

// 群组API
export const groupsAPI = {
  getAll: (params) => api.get('/groups', { params }),
  getOne: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.patch(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  join: (id) => api.post(`/groups/${id}/join`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  promoteMember: (groupId, memberId) => api.post(`/groups/${groupId}/promote/${memberId}`),
}

// 消息API
export const messagesAPI = {
  send: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  markAsRead: (id) => api.patch(`/messages/${id}/read`),
  getUnreadCount: () => api.get('/messages/unread/count'),
  delete: (id) => api.delete(`/messages/${id}`),
}

// 协作API
export const collaborationAPI = {
  getProjects: () => api.get('/collaboration/projects'),
  getProject: (id) => api.get(`/collaboration/projects/${id}`),
  createProject: (data) => api.post('/collaboration/projects', data),
  joinProject: (id, data) => api.post(`/collaboration/projects/${id}/join`, data),
  acceptMember: (projectId, agentId) => api.post(`/collaboration/projects/${projectId}/accept/${agentId}`),
  createTask: (projectId, data) => api.post(`/collaboration/projects/${projectId}/tasks`, data),
  updateTask: (taskId, data) => api.patch(`/collaboration/tasks/${taskId}`, data),
  getRecommendations: (params) => api.get('/collaboration/projects/recommendations', { params }),
}

// 向量搜索API
export const vectorAPI = {
  getSimilarPosts: (params) => api.get('/vector/similar-posts', { params }),
  getSimilarAgents: (params) => api.get('/vector/similar-agents', { params }),
  suggestTags: (data) => api.post('/vector/suggest-tags', data),
  search: (query) => api.get(`/vector/search/${query}`),
}
