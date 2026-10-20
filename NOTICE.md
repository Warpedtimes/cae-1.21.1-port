# Who owns what

This repository mixes three kinds of files. Only the first is open source.

## 1. The port's own work: MIT (see LICENSE)

Written for the 1.21.1 port:

- `core/src/main/java/**`: the core mod's code (a rewrite for NeoForge 1.21.1), and the build files in `core/`
  (`build.gradle`, `settings.gradle`, `gradle.properties`, the Gradle wrapper scripts)
- `tools/**`: the build and release tools
- these KubeJS scripts under `pack/overrides/kubejs/`, which are new in the port:
  - `startup_scripts/`: `aeSeeds.js`, `gaps2Content.js`, `gaps2Explosives.js`, `lavaLily.js`, `mbd2_machines.js`,
    `pncBoilerHeater.js`, `portReplacements.js`, `thermalReplacements.js`
  - `server_scripts/`: `aeSeeds.js`, `chunkyIdle.js`, `gaps2Content.js`, `gaps2Explosives.js`, `lavaLily.js`,
    `mbd2_recipes.js`, `progressionFixes.js`, `thermalReplacements.js`, `tinkersReplacements.js`
  - `client_scripts/`: `gaps2Content.js`, `mbd2_lang.js`
- `README.md`, `LICENSE`, this file, and the wiki pages

## 2. The original pack's content: not open source

**Create: Arcane Engineering** is by **FortnitePro420Xx** (All Rights Reserved). This port is unofficial and not
endorsed by them; their content is not open source and stays theirs. This covers:

- the quests (`pack/overrides/config/ftbquests/`)
- every other KubeJS script, data file and asset in `pack/overrides/kubejs/` (ported from the original pack's scripts,
  even where the port changed them)
- the pack's configs (`pack/overrides/config/`, `pack/overrides/defaultconfigs/`) where they carry the pack's
  settings
- the main menu and loading screen art and layouts (`pack/overrides-client/`, except the shader pack)
- the original core mod's assets and data (`core/src/main/resources/`: textures, models, sounds, language files,
  worldgen and other data), and the structure templates

## 3. Other mods' and creators' work

- **Mods** are not in this repository; the release lists them for your launcher to download from their own pages.
  Each mod belongs to its authors under its own licence (credits on the wiki).
- **Textures and models copied from other mods** so the port could rebuild content those mods no longer have for
  1.21.1 belong to those mods' authors under their licences:
  - Thermal Series and CoFH Core (TeamCoFH): the device, Tinker's Workbench, Phyto-Soil, augment, Phytogro, compost,
    bait and explosive textures, models and blockstates, the device screens' textures, the `tinker` sound and the
    devices' language lines, in `core/src/main/resources/assets/cae/` and `pack/overrides/kubejs/assets/cae/`
  - Magic Feather (`core/src/main/resources/assets/magicfeather/`) and Compressed Creativity's heater
    (`core/src/main/resources/assets/compressedcreativity/`): their textures, models and language lines
  - Tinkers' Construct: the Blood Slime Ball and blood fluid textures (`pack/overrides/kubejs/assets/tconstruct/`)
  - the crystal seed textures (Applied Energistics 2), the Lava Lily models and textures (Ars Nouveau), and any other
    textures in `kubejs/assets/` taken from a mod (the restored structure blocks of mods that are gone)

  The core mod's code was written for the port; the other mods' classes were only read for their numbers.
- **The shader pack** in `pack/overrides-client/shaderpacks/` (Complementary Reimagined) is under its own licence.

If you are one of these authors and want something removed or credited differently, please open an issue.
