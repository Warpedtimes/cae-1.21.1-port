# Who owns what

This repository mixes three kinds of files. Only the first is open source.

## 1. The port's own work: MIT (see LICENSE)

Written for the 1.21.1 port:

- `core/src/main/java/**`: the core mod's code (a rewrite for NeoForge 1.21.1), and the build files in `core/`
  (`build.gradle`, `settings.gradle`, `gradle.properties`, the Gradle wrapper scripts)
- `tools/**`: the build and release tools
- these KubeJS scripts under `pack/overrides/kubejs/`, which are new in the port:
  - `startup_scripts/`: `aeSeeds.js`, `lavaLily.js`, `mbd2_machines.js`, `pncBoilerHeater.js`, `portReplacements.js`,
    `thermalDevicesA.js`, `thermalDevicesB.js`, `thermalReplacements.js`
  - `server_scripts/`: `aeSeeds.js`, `chunkyIdle.js`, `lavaLily.js`, `mbd2_recipes.js`, `progressionFixes.js`,
    `thermalDevicesA.js`, `thermalDevicesB.js`, `thermalReplacements.js`, `tinkersReplacements.js`
  - `client_scripts/`: `mbd2_lang.js`
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
  1.21.1 belong to those mods' authors under their licences: the device textures under
  `pack/overrides/kubejs/assets/cae/textures/block/device_*` and the bait/compost item textures (Thermal Series, by
  TeamCoFH), the crystal seed textures (Applied Energistics 2), the Lava Lily models and textures (Ars Nouveau), and
  any other textures in `kubejs/assets/` taken from a mod.
- **The shader pack** in `pack/overrides-client/shaderpacks/` (Complementary Reimagined) is under its own licence.

If you are one of these authors and want something removed or credited differently, please open an issue.
