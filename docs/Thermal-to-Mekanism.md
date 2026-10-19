# Thermal to Mekanism

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Tinkers to Metallurgy](Tinkers-to-Metallurgy.md) | [Removed and Remapped](Removed-and-Remapped.md) | [Known differences](Known-Differences.md)

## Why

The original pack used the **Thermal Series** (Thermal Foundation, Expansion, Innovation, Integration and Locomotion).
**Thermal has no Minecraft 1.21.1 version.** The port replaces it with **Mekanism** and **Mekanism Generators**.
Items and devices that Mekanism does not cover were rebuilt as pack items. They live in the `cae` namespace.

Old worlds are not affected, because this is a new version of Minecraft. Quests, loot and recipes that named a Thermal
item now name its replacement.

## Machines

The pack uses machines as "gate" items. You craft a machine by combining a casing with an input item. These
Thermal machines became:

| Thermal machine | Now |
|---|---|
| Machine Frame | Mekanism Steel Casing |
| Redstone Furnace | Mekanism Energized Smelter |
| Pulverizer | Mekanism Crusher |
| Sawmill | Mekanism Precision Sawmill |
| Induction Smelter | Mekanism Metallurgic Infuser |
| Crystallizer | Mekanism Chemical Crystallizer |
| Centrifugal Separator | Mekanism Isotopic Centrifuge |
| Phytogenic Insolator | Mekanism Combiner |
| Pyrolyzer | Mekanism Resistive Heater |
| Multiservo Press | Mekanism Osmium Compressor |
| Fractionating Still (Refinery) | PneumaticCraft Refinery |
| Magma Crucible | Create: Metallurgy Industrial Crucible |
| Blast Chiller | Create: Metallurgy Casting Table |
| Brewer | Mekanism Chemical Infuser |
| Fluid Encapsulator (Bottler) | Create Spout |
| Sequential Fabricator (crafter) | Mekanism Formulaic Assemblicator |

Some pack recipes ran inside Thermal machines. They were remade where they are needed:

- **PCB centrifuge** (etched board into separated board and chromatic waste): a Create basin mixing recipe.
- **PCB dryer** (masked PCB into dried board): a Mekanism Metallurgic Infuser recipe with carbon.
- **Corundum duplication** (the Crystallizer): a Create mixing recipe, a cluster with 1000 mB of water makes 2.
- **Flower duplication** (the Insolator): a Mekanism Combiner recipe with bone meal.
- **Honey** from honeycomb or honey blocks, and **molten redstone**: Create mixing.
- **The oil chain** is PneumaticCraft already. Its Thermal fluids became `cae` fluids (light oil, heavy oil, refined
  fuel, creosote, sap, resin, syrup, tree oil). Crude oil is PneumaticCraft's oil.

## Power and storage

Thermal's dynamos are replaced **by role**, with Mekanism Generators:

| Thermal | Now |
|---|---|
| Stirling Dynamo (the first power source in the quests) | Bio Generator |
| Magmatic Dynamo | Heat Generator |
| Compression Dynamo | Gas-Burning Generator |
| Numismatic Dynamo | Solar Generator |
| Lapidary Dynamo | Advanced Solar Generator |
| Gourmand Dynamo | Wind Generator |
| Disenchantment Dynamo | Rotational Complex (a stand-in; there is no real counterpart) |
| RF Coil | Electromagnetic Coil |
| Energy Cell | Mekanism Basic Energy Cube |
| Fluid Cell | Mekanism Basic Fluid Tank |
| Aqueous Accumulator (water generator) | Mekanism Electric Pump |
| Item Collector | PneumaticCraft Omnidirectional Hopper |

Nobody burns coins for power any more, so the numismatic dynamo is only a name for the solar generator.

### Augments

| Thermal augment | Now |
|---|---|
| Cycle augment | Mekanism Speed Upgrade |
| Machine upgrade 1, 2, 3 | Mekanism Basic, Advanced and Elite Tier Installers |
| Item and fluid filter augments | Mekanism Filter Upgrade |

Mekanism lets you put at most 8 speed upgrades in one machine, so a stack of many from a quest reward is more than one
machine can use.

## Coins, metals and parts

**Coins.** The Silver, Gold and Bronze Coin are now `cae` items. They have no crafting recipe, on purpose: they come from
quests and loot, and they are the money for the trade cards. Create: Metallurgy can melt them.

**Metals.** Mekanism already has tin, lead, steel and bronze. For the metals that nothing else in the pack has, the port
adds items for **silver, nickel, invar, constantan, signalum, lumium and enderium** (ingot, nugget, dust, plate and
block, plus raw silver and raw nickel). They work with Create and Mekanism: smelting, crushing, washing, pressing and
Mekanism enriching. The alloys signalum, lumium and enderium are made by Create mixing, and constantan by heated mixing.
Invar is made through the PneumaticCraft invar slurry, as in the original.

Silver and nickel do **not** generate as ore. They come from the void mine and from trades.

**Other parts**, all `cae` items: rubber and cured rubber, tar, rosin, saw blades, drill heads, copper gears, the
experience crystal (used by the backpack experience pump upgrade), blizz and basalz rods and the powders (and blitz powder).
The Blitz Rod became the vanilla **Breeze Rod**.

**Hardened glass.** Obsidian, Enderium, Lumium and Signalum Glass are `cae` blocks with the same toughness. They keep the
tooltip "Completely Indestructible by Withers". They have no crafting recipes, as in the original: you find them as
quest rewards and loot.

**Explosives.** Ice, Fire, Glowstone, Ender and Nuclear TNT, and the Glowstone, Explosive and Nuclear Grenades, are
`cae` items. Right click lights them. Each one then does its effect when the fuse is almost out.

## Devices that were rebuilt

These were rebuilt as KubeJS blocks. They behave like Thermal's, with the numbers taken from the originals, but they are
simpler: no power use, no augments, no redstone control and a plain inventory screen.

### Arboreal Extractor (was the Tree Extractor)

Place it against a tree trunk. It fills an 8000 mB tank with the tree's fluid: sap, resin, and the special fluids of the
pack's magic trees. Fill a bucket by right clicking, or take the fluid with pipes. Bone meal speeds it up.
It needs no power and uses no sapling.

### Rock Generator

Makes stone items. It needs a lava source next to it, and water (or ice) on another side, like Thermal's Igneous
Extruder. Cobblestone, stone, blackstone, basalt and deepslate work as in Thermal. The pack's own stone types (the 19
from the original list) appear when the right block is underneath. It makes one item every second, and hoppers
and pipes can take them out.

### Aquatic Entangler (the fisher)

Fishes on its own. Water must be in front of it. Add bait (Aquachow, Deep Aquachow or a Junk Net) for better or different
loot. It has 15 output slots.

### Hive Hopper

Put it under a beehive or bee nest. When the hive is full of honey, it takes 2 honeycomb and 250 mB of Create honey and
resets the hive.

### Batch Composter

Put compostable items in. It makes compost.

### Decoctive Diffuser

Fills the area around it with the effects of the potion in its tank. It uses 25 mB of potion every 3 seconds, with a
radius of 4 blocks. Glowstone dust makes the effect stronger. Redstone dust makes it last longer. It takes the Create
potion fluid. You can also right click it with a potion bottle.

### Nullifier

Destroys any item or fluid put into it. Hoppers and pipes can feed it. Right click with a stack to destroy the stack.

For the exact differences from Thermal's devices, see [Known differences](Known-Differences.md).

## What was not rebuilt

- **Phyto-Soil Infuser.** It only charged Thermal's Phyto-Soil blocks. Those blocks are not in the pack, and nothing in
  the pack's quests or recipes used the device. A new one would be a new game mechanic with an old name, so it was left
  out.
- **Tinker's Workbench.** It installed Thermal augments and charged Thermal items. Augments became Mekanism upgrades, which
  install in the machine itself, so the bench has no job left.
- **Rose gold, cinnabar, niter, apatite**, the press dies and the mushroom spores. The original pack hid or removed them
  anyway.

## Where to look in the files

For people who want the details: the scripts are `thermalReplacements.js`, `thermalDevicesA.js` and
`thermalDevicesB.js` in the pack's `kubejs` folder (`startup_scripts` and `server_scripts`).
