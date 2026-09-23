$ErrorActionPreference = 'Stop'
$taskTools = Join-Path $PSScriptRoot '../.tools'
New-Item -ItemType Directory -Force -Path $taskTools | Out-Null
if (!(Test-Path (Join-Path $taskTools 'java-unpacked'))) {
  Invoke-WebRequest -Uri 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse' -OutFile (Join-Path $taskTools 'jdk.zip')
  Expand-Archive -LiteralPath (Join-Path $taskTools 'jdk.zip') -DestinationPath (Join-Path $taskTools 'java-unpacked') -Force
}
if (!(Test-Path (Join-Path $taskTools 'apache-maven-3.9.11'))) {
  Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.zip' -OutFile (Join-Path $taskTools 'maven.zip')
  Expand-Archive -LiteralPath (Join-Path $taskTools 'maven.zip') -DestinationPath $taskTools -Force
}
Write-Output 'Project-local Java and Maven ready. No system PATH changes made.'
