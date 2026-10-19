# Worldgen and Structures

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Added mods](Added-Mods.md) | [Known differences](Known-Differences.md)

Worlds in this pack are **new worlds**. A world from the 1.18.2 pack cannot be loaded (Minecraft 1.21.1 is a different
version, and many mods changed).

## Biomes

### What makes up the overworld

The overworld is built from several biome mods together:

- **Terralith** (the base layout, as before)
- **Biomes O' Plenty**
- **Oh The Biomes We've Gone** (this replaces Oh The Biomes You'll Go)
- **Regions Unexplored** (new in the port, about 64 new biomes)
- **Tectonic** (new in the port, for the terrain)

Together they give 288 biomes on the test seed, up from 255 before Regions Unexplored and Tectonic were added.

### Tectonic

Tectonic changes the shape of the land: with taller mountain ranges and bigger land masses. It has a
compatibility layer for Terralith.

### Barren biomes are rarer

The port was asked for a lusher world. The owner's rule was: **do not remove the barren biomes, make them rarer and
smaller.** So:

- The share that each biome mod gets was rebalanced in the mods' own config files. Terralith has a larger share, and the
  Biomes O' Plenty secondary region (where wastelands live) has a smaller one.
- 37 small data files thin out specific biomes: deserts, badlands, wastelands, dry highlands, bare mountain biomes
  and volcanoes. They are still there, just less of them.

Measured on one test seed (a square of 24,576 blocks):

| | Before | After |
|---|---|---|
| Wasteland, desert and badlands | 5.9 % of the map | 2.8 % of the map |
| Bare rocky mountains | 3.1 % | 6.5 % (Tectonic's taller ranges) |
| Oceans | 37 % | 37 % |

These numbers are from a test seed. Your world will differ.

Deserts and badlands are still present, because some of the pack's own structures need them.

## Structures

### The pack's own structures

The structures of the original pack are all here (36 of 36 checked), for example the workhouse, the koro shrine, the old
factory and the arcane temple. Their block lists were updated for 1.21.1. Blocks from mods that no longer
exist were replaced by similar blocks. See [Removed and Remapped](Removed-and-Remapped.md).

### Structure mods added by the port

The port was asked for more and bigger structures. These mods were added:

**Create themed**

- Create: Structures Arise
- Create: Let The Adventure Begin
- Create: Easy Structures
- Integrated Dungeons and Structures (with Integrated API and Integrated Patches)
- Integrated Dungeons Arise
- Integrated Seven Seas
- Integrated Stronghold (replaces the vanilla stronghold)

**General**

- Towns and Towers (village overhaul)
- YUNG's Better Dungeons, Mineshafts, Nether Fortresses, Ocean Monuments, Desert Temples, Jungle Temples and Witch Huts
- The Lost Castle
- Moog's Soaring Structures and Moog's Nether Structures
- Structory: Towers

Use **Explorer's Compass** and **Nature's Compass** to find structures and biomes. Explorer's Compass lists the structures
by mod.

Libraries added for them: YUNG's API, Cristel Lib, Moog's Structure Lib, Integrated API and Integrated Patches.

Structure Expansion was tried and **dropped**. It crashes the game together with Integrated API.

### The end? (the arcane temple)

The quest "The end?" needs the **arcane temple** (`cae:arcane_temple`). It opens the chapter "Arcane Alchemistry".
Like the original, this temple is **very rare**:

- It generates only in jungle temple biomes, with a spacing of 2000 chunks.
- On the test server's seed, the nearest one was about 25,700 blocks from spawn.
- On another test seed, the nearest was about 140,000 blocks away.

The pack gives you a **temple map**: a Supplementaries Cartographer's Quill. The map searches 5000 chunks around you. On an
unlucky seed this can be too far. If your world has no temple within reach of the map, travel further and try again, or start
a new world with a different seed. An operator can also use `/locate structure cae:arcane_temple` to find the nearest one (it can take a while, because
they are so rare).

## Dimensions

The pack has three dimensions of its own, added by the pack's core mod. The void rooms and the arcane arrival platform
are built by scripts. They were tested and work.
