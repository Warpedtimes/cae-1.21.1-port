ServerEvents.recipes(event => {
  if (CAE_THERMAL) { // 1211: thermal
    event.recipes.create.filling('kubejs:enriched_rubber', [
    'cae:cured_rubber',
    Fluid.of('integrateddynamics:menril_resin', 100)
    ])
  }
  if (CAE_TCONSTRUCT) { // 1211: tinkers
    event.recipes.create.filling('create:electron_tube', [
      'create:rose_quartz',
      Fluid.of('createmetallurgy:molten_iron', 45)
    ])
  }
  if (CAE_THERMAL) { // 1211: thermal
    event.recipes.create.filling('create:rose_quartz', [
      'minecraft:redstone',
      Fluid.of('cae:redstone', 25)
    ])
  }
  event.recipes.create.filling('quark:soul_bead', ['forbidden_arcanus:soul', Fluid.of('kubejs:liquid_resent', 200)])
  event.recipes.create.filling('kubejs:anthracene', ['kubejs:empty_vial', Fluid.of('kubejs:superheated_anthracene', 144)])
  event.recipes.create.filling('kubejs:magebloom_sourceberry_smoothie_bowl', ['minecraft:bowl', Fluid.of('kubejs:magebloom_sourceberry_smoothie', 100)])
  event.recipes.create.filling(Item.of('pneumaticcraft:plastic'),['create:sturdy_sheet', Fluid.of("pneumaticcraft:plastic", 500)])
})
