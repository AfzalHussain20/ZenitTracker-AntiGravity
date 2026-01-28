
# ⚠️ Run this script to auto-install Java and Maven locally into the project.

$ErrorActionPreference = "Stop"
$toolsDir = Join-Path $PSScriptRoot "tools"

Write-Host "Verifying tools in $toolsDir..."
if (!(Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }

# --- JDK CHECK & FIX ---
$jdkZip = Join-Path $toolsDir "jdk.zip"
$jdkDest = Join-Path $toolsDir "java_home"

# If jdk-21... folder exists but java_home doesn't, rename it
$extractedJdk = Get-ChildItem -Path $toolsDir -Directory -Filter "jdk-*" | Select-Object -First 1
if ($extractedJdk -and !(Test-Path $jdkDest)) {
    Write-Host "Renaming $($extractedJdk.Name) to java_home..."
    Rename-Item -Path $extractedJdk.FullName -NewName "java_home"
}

if (!(Test-Path $jdkDest)) {
    Write-Host "ERROR: JDK folder not found. Please clean 'tools' dir and retry."
}
else {
    Write-Host "JDK OK."
}

# --- MAVEN SETUP ---
$mvnUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
$mvnZip = Join-Path $toolsDir "maven.zip"
$mvnDest = Join-Path $toolsDir "maven_home"

if (!(Test-Path $mvnDest)) {
    Write-Host "Downloading Maven 3.9.6..."
    Invoke-WebRequest -Uri $mvnUrl -OutFile $mvnZip
    
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $mvnZip -DestinationPath $toolsDir -Force
    
    # Rename (e.g., apache-maven-3.9.6) to 'maven_home'
    $extractedMvn = Get-ChildItem -Path $toolsDir -Directory -Filter "apache-maven*" | Select-Object -First 1
    if ($extractedMvn) {
        Rename-Item -Path $extractedMvn.FullName -NewName "maven_home"
    }
    else {
        Write-Host "Failed to extract Maven properly?"
    }
    
    if (Test-Path $mvnZip) { Remove-Item $mvnZip }
    Write-Host "Maven Install Done."
}
else {
    Write-Host "Maven already exists."
}

Write-Host "SETUP COMPLETE."
