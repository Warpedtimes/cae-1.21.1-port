# Create: Arcane Engineering (1.21.1 Port)

Version 1.3.0

This is an **unofficial community port** of **Create: Arcane Engineering** ported using **AI (CLAUDE)**, a Minecraft modpack made by
**FortnitePro420Xx**. The original runs on Minecraft 1.18.2 with Forge. This port runs on **Minecraft 1.21.1 with
NeoForge**. It is not affiliated with or endorsed by the original author; all credit for the pack goes to them.

It keeps the original's quests, progression, machines, structures and look. It is not made or supported by the
original author. Please do not ask them for help with this port.

Original pack: <https://www.curseforge.com/minecraft/modpacks/create-arcane-engineering>

## What changed, at a glance

- **New engine.** Minecraft 1.21.1, NeoForge 21.1.262, Java 21.
- **Thermal is gone.** Thermal has no 1.21.1 version. Mekanism and Mekanism Generators took over its machines and
  power. The coins, the explosives, the metals and several devices were rebuilt as pack items.
  See [Thermal to Mekanism](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Thermal-to-Mekanism).
- **Tinkers' smeltery is gone; its tools are back.** Create: Metallurgy does the melting and casting, and CAE
  Tools brings back Tinkers' tools and weapons, their parts cast on Metallurgy's table.
  See [Tinkers to Metallurgy](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Tinkers-to-Metallurgy).
- **More to explore.** The world adds Regions Unexplored and Tectonic. Barren biomes are rarer. Many more structure mods
  are added. See [Worldgen and Structures](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Worldgen-and-Structures).
- **Rebuilt content.** AE2 crystal seeds and the Lava Lily are back. See [Removed and Remapped](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Removed-and-Remapped).
- **Extras.** Rain particles, a zoom key, a full-brightness key and shared Xaero's maps for multiplayer.
  See [Added mods](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Added-Mods).
- **Honest list of differences.** See [Known differences](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Known-Differences).

The full overview is in [Changes from 1.18.2](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Changes-from-1.18.2).

## Requirements

| | |
|---|---|
| Minecraft | 1.21.1 |
| Mod loader | NeoForge 21.1.262 |
| Java | 21 |
| Memory (RAM) | 8 GB given to the game |

A computer that runs Minecraft with shaders is a good fit. The pack ships with the Complementary Reimagined shader
turned on. You can turn shaders off. See [Install](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Install).

## How to install

1. Download **`CAE-1.21.1-Port-1.3.0-Client.zip`** from the
   [Releases page](https://github.com/Warpedtimes/cae-1.21.1-port/releases).
2. Import it into your launcher:
   - **[Prism Launcher](https://prismlauncher.org/)**: **Add Instance**, then **Import**, and pick the file.
   - **CurseForge app**: **My Modpacks**, then **Create Custom Profile**, then **import**, and pick the file.

   The launcher downloads every mod from CurseForge by itself. If Prism lists a few mods to download by hand, click
   each link; Prism picks the files up from your Downloads folder.
3. Give the game 8 GB of memory and start it.

Step by step instructions, with the memory setting and first launch tips, are in [Install](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Install).

## How to run a server

1. Download **`CAE-1.21.1-Port-1.3.0-Server.zip`** from the Releases page and unzip it into an empty folder.
2. Install Java 21 and Python 3, then run `python setup.py` once. It installs NeoForge and downloads the mods the zip
   can't include.
3. Accept the EULA in `eula.txt` and start the server with `start.sh` or `start.bat`. The details are in
   [Install](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Install#server). The pack's `server.properties` already has `allow-flight=true`, which it needs.

## Reporting problems

Open an issue on [this repository](https://github.com/Warpedtimes/cae-1.21.1-port/issues). Say what you did, what
you expected and what happened. Please attach the log (`logs/latest.log`) for crashes. Say if you were in singleplayer
or on a server.

## Credits

The original pack is by **FortnitePro420Xx**. Every mod in this pack belongs to its authors. The full list, with
authors and links, is on the [Credits](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Credits) page.

## Licence

- The **content of the original pack** (quests, scripts, ideas, textures and so on) belongs to its author,
  FortnitePro420Xx, and they keep all rights to it. This port is not affiliated with or endorsed by them. If you are the
  author and want this taken down or changed, please open an issue.
- **Each mod** belongs to its own authors and keeps its own licence. See [Credits](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Credits).
- The port's **own work** (the core mod's code, the build tools, the KubeJS scripts written for the port, and these
  docs) is open source under the **MIT licence**: see [LICENSE](https://github.com/Warpedtimes/cae-1.21.1-port/blob/main/LICENSE). [NOTICE.md](https://github.com/Warpedtimes/cae-1.21.1-port/blob/main/NOTICE.md) lists exactly which
  files that covers and which belong to the original author or to other mods.

## Pages

- [Install](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Install)
- [Changes from 1.18.2](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Changes-from-1.18.2)
- [Thermal to Mekanism](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Thermal-to-Mekanism)
- [Tinkers to Metallurgy](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Tinkers-to-Metallurgy)
- [Removed and Remapped](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Removed-and-Remapped)
- [Worldgen and Structures](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Worldgen-and-Structures)
- [Added mods](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Added-Mods)
- [Known differences](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Known-Differences)
- [Credits](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Credits)
- [Changelog](https://github.com/Warpedtimes/cae-1.21.1-port/wiki/Changelog)
