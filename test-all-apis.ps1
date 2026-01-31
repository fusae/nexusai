# NexusAI API 完整测试脚本

$ErrorActionPreference = "Stop"

# 测试结果
$results = @()

function Test-Api {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [string]$Body
    )

    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -ErrorAction Stop
        }

        Write-Host "✅ PASS" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = $Name; Status = "PASS" }
        return $response
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.ErrorDetails) {
            Write-Host "详情: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        $results += [PSCustomObject]@{ Test = $Name; Status = "FAIL" }
        return $null
    }
}

# 开始测试
Write-Host "🧪 NexusAI API 完整测试" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

# 1. 健康检查
Test-Api -Name "1. 健康检查" -Method "GET" -Url "http://localhost:3000/health"

# 2. 注册测试账号
Write-Host "`n=== 2. 注册测试账号 ===" -ForegroundColor Cyan
$registerBody = @{
    name = "AutoTestBot"
    description = "自动化测试机器人"
    capabilities = @("testing", "automation")
    interests = @("ai", "code", "testing")
} | ConvertTo-Json -Depth 3

$registerResult = Test-Api -Name "2. 注册功能" -Method "POST" -Url "http://localhost:3000/api/auth/register" -Headers @{"Content-Type"="application/json"} -Body $registerBody

if ($registerResult -and $registerResult.success) {
    $apiKey = $registerResult.agent.api_key
    $agentName = $registerResult.agent.name
    Write-Host "✅ 注册成功！" -ForegroundColor Green
    Write-Host "   API Key: $apiKey" -ForegroundColor Gray
    Write-Host "   Agent Name: $agentName" -ForegroundColor Gray

    # 3. 获取帖子列表
    Test-Api -Name "3. 获取帖子列表" -Method "GET" -Url "http://localhost:3000/api/posts"

    # 4. 获取单个帖子（空列表）
    Write-Host "`n=== 4. 创建测试帖子 ===" -ForegroundColor Cyan
    $postBody = @{
        author_id = "test-agent-id"
        type = "share"
        title = "测试帖子标题"
        content = "这是一个自动化测试创建的帖子内容"
        metadata = @{"test" = "true"; "tags" = @("test", "automation")}
    } | ConvertTo-Json -Depth 3

    $postResult = Test-Api -Name "4. 创建帖子" -Method "POST" -Url "http://localhost:3000/api/posts" -Headers @{"Content-Type"="application/json"} -Body $postBody

    if ($postResult -and $postResult.id) {
        $postId = $postResult.id
        Write-Host "   帖子ID: $postId" -ForegroundColor Gray

        # 5. 获取单个帖子
        Test-Api -Name "5. 获取单个帖子" -Method "GET" -Url "http://localhost:3000/api/posts/$postId"

        # 6. 发表评论
        Write-Host "`n=== 6. 发表评论 ===" -ForegroundColor Cyan
        $commentBody = @{
            post_id = $postId
            author_id = "test-agent-id"
            content = "这是一条测试评论"
        } | ConvertTo-Json -Depth 3

        $commentResult = Test-Api -Name "6. 发表评论" -Method "POST" -Url "http://localhost:3000/api/comments" -Headers @{"Content-Type"="application/json"} -Body $commentBody

        if ($commentResult -and $commentResult.id) {
            # 7. 获取帖子评论
            Test-Api -Name "7. 获取帖子评论" -Method "GET" -Url "http://localhost:3000/api/posts/$postId/comments"
        }
    }

    # 8. 获取Feed
    Test-Api -Name "8. 获取智能Feed" -Method "GET" -Url "http://localhost:3000/api/feed"

    # 9. 获取好友列表
    Test-Api -Name "9. 获取好友列表" -Method "GET" -Url "http://localhost:3000/api/friends"

    # 10. 获取群组列表
    Test-Api -Name "10. 获取群组列表" -Method "GET" -Url "http://localhost:3000/api/groups"

    # 11. 获取消息列表
    Test-Api -Name "11. 获取消息列表" -Method "GET" -Url "http://localhost:3000/api/messages"

    # 12. 获取协作项目
    Test-Api -Name "12. 获取协作项目" -Method "GET" -Url "http://localhost:3000/api/collaboration/projects"

    # 13. 状态检查
    Test-Api -Name "13. API状态检查" -Method "GET" -Url "http://localhost:3000/api/auth/status"

} else {
    Write-Host "❌ 注册失败，跳过其他测试" -ForegroundColor Red
}

# 测试结果汇总
Write-Host "`n================================" -ForegroundColor Magenta
Write-Host "📊 测试结果汇总" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "`n✅ 通过: $passCount" -ForegroundColor Green
Write-Host "❌ 失败: $failCount" -ForegroundColor Red
Write-Host "📊 总计: $($results.Count)" -ForegroundColor Cyan

$successRate = [math]::Round(($passCount / $results.Count) * 100, 1)
Write-Host "`n成功率: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })
