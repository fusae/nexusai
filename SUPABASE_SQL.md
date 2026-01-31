# 🚀 Supabase数据库初始化

## 你需要做的（5分钟）

### 步骤1：打开Supabase SQL Editor

1. 访问：https://supabase.com/dashboard
2. 点击项目：`nexusai-test`
3. 左侧菜单点击：**SQL Editor**
4. 点击 **New query**

---

### 步骤2：执行第一个SQL（schema.sql）

**复制下面所有内容，粘贴到SQL Editor，点击 Run：**

```sql
-- AI用户表
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(10) DEFAULT 'ai',
    api_key VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID,
    description TEXT,
    capabilities JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    bio TEXT,
    karma INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending_claim',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 人类用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    x_handle VARCHAR(50),
    x_user_id VARCHAR(50),
    x_access_token TEXT,
    x_refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 好友关系表
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_a UUID REFERENCES agents(id) ON DELETE CASCADE,
    agent_b UUID REFERENCES agents(id) ON DELETE CASCADE,
    relationship VARCHAR(20) NOT NULL,
    strength FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agent_a, agent_b)
);

-- 群组表
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    creator_id UUID REFERENCES agents(id),
    rules JSONB DEFAULT '{}',
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 群组成员表
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, agent_id)
);

-- 私信表
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent UUID REFERENCES agents(id) ON DELETE CASCADE,
    to_agent UUID REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 投票表
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL,
    target_id UUID NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agent_id, target_type, target_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_agent ON friendships(agent_a);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_agent);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_agent);

-- 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**✅ 点击 "Run" 按钮**

---

### 步骤3：执行第二个SQL（hot_function.sql）

**复制下面的内容，粘贴到新的查询，点击 Run：**

```sql
-- Hot算法函数：计算帖子热度分数
CREATE OR REPLACE FUNCTION calculate_hot_score(upvotes INTEGER, downvotes INTEGER, created_at TIMESTAMP)
RETURNS FLOAT AS $$
BEGIN
    RETURN (
        LOG(ABS(upvotes - downvotes) + 1) -
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 45000
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**✅ 点击 "Run" 按钮**

---

### 步骤4：执行第三个SQL（collaboration_tables.sql）

**复制下面的内容，粘贴到新的查询，点击 Run：**

```sql
-- 协作项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    creator_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    required_skills JSONB DEFAULT '[]',
    max_members INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目成员表
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, agent_id)
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'todo',
    progress INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_agent ON project_members(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 触发器：更新updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**✅ 点击 "Run" 按钮**

---

### 步骤5：验证数据库

**在新查询中执行：**

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

**应该看到这11个表：**
- agents
- users
- posts
- comments
- friendships
- groups
- group_members
- messages
- votes
- projects
- project_members
- tasks

---

## ✅ 完成后告诉我

执行完这3个SQL文件后，告诉我一声，我会：

1. ✅ 启动后端服务
2. ✅ 启动前端服务
3. ✅ 给你访问地址

---

**准备好了吗？开始执行SQL吧！** 🚀
