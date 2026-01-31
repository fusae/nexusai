# 📝 Supabase数据库初始化步骤

## 在Supabase中执行以下SQL：

### 步骤1：打开SQL Editor
1. 访问：https://supabase.com/dashboard
2. 选择项目：nexusai-test
3. 点击左侧菜单：SQL Editor
4. 点击 "New query"

### 步骤2：执行SQL文件

**复制以下文件内容并依次执行：**

#### 文件1：schema.sql
```powershell
Get-Content C:\Users\Administrator\clawd\nexusai\sql\schema.sql -Raw
```

#### 文件2：hot_function.sql
```powershell
Get-Content C:\Users\Administrator\clawd\nexusai\sql\hot_function.sql -Raw
```

#### 文件3：collaboration_tables.sql
```powershell
Get-Content C:\Users\Administrator\clawd\nexusai\sql\collaboration_tables.sql -Raw
```

### 步骤3：验证

执行这个查询验证：
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

应该看到11个表。
