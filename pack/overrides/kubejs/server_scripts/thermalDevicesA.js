// 1211: tick logic of three rebuilt Thermal devices (blocks and attachments: startup_scripts/thermalDevicesA.js). Everything follows
// cofh.thermal.core.block.entity.device.Device{Fisher,HiveExtractor,Composter}Tile of thermal_foundation 9.2.2.58, decompiled 19 Oct 2026
// (config defaults: cofh.thermal.core.config.ThermalDeviceConfig; bait: data/thermal/recipes/devices/fisher/*.json; the hive output:
// HiveExtractorManager). Notes and every substitute: the port's device notes.
// The blocks tick every 20 ticks (tickFrequency 20), so the tile's per-tick counters are decremented by GDA_STEP = 20 at a time. The
// KubeJS block entity `data` tag holds the counters ('process', ...), like thermalReplacements.js does for the tree extractor.
// 1211: `let`, not `const`, inside loops and functions called in loops (Rhino throws "redeclaration of var" on the second pass).

const GDA_STEP = 20 // must stay equal to info.tickFrequency in the startup script

const GDA_BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const GDA_Vec3 = Java.loadClass('net.minecraft.world.phys.Vec3')
const GDA_Registries = Java.loadClass('net.minecraft.core.registries.Registries')
const GDA_BuiltIn = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const GDA_RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
const GDA_ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
const GDA_LootBuilder = Java.loadClass('net.minecraft.world.level.storage.loot.LootParams$Builder')
const GDA_LootCtxParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')
const GDA_LootSets = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParamSets')
const GDA_BiomeTags = Java.loadClass('net.minecraft.tags.BiomeTags')
const GDA_BlockStateProps = Java.loadClass('net.minecraft.world.level.block.state.properties.BlockStateProperties')
const GDA_Composter = Java.loadClass('net.minecraft.world.level.block.ComposterBlock')
const GDA_Integer = Java.loadClass('java.lang.Integer')
const GDA_FluidAction = Java.loadClass('net.neoforged.neoforge.fluids.capability.IFluidHandler$FluidAction')
const GDA_Cardinal = Java.loadClass('dev.latvian.mods.kubejs.block.custom.CardinalBlockBuilder$CardinalKubeBlock')

// the horizontal step the block faces (the tile's FACING_HORIZONTAL; the front texture is on this side)
// (Direction.getStepX() is renamed for scripts by KubeJS' @RemapForJS and threw every tick: a table by name instead)
const GDA_STEPS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }
function gdaFacing(block) {
    let s = GDA_STEPS[String(block.blockState.getValue(GDA_Cardinal.FACING))] || [0, -1]
    return { dx: s[0], dz: s[1] }
}

// Fluids.WATER.equals(fluidState.getType()): a water SOURCE only (flowing water is Fluids.FLOWING_WATER)
function gdaWater(level, x, y, z) {
    let fs = level.getFluidState(new GDA_BlockPos(x, y, z))
    return fs.isSource() && String(GDA_BuiltIn.FLUID.getKey(fs.getType())) == 'minecraft:water'
}

function gdaRandInt(n) { return Math.floor(Math.random() * Math.max(1, n)) }

// tag test on the biome at a position, with an id guess if the tag call is not available
// (Holder.is(TagKey) goes through a KubeJS type wrapper that fails with a Java exception scripts can't catch, which ended
// the whole tick; comparing the holder's tag names has no overloads)
function gdaBiomeIs(level, pos, tag, word) {
    try {
        let want = String(tag.location())
        return level.getBiome(pos).tags().anyMatch(k => String(k.location()) == want)
    } catch (err) {
        try { return String(level.getBiome(pos).unwrapKey().get().location()).indexOf(word) >= 0 } catch (err2) { return false }
    }
}

// =====================================================================================================================================
// 1. Aquatic Entangler: cae:device_fisher
// DeviceFisherTile: timeConstant 4800 (ThermalDeviceConfig Fisher "Time Constant", range 400..72000), 20 per water source block of the
// "Water Source Time Constant Reduction" (default 20, range 1..1000), particles on. 15 output slots, 1 bait slot.
//   valid  = the block in front is a water source AND at least 7 of the 3x3 blocks centred 2 in front (same height) are water sources
//   process starts at timeConstant / 2; it counts down 1 per tick; at 0 (a) validity is re-checked, (b) process = max(timeConstant / 20,
//            random(0 .. getTimeConstant() - 1)), (c) if valid: roll the loot table
//   getTimeConstant = timeConstant - 20 * (water sources in the 5x3x5 box centred 2 in front: x,z -2..+2, y -1..+1), then / 3 in an
//            ocean biome, / 2 in a river biome, / 2 when it rains on the device, x 2 with no bait, clamped to [timeConstant / 20, timeConstant]
//   loot    = the bait's loot table (none / aquachow: gameplay/fishing; deep aquachow: thermal:gameplay/fishing/deep; junk net:
//            gameplay/fishing/junk), rolled floor(outputMod) times plus once more with probability frac(outputMod); each roll's items go into
//            the 15 slots; if at least one roll was stored, the bait is used up with probability useChance
// =====================================================================================================================================
const GDA_FISH_TIME = 4800
const GDA_FISH_MIN = GDA_FISH_TIME / 20
const GDA_FISH_WATER = 20
// thermal:fisher_boost recipes: [loot table, output_mod, use_chance]; no bait / unknown stack = the plain fishing table, 1.0, 1.0
// 1211: thermal:aquachow, deep_aquachow and junk_net became cae:aquachow, cae:deep_aquachow and cae:junk_net (item tag cae:fisher_bait)
const GDA_FISH_BOOST = {
    'cae:aquachow': ['minecraft:gameplay/fishing', 1.5, 0.5],
    'cae:deep_aquachow': ['cae:gameplay/fishing/deep', 1.75, 0.4],
    'cae:junk_net': ['minecraft:gameplay/fishing/junk', 1.0, 0.0]
}
const GDA_FISH_DEFAULT = ['minecraft:gameplay/fishing', 1.0, 1.0]

function gdaFisherValid(level, block, f) {
    let x = block.x, y = block.y, z = block.z
    if (!gdaWater(level, x + f.dx, y, z + f.dz)) { return false }
    let cx = x + 2 * f.dx, cz = z + 2 * f.dz
    let n = 0
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (gdaWater(level, cx + i, y, cz + j)) { n++ }
        }
    }
    return n >= 7
}

function gdaFisherTimeConstant(level, block, f, hasBait) {
    let x = block.x, y = block.y, z = block.z
    let cx = x + 2 * f.dx, cz = z + 2 * f.dz
    let tc = GDA_FISH_TIME
    for (let i = -2; i <= 2; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let k = -2; k <= 2; k++) {
                if (gdaWater(level, cx + i, y + j, cz + k)) { tc -= GDA_FISH_WATER }
            }
        }
    }
    let pos = new GDA_BlockPos(x, y, z)
    // BiomeDictionary OCEAN / RIVER -> the 1.21.1 biome tags minecraft:is_ocean / minecraft:is_river
    if (gdaBiomeIs(level, pos, GDA_BiomeTags.IS_OCEAN, 'ocean')) { tc = Math.floor(tc / 3) }
    if (gdaBiomeIs(level, pos, GDA_BiomeTags.IS_RIVER, 'river')) { tc = Math.floor(tc / 2) }
    if (level.isRainingAt(pos)) { tc = Math.floor(tc / 2) }
    if (!hasBait) { tc = tc * 2 }
    return Math.max(GDA_FISH_MIN, Math.min(GDA_FISH_TIME, tc))
}

function gdaRollLoot(level, block, table) {
    let holder = level.server.reloadableRegistries()
    let key = GDA_ResourceKey.create(GDA_Registries.LOOT_TABLE, GDA_RL.parse(table))
    let lt = holder.getLootTable(key)
    // the tile rolls with the ORIGIN of the device only (LootContextParamSets.EMPTY): no fishing hook, no rod, no luck
    let params = new GDA_LootBuilder(level)
        .withParameter(GDA_LootCtxParams.ORIGIN, new GDA_Vec3(block.x, block.y, block.z))
        .create(GDA_LootSets.EMPTY)
    return lt.getRandomItems(params)
}

// puts a stack into the slots of an item handler; true if all of it went in (InventoryHelper.insertStackIntoInventory(.., false).isEmpty())
function gdaStore(inv, stack) {
    let rest = stack
    for (let s = 0; s < inv.getSlots() && !rest.isEmpty(); s++) {
        rest = inv.insertItem(s, rest, false)
    }
    return rest.isEmpty()
}

BlockEvents.blockEntityTick('cae:device_fisher', event => {
    let block = event.block
    let entity = block.entity
    if (!entity) { return }
    let level = block.level
    let data = entity.data
    let f = gdaFacing(block)
    let bait = entity.attachments.get('bait')
    let out = entity.attachments.get('out')
    if (!bait || !out) { return }
    let baitStack = bait.getStackInSlot(0)
    let hasBait = !baitStack.isEmpty()

    // updateActiveState(): the first time the device is valid the timer is rolled at once; before that it sits at timeConstant / 2
    let valid = gdaFisherValid(level, block, f)
    let wasValid = data.contains('valid') ? data.getBoolean('valid') : false
    let process = data.contains('process') ? data.getInt('process') : GDA_FISH_TIME / 2
    data.putBoolean('valid', valid)
    if (!wasValid && valid) {
        process = Math.max(GDA_FISH_MIN, gdaRandInt(gdaFisherTimeConstant(level, block, f, hasBait)))
    }
    process -= GDA_STEP
    if (process > 0) {
        data.putInt('process', process)
        entity.save()
        return
    }
    // cycle: re-check validity, re-roll the timer
    data.putInt('process', Math.max(GDA_FISH_MIN, gdaRandInt(gdaFisherTimeConstant(level, block, f, hasBait))))
    if (valid) {
        let boost = (hasBait && GDA_FISH_BOOST[String(baitStack.id)]) ? GDA_FISH_BOOST[String(baitStack.id)] : GDA_FISH_DEFAULT
        let m = 1.0 * boost[1]
        let rolls = Math.floor(m) + (Math.random() < (m - Math.floor(m)) ? 1 : 0)
        let stored = 0
        for (let r = 0; r < rolls; r++) {
            let items = gdaRollLoot(level, block, boost[0])
            let n = items.size()
            for (let i = 0; i < n; i++) {
                if (gdaStore(out, items.get(i))) { stored++ }
            }
        }
        if (stored > 0) {
            if (hasBait && Math.random() < boost[2]) { bait.extractItem(0, 1, false) }
            // particles: DeviceFisherTile sends 10 splash particles in front of the device (config "Particles", default on)
            try {
                level.server.runCommandSilent('execute in ' + level.dimension + ' run particle minecraft:splash ' + (block.x + 0.5 + f.dx) + ' ' + (block.y + 0.5) + ' ' + (block.z + 0.5 + f.dz) + ' 0.1 0 0.1 0.02 10')
            } catch (err) { }
        }
    }
    entity.save()
})

// Bait by right click: the tile's input slot takes the item; a KubeJS block entity has one right click action (the inventory screen), so
// holding bait puts it into the bait slot instead of opening the screen. Sneak + empty hand takes the bait back.
BlockEvents.rightClicked('cae:device_fisher', event => {
    let entity = event.block.entity
    if (!entity) { return }
    let bait = entity.attachments.get('bait')
    if (!bait) { return }
    let held = event.item
    if (!held.isEmpty() && GDA_FISH_BOOST[String(held.id)]) {
        let slot = bait.getStackInSlot(0)
        if (!slot.isEmpty() && String(slot.id) != String(held.id)) { return }
        let before = held.count
        let rest = bait.insertItem(0, held.copy(), false)
        let taken = before - rest.count
        if (taken <= 0) { return }
        if (!event.player.isCreative()) { held.shrink(taken) }
        entity.save()
        event.cancel()
    } else if (held.isEmpty() && event.player.isCrouching() && !bait.getStackInSlot(0).isEmpty()) {
        let back = bait.extractItem(0, 64, false)
        event.player.give(back)
        entity.save()
        event.cancel()
    }
})

// =====================================================================================================================================
// 2. Hive Hopper: cae:device_hive_extractor
// DeviceHiveExtractorTile: valid when the block ABOVE has the honey_level property (BeehiveBlock.HONEY_LEVEL); every updateActiveState()
// (placing, neighbour change, redstone control change) with honey_level >= 5 it takes HiveExtractorManager.getItem/getFluid (default
// 2 honeycomb + 250 mB honey) into its output slot / 8000 mB tank and sets the hive's honey_level to 0. The Thermal mappings
// (thermal:hive_extractor recipes) are empty by default, so every hive gives the default.
// 1211 substitute: Thermal reacted to the neighbour change; here the block checks every 20 ticks. Thermal also voided the products when
// the slot or tank was full (it reset the hive regardless); this one waits until both fit, so nothing is lost.
// =====================================================================================================================================
const GDA_HONEY = GDA_BlockStateProps.LEVEL_HONEY
const GDA_COMBS = 2
const GDA_HONEY_MB = 250

BlockEvents.blockEntityTick('cae:device_hive_extractor', event => {
    let block = event.block
    let entity = block.entity
    if (!entity) { return }
    let level = block.level
    let pos = new GDA_BlockPos(block.x, block.y + 1, block.z)
    let state = level.getBlockState(pos)
    if (!state.hasProperty(GDA_HONEY)) { return }
    if (Number(state.getValue(GDA_HONEY)) < 5) { return }
    let inv = entity.attachments.get('out')
    let tank = entity.attachments.get('tank')
    if (!inv || !tank) { return }
    let combs = Item.of('minecraft:honeycomb', GDA_COMBS)
    let honey = Fluid.of('create:honey', GDA_HONEY_MB)
    if (!inv.insertItem(0, combs, true).isEmpty()) { return }
    if (tank.fill(honey, GDA_FluidAction.SIMULATE) < GDA_HONEY_MB) { return }
    inv.insertItem(0, combs, false)
    tank.fill(honey, GDA_FluidAction.EXECUTE)
    level.setBlock(pos, state.setValue(GDA_HONEY, GDA_Integer.valueOf(0)), 3)
    entity.save()
})

// The screen is not available for the hive hopper (the right click is the bucket filling): an empty hand takes the honeycomb.
BlockEvents.rightClicked('cae:device_hive_extractor', event => {
    if (!event.item.isEmpty()) { return }
    let entity = event.block.entity
    if (!entity) { return }
    let inv = entity.attachments.get('out')
    if (!inv || inv.getStackInSlot(0).isEmpty()) { return }
    let got = inv.extractItem(0, 64, false)
    event.player.give(got)
    entity.save()
    event.cancel()
})

// =====================================================================================================================================
// 3. Batch Composter: cae:device_composter
// DeviceComposterTile: timeConstant 120 (ThermalDeviceConfig Composter "Time Constant", range 20..72000), baseMod 1. 9 input slots that
// take compostable items (ComposterBlock.COMPOSTABLES), one output slot of compost (thermal:compost, here cae:compost).
//   active only while an input slot is non-empty; process counts down from processMax (= timeConstant / baseMod = 120) 1 per tick and an
//   emptied input resets it; at 0: process = processMax; if the output slot is not full, every input slot holding a compostable item
//   loses ONE item and adds that item's compost chance to compostLevel (a float, saved as "Compost"); then while compostLevel >= 7 and the
//   output slot is not full: compostLevel -= 7 and one compost is added to the output (+1 XP, not ported). Items that are not
//   compostable stay in their slot and are ignored.
// =====================================================================================================================================
const GDA_COMPOST_TIME = 120
const GDA_COMPOST_LEVEL_MAX = 7.0

BlockEvents.blockEntityTick('cae:device_composter', event => {
    let block = event.block
    let entity = block.entity
    if (!entity) { return }
    let inv = entity.attachments.get('in')
    let out = entity.attachments.get('out')
    if (!inv || !out) { return }
    let data = entity.data
    let hasInputs = false
    for (let s = 0; s < inv.getSlots(); s++) {
        if (!inv.getStackInSlot(s).isEmpty()) { hasInputs = true }
    }
    if (!hasInputs) {
        // onInventoryChanged: no inputs left -> the timer is back at processMax
        if (data.getInt('process') != GDA_COMPOST_TIME) { data.putInt('process', GDA_COMPOST_TIME); entity.save() }
        return
    }
    let process = data.contains('process') ? data.getInt('process') : GDA_COMPOST_TIME
    process -= GDA_STEP
    if (process > 0) {
        data.putInt('process', process)
        entity.save()
        return
    }
    data.putInt('process', GDA_COMPOST_TIME)
    let level = data.contains('compost') ? data.getFloat('compost') : 0.0
    let outFull = () => { let o = out.getStackInSlot(0); return !o.isEmpty() && o.count >= o.maxStackSize }
    if (!outFull()) {
        for (let s = 0; s < inv.getSlots(); s++) {
            let st = inv.getStackInSlot(s)
            if (st.isEmpty()) { continue }
            let chance = GDA_Composter.getValue(st)
            if (chance > 0) {
                level += chance
                inv.extractItem(s, 1, false)
            }
        }
    }
    while (level >= GDA_COMPOST_LEVEL_MAX && !outFull()) {
        level -= GDA_COMPOST_LEVEL_MAX
        out.insertItem(0, Item.of('cae:compost'), false)
        try {
            let b = event.block
            b.level.server.runCommandSilent('execute in ' + b.level.dimension + ' run particle minecraft:composter ' + (b.x + 0.5) + ' ' + (b.y + 1.5) + ' ' + (b.z + 0.5) + ' 0.1 0 0.1 0.02 4')
        } catch (err) { }
    }
    data.putFloat('compost', level)
    entity.save()
})

// Right click: a compostable item in the hand goes into the input slots; an empty hand takes the compost; otherwise (empty hand and no
// compost, or sneaking with an empty hand) the 3x3 input screen opens (the block's own right click action).
BlockEvents.rightClicked('cae:device_composter', event => {
    let entity = event.block.entity
    if (!entity) { return }
    let inv = entity.attachments.get('in')
    let out = entity.attachments.get('out')
    if (!inv || !out) { return }
    let held = event.item
    if (!held.isEmpty()) {
        if (GDA_Composter.getValue(held) <= 0) { return }
        let rest = held.copy()
        for (let s = 0; s < inv.getSlots() && !rest.isEmpty(); s++) {
            rest = inv.insertItem(s, rest, false)
        }
        let taken = held.count - rest.count
        if (taken <= 0) { return }
        if (!event.player.isCreative()) { held.shrink(taken) }
        entity.save()
        event.cancel()
    } else if (!event.player.isCrouching() && !out.getStackInSlot(0).isEmpty()) {
        event.player.give(out.extractItem(0, 64, false))
        entity.save()
        event.cancel()
    }
})

// =====================================================================================================================================
// 4. tags, bait recipes
// =====================================================================================================================================
ServerEvents.tags('block', event => {
    event.add('minecraft:mineable/pickaxe', ['cae:device_fisher', 'cae:device_hive_extractor', 'cae:device_composter'])
})

// the filters of the fisher's bait slot and the composter's output slot (startup script: '#cae:fisher_bait',
// '#cae:composter_output'; a tag, since item ids don't resolve yet when blocks register)
ServerEvents.tags('item', event => {
    event.add('cae:fisher_bait', ['cae:aquachow', 'cae:deep_aquachow', 'cae:junk_net'])
    event.add('cae:composter_output', 'cae:compost')
})

ServerEvents.recipes(event => {
    // thermal_foundation data/thermal/recipes/aquachow_4.json, deep_aquachow_4.json, junk_net.json (forge: tags -> c: tags)
    event.shapeless(Item.of('cae:aquachow', 4), ['minecraft:wheat', 'minecraft:wheat', 'minecraft:slime_ball']).id('cae:aquachow_4')
    event.shapeless(Item.of('cae:deep_aquachow', 4), ['minecraft:wheat', 'minecraft:beetroot', 'minecraft:slime_ball', '#c:nuggets/lead']).id('cae:deep_aquachow_4')
    event.shaped('cae:junk_net', ['n#n', '#S#', 'n#n'], { '#': '#c:strings', n: '#c:nuggets/iron', S: 'minecraft:stick' }).id('cae:junk_net')
})
