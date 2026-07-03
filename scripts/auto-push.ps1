# MFM Corporation - Auto Git Push Script
# Automatically pushes changes to GitHub after modifications

$gitPath = "C:\Program Files\Git\cmd\git.exe"
$repoPath = "c:\Users\DELL\Documents\GitHub\mfm-corporation"

function Push-Changes {
    param(
        [string]$CommitMessage
    )
    
    Write-Host "🔷 MFM: Auto-pushing changes to GitHub..." -ForegroundColor Blue
    
    # Change to repository directory
    Set-Location $repoPath
    
    # Check if there are changes
    $status = & $gitPath status --porcelain
    if ($status) {
        Write-Host "Changes detected:" -ForegroundColor Yellow
        $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        
        # Add all changes
        Write-Host "Adding changes..." -ForegroundColor Green
        & $gitPath add .
        
        # Commit changes
        Write-Host "Committing changes..." -ForegroundColor Green
        & $gitPath commit -m $CommitMessage
        
        # Push to GitHub
        Write-Host "Pushing to GitHub..." -ForegroundColor Green
        $pushResult = & $gitPath push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host "🌐 Live at: https://mrhanfx-code.github.io/mfm-corporation" -ForegroundColor Blue
        } else {
            Write-Host "❌ Push failed!" -ForegroundColor Red
            Write-Host $pushResult -ForegroundColor Red
        }
    } else {
        Write-Host "ℹ️ No changes to push." -ForegroundColor Gray
    }
}

# Export function for use in other scripts
Export-ModuleMember -Function Push-Changes
