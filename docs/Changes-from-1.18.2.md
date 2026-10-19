# Changes from 1.18.2

[Home](Home.md) | [Install](Install.md) | [Known differences](Known-Differences.md) | [Changelog](Changelog.md)

This page lists everything that is different from the original **Create: Arcane Engineering** (Minecraft 1.18.2,
Forge). Each section links to a page with the details.

The goal of the port is simple: the same pack, the same quests and the same progression, on Minecraft 1.21.1.
Where a mod no longer exists, something else does its job. Where that was not possible, the
[Known differences](Known-Differences.md) page says so.

## The platform

| | Original | This port |
|---|---|---|
| Minecraft | 1.18.2 | 1.21.1 |
| Loader | Forge | NeoForge 21.1.262 |
| Java | 17 | 21 |
| Scripting | KubeJS for 1.18 | KubeJS 7 |
| Quests | FTB Quests for 1.18 | FTB Quests 2101 (all 718 quests are there) |

The pack's own helper mod was rewritten for NeoForge. It carries the pack's custom items and blocks (for example the
crystal, the catalyst, the casing and the orb), the three pack dimensions, a fix for a startup freeze, and a few
compatibility fixes.

## Mods that are replaced

| Original | Now | Page |
|---|---|---|
| Thermal Series (Foundation, Expansion, Innovation, Integration, Locomotion) | Mekanism and Mekanism Generators, plus pack items | [Thermal to Mekanism](Thermal-to-Mekanism.md) |
| Tinkers' Construct | Create: Metallurgy | [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md) |
| Multiblocked and Custom Machinery | Multiblocked2 (all pack machines rebuilt) | [Removed and Remapped](Removed-and-Remapped.md) |
| Oculus and Rubidium or Embeddium | Iris and Sodium | [Removed and Remapped](Removed-and-Remapped.md) |
| Game Stages and Item Filters | KubeJS 7 stages and FTB Filter System | [Removed and Remapped](Removed-and-Remapped.md) |
| Oh The Biomes You'll Go | Oh The Biomes We've Gone | [Worldgen and Structures](Worldgen-and-Structures.md) |

Other mods that could not come along, and the items that changed because of it, are on
[Removed and Remapped](Removed-and-Remapped.md).

## Rebuilt content

Some things were lost when their mods moved on. They were rebuilt so the pack keeps them:

- Thermal devices: the **Arboreal Extractor**, the **Rock Generator**, the **Aquatic Entangler**, the **Hive Hopper**,
  the **Batch Composter**, the **Decoctive Diffuser** and the **Nullifier**.
  See [Thermal to Mekanism](Thermal-to-Mekanism.md).
- Thermal coins, metals, rubber, the explosives and hardened glass, as `cae` items.
- AE2 **crystal seeds** (AE2 removed them) and Ars Nouveau's **Lava Lily** (Ars removed it).
  See [Removed and Remapped](Removed-and-Remapped.md).
- Forbidden and Arcanus' reinforced deorum tools, the Orb of Temporary Flight and pixies.
- Time in a Bottle, now part of the pack's own mod.
- Heat for Create boilers now comes from a PneumaticCraft heat pipe under the tank. (The original used Compressed
  Creativity's heater.)

## The world

- **Regions Unexplored** and **Tectonic** are added. Terralith, Biomes O' Plenty and Oh The Biomes We've Gone stay.
- Barren biomes (deserts, badlands, wastelands) are **rarer and smaller**, but not removed.
- A long list of **structure mods** is added, many of them Create themed.

See [Worldgen and Structures](Worldgen-and-Structures.md).

## Added mods

The port adds mods the original did not have: map sharing, rain particles, a zoom key, a full-brightness key,
Mekanism, Create: Metallurgy and the structure mods.
See [Added mods](Added-Mods.md).

## Fixes and testing

The port was checked in game, not only on paper:

- All 718 quests were walked through and paid out in a test world.
- Every quest item can be made, with two exceptions that are unobtainable by design
  (`avaritia:zyzzium_ingot` and `minecraft:barrier`).
- The machines, the boiler heat, the commands and the structures were run through test suites.
- Several bugs of the new versions were found and fixed. The [Changelog](Changelog.md) lists the highlights.

## What is not the same

Some things cannot match the original. That list is on [Known differences](Known-Differences.md).

## Credits

The original pack is by FortnitePro420Xx. See [Credits](Credits.md).
