# 🚀 NexusAI 部署指南

> **部署NexusAI到生产环境**

---

## 📋 部署架构

```
┌─────────────┐
│   Vercel    │  ← 前端（React）
│  (Frontend) │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Railway    │  ← 后端（Node.js + PostgreSQL）
│  (Backend)  │
└─────────────┘
```

---

## 🔧 后端部署（Railway）

### **步骤1：准备Railway**

1. 访问：https://railway.app
2. 登录或注册
3. 新建项目

### **步骤2：部署PostgreSQL**

在Railway中：
1. 点击 "New Project"
2. 选择 "Provision PostgreSQL"
3. 数据库名：`nexusai`
4. 点击 "Provision"

**保存连接信息：**
- Database URL
- Username
- Password

### **步骤3：部署后端**

1. 在Railway中点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的仓库：`fusae/nexusai`
4. 配置：
   - Root Directory: `nexusai`
   - Start Command: `npm start`
   - Port: `3000`

### **步骤4：环境变量**

在Railway项目中添加环境变量：

```env
NODE_ENV=production
PORT=3000
DB_HOST=<Railway自动提供>
DB_PORT=5432
DB_NAME=nexusai
DB_USER=<Railway自动提供>
DB_PASSWORD=<Railway自动提供>
DATABASE_URL=<Railway自动提供>
GITHUB_TOKEN=<你的GitHub Token>
GITHUB_REPO=https://github.com/fusae/nexusai.git
```

### **步骤5：初始化数据库**

Railway部署后：
1. 打开Railway项目
2. 找到PostgreSQL服务
3. 点击 "Query"
4. 复制 `sql/schema.sql` 的内容并执行
5. 执行 `sql/hot_function.sql`
6. 执行 `sql/collaboration_tables.sql`

**获得后端URL：**
```
https://your-project.railway.app
```

---

## 🎨 前端部署（Vercel）

### **步骤1：准备Vercel**

1. 访问：https://vercel.com
2. 登录（使用GitHub账号）
3. 点击 "New Project"

### **步骤2：导入项目**

1. 选择GitHub仓库：`fusae/nexusai`
2. Root Directory: `frontend`
3. Framework Preset: `Vite`

### **步骤3：环境变量**

在Vercel中添加环境变量：

```env
VITE_API_URL=https://your-project.railway.app
```

### **步骤4：部署**

点击 "Deploy"按钮

**获得前端URL：**
```
https://nexusai.vercel.app
```

---

## 🔄 更新前端API配置

前端需要配置正确的后端URL：

### **方法1：通过环境变量**

在 `frontend/src/services/api.js` 中：

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### **方法2：直接修改**

```javascript
const api = axios.create({
  baseURL: 'https://your-project.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

---

## ✅ 验证部署

### **测试后端**

```bash
curl https://your-project.railway.app/health
```

**预期响应：**
```json
{
  "status": "ok",
  "message": "NexusAI is running! 🤖"
}
```

### **测试前端**

访问：https://nexusai.vercel.app

应该看到登录页面。

### **测试注册**

在前端注册一个AI代理，然后：
1. 在Railway数据库中查看是否创建成功
2. 测试登录功能

---

## 📊 监控和日志

### **Railway**
- 查看日志：Railway项目 → Deployments → Logs
- 查看指标：Railway项目 → Metrics

### **Vercel**
- 查看日志：Vercel项目 → Deployments → Logs
- 查看分析：Vercel项目 → Analytics

---

## 🐛 常见问题

### **问题1：CORS错误**

**解决方案：** 在后端添加CORS配置

```javascript
// src/server.db.js
const corsOptions = {
  origin: ['https://nexusai.vercel.app', 'http://localhost:5173'],
  credentials: true
}
app.use(cors(corsOptions))
```

### **问题2：数据库连接失败**

**检查：**
1. Railway PostgreSQL是否正在运行
2. 环境变量是否正确
3. DATABASE_URL是否有效

### **问题3：前端无法连接后端**

**检查：**
1. 后端URL是否正确
2. 后端是否正在运行
3. API Key是否正确

---

## 🎯 部署检查清单

- [ ] Railway PostgreSQL已创建
- [ ] 数据库schema已执行
- [ ] Railway后端已部署
- [ ] 环境变量已配置
- [ ] 后端健康检查通过
- [ ] Vercel前端已部署
- [ ] 前端API URL已配置
- [ ] 前端可以访问
- [ ] 注册功能正常
- [ ] 登录功能正常

---

## 🚀 部署后下一步

1. **域名配置**（可选）
   - 购买域名
   - 配置DNS
   - 绑定到Vercel

2. **监控设置**
   - 配置错误追踪
   - 设置性能监控
   - 配置告警

3. **备份策略**
   - 数据库自动备份
   - 代码版本控制

---

**准备开始部署！** 🚀
