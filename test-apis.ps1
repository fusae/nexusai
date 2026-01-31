# NexusAI API Test Script
$ErrorActionPreference = "Stop"

$results = @()

function Test-Api {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [string]$Body
    )

    Write-Host "`n=== $Name ==="
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        Write-Host "PASS" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = $Name; Status = "PASS" }
        return $response
    } catch {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"
        $results += [PSCustomObject]@{ Test = $Name; Status = "FAIL" }
        return $null
    }
}

Write-Host "NexusAI API Complete Test"
Write-Host "========================="

# 1. Health Check
Test-Api -Name "1. Health Check" -Method "GET" -Url "http://localhost:3000/health"

# 2. Register
Write-Host "`n=== 2. Register Test Account ==="
$registerBody = @{
    name = "AutoTestBot"
    description = "Automated Test Bot"
    capabilities = @("testing")
    interests = @("ai", "code")
} | ConvertTo-Json -Depth 3

$registerResult = Test-Api -Name "2. Register" -Method "POST" -Url "http://localhost:3000/api/auth/register" -Headers @{"Content-Type"="application/json"} -Body $registerBody

if ($registerResult -and $registerResult.success) {
    $apiKey = $registerResult.agent.api_key
    Write-Host "API Key: $apiKey"

    # 3. Get Posts
    Test-Api -Name "3. Get Posts" -Method "GET" -Url "http://localhost:3000/api/posts"

    # 4. Create Post
    Write-Host "`n=== 4. Create Post ==="
    $postBody = @{
        author_id = "test-id"
        type = "share"
        title = "Test Post"
        content = "Test content"
    } | ConvertTo-Json -Depth 3

    $postResult = Test-Api -Name "4. Create Post" -Method "POST" -Url "http://localhost:3000/api/posts" -Headers @{"Content-Type"="application/json"} -Body $postBody

    if ($postResult -and $postResult.id) {
        $postId = $postResult.id
        Write-Host "Post ID: $postId"

        # 5. Get Single Post
        Test-Api -Name "5. Get Single Post" -Method "GET" -Url "http://localhost:3000/api/posts/$postId"

        # 6. Create Comment
        Write-Host "`n=== 6. Create Comment ==="
        $commentBody = @{
            post_id = $postId
            author_id = "test-id"
            content = "Test comment"
        } | ConvertTo-Json -Depth 3

        $commentResult = Test-Api -Name "6. Create Comment" -Method "POST" -Url "http://localhost:3000/api/comments" -Headers @{"Content-Type"="application/json"} -Body $commentBody

        if ($commentResult -and $commentResult.id) {
            # 7. Get Post Comments
            Test-Api -Name "7. Get Comments" -Method "GET" -Url "http://localhost:3000/api/posts/$postId/comments"
        }
    }

    # 8. Get Feed
    Test-Api -Name "8. Get Feed" -Method "GET" -Url "http://localhost:3000/api/feed"

    # 9. Get Friends
    Test-Api -Name "9. Get Friends" -Method "GET" -Url "http://localhost:3000/api/friends"

    # 10. Get Groups
    Test-Api -Name "10. Get Groups" -Method "GET" -Url "http://localhost:3000/api/groups"

    # 11. Get Messages
    Test-Api -Name "11. Get Messages" -Method "GET" -Url "http://localhost:3000/api/messages"

    # 12. Get Projects
    Test-Api -Name "12. Get Projects" -Method "GET" -Url "http://localhost:3000/api/collaboration/projects"

    # 13. Status Check
    Test-Api -Name "13. Status Check" -Method "GET" -Url "http://localhost:3000/api/auth/status"
}

# Summary
Write-Host "`n========================="
Write-Host "Test Summary"
Write-Host "========================="

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $results.Count

Write-Host "`nPASS: $passCount"
Write-Host "FAIL: $failCount"
Write-Host "TOTAL: $total"

if ($total -gt 0) {
    $successRate = [math]::Round(($passCount / $total) * 100, 1)
    Write-Host "Success Rate: $successRate%"
}
