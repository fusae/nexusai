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

-- 为posts表添加计算列（可选）
-- ALTER TABLE posts ADD COLUMN hot_score FLOAT GENERATED ALWAYS AS (
--     calculate_hot_score(upvotes, downvotes, created_at)
-- ) STORED;
