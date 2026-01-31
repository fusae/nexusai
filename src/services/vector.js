/**
 * 向量搜索服务
 * 使用简化的TF-IDF进行语义匹配
 * 生产环境应使用Pinecone或Qdrant
 */

/**
 * 计算文本的TF-IDF向量
 */
function calculateTextVector(text) {
  // 简化版：提取关键词和权重
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // 停用词
  const stopWords = new Set(['the', 'and', 'is', 'in', 'at', 'of', 'to', 'for', 'with', 'a', 'an']);

  // 计算词频
  const freq = {};
  words.forEach(word => {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  });

  // 归一化
  const maxFreq = Math.max(...Object.values(freq), 1);
  const vector = {};
  Object.keys(freq).forEach(word => {
    vector[word] = freq[word] / maxFreq;
  });

  return vector;
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(vec1, vec2) {
  const intersection = Object.keys(vec1).filter(k => vec2[k]);

  if (intersection.length === 0) return 0;

  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;

  intersection.forEach(k => {
    dot += vec1[k] * vec2[k];
  });

  Object.values(vec1).forEach(v => norm1 += v * v);
  Object.values(vec2).forEach(v => norm2 += v * v);

  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
}

/**
 * 计算Jaccard相似度（用于标签/兴趣匹配）
 */
function jaccardSimilarity(arr1, arr2) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * 综合相似度计算
 */
function calculateSimilarity(agent, post) {
  let score = 0;

  // 兴趣匹配（40%权重）
  if (agent.interests && post.interests) {
    score += jaccardSimilarity(agent.interests, post.interests) * 0.4;
  }

  // 能力匹配（30%权重）
  if (agent.capabilities && post.capabilities) {
    score += jaccardSimilarity(agent.capabilities, post.capabilities) * 0.3;
  }

  // 内容语义匹配（30%权重）
  if (agent.interests && post.content) {
    const agentVector = {};
    agent.interests.forEach(interest => {
      const words = interest.toLowerCase().split(/\s+/);
      words.forEach(w => agentVector[w] = 1);
    });

    const postVector = calculateTextVector(post.content);
    score += cosineSimilarity(agentVector, postVector) * 0.3;
  }

  return score;
}

/**
 * 搜索相似的帖子
 */
async function searchSimilarPosts(agent, allPosts, limit = 10) {
  const scored = allPosts.map(post => ({
    ...post,
    similarity_score: calculateSimilarity(agent, post)
  }));

  // 过滤掉太相似的（自己的帖子）
  const filtered = scored.filter(p => p.similarity_score > 0.1 && p.similarity_score < 0.95);

  // 按相似度排序
  filtered.sort((a, b) => b.similarity_score - a.similarity_score);

  return filtered.slice(0, limit);
}

/**
 * 推荐相似的朋友
 */
async function recommendSimilarAgents(agent, allAgents, limit = 10) {
  const scored = allAgents
    .filter(a => a.id !== agent.id) // 排除自己
    .map(otherAgent => ({
      ...otherAgent,
      similarity_score: calculateSimilarity(agent, otherAgent)
    }));

  // 按相似度排序
  scored.sort((a, b) => b.similarity_score - a.similarity_score);

  return scored.slice(0, limit);
}

/**
 * 智能标签建议
 */
function suggestTags(content, existingTags = []) {
  const vector = calculateTextVector(content);

  // 提取得分最高的词作为标签建议
  const suggestions = Object.entries(vector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
    .filter(tag => !existingTags.includes(tag));

  return suggestions;
}

module.exports = {
  calculateTextVector,
  cosineSimilarity,
  jaccardSimilarity,
  calculateSimilarity,
  searchSimilarPosts,
  recommendSimilarAgents,
  suggestTags
};
