# Removed and Remapped

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Thermal to Mekanism](Thermal-to-Mekanism.md) | [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md) | [Known differences](Known-Differences.md)

Many mods of the 1.18.2 pack have no 1.21.1 version, or were replaced by a better one. This page lists them, and the
items that changed because of it. Quests, loot tables, recipes and structures were updated to use the new items.

The two biggest replacements have their own pages: [Thermal to Mekanism](Thermal-to-Mekanism.md) and
[Tinkers to Metallurgy](Tinkers-to-Metallurgy.md).

## Rebuilt by the port

### AE2 crystal seeds

Applied Energistics 2 removed the Certus Quartz Seed and Fluix Seed in 1.21. The port brings back both as pack items
(`cae:certus_crystal_seed`, `cae:fluix_crystal_seed`) with the same numbers as the original.

- Throw a seed into **water**. It grows into a Certus Quartz Crystal or a Fluix Crystal in 24,000 ticks (20 minutes).
- Each **powered Crystal Growth Accelerator** touching the seed makes it grow faster, up to six of them.
- Certus seeds come from milling a Certus Quartz Crystal (Create), and from the pack's sequenced assembly with sand and
  sky solution. The plain crafting recipe for certus seeds stays removed, as in the original.
- Fluix seeds are crafted from sand and fluix dust (2 seeds).

Differences: the seed always shows its first texture while it grows (the larger textures cannot be shown in 1.21).
It does not sink slowly, does not make growth particles and has no short pickup delay. Seeds with different growth
progress do not stack.

### Lava Lily

Ars Nouveau removed the Lava Lily in version 5. The port brings it back as `cae:lava_lily`. It is in the same loot tables
as before, and you can craft it: a lily pad and 8 source gems make 8 lily items.

- It is placed by **right clicking**, not as a normal block item. It lands on the first block or liquid you look at,
  if the space above is air.
- It looks like stone, magma or lava, depending on what is under it.
- Standing in one on a **magma block** stops the magma damage.

Differences: the lily stays where it is when its support is removed (Ars' lily dropped). Ars' Volcanic Sourcelink no longer
grows lilies on lava.

### Ars Nouveau fibers

Ars Nouveau 5 removed the **Blaze Fiber** and the **End Fiber**. Loot that gave them now gives **Magebloom Fiber**.

### Other rebuilt items

- Forbidden and Arcanus: the **Orb of Temporary Flight**, **Pixie** and **Corrupted Pixie** were removed in the new
  version. The port registers them again. The pixie jars point to the pixies.
- Forbidden and Arcanus' **reinforced deorum tools** exist, but without models, names or attack values in the new version.
  The port restores them as in 1.18.2.
- **Time in a Bottle** is part of the pack's own mod.

## Items that were swapped

| Original | Now | Note |
|---|---|---|
| Magic Feather | Elytra | The one quest that wanted it asks for an elytra. There is no flight charm. |
| Compressed Creativity heater | PneumaticCraft Heat Pipe | The tips quest says so. See below for boilers. |
| Forbidden and Arcanus Dark Rune | Rune | The new version has only one rune. |
| Forbidden and Arcanus Dark Soul | Soul | |
| Forbidden and Arcanus Cloth, Sanity Meter | White Wool, Clock | Only in loot tables. |
| Scute | Armadillo Scute | Minecraft renamed it. |
| Waystones Sharestone | Light Gray Sharestone | |
| Grass | Short Grass | Minecraft renamed it. |
| Samurai Dynasty Tyr Samurai Chestplate | Master Samurai Chestplate | The new version has no Tyr tier. |
| Dungeon Crawl chest tables stage 6 and 9 | Stage 5 | The new version has stages 1 to 5. |
| Slime Pickaxe given in the void | Iron Pickaxe | |
| Integrated Dynamics crafting parts | Integrated Crafting | They moved to another mod. |
| Biomes You'll Go woods | Oh The Biomes We've Gone woods | Same trees, in the new mod. |

### Boilers

Create boilers used to get heat from Compressed Creativity. Now a **PneumaticCraft Heat Pipe directly under a fluid tank**
heats it. 100, 200 and 300 degrees Celsius give a passive, a kindled and a seething boiler. The heat drains as it did in
the original.

### 'Dustrial Decor and other decoration

'Dustrial Decor and Dave's Building Extended have no 1.21.1 version. Their blocks inside the pack's structures were
swapped for Create Deco, Architect's Palette, vanilla and Chipped blocks (chains, iron doors, sheet metal, lanterns, and so
on). Nothing was turned into air, but some blocks look a little different from the original.

## Mods that are not in the pack

These mods of the 1.18.2 pack are gone. The reason is as the pack's mod list records it.

### Replaced by another mod

| Mod | Reason |
|---|---|
| Thermal Foundation, Expansion, Innovation, Integration, Locomotion, KubeJS Thermal, CoFH Core | Replaced by Mekanism and Mekanism Generators |
| Tinkers' Construct, Mantle, KubeJS Tinkers Construct | Replaced by Create: Metallurgy |
| Multiblocked, Custom Machinery | Replaced by Multiblocked2 |
| Create: Arcane Engineering Core | Rewritten as the pack's own mod |
| Time in a Bottle | Rebuilt in the pack's own mod |
| Game Stages | KubeJS 7 has stages built in |
| Item Filters | FTB Quests uses FTB Filter System |
| Oculus, Embeddium, Rubidium | Replaced by Iris with Sodium |
| Auudio, FancyMenu Audio Extension | FancyMenu 3 has audio built in |
| Create: Steam 'n' Rails | Continued as Steam 'n' Rails (NeoForge) |
| Construction Wand | Continued as Construction Wand: KOTS |
| Decorative Blocks | Continued as Decorative Blocks Reborn |
| Glassential | Continued as Glassential Renewed |
| Immersive Weathering | Continued as Immersive Weathering: Renewed |
| TerraBlender (Forge) | NeoForge has its own TerraBlender |
| Starlight | The vanilla light engine took its ideas |
| LazyDFU, Lightspeed | ModernFix covers them |

### No 1.21.1 version

Compressed Creativity, Magic Feather, Spirit, Canary, Fastload, Smooth Boot (Reloaded), CookieCore, ForgetMeChunk,
Entity Collision FPS Fix, Effective, AntiGhost, FancyMenu Video Extension, FancyVideo-API, Decorative Blocks
Compat, Create: Extended Cogwheels, **The Sound of Rain**.

Infernal Expansion is gone as well. The pack used it for one recipe (gunpowder in glow fire into glowstone dust).
Glowstone dust can still be obtained.

### Other reasons

| Mod | Reason |
|---|---|
| Structure Expansion | It crashes the game together with Integrated API. Integrated API raises the same limits. |
| Create Chunkloading | No version past Create 0.5. One tip quest used it. FTB Chunks force-loading does the job. |
| AutoRegLib | Not needed (Quark uses Zeta). |
| Entangled Fix | A bug fix for the old Entangled. Not needed. |
| Redirector | ModernFix flags it as harmful. |

## Where to look in the files

The reasons for dropped mods are in `pack/mods.json`, under `dropped`. The replacement content is in the pack's
`kubejs` folder (`startup_scripts` and `server_scripts`).
