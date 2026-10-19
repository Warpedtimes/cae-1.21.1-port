// 1211: the server half of startup_scripts/knownDiffFixes.js (things from the wiki's "Known differences" page brought back
// to how the 1.18.2 pack had them, 19 Oct 2026).

// Necrotic Bone: not a wither skeleton drop. Tinkers turned the bones a wither skeleton drops into necrotic bones, but
// Architect's Palette (in the 1.18.2 pack too) turns them into withered bones first, and does so here as well; the
// necrotic bone comes from haunting a bone (tinkersReplacements.js).

// PneumaticCraft's Creative Compressed Iron Block (creative only): opening its screen crashes the client in this pack, so
// a right click does nothing instead. Its temperature can still be set with /data (the block entity's targetTemperature).
BlockEvents.rightClicked('pneumaticcraft:creative_compressed_iron_block', event => {
    event.cancel()
})

ServerEvents.recipes(event => {
    // Ars Nouveau 2.9.0 (data/ars_nouveau/recipes/blaze_fiber.json, end_fiber.json)
    event.shapeless(Item.of('ars_nouveau:blaze_fiber', 2), ['ars_nouveau:magebloom_fiber', 'ars_nouveau:magebloom_fiber',
        'minecraft:blaze_powder']).id('cae:ars_blaze_fiber')
    event.shapeless(Item.of('ars_nouveau:end_fiber', 2), ['ars_nouveau:blaze_fiber', 'ars_nouveau:blaze_fiber',
        'minecraft:popped_chorus_fruit']).id('cae:ars_end_fiber')
    // the 1.18.2 pack's compatRecipes.js: 3 blaze fiber and 200 mB of liquid chorus mix into 3 end fiber
    event.recipes.create.mixing('3x ars_nouveau:end_fiber', ['3x ars_nouveau:blaze_fiber',
        Fluid.of('integrateddynamics:liquid_chorus', 200)]).id('cae:ars_end_fiber_mixing')
})
