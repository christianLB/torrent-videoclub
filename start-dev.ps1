# Stop existing Next.js processes if any
$nextProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*next*" }
if ($nextProcesses) {
  Write-Host "Stopping existing Next.js processes..."
  $nextProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
}

# Clean up the .next directory
Write-Host "Cleaning up .next directory..."
if (Test-Path ".next") {
  try {
    # Force remove trace directory which often causes permission issues
    if (Test-Path ".next\trace") {
      attrib -R ".next\trace" /S /D
      Remove-Item ".next\trace" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Force remove cache directory
    if (Test-Path ".next\cache") {
      attrib -R ".next\cache" /S /D
      Remove-Item ".next\cache" -Recurse -Force -ErrorAction SilentlyContinue
    }
  } catch {
    Write-Host "Warning: Could not completely clean .next directory. Some files may be in use."
  }
}

# Set environment variables to disable telemetry and tracing
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NEXT_TRACING_MODE = "none"

# Start the development server with new settings
Write-Host "Starting Next.js development server on port 3002..."
npm run dev -- --port 3002
