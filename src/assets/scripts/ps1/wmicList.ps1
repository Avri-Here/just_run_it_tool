Get-WmiObject -Query "SELECT * FROM Win32_Product" | ForEach-Object {
    if ($_.Name) {
        $programName = $_.Name.Trim()
        if ($programName) {
            Write-Host "Command to uninstall $programName : "
            $uninstallCommand = "wmic product where ""name='$programName'"" call uninstall /nointeractive"
            Write-Host $uninstallCommand
            Write-Host " "
            Write-Host "----------------------------------------------------"
            Write-Host " "
        }
    }
}
