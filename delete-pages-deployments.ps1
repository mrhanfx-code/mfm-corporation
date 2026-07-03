# PowerShell script to delete all Cloudflare Pages deployments for mfm-corporation project
# This is a workaround for the Cloudflare issue where projects with many deployments cannot be deleted

$projectName = "mfm-corporation"
$prodId = ""

Write-Host "Starting deployment deletion for project: $projectName" -ForegroundColor Cyan

while ($true) {
    # Get list of deployments
    $output = npx wrangler pages deployment list --project-name=$projectName --json 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error getting deployment list: $output" -ForegroundColor Red
        break
    }
    
    # Parse JSON to get deployment IDs
    try {
        $deployments = $output | ConvertFrom-Json
        $ids = $deployments | ForEach-Object { $_.Id }
    } catch {
        Write-Host "Error parsing deployment list" -ForegroundColor Red
        break
    }
    
    # Filter out production deployment
    $toDelete = $ids | Where-Object { $_ -ne $prodId } | Where-Object { $_ -ne "" }
    
    if (-not $toDelete -or $toDelete.Count -eq 0) {
        Write-Host "Done. Production deployment: $prodId" -ForegroundColor Green
        break
    }
    
    Write-Host "Deleting $($toDelete.Count) deployments..." -ForegroundColor Yellow
    
    foreach ($id in $toDelete) {
        Write-Host "Deleting deployment: $id" -ForegroundColor Yellow
        
        $deleteOutput = npx wrangler pages deployment delete $id --project-name=$projectName --force 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            if ($deleteOutput -match "active production deployment") {
                Write-Host "  -> Skipping active production deployment: $id" -ForegroundColor Cyan
                $prodId = $id
            } else {
                Write-Host "  -> Error deleting deployment: $deleteOutput" -ForegroundColor Red
            }
        } else {
            Write-Host "  -> Successfully deleted" -ForegroundColor Green
        }
    }
}

Write-Host "Deployment deletion complete" -ForegroundColor Green
Write-Host "You can now delete the Pages project from the Cloudflare dashboard" -ForegroundColor Cyan
