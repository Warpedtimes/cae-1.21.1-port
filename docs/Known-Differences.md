# Known differences

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Thermal to Mekanism](Thermal-to-Mekanism.md) | [Removed and Remapped](Removed-and-Remapped.md)

This is the honest list of what is **not** like the original 1.18.2 pack. Nothing here blocks the quests.
In testing, every quest item can be made, except two that are unobtainable by design (`avaritia:zyzzium_ingot` and
`minecraft:barrier`).

## Machines and devices

- **Thermal devices are simpler.** The rebuilt Arboreal Extractor, Rock Generator, Aquatic Entangler, Hive Hopper, Batch
  Composter, Decoctive Diffuser and Nullifier have:
  - no power use, no augments and no redstone control
  - plain inventory screens, with no progress bar
  - one fixed look, with no "working" animation
  - most of them work in steps of one second instead of every tick, which gives the same speed on average
- **Item sides.** On the Aquatic Entangler and the Batch Composter, items go in at the top and come out of the other five
  sides. Thermal let every side do both.
- **Hive Hopper.** It waits until there is room before it empties a hive. Thermal emptied it and threw the honey away.
- **Decoctive Diffuser.** No filter and no area or strength augments. The boost slot has no screen: use a hopper or a pipe.
- **Nullifier.** No filter. It always works.
- **Arboreal Extractor.** The Tinkers ender slime tree is not supported. Compost does not boost it.
- **Phyto-Soil Infuser and Tinker's Workbench** are not in the pack. See [Thermal to Mekanism](Thermal-to-Mekanism.md).
- **Mekanism speed upgrades.** About 100 quest rewards were Thermal Cycle Augments. They are now Mekanism Speed Upgrades,
  and one Mekanism machine takes at most 8.
- **Explosives.** Ice, Fire, Glowstone, Ender and Nuclear TNT and the grenades are re-made with new code. The effects are
  the same idea, but the radii were chosen by the port.
- **Hardened glass** has no connected-texture look.
- **Create boilers** are heated by a PneumaticCraft Heat Pipe, not Compressed Creativity.

## Items and materials

- **Silver and nickel have no ore.** They come from the void mine and from trades only.
- **Coins** have no crafting recipes. Quests and loot give them.
- **Steel** exists three times (Mekanism, Alloyed and Create: Metallurgy). Thermal's steel became the Mekanism one. Almost Unified can merge them.
- **Rose gold, cinnabar, niter and apatite** are gone. The original pack hid them anyway.
- **Necrotic Bone** can only be made by haunting a bone. Wither skeletons do not drop it.
- **Ichor Slime Ball** is a Magma Cream now.
- **Magic Feather** is gone. The quest that asked for it now asks for an elytra.
- **Tinkers smeltery** is Create: Metallurgy. Heat comes from blaze burners, and melting times follow Metallurgy.
  See [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md).
- **Molten diamond** is a fluid added by the pack, because Metallurgy has none.

## AE2 seeds, Lava Lily and Ars Nouveau

- **AE2 crystal seeds** are pack items. They show only their first texture while growing.
- **Lava Lily** does not drop when its support is removed. Volcanic Sourcelinks do not grow lilies.
- **Blaze Fiber and End Fiber** from Ars Nouveau no longer exist. Loot gives Magebloom Fiber instead.

## World

- **Biomes are different.** Different mods make up the overworld. See [Worldgen and Structures](Worldgen-and-Structures.md).
- **The arcane temple is very rare**, as in the original. Some seeds put it very far away. The temple map searches 5000
  chunks.
- **Structure blocks** from mods that are gone were swapped for similar blocks. Some look a little different.

## Left as in 1.18.2

These small things were already like this in the original, and were left alone:

- three quest markers that have no task (they are optional now)
- sticks can be placed (Supplementaries)
- food that should remove an effect never cured poison

## Multiplayer

- Xaero's mod versions must match on the server and the client, or the login is refused. The reason is shown on the
  client's screen. The server log only says "Disconnected".
- Do not right click PneumaticCraft's creative heat block. Its screen crashes the client.
- Unformed Multiblocked2 controllers open no screen. This is how that mod works.

