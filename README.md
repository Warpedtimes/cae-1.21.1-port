# Create: Arcane Engineering (1.21.1 Port)

Version 1.0.0

This is an **unofficial community port** of **Create: Arcane Engineering**, a Minecraft modpack made by
**FortnitePro420Xx**. The original runs on Minecraft 1.18.2 with Forge. This port runs on **Minecraft 1.21.1 with
NeoForge**. It is shared with the original author's permission.

It keeps the original's quests, progression, machines, structures and look. It is not made or supported by the
original author. Please do not ask them for help with this port.

Original pack: <https://www.curseforge.com/minecraft/modpacks/create-arcane-engineering>

## What changed, at a glance

- **New engine.** Minecraft 1.21.1, NeoForge 21.1.262, Java 21.
- **Thermal is gone.** Thermal has no 1.21.1 version. Mekanism and Mekanism Generators took over its machines and
  power. The coins, the explosives, the metals and several devices were rebuilt as pack items.
  See [Thermal to Mekanism](Thermal-to-Mekanism.md).
- **Tinkers' Construct is gone.** Create: Metallurgy does the melting and casting.
  See [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md).
- **More to explore.** The world adds Regions Unexplored and Tectonic. Barren biomes are rarer. Many more structure mods
  are added. See [Worldgen and Structures](Worldgen-and-Structures.md).
- **Rebuilt content.** AE2 crystal seeds and the Lava Lily are back. See [Removed and Remapped](Removed-and-Remapped.md).
- **Extras.** Rain particles, a zoom key, a full-brightness key and shared Xaero's maps for multiplayer.
  See [Added mods](Added-Mods.md).
- **Honest list of differences.** See [Known differences](Known-Differences.md).

The full overview is in [Changes from 1.18.2](Changes-from-1.18.2.md).

## Requirements

| | |
|---|---|
| Minecraft | 1.21.1 |
| Mod loader | NeoForge 21.1.262 |
| Java | 21 |
| Memory (RAM) | 8 GB given to the game |

A computer that runs Minecraft with shaders is a good fit. The pack ships with the Complementary Reimagined shader
turned on. You can turn shaders off. See [Install](Install.md).

## How to install

1. Install [Prism Launcher](https://prismlauncher.org/).
2. Download the release file from the Releases page of this repository.
   TODO(owner): name the exact file here once the packaging is decided (a `.mrpack` or a CurseForge `.zip`).
3. In Prism, choose **Add Instance**, then **Import**, and pick the file.
4. Give the instance 8 GB of memory and start it.

Step by step instructions, with the memory setting and first launch tips, are in [Install](Install.md).

## How to run a server

1. Download the **server pack** from the Releases page.
   TODO(owner): name the exact server pack file here.
2. Install Java 21.
3. Follow the steps in [Install](Install.md#server). Set `allow-flight=true` in `server.properties`, or players who
   fly with the pack's items can be kicked.

## Reporting problems

Open an issue on this repository. Say what you did, what you expected and what happened. Please attach the log
(`logs/latest.log`) for crashes. Say if you were in singleplayer or on a server.
TODO(owner): put the link to the issues page here.

## Credits

The original pack is by **FortnitePro420Xx**. Every mod in this pack belongs to its authors. The full list, with
authors and links, is on the [Credits](Credits.md) page.

## Licence

- The **content of the original pack** (quests, scripts, ideas, textures and so on) belongs to its author,
  FortnitePro420Xx. It is shared here with their permission. This does not give you the right to reuse it elsewhere.
- **Each mod** belongs to its own authors and keeps its own licence. See [Credits](Credits.md).
- The port's **own code** (the `core/` folder and the build tools) has no licence yet.
  TODO(owner): choose a licence for `core/` and the tools and put it here.

## Pages

- [Install](Install.md)
- [Changes from 1.18.2](Changes-from-1.18.2.md)
- [Thermal to Mekanism](Thermal-to-Mekanism.md)
- [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md)
- [Removed and Remapped](Removed-and-Remapped.md)
- [Worldgen and Structures](Worldgen-and-Structures.md)
- [Added mods](Added-Mods.md)
- [Known differences](Known-Differences.md)
- [Credits](Credits.md)
- [Changelog](Changelog.md)
