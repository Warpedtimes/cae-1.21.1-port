ServerEvents.recipes(event => {
  event.recipes.create.milling(Item.of('3x kubejs:quartz_seed'), 'minecraft:quartz')
  event.recipes.create.milling(Item.of('3x kubejs:redstone_seed'), 'create:rose_quartz')
  // port: ae2:certus_crystal_seed no longer exists in AE2 15; recipe dropped
  // event.recipes.create.milling(Item.of('3x ae2:certus_crystal_seed'), 'ae2:certus_quartz_crystal')
  // 1211: restored with the pack's own seed (startup_scripts/aeSeeds.js), same 3x
  event.recipes.create.milling(Item.of('3x cae:certus_crystal_seed'), 'ae2:certus_quartz_crystal')
  event.recipes.create.milling('4x kubejs:rune_dust', 'forbidden_arcanus:rune')
  event.recipes.create.milling('kubejs:powdered_flint', "minecraft:flint")
  event.recipes.create.milling('minecraft:gravel', "minecraft:mossy_cobblestone")
  event.recipes.create.cutting('ae2:certus_quartz_dust', "ae2:certus_quartz_crystal")
  // 1211: Item.of(x).withChance() is CreateItem.of(item, chance) now
  event.recipes.create.milling(CreateItem.of('minecraft:sand', 0.33), "minecraft:gravel")
  event.recipes.create.milling(['create:powdered_obsidian', CreateItem.of('create:powdered_obsidian', 0.50)],'minecraft:obsidian').processingTime(200)
  if (CAE_THERMAL) { // 1211: thermal
    event.recipes.create.milling('3x cae:blizz_powder', 'cae:blizz_rod')
    event.recipes.create.milling('3x cae:basalz_powder', 'cae:basalz_rod')
    event.recipes.create.milling('3x cae:blitz_powder', 'minecraft:breeze_rod')
  }

    let dumbshit = [ "waystones:waystone",
        "waystones:mossy_waystone",
     "waystones:sandy_waystone" ]
     dumbshit.forEach(i => {
      event.recipes.create.crushing(["5x kubejs:warp_fragments",Item.of("kubejs:warp_fragments")],i)
     })
})
