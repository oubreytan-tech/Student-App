param([ValidateSet('verify','run','package')][string]$Task='verify')
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
# ── Load .env into environment variables ──────────────────────────────────────
$taskEnvFile=Join-Path $taskRoot '.env'
if(Test-Path -LiteralPath $taskEnvFile){
  Get-Content $taskEnvFile | Where-Object {$_ -match '^\s*[^#]\S+='}| ForEach-Object {
    $parts=$_ -split '=',2
    $key=$parts[0].Trim()
    $val=$parts[1].Trim()
    [System.Environment]::SetEnvironmentVariable($key,$val,'Process')
  }
}
# ─────────────────────────────────────────────────────────────────────────────
$taskJava=Get-ChildItem (Join-Path $taskRoot '.tools/java-unpacked') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if($taskJava){$env:JAVA_HOME=$taskJava.FullName;$env:Path=(Join-Path $taskJava.FullName 'bin')+';'+$env:Path}
$taskMaven=Join-Path $taskRoot '.tools/apache-maven-3.9.11/bin/mvn.cmd'
if(!(Test-Path -LiteralPath $taskMaven)){$taskMaven='mvn.cmd'}
Push-Location (Join-Path $taskRoot 'backend')
try {
 $taskErrorActionPreference=$ErrorActionPreference
 try {
  $ErrorActionPreference='Continue'
  if($Task -eq 'run'){& $taskMaven '-B' '-ntp' 'spring-boot:run'}else{& $taskMaven '-B' '-ntp' $Task}
  $taskExitCode=$LASTEXITCODE
 } finally {
  $ErrorActionPreference=$taskErrorActionPreference
 }
 if($taskExitCode -ne 0){throw "Maven task failed with exit code $taskExitCode"}
} finally {Pop-Location}
