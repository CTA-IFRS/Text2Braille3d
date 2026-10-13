param(
    [Parameter(Mandatory = $true)][ValidateNotNullOrEmpty()][string]$Query,
    [ValidateRange(1, 100)][int]$Limit = 20
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sources = @('AGENTS.md', 'README.md', 'docs', '.agents/skills', '.codex/agents')
$files = foreach ($source in $sources) {
    $candidate = Join-Path $projectRoot $source
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { Get-Item -LiteralPath $candidate }
    elseif (Test-Path -LiteralPath $candidate -PathType Container) {
        Get-ChildItem -LiteralPath $candidate -Recurse -File | Where-Object { $_.Extension -in '.md', '.txt', '.toml' }
    }
}
$hits = @($files | Select-String -SimpleMatch -Pattern $Query -Encoding UTF8 | Select-Object -First $Limit)
if ($hits.Count -eq 0) { Write-Output 'Nenhum trecho encontrado na base local.'; exit 0 }
foreach ($hit in $hits) {
    $relative = $hit.Path.Substring($projectRoot.Length + 1)
    Write-Output ('{0}:{1}: {2}' -f $relative, $hit.LineNumber, $hit.Line.Trim())
}
