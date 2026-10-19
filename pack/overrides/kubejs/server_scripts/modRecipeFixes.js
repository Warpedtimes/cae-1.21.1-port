// 1211: recipes that ship broken in mods of the 1.21.1 pack (the game logs "Parsing error loading recipe" and drops them),
// added back as they were meant. Found in the server log, 19 Oct 2026.
// Not fixed here because nothing is lost: Dramatic Doors' tall/short doors for Chipped (not in the pack) and for Oh The
// Biomes We've Gone woods whose doors no longer exist.

ServerEvents.recipes(event => {
    // Create Deco 2.1.3 data/createdeco/recipe/placard.json: a dyed placard and white dye back to Create's plain placard
    // (its white dye ingredient is written as {"id": ...}, which ingredients don't accept)
    event.shapeless('create:placard', ['#createdeco:placards', 'minecraft:white_dye']).id('cae:fix/createdeco_placard')
    // Samurai Dynasty 0.1.8 lamps/deepslate_lamp.json: "polished_deepslatee_slab" (typo)
    event.shaped('samurai_dynasty:deepslate_lamp', ['S', 'T', 'B'], {
        S: 'minecraft:polished_deepslate_slab', T: 'minecraft:torch', B: 'minecraft:polished_deepslate'
    }).id('cae:fix/samurai_deepslate_lamp')
})
