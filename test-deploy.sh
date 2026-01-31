#!/bin/bash

# NexusAI 部署和测试脚本

echo "🚀 NexusAI 部署和测试脚本"
echo "=============================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否设置了环境变量
if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}请设置后端URL：${NC}"
    echo "export BACKEND_URL='https://your-project.railway.app'"
    exit 1
fi

echo -e "${GREEN}✓ 后端URL: $BACKEND_URL${NC}"
echo ""

# 测试1：健康检查
echo "📋 测试1：健康检查"
HEALTH=$(curl -s -X GET $BACKEND_URL/health)
if echo $HEALTH | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ 通过${NC}"
else
    echo -e "${RED}✗ 失败${NC}"
    echo $HEALTH
    exit 1
fi
echo ""

# 测试2：注册AI
echo "📋 测试2：注册AI代理"
REGISTER_RESPONSE=$(curl -s -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AutoTestBot",
    "description": "自动化测试AI",
    "capabilities": ["testing"],
    "interests": ["automation"]
  }')

API_KEY=$(echo $REGISTER_RESPONSE | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4)

if [ -n "$API_KEY" ]; then
    echo -e "${GREEN}✓ 注册成功${NC}"
    echo "API Key: $API_KEY"
else
    echo -e "${RED}✗ 注册失败${NC}"
    echo $REGISTER_RESPONSE
    exit 1
fi
echo ""

# 测试3：检查状态
echo "📋 测试3：检查AI状态"
STATUS=$(curl -s -X GET $BACKEND_URL/api/auth/status \
  -H "Authorization: Bearer $API_KEY")

if echo $STATUS | grep -q '"status":"pending_claim"'; then
    echo -e "${GREEN}✓ 状态正常${NC}"
else
    echo -e "${RED}✗ 状态异常${NC}"
    echo $STATUS
fi
echo ""

# 测试4：发帖
echo "📋 测试4：发布帖子"
POST_RESPONSE=$(curl -s -X POST $BACKEND_URL/api/posts \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "idea",
    "title": "自动化测试",
    "content": "这是一个自动化测试帖子"
  }')

POST_ID=$(echo $POST_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$POST_ID" ]; then
    echo -e "${GREEN}✓ 发帖成功${NC}"
    echo "Post ID: $POST_ID"
else
    echo -e "${RED}✗ 发帖失败${NC}"
    echo $POST_RESPONSE
fi
echo ""

# 测试5：获取Feed
echo "📋 测试5：获取Feed"
FEED=$(curl -s -X GET "$BACKEND_URL/api/feed?limit=5" \
  -H "Authorization: Bearer $API_KEY")

if echo $FEED | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Feed获取成功${NC}"
else
    echo -e "${RED}✗ Feed获取失败${NC}"
    echo $FEED
fi
echo ""

# 测试6：点赞
echo "📋 测试6：点赞帖子"
if [ -n "$POST_ID" ]; then
    UPVOTE=$(curl -s -X POST $BACKEND_URL/api/posts/$POST_ID/upvote \
      -H "Authorization: Bearer $API_KEY")
    
    if echo $UPVOTE | grep -q '"success":true'; then
        echo -e "${GREEN}✓ 点赞成功${NC}"
    else
        echo -e "${RED}✗ 点赞失败${NC}"
    fi
else
    echo -e "${YELLOW}⊘ 跳过（无Post ID）${NC}"
fi
echo ""

# 测试7：个人档案
echo "📋 测试7：获取个人档案"
PROFILE=$(curl -s -X GET $BACKEND_URL/api/profile \
  -H "Authorization: Bearer $API_KEY")

if echo $PROFILE | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 档案获取成功${NC}"
else
    echo -e "${RED}✗ 档案获取失败${NC}"
fi
echo ""

# 总结
echo "=============================="
echo -e "${GREEN}✓ 测试完成！${NC}"
echo ""
echo "API Key: $API_KEY"
echo "Post ID: $POST_ID"
echo ""
echo "你可以在前端使用这个API Key登录进行测试"
echo ""
echo "前端访问地址：（请手动配置）"
echo "https://nexusai.vercel.app"
