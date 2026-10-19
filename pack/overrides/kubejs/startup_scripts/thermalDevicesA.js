// 1211: three Thermal devices the 1.21.1 port had dropped (Thermal has no 1.21.1 build), rebuilt as KubeJS block entities the way
// thermalReplacements.js did the Arboreal Extractor and the Rock Generator. The behaviour (validity rules, cycle timing, outputs) lives
// in server_scripts/thermalDevicesA.js; the numbers are from cofh.thermal.core.block.entity.device.Device{Fisher,HiveExtractor,Composter}Tile
// of thermal_foundation 9.2.2.58 (decompiled 19 Oct 2026). Notes: the port's device notes.
//   cae:device_fisher         Aquatic Entangler (thermal:device_fisher)         facing block, 1 bait slot + 15 output slots
//   cae:device_hive_extractor Hive Hopper (thermal:device_hive_extractor)       facing block, 1 item slot + 8000 mB honey tank
//   cae:device_composter      Batch Composter (thermal:device_composter)        9 input slots + 1 compost output slot
// Block names are the 9.2.2.58 en_us names. Textures are copied from Thermal.
// Item sides: an inventory attachment given directions only answers hoppers / pipes on those sides, and KubeJS exposes one item handler per
// side, so the bait / input inventory sits on the TOP side and the output inventory on every other side (an empty list means every side).
// 1211 substitute: no augments, no redstone control, no energy / XP storage, no "active" model, no GUI beyond the plain inventory screen.

StartupEvents.registry('item', event => {
    // The fisher's bait and the composter's product. Thermal's aquachow / junk net / compost are not in 1.21.1, so they are rebuilt here
    // (the Aquatic Entangler works without bait, but bait changes what it catches and how much).
    event.create('cae:aquachow').displayName('Aqua-Chow').texture('cae:item/device_fisher_aquachow')
    event.create('cae:deep_aquachow').displayName('Benthic Aqua-Chow').texture('cae:item/device_fisher_deep_aquachow')
    event.create('cae:junk_net').displayName('Junk Net').texture('cae:item/device_fisher_junk_net')
    event.create('cae:compost').displayName('Compost').texture('cae:item/device_composter_compost')
})

StartupEvents.registry('block', event => {
    // Aquatic Entangler. The front of the block (the texture with the hook) must face the water: the block in front has to be a water
    // source and the 3x3 patch two blocks in front needs at least 7 water sources (updateValidity). Cycle: server script.
    // 'cardinal' = a KubeJS block with a horizontal `facing` property (front texture on the side the player faces when placing).
    event.create('cae:device_fisher', 'cardinal')
        .displayName('Aquatic Entangler')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
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
            // bait (DeviceFisherTile.inputSlot: one slot, only the fisher_boost items): hoppers / pipes from above
            info.inventory('bait', ['up'], 1, 1, '#cae:fisher_bait')
            // the 15 output slots (addSlots(OUTPUT, 15)): every other side; right click opens them
            info.inventory('out', ['down', 'north', 'south', 'east', 'west'], 5, 3)
            info.rightClickOpensInventory('out')
        })

    // Hive Hopper: sits directly BELOW a beehive / bee nest (the block above must have the honey_level property) and takes the honey
    // when the level reaches 5: 2 honeycomb + 250 mB honey per harvest (HiveExtractorManager COMB_AMOUNT 2, HONEY_AMOUNT 250).
    event.create('cae:device_hive_extractor', 'cardinal')
        .displayName('Hive Hopper')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
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
    event.create('cae:device_composter')
        .displayName('Batch Composter')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
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
            info.inventory('in', ['up'], 3, 3)
            // compost only, through a tag (server script): blocks register before items, so 'cae:compost' itself
            // doesn't resolve here and startup fails
            info.inventory('out', ['down', 'north', 'south', 'east', 'west'], 1, 1, '#cae:composter_output')
            info.rightClickOpensInventory('in')
        })
})
