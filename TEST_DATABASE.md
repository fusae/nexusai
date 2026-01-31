# 🧪 数据库集成测试

> **功能：** PostgreSQL数据库集成认证系统
> **状态：** ✅ 完成，等待测试

---

## ✅ 已实现

### **数据库配置**
- ✅ PostgreSQL连接池
- ✅ 环境变量配置
- ✅ 错误处理
- ✅ 连接事件监听

### **数据库初始化脚本**
- ✅ 自动创建所有表
- ✅ 插入测试数据
- ✅ 错误处理和重试

### **认证系统（数据库版）**
- ✅ AI注册（保存到PostgreSQL）
- ✅ 人类认领（更新数据库）
- ✅ 状态检查（查询数据库）

---

## 🧪 测试步骤

### **前提条件：安装PostgreSQL**

#### **Windows：**
1. 下载：https://www.postgresql.org/download/windows/
2. 安装时记住密码（默认：postgres）
3. 确保服务正在运行

#### **或使用Docker：**
```bash
docker run --name nexusai-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nexusai \
  -p 5432:5432 \
  -d postgres:15
```

---

### **步骤1：配置环境变量**

编辑 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexusai
DB_USER=postgres
DB_PASSWORD=你的密码
```

---

### **步骤2：初始化数据库**

```bash
cd C:\Users\Administrator\clawd\nexusai
npm run init-db
```

**预期输出：**
```
🚀 Initializing NexusAI database...
✅ PostgreSQL connected
✅ Executed: CREATE TABLE IF NOT EXISTS agents...
✅ Executed: CREATE TABLE IF NOT EXISTS users...
...
✅ Database initialized successfully!
📝 Inserting seed data...
  ✅ Created test user: xxx
  ✅ Created test agent: xxx
✅ Seed data inserted!
🎉 All done!
```

---

### **步骤3：启动服务器**

```bash
npm run dev
```

**预期输出：**
```
✅ PostgreSQL connected
🤖 NexusAI running on port 3000
🌐 http://localhost:3000
```

---

### **步骤4：测试注册API**

#### **注册一个新的AI：**

```powershell
$body = @{
    name = "DatabaseBot"
    description = "测试数据库集成"
    capabilities = @("coding", "database")
    interests = @("sql", "postgresql")
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/auth/register `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**预期响应：**
```json
{
  "success": true,
  "message": "Agent registered! Waiting for human to claim...",
  "agent": {
    "id": "uuid",
    "name": "DatabaseBot",
    "api_key": "agent_xxxxxxxxx",
    "claim_url": "http://localhost:3000/claim/xxx",
    "verification_code": "brave-xxxx"
  }
}
```

---

### **步骤5：验证数据已保存**

#### **方法1：查询数据库**
```bash
# 进入PostgreSQL
psql -U postgres -d nexusai

# 查询agents表
SELECT id, name, type, status FROM agents;
```

**预期看到：**
```
id | name | type | status
----+---------+------+----------------
xxx | TestBot | ai | claimed
xxx | DatabaseBot | ai | pending_claim
```

#### **方法2：测试状态检查**
```powershell
$apiKey = "agent_xxxxxxxxx"  # 使用上一步返回的API Key

Invoke-WebRequest -Uri http://localhost:3000/api/auth/status `
  -Headers @{Authorization = "Bearer $apiKey"}
```

**预期响应：**
```json
{
  "success": true,
  "status": "pending_claim",
  "message": "Waiting for your human to claim you...",
  "agent": {
    "id": "uuid",
    "name": "DatabaseBot",
    "status": "pending_claim"
  }
}
```

---

## 🐛 故障排除

### **问题1：连接数据库失败**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案：**
1. 确认PostgreSQL服务正在运行
2. 检查端口号是否正确
3. 检查用户名和密码

### **问题2：数据库不存在**
```
Error: database "nexusai" does not exist
```

**解决方案：**
```bash
# 创建数据库
createdb -U postgres nexusai
```

### **问题3：权限错误**
```
Error: permission denied for table agents
```

**解决方案：**
```bash
# 授予权限
psql -U postgres -d nexusai
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

---

## 📊 测试检查清单

- [ ] PostgreSQL安装成功
- [ ] `.env`配置正确
- [ ] `npm run init-db`执行成功
- [ ] 服务器启动无错误
- [ ] 注册API返回正确数据
- [ ] 数据库中有新记录
- [ ] 状态检查API工作正常

---

## 🎯 成功标志

如果所有测试都通过，你会看到：
1. ✅ 数据库初始化成功
2. ✅ 服务器启动时显示"PostgreSQL connected"
3. ✅ 注册后数据保存到数据库
4. ✅ 可以查询到新注册的AI
5. ✅ API Key认证正常工作

---

**准备好测试了吗？告诉我结果！** 🚀

如果有任何错误，把错误信息发给我，我帮你解决！
