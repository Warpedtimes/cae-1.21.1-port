# Changelog

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Known differences](Known-Differences.md) | [Install](Install.md)

## 1.0.0 (first public release)

The port began on 18 October 2026. This is the first version shared publicly. It is
**Create: Arcane Engineering (1.21.1 Port)**, for Minecraft 1.21.1 with NeoForge 21.1.262.
TODO(owner): put the release date here.

### Porting

- The whole pack moved from Minecraft 1.18.2 (Forge) to 1.21.1 (NeoForge, Java 21).
- The pack's own mod was rewritten for NeoForge.
- All KubeJS scripts, data files and configs were ported. KubeJS 7 and FTB Quests 2101 are used.
- All 718 quests, with 786 tasks, were ported. Quest icons and item filters were moved to the new formats.
- Thermal was replaced by Mekanism and Mekanism Generators. See [Thermal to Mekanism](Thermal-to-Mekanism.md).
- Tinkers' Construct was replaced by Create: Metallurgy. See [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md).
- Multiblocked machines were rebuilt on Multiblocked2. All 17 machine screens work on a dedicated server.
- The structures of the pack were moved to the new block names (30 templates, nothing turned into air).
- The main menu and loading screen were ported to FancyMenu 3.
- A fix for a startup freeze between Mekanism and Multiblocked2 (it happened in about 1 start in 5).

### Rebuilt content

- Thermal devices: Arboreal Extractor, Rock Generator, Aquatic Entangler, Hive Hopper, Batch Composter, Decoctive Diffuser
  and Nullifier.
- Thermal coins, metals, rubber, parts, hardened glass and explosives, as `cae` items.
- AE2 crystal seeds and the Lava Lily.
- Forbidden and Arcanus: reinforced deorum tools, Orb of Temporary Flight, Pixie and Corrupted Pixie.
- Time in a Bottle in the pack's own mod.
- PneumaticCraft heat for Create boilers.
- Original values in place of guesses: a review against the 1.18.2 pack found guessed numbers (tree extractor, rock
  generator, alloys, explosives and more). They were replaced with the original's.
- Modern Train Parts, Custom Window Title and Swing Through Grass are back.

### World

- Regions Unexplored and Tectonic were added. Barren biomes are rarer and smaller.
- More and bigger structures (Create themed mods, Integrated Dungeons, YUNG's, Towns and Towers and more).
- Wild waystones can appear in every overworld biome.

### Fixes from the testing sweeps

Every part of the pack was run in game in test suites. Found and fixed:

- "Buy a Task" gave nothing.
- Create: Metallurgy casting of tin, lead and osmium was broken by Almost Unified.
- The chapter 5 orb never passed the ender TNT stage.
- The explosives summoned nothing for players who are not operators.
- Backpack upgrade crafts and the crystal's spell orbit used methods KubeJS 7 hides.
- Several quests could never complete (quests without tasks). They were fixed or made optional.
- Arcane titles went to the wrong player.
- Delayed steps in the void rooms and the arcane arrival platform did not run, so the rooms were never built.
- Quest rewards were never blocked in the void.
- Quest station recipes did not match.
- Crushing wheel loot for whirlisprigs and amethyst golems did not work with Ars Nouveau 5.
- The tree extractor and the rock generator threw an error on every tick.
- Loot bags open again.
- The Time Crystal puzzle works from start to end.
- The reinforced deorum tools work again.
- Machine screen titles ran off the edge of the screen.
- The quest station showed its raw name.
- Integrated Dungeons' structure map trades logged errors and used the wrong map icon.
- Quark's "Configure Quark Here!" bubble covered the Multiplayer button.
- Joining a server froze it for a few seconds while it read huge advancement files. They are dropped (from about 13,000
  to about 1,100 advancements).

### Quality of life

- Particle Rain, Ok Zoomer (zoom key) and Full Brightness Toggle (full brightness key). See [Added mods](Added-Mods.md).
- Xaero's Minimap, World Map and Maps: Multiplayer+, so that players can share their explored map on a server.
- The shader pack Complementary Reimagined is on by default.
- Chunky, with pre-generation that runs only while no player is online.
- The temple map for the quest "The end?" comes as a Cartographer's Quill.

### Known issues

See [Known differences](Known-Differences.md).
