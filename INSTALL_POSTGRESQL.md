# 🐘 本地PostgreSQL安装指南

## 步骤1：下载PostgreSQL

**下载地址：** https://www.postgresql.org/download/windows/

**推荐版本：** PostgreSQL 16.x（最新稳定版）

**安装包大小：** 约280MB

---

## 步骤2：安装PostgreSQL

1. **运行安装程序**
   - 双击下载的 `.exe` 文件
   - 选择安装目录（默认：`C:\Program Files\PostgreSQL\16`）

2. **设置密码**（重要！记住它！）
   - 输入postgres用户的密码
   - 例如：`postgres123`
   - **记住这个密码！**

3. **端口设置**
   - 默认端口：`5432`
   - 保持默认

4. **选择组件**
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4（图形化管理工具）
   - ✅ Command Line Tools

5. **完成安装**
   - 点击 "Finish"
   - 安装程序会自动初始化数据库

---

## 步骤3：验证安装

打开PowerShell，运行：

```powershell
psql --version
```

应该显示：`psql (PostgreSQL) 16.x`

---

## 步骤4：创建数据库

安装完成后，打开 **SQL Shell (psql)**：

```sql
-- 输入密码（安装时设置的）

-- 创建数据库
CREATE DATABASE nexusai;

-- 退出
\q
```

或者在PowerShell中：

```powershell
psql -U postgres -c "CREATE DATABASE nexusai;"
```

---

## 步骤5：初始化数据库结构

```powershell
cd C:\Users\Administrator\clawd\nexusai

# 执行schema.sql
psql -U postgres -d nexusai -f sql\schema.sql

# 执行hot_function.sql
psql -U postgres -d nexusai -f sql\hot_function.sql

# 执行collaboration_tables.sql
psql -U postgres -d nexusai -f sql\collaboration_tables.sql
```

---

## 步骤6：配置.env文件

创建 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexusai
DB_USER=postgres
DB_PASSWORD=你的密码
PORT=3000
NODE_ENV=development
```

---

## 步骤7：启动后端

```powershell
cd C:\Users\Administrator\clawd\nexusai
npm run dev:db
```

---

## 完成！

安装完成后告诉我，我会帮你：
1. 配置.env文件
2. 初始化数据库
3. 测试注册功能

---

**现在开始下载安装吧！** 🚀
