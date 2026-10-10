<#
.SYNOPSIS
    Extract a compendium pack to JSON, or compile JSON back into a pack.

.DESCRIPTION
    A thin wrapper around the official Foundry CLI (@foundryvtt/foundryvtt-cli), vendored
    under scripts/pack-tools/fvtt-cli. The wrapper exists only so nobody has to remember
    paths: all the work is done by Foundry's own extractPack/compilePack.

    Nothing needs installing. Foundry is an Electron app, so it ships a modern Node, and
    its own node_modules already contain the heavy dependencies the CLI needs
    (classic-level with its native LevelDB binding, nedb-promises, @seald-io). This script
    points the CLI at them and runs it with Foundry's Node.

    FOUNDRY MUST BE CLOSED. LevelDB takes an exclusive lock on an open pack; a second
    writer either fails or leaves the pack inconsistent. The script refuses to run while
    Foundry is up.

.PARAMETER Command
    extract - pack -> one JSON file per document, in packs/_source/<pack>/
    compile - those JSON files -> back into the pack

.PARAMETER Pack
    Pack name as it appears under packs/, e.g. moves, abilities, species.

.EXAMPLE
    .\pack.ps1 extract moves
    # edit the files in packs\_source\moves
    .\pack.ps1 compile moves

.NOTES
    Commit the pack before compiling. A bad write cannot be recovered from the pack
    itself, and the .ldb files are what the rest of the team pulls.
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("extract", "compile")]
    [string]$Command,

    [Parameter(Mandatory = $true)]
    [string]$Pack,

    [string]$FoundryExe = "C:\Program Files\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe"
)

$ErrorActionPreference = "Stop"

$repo    = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$cliDir  = Join-Path $PSScriptRoot "fvtt-cli"
$runner  = Join-Path $PSScriptRoot "run-cli.mjs"
$packDir = Join-Path $repo "packs\$Pack"
$srcDir  = Join-Path $repo "packs\_source\$Pack"

if (-not (Test-Path $FoundryExe)) {
    throw "Foundry introuvable : '$FoundryExe'. Passe -FoundryExe avec le bon chemin."
}
if (-not (Test-Path $packDir)) {
    $available = (Get-ChildItem (Join-Path $repo "packs") -Directory |
                  Where-Object { $_.Name -ne "_source" } |
                  Select-Object -ExpandProperty Name) -join ", "
    throw "Pack '$Pack' introuvable. Packs disponibles : $available"
}
if (Get-Process -Name "Foundry*" -ErrorAction SilentlyContinue) {
    throw "Foundry est ouvert. Ferme-le d'abord : le pack est verrouille tant qu'il tourne."
}

# Link the CLI's missing dependencies to the copies inside Foundry, rather than shipping
# a native binary in the repo. Junctions are used because they need no admin rights.
$cliModules     = Join-Path $cliDir "node_modules"

# The CLI's dependencies are real copies under fvtt-cli/node_modules, committed with the
# repo.
#
# They were originally junctions into the Foundry install, to avoid duplicating a native
# binary. That was a mistake: a junction is a real path, not a shortcut, so a "discard
# changes" in a Git client deleted files *through* it and damaged the Foundry
# installation. Nothing in this repo may point outside it.
foreach ($dep in @("classic-level", "nedb-promises", "@seald-io")) {
    $target = Join-Path $cliModules $dep
    if (-not (Test-Path $target)) {
        throw "Dependance '$dep' manquante dans fvtt-cli\node_modules. Le depot est incomplet ?"
    }

    # A leftover junction from the old approach is actively dangerous - refuse to run.
    $item = Get-Item $target -Force
    if ($item.LinkType -eq "Junction") {
        throw "'$dep' est une jonction vers '$($item.Target)'. Supprime-la (rmdir) : un discard Git effacerait les fichiers cibles."
    }
}

$env:ELECTRON_RUN_AS_NODE = "1"

# Run the CLI with Foundry's Node and return its exit code.
#
# Foundry's exe is a GUI-subsystem program. Called with "&", PowerShell neither waits for
# it nor records its exit code: the script carried on while the CLI was still writing
# (the next run then saw "Foundry" running and refused), and a failed compile was
# reported as "Pack mis a jour". Start-Process -Wait does both.
function Invoke-Cli([string[]]$CliArgs) {
    $quoted = @($runner) + $CliArgs | ForEach-Object { '"' + $_ + '"' }
    $process = Start-Process -FilePath $FoundryExe -ArgumentList $quoted -NoNewWindow -Wait -PassThru
    return $process.ExitCode
}

switch ($Command) {
    "extract" {
        New-Item -ItemType Directory -Path $srcDir -Force | Out-Null
        if ((Invoke-Cli @("extract", $packDir, $srcDir)) -ne 0) { throw "Echec de l'extraction (voir l'erreur ci-dessus)." }
        Write-Host ""
        Write-Host "Fichiers ecrits dans : packs\_source\$Pack" -ForegroundColor Green
    }
    "compile" {
        if (-not (Test-Path $srcDir)) {
            throw "Rien a compiler : lance d'abord '.\pack.ps1 extract $Pack'."
        }
        if ((Invoke-Cli @("compile", $srcDir, $packDir)) -ne 0) {
            throw "Echec de la compilation : le pack n'a PAS ete modifie (voir l'erreur ci-dessus)."
        }
        Write-Host ""
        Write-Host "Pack mis a jour : packs\$Pack" -ForegroundColor Green
        Write-Host "Pense a commiter les fichiers .ldb pour partager tes modifications." -ForegroundColor Yellow
    }
}
