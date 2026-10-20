// 1211: replacements for the Thermal Series items/blocks/fluids the pack used (Thermal has no 1.21.1 build; Mekanism +
// Mekanism Generators took its place, see the port's Thermal id-map notes).
// Everything that has a sensible counterpart in Mekanism / PneumaticCraft / Create / Metallurgy / vanilla is mapped to that
// in the id map. This file only registers what is left, under the cae: namespace, keeping the old Thermal path:
//   metals Thermal Foundation had and 1.21.1 does not (silver, nickel, invar, constantan, signalum, lumium, enderium),
//   the trade coins, rubber, tar, rosin, the sap / oil fluids, the hardened glass, a few small crafting parts,
//   and the TNT / grenades.
// The Thermal devices (Arboreal Extractor, Igneous Extruder, Aquatic Entangler, Hive Hopper, Batch Composter, Decoctive Diffuser,
// Nullifier, Vacuumulator, Phyto-Soil Infuser, Tinker's Workbench), their augments, Phytogro, compost and the fishing bait are real
// blocks and items of the core mod now (com.caeport.cae.device): they are not registered here.
// Textures are copies of the Thermal 11 ones (copied from Thermal), in kubejs/assets/cae/textures/{item,block}. The hardened glass
// connects like Thermal's: Thermal shipped CTM sheets, which ConnectedTexturesMod doesn't apply to these KubeJS blocks, so
// tools/connected_glass.py turns them into Fusion strips (*_glass_connected.png) and models/block/*_glass.json use Fusion's
// "fusion:model" loader.
// The recipes that go with all of this live in server_scripts/thermalReplacements.js.

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

    // explosives: the five TNT are blocks again (startup_scripts/gaps2Content.js); the grenades are items thrown by a right
    // click (server_scripts/gaps2Explosives.js). Thermal's grenades stacked to 16 and had the common rarity.
    event.create('cae:glowstone_grenade').displayName('Radiant Grenade').maxStackSize(16)
    event.create('cae:explosive_grenade').displayName('Grenade').maxStackSize(16)
    event.create('cae:nuke_grenade').displayName('Nuclear Grenade').maxStackSize(16)
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
