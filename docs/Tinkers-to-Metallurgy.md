# Tinkers' Construct to Create: Metallurgy

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Thermal to Mekanism](Thermal-to-Mekanism.md) | [Removed and Remapped](Removed-and-Remapped.md) | [Known differences](Known-Differences.md)

## Why

The original pack used **Tinkers' Construct** for its smeltery, melting and casting. **Tinkers' Construct has no
Minecraft 1.21.1 version.** The port uses **Create: Metallurgy** instead. It fits the rest of the pack, and every early
smeltery quest can be done with it.

Only the melting and casting were replaced. Other parts of Tinkers are not in the pack.

## What replaced what

| Tinkers' Construct | Create: Metallurgy |
|---|---|
| Smeltery Controller, Seared Melter | Foundry Basin (items melt in it under a Foundry Lid, heated by a blaze burner) |
| Foundry Controller | Industrial Crucible |
| Seared and Scorched Table | Casting Table |
| Seared and Scorched Basin | Casting Basin |
| Faucet | Faucet |
| Seared Bricks | Refractory Mortar (the block the Foundry Basin is crafted from) |
| Grout | Refractory Mortar Ball |
| Multi-use ingot cast | Graphite Ingot Mold |
| Molten iron, gold, nickel, copper, zinc | The same molten fluids from Metallurgy, with buckets |

Some parts of the Tinkers smeltery were only seen in Ponder scenes and structures (channel, duct, chute, drain and fuel
gauge). There they became Create parts: fluid pipe, andesite funnel, chute, item drain and fluid tank.

## Recipes that were kept

The pack's own Tinkers recipes were written again for Metallurgy, with the original amounts and times where Metallurgy
allows it:

- Melting and casting of **redstone** (using the pack's molten redstone) and the redstone block.
- Melting and casting of **diamond**. Metallurgy has no molten diamond, so the pack adds one (`Molten Diamond`). The
  "engineering circuit" assembly uses 100 mB of it.
- Melting **entities** in the Industrial Crucible: wraiths and vexes give Liquid Resent. The Create contraption entities
  give Inertia Essence. Bees give honey.
- Melting **tar** into superheated anthracene.
- The 60 **ore stone** meltings (veridium, asurine, crimsite and ochrum blocks into molten copper, zinc, iron or gold).
- The runic tablet and 200 mB of source into a source gem, and the nugget cast with 90 mB of molten gold.
- Honey from a bee or a honey block, and the omelette basin recipe.
- Haunting a bone for the **Necrotic Bone**.

## Differences you will notice

- **Heat.** Tinkers used fuel from the smeltery. Metallurgy uses **blaze burners**. Everything melts at "heated", except tar
  and diamond, which need "superheated" (a burner with blaze cake, or the crucible with superheating).
  The cut-off was chosen by reading Metallurgy's own recipes.
- **Melting times** follow Metallurgy's speed (about 4 ticks for every 9 mB) for tar, the ore stones and diamond.
- **Entity melting.** In Metallurgy the crucible hurts the entity and gives the fluid when it dies. The pack's recipes
  deal 1 damage per tick (the original had none), so the entities can actually die.
- **Ichor Slime Ball** is now a **Magma Cream**.
- The **Necrotic Bone** is only made by haunting a bone with Create. It is not a drop from wither skeletons.
- The **greenheart, skyroot and bloodshroom** logs that one task asked for are now Oh The Biomes We've Gone's green
  enchanted, blue enchanted and redwood logs.

## Where to look in the files

The scripts are `tinkersReplacements.js` and `portReplacements.js` in the pack's `kubejs` folder. Their comments say
which numbers are the original's and which are a substitute (they are marked `1211 substitute`).
