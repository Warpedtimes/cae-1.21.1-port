// 1211: AE2's crystal seeds, rebuilt (AE2 1.21 removed them). Items: startup_scripts/aeSeeds.js (cae:certus_crystal_seed,
// cae:fluix_crystal_seed). The numbers are AE2 11.7.6's (1.18.2), read from appeng.items.misc.CrystalSeedItem and
// appeng.entity.GrowingCrystalEntity:
//   - a seed item entity lying in water (in the Nether: in lava) grows; progress is the stack's tag "p" (0..24000 ticks);
//     GROWTH_TICKS_REQUIRED = 24000 (20 minutes) at one progress per tick without accelerators
//   - the water test is on the block at (floor x, floor((box.minY+box.maxY)/2), floor z); multiplier 1 in water, else 0 (no growth)
//   - speed = GROWTH_TICK_PROGRESS[n] = {1, 10, 20, 30, 40, 50, 60}[n], n = powered Crystal Growth Accelerators among the six
//     blocks next to that block (an unpowered accelerator does not count); progress per tick = max(1, speed * multiplier)
//   - at 24000 the stack becomes the same number of the grown item (certus seed -> ae2:certus_quartz_crystal, fluix seed ->
//     ae2:fluix_crystal); the item entity never despawns; progress stays on the stack, so picking a seed up and dropping it
//     again keeps it (the stack tag is the only state)
// 1211 substitute: the original entity (AEBaseItemEntity subclass) is replaced by a script on vanilla item entities: seed
// entities are collected when they spawn/load (EntityEvents.spawned, plus a rescan of each level every 100 ticks for entities
// loaded from disk) and only those are ticked. Not carried over: the slow sink (-0.002 y velocity, 0.99 drag) and the
// particles of the original entity, the 40 tick pickup delay at creation.
// The stack tag "p" is kept in minecraft:custom_data ({p: ticks}), the 1.21 form of stack NBT.

var CAE_SEED_GROWN = {
  'cae:certus_crystal_seed': 'ae2:certus_quartz_crystal',
  'cae:fluix_crystal_seed': 'ae2:fluix_crystal'
}
var CAE_SEED_REQUIRED = 24000
var CAE_SEED_SPEED = [1, 10, 20, 30, 40, 50, 60]
var CAE_SEED_TRACKED = {} // dimension id -> { entityId: ItemEntity }
var CAE_SEED_CLOCK = {}   // dimension id -> ticks since the last rescan

var CaeSeedDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
var CaeSeedCustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
var CaeSeedModelData = Java.loadClass('net.minecraft.world.item.component.CustomModelData')
var CaeSeedCompound = Java.loadClass('net.minecraft.nbt.CompoundTag')
var CaeSeedFluidTags = Java.loadClass('net.minecraft.tags.FluidTags')
var CaeSeedBlockPos = Java.loadClass('net.minecraft.core.BlockPos')

function caeSeedGetProgress(stack) {
  let cd = stack.get(CaeSeedDataComponents.CUSTOM_DATA)
  if (cd == null) return 0
  return cd.copyTag().getInt('p')
}

function caeSeedSetProgress(stack, p) {
  let existing = stack.get(CaeSeedDataComponents.CUSTOM_DATA)
  let tag = existing == null ? new CaeSeedCompound() : existing.copyTag()
  tag.putInt('p', Math.max(0, Math.min(CAE_SEED_REQUIRED, p)))
  stack.set(CaeSeedDataComponents.CUSTOM_DATA, CaeSeedCustomData.of(tag))
  // the bigger crystal at 1/3 and 2/3 growth, as AE2 1.18's "ae2:growth" item model predicate (0.333 / 0.666): the item
  // models in kubejs/assets/cae/models/item pick it by custom_model_data 1 / 2
  let stage = p >= CAE_SEED_REQUIRED * 0.666 ? 2 : (p >= CAE_SEED_REQUIRED * 0.333 ? 1 : 0)
  let current = stack.get(CaeSeedDataComponents.CUSTOM_MODEL_DATA)
  if ((current == null ? 0 : current.value()) != stage) {
    if (stage == 0) stack.remove(CaeSeedDataComponents.CUSTOM_MODEL_DATA)
    else stack.set(CaeSeedDataComponents.CUSTOM_MODEL_DATA, new CaeSeedModelData(stage))
  }
}

function caeSeedEntityKey(e) {
  return String(e.getId())
}

function caeSeedIsSeedEntity(e) {
  if (String(e.type) != 'minecraft:item') return false
  let stack = e.getItem()
  if (stack.isEmpty()) return false
  return CAE_SEED_GROWN[String(stack.id)] !== undefined
}

function caeSeedTrack(level, e) {
  let dim = String(level.dimension)
  let map = CAE_SEED_TRACKED[dim]
  if (!map) map = CAE_SEED_TRACKED[dim] = {}
  let key = caeSeedEntityKey(e)
  if (map[key] === undefined) {
    map[key] = e
    e.setUnlimitedLifetime() // the original seed entity has getEntityLifespan = Integer.MAX_VALUE
  }
}

// number of powered growth accelerators next to the block pos (the six neighbours), as GrowingCrystalEntity.getAcceleratorCount
function caeSeedAcceleratorCount(level, pos) {
  let n = 0
  // Direction.getStepX() is renamed for scripts (KubeJS @RemapForJS): a table of the six offsets instead
  let steps = [[0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]]
  for (let i = 0; i < 6; i++) {
    let d = steps[i]
    let np = new CaeSeedBlockPos(pos.getX() + d[0], pos.getY() + d[1], pos.getZ() + d[2])
    let bs = level.getBlockState(np)
    if (String(bs.block.id) == 'ae2:growth_accelerator' && String(bs).indexOf('powered=true') >= 0) n++
  }
  return n
}

// progress added per tick for a seed entity at its position (0 = does not grow)
function caeSeedRate(level, e) {
  let box = e.getBoundingBox()
  let pos = new CaeSeedBlockPos(Math.floor(e.getX()), Math.floor((box.minY + box.maxY) / 2), Math.floor(e.getZ()))
  let fluid = level.getBlockState(pos).getFluidState()
  let nether = String(level.dimension) == 'minecraft:the_nether'
  // Fluid.is(TagKey) has one signature; FluidState.is(...) is ambiguous to Rhino (TagKey / HolderSet) and threw every tick
  let mult = fluid.getType().is(nether ? CaeSeedFluidTags.LAVA : CaeSeedFluidTags.WATER) ? 1 : 0
  if (mult <= 0) return 0
  let n = caeSeedAcceleratorCount(level, pos)
  let speed = CAE_SEED_SPEED[Math.min(n, CAE_SEED_SPEED.length - 1)]
  return Math.max(1, Math.floor(speed * mult))
}

function caeSeedGrow(level, e) {
  let stack = e.getItem()
  let grown = CAE_SEED_GROWN[String(stack.id)]
  if (grown === undefined) return false // changed into something else: stop tracking
  let add = caeSeedRate(level, e)
  if (add <= 0) return true
  let p = caeSeedGetProgress(stack) + add
  if (p >= CAE_SEED_REQUIRED) {
    e.setItem(Item.of(grown, stack.count))
    return false
  }
  let copy = stack.copy()
  caeSeedSetProgress(copy, p)
  e.setItem(copy)
  return true
}

EntityEvents.spawned(event => {
  let e = event.entity
  if (String(e.type) != 'minecraft:item') return
  if (caeSeedIsSeedEntity(e)) caeSeedTrack(event.level, e)
})

LevelEvents.tick(event => {
  let level = event.level
  let dim = String(level.dimension)

  // entities loaded from disk may not pass through the spawn event of this session: look again every 100 ticks
  let clock = (CAE_SEED_CLOCK[dim] || 0) + 1
  if (clock >= 100) {
    clock = 0
    // audit 5 H-3: item entities only (orbitMagic.js entitiesOfType), not every entity of the level wrapped for JS
    entitiesOfType(level, 'minecraft:item').forEach(e => {
      if (caeSeedIsSeedEntity(e)) caeSeedTrack(level, e)
    })
  }
  CAE_SEED_CLOCK[dim] = clock

  let map = CAE_SEED_TRACKED[dim]
  if (!map) return
  for (let key in map) {
    let e = map[key]
    if (e.isRemoved() || !caeSeedIsSeedEntity(e) || !caeSeedGrow(level, e)) delete map[key]
  }
})

// ---- recipes ----------------------------------------------------------------------------------------------------------
ServerEvents.recipes(event => {
  // 1.18.2: ae2:misc/seeds_fluix (sand + fluix dust -> 2 fluix seeds) stayed in the pack; ae2:misc/seeds_certus (sand + certus
  // dust -> 2 certus seeds) was removed by recipeRemoval.js, so the certus seed only comes from milling a certus crystal.
  event.shapeless('2x cae:fluix_crystal_seed', ['#minecraft:sand', '#c:dusts/fluix']).id('cae:seeds_fluix')
})
