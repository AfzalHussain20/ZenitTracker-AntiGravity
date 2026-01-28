
# ⚠️ Run this script to auto-install Java and Maven locally into the project.

$ErrorActionPreference = "Stop"
$toolsDir = Join-Path $PSScriptRoot "tools"

Write-Host "Creating tools directory at $toolsDir..."
if (!(Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }

# --- JDK SETUP ---
$jdkUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_windows_hotspot_21.0.2_13.zip"
$jdkZip = Join-Path $toolsDir "jdk.zip"
$jdkDest = Join-Path $toolsDir "java_home"

if (!(Test-Path $jdkDest)) {
    Write-Host "Downloading JDK 21... (This may take a minute)"
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip
    
    Write-Host "Extracting JDK..."
    Expand-Archive -Path $jdkZip -DestinationPath $toolsDir -Force
    
    # Rename the extracted folder (e.g., jdk-21.0.2+13) to 'java_home'
    $extractedJdk = Get-ChildItem -Path $toolsDir -Directory -Filter "jdk-*" | Select-Object -First 1
    Rename-Item -Path $extractedJdk.FullName -NewName "java_home"
    
    Remove-Item $jdkZip
    Write-Host "JDK Installed."
} else {
    Write-Host "JDK already exists."
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
    Rename-Item -Path $extractedMvn.FullName -NewName "maven_home"
    
    Remove-Item $mvnZip
    Write-Host "Maven Installed."
} else {
    Write-Host "Maven already exists."
}

Write-Host "SETUP COMPLETE. Tools are in $toolsDir"
