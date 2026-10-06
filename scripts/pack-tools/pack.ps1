<#
.SYNOPSIS
    Read and write the system's LevelDB compendium packs, with no Node.js install.

.DESCRIPTION
    Foundry ships `classic-level` - the same library foundryvtt-cli uses - and its
    Electron binary runs plain scripts when ELECTRON_RUN_AS_NODE is set. Together that
    provides a modern Node and the native LevelDB binding without installing anything.

    Foundry must be CLOSED. LevelDB takes an exclusive lock on an open pack; a second
    writer will either fail outright or leave the pack inconsistent.

.PARAMETER Command
    extract - write one .json per document into -Out
    compile - read those .json files back into the pack
    list    - print "key<TAB>name" for every primary document

.PARAMETER Pack
    Pack name (e.g. "moves") or a full path to a pack directory.

.PARAMETER Out
    Directory for extract/compile. Defaults to packs/_source/<pack>.

.EXAMPLE
    .\pack.ps1 list moves

.EXAMPLE
    .\pack.ps1 extract moves
    # edit the JSON files under packs/_source/moves
    .\pack.ps1 compile moves

.NOTES
    Always commit, or copy, a pack before compiling into it: a bad write is not
    recoverable from the pack itself.
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("extract", "compile", "list")]
    [string]$Command,

    [Parameter(Mandatory = $true)]
    [string]$Pack,

    [string]$Out,

    [string]$FoundryExe = "C:\Program Files\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe"
)

$ErrorActionPreference = "Stop"

$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$tool = Join-Path $PSScriptRoot "pack-tool.js"

if (-not (Test-Path $FoundryExe)) {
    throw "Foundry not found at '$FoundryExe'. Pass -FoundryExe with the correct path."
}

# Refuse to run while Foundry holds the pack open.
if (Get-Process -Name "Foundry*" -ErrorAction SilentlyContinue) {
    throw "Foundry is running. Close it first - LevelDB locks the pack while it is open."
}

# A bare pack name always resolves under packs/. Only treat the argument as a path when
# it actually looks like one, otherwise "moves" would match a same-named folder in
# whatever directory the shell happens to be sitting in.
$packDir = if ($Pack -match '[\\/]' -and (Test-Path $Pack)) { (Resolve-Path $Pack).Path }
           else { Join-Path $repo "packs\$Pack" }

if (-not (Test-Path $packDir)) {
    throw "Pack directory not found: $packDir"
}

if (-not $Out) {
    $Out = Join-Path $repo "packs\_source\$(Split-Path $packDir -Leaf)"
}

$env:ELECTRON_RUN_AS_NODE = "1"

switch ($Command) {
    "list"    { & $FoundryExe $tool list $packDir }
    "extract" { & $FoundryExe $tool extract $packDir $Out }
    "compile" { & $FoundryExe $tool compile $Out $packDir }
}
