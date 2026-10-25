ServerEvents.recipes(event => {
  //event.recipes.create.cutting(['kubejs:petrified_sheet'], 'minecraft:petrified_oak_slab').processingTime(150)
  event.recipes.create.cutting(['9x integrateddynamics:crystalized_menril_chunk'], 'integrateddynamics:crystalized_menril_block').processingTime(90)
  event.recipes.create.cutting(['2x minecraft:oak_slab'], 'minecraft:oak_planks').processingTime(90)
  event.recipes.create.cutting(['ars_elemental:stripped_yellow_archwood_log'], 'ars_elemental:yellow_archwood_log').processingTime(90)
  event.recipes.create.cutting(['6x ars_nouveau:archwood_planks'], 'ars_elemental:stripped_yellow_archwood_log').processingTime(90)
  event.recipes.create.cutting(['6x ars_nouveau:archwood_planks'], 'ars_elemental:stripped_yellow_archwood').processingTime(90)

  // added (1.21.1 port, owner's request, 25 Oct 2026): rabbit hide had no recipe. Leather cuts into 4 hides, the reverse of
  // vanilla's 4 hides -> 1 leather, so the pair can't duplicate anything. Saw for automation, knife on a Farmer's Delight
  // cutting board for early game.
  event.recipes.create.cutting(['4x minecraft:rabbit_hide'], 'minecraft:leather').processingTime(50).id('kubejs:cutting/rabbit_hide')
  event.custom({
    type: 'farmersdelight:cutting',
    ingredients: [{ item: 'minecraft:leather' }],
    tool: { tag: 'c:tools/knife' },
    result: [{ item: { id: 'minecraft:rabbit_hide', count: 4 } }]
  }).id('kubejs:farmersdelight_cutting/rabbit_hide')
}) 
  