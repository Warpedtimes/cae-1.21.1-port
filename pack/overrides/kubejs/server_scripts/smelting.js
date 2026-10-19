ServerEvents.recipes(event => {
  event.smelting('minecraft:quartz', 'kubejs:quartz_cluster')
  event.smelting('ae2:certus_quartz_crystal', 'kubejs:certus_quartz_seed_cluster')
  event.smelting('minecraft:obsidian', 'create:powdered_obsidian')
  if (CAE_THERMAL) { // 1211: thermal
    event.smelting('cae:invar_ingot', 'cae:invar_dust')
  }
  event.smelting("minecraft:redstone","kubejs:redstone_cluster")
  event.smoking('pneumaticcraft:printed_circuit_board', 'kubejs:cleaned_pcb')
})
