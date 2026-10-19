// 1211: three Thermal devices the 1.21.1 port had dropped (Thermal has no 1.21.1 build), rebuilt as KubeJS block entities the way
// thermalReplacements.js did the Arboreal Extractor and the Rock Generator. The behaviour (validity rules, cycle timing, outputs) lives
// in server_scripts/thermalDevicesA.js; the numbers are from cofh.thermal.core.block.entity.device.Device{Fisher,HiveExtractor,Composter}Tile
// of thermal_foundation 9.2.2.58 (decompiled 19 Oct 2026). Notes: the port's device notes.
//   cae:device_fisher         Aquatic Entangler (thermal:device_fisher)         facing block, 1 bait slot + 15 output slots
//   cae:device_hive_extractor Hive Hopper (thermal:device_hive_extractor)       facing block, 1 item slot + 8000 mB honey tank
//   cae:device_composter      Batch Composter (thermal:device_composter)        9 input slots + 1 compost output slot
// Block names are the 9.2.2.58 en_us names. Textures and models are copied from Thermal 9.2.2.58 (kubejs/assets/cae/blockstates,
// models/block, textures/block: device_*), with Thermal's `active` blockstate (the server scripts set it while the device works) and
// the composter's compost `level`.
// Item sides: see "Item sides" at the end of this file (every side inserts into the inputs and extracts from the outputs, as Thermal).
// The per-side directions given to the inventories below are only the fallback for when that registration fails.
// 1211 substitute: no augments, no redstone control (Thermal's default, "ignored", is what they do), no XP storage, no GUI beyond the
// plain inventory screen. Thermal's devices use no energy, and neither do these.

StartupEvents.registry('item', event => {
    // The fisher's bait and the composter's product. Thermal's aquachow / junk net / compost are not in 1.21.1, so they are rebuilt here
    // (the Aquatic Entangler works without bait, but bait changes what it catches and how much).
    event.create('cae:aquachow').displayName('Aqua-Chow').texture('cae:item/device_fisher_aquachow')
    event.create('cae:deep_aquachow').displayName('Benthic Aqua-Chow').texture('cae:item/device_fisher_deep_aquachow')
    event.create('cae:junk_net').displayName('Junk Net').texture('cae:item/device_fisher_junk_net')
    event.create('cae:compost').displayName('Compost').texture('cae:item/device_composter_compost')
})

// Thermal's ACTIVE blockstate property (cofh.lib.util.constants.BlockStatePropertiesCoFH.ACTIVE) and the Batch Composter's fill level
// (TileBlockComposter.LEVEL = BlockStateProperties.LEVEL_COMPOSTER, 0..8, set from the compost in the output slot).
const GDA_ACTIVE = Java.loadClass('net.minecraft.world.level.block.state.properties.BooleanProperty').create('active')
const GDA_LEVEL = Java.loadClass('net.minecraft.world.level.block.state.properties.BlockStateProperties').LEVEL_COMPOSTER

StartupEvents.registry('block', event => {
    // Aquatic Entangler. The front of the block (the texture with the hook) must face the water: the block in front has to be a water
    // source and the 3x3 patch two blocks in front needs at least 7 water sources (updateValidity). Cycle: server script.
    // 'cardinal' = a KubeJS block with a horizontal `facing` property (front texture on the side the player faces when placing).
    event.create('cae:device_fisher', 'cardinal')
        .displayName('Aquatic Entangler')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .property(GDA_ACTIVE)
        .defaultState(s => s.set(GDA_ACTIVE, false))
        .textures({
            particle: 'cae:block/device_fisher_side',
            bottom: 'cae:block/device_fisher_bottom',
            top: 'cae:block/device_fisher_top',
            front: 'cae:block/device_fisher',
            side: 'cae:block/device_fisher_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(20)
            // bait (DeviceFisherTile.inputSlot: one slot, only the fisher_boost items). The directions (bait from above, output on the
            // other sides) only apply if the all-sides handler at the end of this file fails to register.
            info.inventory('bait', ['up'], 1, 1, '#cae:fisher_bait')
            // the 15 output slots (addSlots(OUTPUT, 15)); right click opens them
            info.inventory('out', ['down', 'north', 'south', 'east', 'west'], 5, 3)
            info.rightClickOpensInventory('out')
        })

    // Hive Hopper: sits directly BELOW a beehive / bee nest (the block above must have the honey_level property) and takes the honey
    // when the level reaches 5: 2 honeycomb + 250 mB honey per harvest (HiveExtractorManager COMB_AMOUNT 2, HONEY_AMOUNT 250).
    event.create('cae:device_hive_extractor', 'cardinal')
        .displayName('Hive Hopper')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .property(GDA_ACTIVE)
        .defaultState(s => s.set(GDA_ACTIVE, false))
        .textures({
            particle: 'cae:block/device_hive_extractor_side',
            bottom: 'cae:block/device_hive_extractor_bottom',
            top: 'cae:block/device_hive_extractor_top',
            front: 'cae:block/device_hive_extractor',
            side: 'cae:block/device_hive_extractor_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(20)
            info.inventory('out', [], 1, 1)
            info.fluidTank('tank', [], 8000)
            info.rightClickFillsTank('tank')
        })

    // Batch Composter: nine input slots, one compost output slot; every 120 ticks it eats one item from each input slot that is
    // compostable and turns each 7 compost chances into one cae:compost.
    // Thermal's model is an open box (the top texture has a hole) with the compost inside rising with `level`: cutout, and not
    // occluding, so light reaches the inside (a solid block would leave it black).
    event.create('cae:device_composter')
        .displayName('Batch Composter')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .property(GDA_ACTIVE)
        .property(GDA_LEVEL)
        .defaultState(s => s.set(GDA_ACTIVE, false))
        .renderType('cutout')
        .notSolid()
        .textures({
            particle: 'cae:block/device_composter_side',
            down: 'cae:block/device_composter_bottom',
            up: 'cae:block/device_composter_top',
            north: 'cae:block/device_composter_side',
            south: 'cae:block/device_composter_side',
            east: 'cae:block/device_composter_side',
            west: 'cae:block/device_composter_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(20)
            // directions: the fallback only, as on the fisher
            info.inventory('in', ['up'], 3, 3)
            // compost only, through a tag (server script): blocks register before items, so 'cae:compost' itself
            // doesn't resolve here and startup fails
            info.inventory('out', ['down', 'north', 'south', 'east', 'west'], 1, 1, '#cae:composter_output')
            info.rightClickOpensInventory('in')
        })
})

// =====================================================================================================================================
// Item sides of the rebuilt devices (this file's three and the Arboreal Extractor, Rock Generator and Decoctive Diffuser).
// Thermal answered hoppers and pipes on every side with one item handler over [input slots..., output slots...]: insertItem only
// fills the input slots, extractItem empties any slot (AugmentableBlockEntity: StorageGroup.ACCESSIBLE), except on the Aquatic
// Entangler and the Batch Composter, which only let the outputs out (Device{Fisher,Composter}Tile.getItemHandlerCapability:
// INPUT_OUTPUT, input extraction blocked; read from the 9.2.2.58 tiles, the handler classes are CoFH Core 1.20.1's). The composter's
// inputs only take compostable items.
// KubeJS gives each side the first inventory attachment listed for it, so this registers that handler itself, on NeoForge's
// RegisterCapabilitiesEvent at HIGH priority: providers are asked in registration order, and KubeJS registers its own at NORMAL, so
// this one answers every side (and the null side). If anything here fails, the provider returns null and KubeJS's per-side
// inventories answer as before.
// The handler is a JS object made into an IItemHandlerModifiable by Rhino (a plain object passed for an interface type) through
// NeoForge's RangedWrapper constructor; it reads the block entity's own inventories, so nothing is copied. Every method is guarded:
// these run inside hopper / pipe ticks, where an uncaught script error would take the server down.
// =====================================================================================================================================
const GDA_IO_ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const GDA_IO_Ranged = Java.loadClass('net.neoforged.neoforge.items.wrapper.RangedWrapper')
// ComposterBlock is loaded on first use, not while the startup scripts load
let gdaIoComposter = null
function gdaIoCompostable(stack) {
    if (gdaIoComposter == null) { gdaIoComposter = Java.loadClass('net.minecraft.world.level.block.ComposterBlock') }
    return gdaIoComposter.getValue(stack) > 0
}
// [block id, input inventory or null, output inventory or null, inputs can be extracted, extra check for inserting into the inputs]
const GDA_IO_DEVICES = [
    ['cae:device_fisher', 'bait', 'out', false, null],
    ['cae:device_composter', 'in', 'out', false, stack => gdaIoCompostable(stack)],
    ['cae:device_tree_extractor', 'boost', null, true, null],
    // the boost slot's own filter is dropped if the item ids don't resolve at startup (startup thermalDevicesB.js), so it is checked here too
    ['cae:device_potion_diffuser', 'boost', null, true, stack => ['minecraft:redstone', 'minecraft:glowstone_dust'].indexOf(String(stack.id)) >= 0],
    ['cae:device_rock_gen', null, 'out', true, null],
    ['cae:device_hive_extractor', null, 'out', true, null]
]
let gdaIoWarned = false

function gdaIoWarn(msg) {
    if (!gdaIoWarned) { console.warn('thermalDevicesA.js: device item handler: ' + msg) }
    gdaIoWarned = true
}

function gdaIoHandler(be, dev) {
    try {
        let inp = dev[1] ? be.attachments.get(dev[1]) : null
        let out = dev[2] ? be.attachments.get(dev[2]) : null
        let ni = inp ? inp.getSlots() : 0
        let no = out ? out.getSlots() : 0
        if (ni + no <= 0) { return null }
        let extractInputs = dev[3]
        let check = dev[4]
        let empty = GDA_IO_ItemStack.EMPTY
        let view = {
            getSlots: () => ni + no,
            getStackInSlot: slot => {
                try { return slot < ni ? inp.getStackInSlot(slot) : out.getStackInSlot(slot - ni) } catch (err) { gdaIoWarn(err); return empty }
            },
            insertItem: (slot, stack, simulate) => {
                try {
                    if (slot >= ni || stack.isEmpty()) { return stack }
                    if (check && !check(stack)) { return stack }
                    return inp.insertItem(slot, stack, simulate)
                } catch (err) { gdaIoWarn(err); return stack }
            },
            extractItem: (slot, amount, simulate) => {
                try {
                    if (slot < ni) { return extractInputs ? inp.extractItem(slot, amount, simulate) : empty }
                    return out.extractItem(slot - ni, amount, simulate)
                } catch (err) { gdaIoWarn(err); return empty }
            },
            getSlotLimit: slot => {
                try { return slot < ni ? inp.getSlotLimit(slot) : out.getSlotLimit(slot - ni) } catch (err) { gdaIoWarn(err); return 64 }
            },
            isItemValid: (slot, stack) => {
                try {
                    if (slot >= ni) { return false }
                    if (check && !check(stack)) { return false }
                    return inp.isItemValid(slot, stack)
                } catch (err) { gdaIoWarn(err); return false }
            },
            setStackInSlot: (slot, stack) => {
                try {
                    if (slot < ni) { inp.setStackInSlot(slot, stack) } else { out.setStackInSlot(slot - ni, stack) }
                } catch (err) { gdaIoWarn(err) }
            }
        }
        return new GDA_IO_Ranged(view, 0, ni + no)
    } catch (err) {
        gdaIoWarn(err)
        return null
    }
}

try {
    let EventPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
    NativeEvents.onEvent(EventPriority.HIGH, 'net.neoforged.neoforge.capabilities.RegisterCapabilitiesEvent', event => {
        try {
            let ItemCap = Java.loadClass('net.neoforged.neoforge.capabilities.Capabilities$ItemHandler')
            let BuiltIn = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
            let RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
            GDA_IO_DEVICES.forEach(dev => {
                try {
                    // getOptional(ResourceLocation), as mbd2_machines.js looks blocks up (the block entity type has the block's id)
                    let found = BuiltIn.BLOCK_ENTITY_TYPE.getOptional(RL.parse(dev[0]))
                    if (!found.isPresent()) { console.warn('thermalDevicesA.js: no block entity type ' + dev[0] + ', its item sides stay per side'); return }
                    event.registerBlockEntity(ItemCap.BLOCK, found.get(), (be, side) => gdaIoHandler(be, dev))
                } catch (err) {
                    console.warn('thermalDevicesA.js: item sides of ' + dev[0] + ' not registered (' + err + '), they stay per side')
                }
            })
        } catch (err) {
            console.warn('thermalDevicesA.js: device item sides not registered (' + err + '), they stay per side')
        }
    })
} catch (err) {
    console.warn('thermalDevicesA.js: could not listen for RegisterCapabilitiesEvent (' + err + '), device item sides stay per side')
}
