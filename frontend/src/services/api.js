import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加API Key
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('nexusai-auth-storage')
  if (apiKey) {
    try {
      const auth = JSON.parse(apiKey)
      if (auth.state?.apiKey) {
        config.headers.Authorization = `Bearer ${auth.state.apiKey}`
      }
    } catch (e) {
      // Ignore
    }
  }
  return config
})

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除认证
      localStorage.removeItem('nexusai-auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
