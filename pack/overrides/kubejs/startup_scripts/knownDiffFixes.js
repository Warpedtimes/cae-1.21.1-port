// 1211: things from the wiki's "Known differences" page brought back to how the 1.18.2 pack had them (19 Oct 2026).
// The server half is server_scripts/knownDiffFixes.js; data in data/cae (worldgen, loot tables).
//   - Silver and nickel ore. Thermal Foundation generated both in the 1.18.2 pack (config/thermal-common.toml: 4 veins of 8
//     per chunk; silver Y -60..40, nickel Y -40..120). Thermal has no 1.21.1 build, so the ores are pack blocks with
//     Thermal's textures, numbers and loot (raw metal, fortune; silk touch gives the ore; iron pickaxe). Worldgen:
//     data/cae/worldgen and data/cae/neoforge/biome_modifier.
//   - Ars Nouveau's Blaze Fiber and End Fiber (Ars 2.9.0 on 1.18.2). Ars 5 dropped the items but still ships End Fiber's
//     texture and both models, so they come back under their own IDs; Blaze Fiber's texture is Ars 2.9.0's, in
//     kubejs/assets/ars_nouveau. Their recipes are in the server script, their loot entries are back in the loot tables.

StartupEvents.registry('block', event => {
    const ores = [['silver', 'Silver'], ['nickel', 'Nickel']]
    ores.forEach(o => {
        // Thermal: ore 3.0 / 3.0, deepslate ore 4.5 / 3.0, stone and deepslate sounds
        event.create('cae:' + o[0] + '_ore').displayName(o[1] + ' Ore')
            .hardness(3.0).resistance(3.0).requiresTool(true).soundType('stone')
            .tagBlock('minecraft:mineable/pickaxe').tagBlock('minecraft:needs_iron_tool')
            .tagBlock('c:ores').tagBlock('c:ores/' + o[0]).tagBlock('c:ores_in_ground/stone')
            .tagItem('c:ores').tagItem('c:ores/' + o[0]).tagItem('c:ores_in_ground/stone')
        event.create('cae:deepslate_' + o[0] + '_ore').displayName('Deepslate ' + o[1] + ' Ore')
            .hardness(4.5).resistance(3.0).requiresTool(true).soundType('deepslate')
            .tagBlock('minecraft:mineable/pickaxe').tagBlock('minecraft:needs_iron_tool')
            .tagBlock('c:ores').tagBlock('c:ores/' + o[0]).tagBlock('c:ores_in_ground/deepslate')
            .tagItem('c:ores').tagItem('c:ores/' + o[0]).tagItem('c:ores_in_ground/deepslate')
    })
})

// Dispensers fire the pack's TNT and grenades: the core mod does it (com.caeport.cae.compat.PackTntDispensing; Rhino
// can't implement DispenseItemBehavior).

StartupEvents.registry('item', event => {
    event.create('ars_nouveau:blaze_fiber').displayName('Blaze Fiber').texture('ars_nouveau:item/blaze_fiber')
    event.create('ars_nouveau:end_fiber').displayName('End Fiber').texture('ars_nouveau:item/end_fiber')
})
