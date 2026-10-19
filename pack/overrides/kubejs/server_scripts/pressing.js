ServerEvents.recipes(event => {
  if (CAE_THERMAL) { // 1211: thermal
    event.recipes.create.compacting('1x ' + ("cae:rubber"), [Fluid.of(('minecraft:water'), 250), '4x minecraft:vine'])
    event.recipes.create.compacting('1x ' + ("cae:rubber"), [Fluid.of(('minecraft:water'), 250), Ingredient.of('#minecraft:flowers'), Ingredient.of('#minecraft:flowers'), Ingredient.of('#minecraft:flowers'), Ingredient.of('#minecraft:flowers')])
    event.recipes.create.compacting('1x ' + ("cae:rubber"), [Fluid.of(('cae:resin'), 250)])
  }
  event.recipes.create.compacting('forbidden_arcanus:rune', ['kubejs:rune_dust', 'kubejs:rune_dust', 'kubejs:rune_dust', 'quark:violet_corundum_cluster']).heated()
  if (CAE_THERMAL) { // 1211: thermal
    event.recipes.create.compacting(['4x minecraft:lapis_lazuli'], ['mekanism:dust_lapis_lazuli', 'mekanism:dust_lapis_lazuli', 'mekanism:dust_lapis_lazuli', 'quark:blue_corundum_cluster']).heated()
  }
  event.recipes.create.compacting('1x ' + ("create:chromatic_compound"), [Fluid.of(('kubejs:liquid_anthraquinone'), 144)])
  event.recipes.create.pressing("kubejs:radiant_sheet", ["create:refined_radiance"])
  event.recipes.create.pressing("create:sturdy_sheet","pneumaticcraft:ingot_iron_compressed")
  event.recipes.create.compacting(Fluid.of(('kubejs:sourceberry_juice'), 100), ['ars_nouveau:sourceberry_bush'])
  event.recipes.create.compacting(Fluid.of(('kubejs:magebloom_juice'), 100), ['ars_nouveau:magebloom'])
})
