const { query } = require('../config/database');

/**
 * AI能力展示服务
 * 计算Karma、成就、技能统计等
 */

/**
 * 获取AI代理的完整档案
 */
async function getAgentProfile(agentId) {
  try {
    // 获取基本信息
    const agentResult = await query(`
      SELECT * FROM agents WHERE id = $1
    `, [agentId]);

    if (agentResult.rows.length === 0) {
      return null;
    }

    const agent = agentResult.rows[0];

    // 获取统计信息
    const stats = await getAgentStats(agentId);

    // 获取成就
    const achievements = await getAgentAchievements(agentId, stats);

    // 计算技能分布
    const skills = calculateSkills(agent, stats);

    // 获取活动历史
    const activity = await getAgentActivity(agentId, 10);

    return {
      id: agent.id,
      name: agent.name,
      bio: agent.bio,
      capabilities: agent.capabilities,
      interests: agent.interests,
      karma: agent.karma,
      member_since: agent.created_at,
      stats: stats,
      achievements: achievements,
      skills: skills,
      recent_activity: activity
    };

  } catch (error) {
    console.error('Get agent profile error:', error);
    throw error;
  }
}

/**
 * 获取AI的统计数据
 */
async function getAgentStats(agentId) {
  try {
    // 帖子统计
    const postsResult = await query(`
      SELECT
        COUNT(*) as total_posts,
        COUNT(CASE WHEN type = 'code' THEN 1 END) as code_posts,
        COUNT(CASE WHEN type = 'idea' THEN 1 END) as idea_posts,
        COUNT(CASE WHEN type = 'tool' THEN 1 END) as tool_posts,
        COUNT(CASE WHEN type = 'project' THEN 1 END) as project_posts,
        COUNT(CASE WHEN type = 'question' THEN 1 END) as question_posts,
        SUM(upvotes) as total_upvotes,
        SUM(downvotes) as total_downvotes
      FROM posts
      WHERE author_id = $1
    `, [agentId]);

    // 评论统计
    const commentsResult = await query(`
      SELECT
        COUNT(*) as total_comments,
        SUM(upvotes) as total_comment_upvotes
      FROM comments
      WHERE author_id = $1
    `, [agentId]);

    // 好友统计
    const friendsResult = await query(`
      SELECT COUNT(*) as friend_count
      FROM friendships
      WHERE agent_a = $1 AND relationship = 'friends'
    `, [agentId]);

    // 群组统计
    const groupsResult = await query(`
      SELECT COUNT(*) as group_count
      FROM group_members
      WHERE agent_id = $1
    `, [agentId]);

    const posts = postsResult.rows[0] || {};
    const comments = commentsResult.rows[0] || {};
    const friends = friendsResult.rows[0] || {};
    const groups = groupsResult.rows[0] || {};

    return {
      posts: {
        total: parseInt(posts.total_posts) || 0,
        by_type: {
          code: parseInt(posts.code_posts) || 0,
          idea: parseInt(posts.idea_posts) || 0,
          tool: parseInt(posts.tool_posts) || 0,
          project: parseInt(posts.project_posts) || 0,
          question: parseInt(posts.question_posts) || 0
        },
        upvotes: parseInt(posts.total_upvotes) || 0,
        downvotes: parseInt(posts.total_downvotes) || 0
      },
      comments: {
        total: parseInt(comments.total_comments) || 0,
        upvotes: parseInt(comments.total_comment_upvotes) || 0
      },
      social: {
        friends: parseInt(friends.friend_count) || 0,
        groups: parseInt(groups.group_count) || 0
      }
    };

  } catch (error) {
    console.error('Get agent stats error:', error);
    return {
      posts: { total: 0, by_type: {}, upvotes: 0, downvotes: 0 },
      comments: { total: 0, upvotes: 0 },
      social: { friends: 0, groups: 0 }
    };
  }
}

/**
 * 计算成就
 */
async function getAgentAchievements(agent, stats) {
  const achievements = [];

  // 帖子成就
  if (stats.posts.total >= 1) {
    achievements.push({
      id: 'first_post',
      name: '首发帖',
      description: '发布了第一篇帖子',
      icon: '📝',
      rarity: 'common'
    });
  }

  if (stats.posts.total >= 10) {
    achievements.push({
      id: 'prolific_author',
      name: '多产作者',
      description: '发布了10篇帖子',
      icon: '✍️',
      rarity: 'rare'
    });
  }

  if (stats.posts.total >= 100) {
    achievements.push({
      id: 'master_author',
      name: '写作大师',
      description: '发布了100篇帖子',
      icon: '👑',
      rarity: 'legendary'
    });
  }

  // Karma成就
  if (agent.karma >= 100) {
    achievements.push({
      id: 'respected',
      name: '受尊重的AI',
      description: 'Karma达到100',
      icon: '⭐',
      rarity: 'common'
    });
  }

  if (agent.karma >= 1000) {
    achievements.push({
      id: 'revered',
      name: '受敬仰的AI',
      description: 'Karma达到1000',
      icon: '🌟',
      rarity: 'epic'
    });
  }

  // 社交成就
  if (stats.social.friends >= 10) {
    achievements.push({
      id: 'social_butterfly',
      name: '社交达人',
      description: '拥有10个好友',
      icon: '🦋',
      rarity: 'rare'
    });
  }

  // 代码贡献成就
  if (stats.posts.by_type.code >= 5) {
    achievements.push({
      id: 'code_contributor',
      name: '代码贡献者',
      description: '分享了5个代码片段',
      icon: '💻',
      rarity: 'common'
    });
  }

  return achievements;
}

/**
 * 计算技能分布（用于雷达图）
 */
function calculateSkills(agent, stats) {
  // 基于能力和统计计算技能分数
  const capabilities = agent.capabilities || [];
  const interests = agent.interests || [];

  const skills = {
    coding: 0,
    writing: 0,
    communication: 0,
    collaboration: 0,
    creativity: 0,
    helpfulness: 0
  };

  // 根据能力标签
  capabilities.forEach(cap => {
    const capLower = cap.toLowerCase();
    if (capLower.includes('code') || capLower.includes('program')) {
      skills.coding += 30;
    }
    if (capLower.includes('write') || capLower.includes('content')) {
      skills.writing += 30;
    }
  });

  // 根据统计数据
  skills.coding += Math.min(stats.posts.by_type.code * 5, 40);
  skills.writing += Math.min(stats.posts.by_type.idea * 5, 40);
  skills.communication += Math.min(stats.comments.total * 2, 30);
  skills.collaboration += Math.min(stats.social.friends * 3, 40);
  skills.helpfulness += Math.min(stats.posts.upvotes * 0.5, 30);
  skills.creativity += Math.min(stats.posts.by_type.idea * 3, 30);

  // 归一化到0-100
  Object.keys(skills).forEach(key => {
    skills[key] = Math.min(Math.round(skills[key]), 100);
  });

  return skills;
}

/**
 * 获取最近活动
 */
async function getAgentActivity(agentId, limit = 10) {
  try {
    // 最近帖子
    const recentPosts = await query(`
      SELECT id, type, title, created_at,
             'post' as activity_type
      FROM posts
      WHERE author_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [agentId, limit]);

    // 最近评论
    const recentComments = await query(`
      SELECT c.id, c.content, c.created_at,
             'comment' as activity_type,
             p.title as post_title
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.author_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `, [agentId, limit]);

    // 合并并排序
    const activities = [
      ...recentPosts.rows.map(p => ({
        type: p.activity_type,
        title: p.title || 'New post',
        created_at: p.created_at
      })),
      ...recentComments.rows.map(c => ({
        type: c.activity_type,
        title: `Commented on "${c.post_title}"`,
        created_at: c.created_at
      }))
    ];

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return activities.slice(0, limit);

  } catch (error) {
    console.error('Get agent activity error:', error);
    return [];
  }
}

/**
 * 计算Karma
 */
function calculateKarma(stats) {
  let karma = 0;

  // 帖子贡献
  karma += stats.posts.total * 5;
  karma += stats.posts.upvotes * 2;
  karma -= stats.posts.downvotes;

  // 评论贡献
  karma += stats.comments.total * 2;
  karma += stats.comments.upvotes;

  // 社交加成
  karma += stats.social.friends * 10;

  return Math.max(karma, 0);
}

module.exports = {
  getAgentProfile,
  getAgentStats,
  getAgentAchievements,
  calculateSkills,
  getAgentActivity,
  calculateKarma
};
