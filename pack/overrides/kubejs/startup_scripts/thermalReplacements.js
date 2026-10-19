// 1211: replacements for the Thermal Series items/blocks/fluids the pack used (Thermal has no 1.21.1 build; Mekanism +
// Mekanism Generators took its place, see the port's Thermal id-map notes).
// Everything that has a sensible counterpart in Mekanism / PneumaticCraft / Create / Metallurgy / vanilla is mapped to that
// in the id map. This file only registers what is left, under the cae: namespace, keeping the old Thermal path:
//   metals Thermal Foundation had and 1.21.1 does not (silver, nickel, invar, constantan, signalum, lumium, enderium),
//   the trade coins, rubber, tar, rosin, the sap / oil fluids, the hardened glass, a few small crafting parts,
//   the TNT / grenades, and two ticking machines (the tree extractor and the rock generator).
// Textures are copies of the Thermal 11 ones (copied from Thermal), in kubejs/assets/cae/textures/{item,block}.
// The recipes that go with all of this live in server_scripts/thermalReplacements.js.
// Notes on the KubeJS 7 APIs used (read in KubeJS 2101 sources, block/entity/*):
//   BlockBuilder.blockEntity(info => { info.serverTicking(); info.tickFrequency(n); info.fluidTank(id, dirs, cap);
//   info.inventory(id, dirs, w, h); info.rightClickFillsTank(id); info.rightClickOpensInventory(id) }) and the server-side
//   BlockEvents.blockEntityTick(blockId, e => ...) event; an empty direction list means every side.

StartupEvents.registry('item', event => {
    // metals Thermal Foundation provided that no 1.21.1 mod does. Nuggets / ingots / dusts / plates; blocks are below.
    const metals = [
        ['silver', 'Silver'],
        ['nickel', 'Nickel'],
        ['invar', 'Invar'],
        ['constantan', 'Constantan'],
        ['signalum', 'Signalum'],
        ['lumium', 'Lumium'],
        ['enderium', 'Enderium']
    ]
    metals.forEach(m => {
        event.create('cae:' + m[0] + '_ingot').displayName(m[1] + ' Ingot')
        event.create('cae:' + m[0] + '_nugget').displayName(m[1] + ' Nugget')
        event.create('cae:' + m[0] + '_dust').displayName(m[1] + ' Dust')
        event.create('cae:' + m[0] + '_plate').displayName(m[1] + ' Plate')
    })
    event.create('cae:raw_silver').displayName('Raw Silver')
    event.create('cae:raw_nickel').displayName('Raw Nickel')

    // trade currency (the pack hands them out as quest rewards and loot; there is deliberately no crafting recipe)
    event.create('cae:silver_coin').displayName('Silver Coin')
    event.create('cae:gold_coin').displayName('Gold Coin')
    event.create('cae:bronze_coin').displayName('Bronze Coin')

    // small parts and materials
    event.create('cae:copper_gear').displayName('Copper Gear')
    event.create('cae:rubber').displayName('Rubber')
    event.create('cae:cured_rubber').displayName('Cured Rubber')
    event.create('cae:rosin').displayName('Rosin')
    event.create('cae:tar').displayName('Tar')
    event.create('cae:saw_blade').displayName('Saw Blade')
    event.create('cae:drill_head').displayName('Drill Head')
    event.create('cae:xp_crystal').displayName('Experience Crystal')

    // elemental rods / powders (Thermal mob drops; the mobs are gone, the pack mills the rods into powders, see the server script)
    event.create('cae:blizz_rod').displayName('Blizz Rod')
    event.create('cae:basalz_rod').displayName('Basalz Rod')
    event.create('cae:blizz_powder').displayName('Blizz Powder')
    event.create('cae:basalz_powder').displayName('Basalz Powder')
    event.create('cae:blitz_powder').displayName('Blitz Powder')

    // explosives, thrown / primed by a right click (server script)
    event.create('cae:ender_tnt').displayName('Ender TNT')
    event.create('cae:glowstone_tnt').displayName('Glowstone TNT')
    event.create('cae:ice_tnt').displayName('Ice TNT')
    event.create('cae:fire_tnt').displayName('Fire TNT')
    event.create('cae:nuke_tnt').displayName('Nuclear TNT').rarity('epic')
    event.create('cae:glowstone_grenade').displayName('Glowstone Grenade')
    event.create('cae:explosive_grenade').displayName('Explosive Grenade')
    event.create('cae:nuke_grenade').displayName('Nuclear Grenade').rarity('epic')
})

StartupEvents.registry('block', event => {
    const metals = [
        ['silver', 'Silver'],
        ['nickel', 'Nickel'],
        ['invar', 'Invar'],
        ['constantan', 'Constantan'],
        ['signalum', 'Signalum'],
        ['lumium', 'Lumium'],
        ['enderium', 'Enderium']
    ]
    metals.forEach(m => {
        event.create('cae:' + m[0] + '_block').displayName('Block of ' + m[1]).hardness(5.0).resistance(6.0).requiresTool(true).soundType('metal')
    })
    event.create('cae:cured_rubber_block').displayName('Block of Cured Rubber').hardness(1.0).resistance(2.0).soundType('slime_block')

    // hardened glass: indestructible by the Wither (tagged minecraft:wither_immune in the server script)
    const glass = [['obsidian_glass', 'Obsidian Glass', 0], ['enderium_glass', 'Enderium Glass', 0], ['lumium_glass', 'Lumium Glass', 1.0], ['signalum_glass', 'Signalum Glass', 0.6]]
    glass.forEach(g => {
        event.create('cae:' + g[0]).displayName(g[1]).hardness(5.0).resistance(1200.0).requiresTool(true).soundType('glass').notSolid().renderType('cutout').lightLevel(g[2])
    })

    // Arboreal Extractor: stands next to a tree trunk, fills a 8000 mB tank (DeviceTreeExtractorTile: new FluidStorageCoFH(8000)) with the
    // tree's sap / resin. Right click with a bucket; right click with bone meal stocks the boost (server script).
    // The recipes (which tree gives what) and the tick logic are in server_scripts/thermalReplacements.js; the tick runs every 20 ticks and
    // its CAE_TREE_STEP there must stay equal to this number (the cycle is 500+ ticks long, see the server script).
    event.create('cae:device_tree_extractor')
        .displayName('Arboreal Extractor')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .textures({
            particle: 'cae:block/device_tree_extractor_side',
            down: 'cae:block/device_tree_extractor_bottom',
            up: 'cae:block/device_tree_extractor_top',
            north: 'cae:block/device_tree_extractor',
            south: 'cae:block/device_tree_extractor_side',
            east: 'cae:block/device_tree_extractor_side',
            west: 'cae:block/device_tree_extractor_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(20)
            info.fluidTank('tank', [], 8000)
            info.rightClickFillsTank('tank')
        })

    // Rock Generator (Thermal's Igneous Extruder): needs a lava source next to it plus the water / ice of the mapping and the block
    // underneath it (the mapping table is in the server script); one item per 20 ticks into a 1 slot output like the tile's single output
    // slot (hoppers / pipes can pull from it, right click opens it).
    event.create('cae:device_rock_gen')
        .displayName('Rock Generator')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .textures({
            particle: 'cae:block/device_rock_gen_side',
            down: 'cae:block/device_rock_gen_bottom',
            up: 'cae:block/device_rock_gen_top',
            north: 'cae:block/device_rock_gen',
            south: 'cae:block/device_rock_gen_side',
            east: 'cae:block/device_rock_gen_side',
            west: 'cae:block/device_rock_gen_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(20)
            info.inventory('out', [], 1, 1)
            info.rightClickOpensInventory('out')
        })
})

StartupEvents.registry('fluid', event => {
    // colours picked from the Thermal buckets. 'thick' fluids are slow and viscous, 'thin' ones are watery.
    event.create('cae:sap', 'thick').tint(0xC6A15A).displayName('Sap')
    event.create('cae:resin', 'thick').tint(0xC27A1E).displayName('Resin')
    event.create('cae:syrup', 'thick').tint(0x8A5A22).displayName('Syrup')
    event.create('cae:tree_oil', 'thick').tint(0x6B6A1E).displayName('Tree Oil')
    event.create('cae:light_oil', 'thin').tint(0xB89A2C).displayName('Light Oil')
    event.create('cae:heavy_oil', 'thick').tint(0x2E2418).displayName('Heavy Oil')
    event.create('cae:refined_fuel', 'thin').tint(0xD9C53A).displayName('Refined Fuel')
    event.create('cae:creosote', 'thick').tint(0x4A3B22).displayName('Creosote Oil')
    event.create('cae:redstone', 'thin').tint(0xD4281C).displayName('Liquid Redstone').type(t => t.lightLevel(5))
})
