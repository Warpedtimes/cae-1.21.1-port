ServerEvents.recipes(event => {
  event.shapeless('kubejs:sealed_mechanism', ['2x kubejs:enriched_rubber', '#create:kinetic_mechanisms'])
  if (CAE_THERMAL) { // 1211: thermal
    event.shapeless('kubejs:sealed_mechanism', ['4x cae:cured_rubber', '#create:kinetic_mechanisms'])
  }
  // 1211: forge: tags are c: tags (workbenches -> player_workstations/crafting_tables); corundum_clusters is the pack's own tag (tags.js)
  event.shapeless('3x quark:violet_corundum_cluster', ['3x #c:corundum_clusters', 'kubejs:rune_dust'])
  event.shapeless('minecraft:crafting_table', ['#c:player_workstations/crafting_tables'])
  event.shapeless('minecraft:chest', ['#c:chests/wooden'])
  event.shapeless("createoreexcavation:drill", "pneumaticcraft:drill_bit_iron")
  event.shapeless("ars_nouveau:spell_parchment", "4x ars_nouveau:magebloom_fiber")

  // port: moved above the andesite alloy recipes below, so the removal can't catch them
  event.remove({output: "create:andesite_alloy"})
  // 1211: Create: Metallurgy casts a whole andesite alloy block from 90 mB of molten iron/zinc + 1 andesite (9 alloys)
  event.remove({id: "createmetallurgy:casting_in_basin/andesite_alloy_from_iron"})
  event.remove({id: "createmetallurgy:casting_in_basin/andesite_alloy_from_zinc"})
  event.shapeless("create:andesite_alloy", ["minecraft:diorite", "minecraft:andesite"]).id('cae:coolrecipe_manual_only')
  event.recipes.create.mixing("4x create:andesite_alloy", ["integrateddynamics:crystalized_menril_chunk", "minecraft:andesite"])
  event.shapeless("2x create:andesite_alloy", ["integrateddynamics:crystalized_menril_chunk", "minecraft:andesite"]).id('cae:supa_coolrecipe_manual_only')
  event.recipes.create.mixing("2x create:andesite_alloy", ["minecraft:diorite", "minecraft:andesite"])
  //event.recipes.create.mixing("2x minecraft:andesite", ["minecraft:petrified_oak_slab", "minecraft:moss_block"])
  //event.recipes.create.compacting("3x minecraft:moss_block", ["minecraft:moss_block", Fluid.of('minecraft:water',100)])
  event.replaceInput({id:"createaddition:mixing/netherrack"}, "#c:cobblestones", 'minecraft:ancient_debris')
  // 1211: smelting has no chance output (withChance is gone on 1.21, and the 1.20 recipe serialised a plain result anyway)
  event.smelting("minecraft:andesite","minecraft:gravel")
  // 1211: avaritia:zizz and avaritia:zyzzium_ingot are both registered (item.txt)
  event.shapeless("avaritia:zizz",["7x kubejs:finalpcb","2x avaritia:zyzzium_ingot"])
  // port: ars_nouveau:bucket_of_source no longer exists in Ars Nouveau 4
  // event.shapeless("ars_nouveau:bucket_of_source","kubejs:source_bucket")
  // 1211: ingredients match any components by their plain id, so Item.of(..).ignoreNBT() is just the id; damageIngredient takes a slot filter
  event.shapeless("kubejs:makeshift_kinetic_mechanism", ["2x #c:stripped_logs","kubejs:saw","4x create:andesite_alloy"]).damageIngredient("kubejs:saw")
  const drills = [
    "netherite",
    "diamond"
  ]
  function drill(In) {event.shapeless("createoreexcavation:" + In + "_drill", "pneumaticcraft:drill_bit_" + In)}

  drills.forEach(element => {
      drill(element)
      })

})
