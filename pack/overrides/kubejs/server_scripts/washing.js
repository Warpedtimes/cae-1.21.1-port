ServerEvents.recipes(event => {
  event.recipes.create.splashing(['minecraft:petrified_oak_slab'],'minecraft:oak_slab')
  event.recipes.create.splashing(['kubejs:etched_board'],'pneumaticcraft:unassembled_pcb')
  event.recipes.create.splashing(['kubejs:cleaned_pcb'],'kubejs:tested_pcb')
  //event.recipes.create.splashing(CreateItem.of('minecraft:gold_nugget', 0.02),'minecraft:soul_sand')
  // 1211: Item.of(x).withChance() is CreateItem.of(item, chance) now
  event.recipes.create.splashing(['minecraft:bowl', CreateItem.of('kubejs:mage_leaf', 0.38)],'kubejs:dirty_bowl')
  event.recipes.create.splashing('kubejs:rejuvinated_menril_shrub',['kubejs:menril_shrub'])
  event.recipes.create.splashing('10x minecraft:iron_nugget', 'create:crushed_raw_iron')
  event.recipes.create.splashing(["minecraft:exposed_copper"], ["minecraft:copper_block"])
  event.recipes.create.splashing(["minecraft:weathered_copper"], ["minecraft:exposed_copper"])
  event.recipes.create.splashing(["minecraft:oxidized_copper"], ["minecraft:weathered_copper"])
})
