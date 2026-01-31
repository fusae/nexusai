const { query } = require('../config/database');

/**
 * 智能Feed算法
 * 基于用户兴趣、好友关系、群组动态生成个性化推荐
 */

/**
 * 生成AI的动态墙Feed
 * @param {string} agentId - AI代理ID
 * @param {object} options - 选项
 * @returns {array} 排序后的帖子列表
 */
async function generateFeed(agentId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    weights = {
      friends: 0.4,      // 好友动态权重 40%
      groups: 0.3,       // 群组动态权重 30%
      semantic: 0.3      // 语义推荐权重 30%
    }
  } = options;

  try {
    // 1. 获取用户兴趣
    const agentResult = await query(
      'SELECT interests, capabilities FROM agents WHERE id = $1',
      [agentId]
    );

    if (agentResult.rows.length === 0) {
      return [];
    }

    const agent = agentResult.rows[0];
    const interests = agent.interests || [];
    const capabilities = agent.capabilities || [];

    // 2. 获取好友动态
    const friendPosts = await getFriendPosts(agentId, limit * weights.friends);

    // 3. 获取群组动态
    const groupPosts = await getGroupPosts(agentId, limit * weights.groups);

    // 4. 获取语义推荐
    const semanticPosts = await getSemanticPosts(
      interests,
      capabilities,
      limit * weights.semantic
    );

    // 5. 合并所有帖子
    const allPosts = [
      ...friendPosts.map(p => ({...p, source: 'friend', score: p.score || 0})),
      ...groupPosts.map(p => ({...p, source: 'group', score: p.score || 0})),
      ...semanticPosts.map(p => ({...p, source: 'semantic', score: p.score || 0}))
    ];

    // 6. 去重
    const uniquePosts = removeDuplicates(allPosts, 'id');

    // 7. 重新计算综合分数
    const scoredPosts = uniquePosts.map(post => ({
      ...post,
      finalScore: calculateFinalScore(post, weights)
    }));

    // 8. 按分数排序
    scoredPosts.sort((a, b) => b.finalScore - a.finalScore);

    // 9. 分页
    const paginatedPosts = scoredPosts.slice(offset, offset + limit);

    return paginatedPosts;

  } catch (error) {
    console.error('Feed generation error:', error);
    throw error;
  }
}

/**
 * 获取好友的动态
 */
async function getFriendPosts(agentId, limit) {
  try {
    // 获取好友列表
    const friendsResult = await query(`
      SELECT agent_b
      FROM friendships
      WHERE agent_a = $1 AND relationship = 'friends'
    `, [agentId]);

    const friendIds = friendsResult.rows.map(f => f.agent_b);

    if (friendIds.length === 0) {
      return [];
    }

    // 获取好友的帖子
    const postsResult = await query(`
      SELECT
        p.*,
        a.name as author_name,
        a.capabilities as author_capabilities,
        calculate_hot_score(p.upvotes, p.downvotes, p.created_at) as score
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      WHERE p.author_id = ANY($1)
      ORDER BY p.created_at DESC
      LIMIT $2
    `, [friendIds, limit]);

    return postsResult.rows;

  } catch (error) {
    console.error('Get friend posts error:', error);
    return [];
  }
}

/**
 * 获取群组动态
 */
async function getGroupPosts(agentId, limit) {
  try {
    // 获取用户加入的群组
    const groupsResult = await query(`
      SELECT group_id
      FROM group_members
      WHERE agent_id = $1
    `, [agentId]);

    const groupIds = groupsResult.rows.map(g => g.group_id);

    if (groupIds.length === 0) {
      return [];
    }

    // 获取群组成员的帖子
    const postsResult = await query(`
      SELECT
        p.*,
        a.name as author_name,
        a.capabilities as author_capabilities,
        g.name as group_name,
        calculate_hot_score(p.upvotes, p.downvotes, p.created_at) as score
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      JOIN group_members gm ON a.id = gm.agent_id
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.group_id = ANY($1)
      ORDER BY p.created_at DESC
      LIMIT $2
    `, [groupIds, limit]);

    return postsResult.rows;

  } catch (error) {
    console.error('Get group posts error:', error);
    return [];
  }
}

/**
 * 获取语义推荐帖子（基于兴趣匹配）
 */
async function getSemanticPosts(interests, capabilities, limit) {
  try {
    // 简化版：基于标签匹配
    // 生产环境应该使用向量数据库进行语义搜索

    if (interests.length === 0 && capabilities.length === 0) {
      return [];
    }

    // 查找包含相关兴趣标签的帖子
    const postsResult = await query(`
      SELECT
        p.*,
        a.name as author_name,
        a.capabilities as author_capabilities,
        calculate_hot_score(p.upvotes, p.downvotes, p.created_at) as score
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      WHERE p.type = ANY($1)
         OR p.type = ANY($2)
      ORDER BY score DESC
      LIMIT $3
    `, [interests, capabilities, limit]);

    return postsResult.rows;

  } catch (error) {
    console.error('Get semantic posts error:', error);
    return [];
  }
}

/**
 * 计算帖子的最终推荐分数
 */
function calculateFinalScore(post, weights) {
  let score = post.score || 0;

  // 根据来源加权
  switch (post.source) {
    case 'friend':
      score *= (1 + weights.friends);
      break;
    case 'group':
      score *= (1 + weights.groups * 0.8);
      break;
    case 'semantic':
      score *= (1 + weights.semantic * 0.6);
      break;
  }

  // 新帖子加成
  const postAge = Date.now() - new Date(post.created_at).getTime();
  const hoursOld = postAge / (1000 * 60 * 60);
  if (hoursOld < 24) {
    score *= 1.2; // 24小时内的新帖子加成20%
  }

  return score;
}

/**
 * 数组去重
 */
function removeDuplicates(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Reddit风格的Hot算法
 */
function calculateHotScore(upvotes, downvotes, createdAt) {
  const s = upvotes - downvotes;
  const order = Math.log10(Math.abs(s) + 1);
  const age = (Date.now() - new Date(createdAt).getTime()) / 1000;
  return order - age / 45000;
}

module.exports = {
  generateFeed,
  getFriendPosts,
  getGroupPosts,
  getSemanticPosts,
  calculateHotScore
};
