# Get the current user's home directory


$homeDirectory = [System.Environment]::GetFolderPath('MyDocuments')


$musicSource = $args[0]
$songDir = "$homeDirectory\appsAndMore\mySongs\$musicSource"

# Function to encode special characters for XML
function Encode-Xml {
    param ([string]$text)
    $text = $text -replace '&', '&amp;'
    $text = $text -replace '<', '&lt;'
    $text = $text -replace '>', '&gt;'
    $text = $text -replace '"', '&quot;'
    $text = $text -replace "'", '&apos;'
    return $text
}

# Function to shuffle an array (Fisher-Yates shuffle algorithm)
function Shuffle-Array {
    param ([array]$array)
    for ($i = $array.Count - 1; $i -gt 0; $i--) {
        $j = Get-Random -Maximum ($i + 1)
        $temp = $array[$i]
        $array[$i] = $array[$j]
        $array[$j] = $temp
    }
    return $array
}

$outputFileName = $musicSource +".wpl"
$outputFilePath = "$homeDirectory\appsAndMore\mySongs\rest\playlistFiles\$outputFileName"
# Get all files in the directory and subdirectories
$files = Get-ChildItem -Path $songDir -Recurse -File

# Shuffle the files randomly
$shuffledFiles = Shuffle-Array -array $files

# Create WPL playlist content
$wplContent = @"
<?wpl version="1.0"?>
<smil>
    <head>
        <meta name="Generator" content="PowerShell Script"/>
        <meta name="ItemCount" content="$($shuffledFiles.Count)"/>
    </head>
    <body>
        <seq>
"@

foreach ($file in $shuffledFiles) {
    $encodedPath = Encode-Xml -text $file.FullName
    $wplContent += "            <media src=""$encodedPath""/>`n"
}

$wplContent += @"
        </seq>
    </body>
</smil>
"@

# Write the WPL content to the output file
$wplContent | Out-File -FilePath $outputFilePath -Encoding UTF8

Write-Output "WPL playlist has been created : $outputFilePath"
# }
