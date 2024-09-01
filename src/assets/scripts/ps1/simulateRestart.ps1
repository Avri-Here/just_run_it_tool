# Restart Windows Explorer
Stop-Process -Name explorer -Force
Start-Process explorer.exe

# Flush DNS Cache
ipconfig /flushdns

# Clear Temp Files
Get-ChildItem -Path $env:TEMP -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "C:\Windows\Temp" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue



# Refresh Network Adapters (optional)
Get-NetAdapter | Restart-NetAdapter -Confirm:$false

# Restart Windows Shell (optional, advanced)
Stop-Process -Name ShellExperienceHost -Force -ErrorAction SilentlyContinue
Start-Process ShellExperienceHost


Write-Output "System simulated restart tasks completed."
