// 1211: JEIEvents.hideItems / hideFluids are now RecipeViewerEvents.removeEntries('item' | 'fluid', event => event.remove(filter)).
// (removeEntries only hides; removeEntriesCompletely would also drop them from the recipes. Hide is what JEIEvents.hide did.)
// Filters are the usual KubeJS ones (ids, #tags, /regex/), see ItemPredicate.wrap.
RecipeViewerEvents.removeEntries('item', event => {
  // Ids of items that do not exist (yet) are skipped instead of throwing, many of these are thermal/tinkers items.
  let hide = (filter) => {
    if (typeof filter === 'string' && filter.charAt(0) != '#' && !Item.exists(filter)) return
    event.remove(filter)
  }
  let removalObj = {
    Shafts: ["birch","oak","spruce","jungle","acacia","dark_oak","crimson","warped","glass","brass"]
    }
    removalObj.Shafts.forEach(mixer => {
      hide(`createcasing:${mixer}_shaft`)
})
    hide('beyond_earth:iron_plate')
    hide('create:tree_fertilizer')
    hide('create:tree_fertilizer')
    hide('mekanism:dust_bronze') // 1211: thermal
    ;['ingot_bronze', 'nugget_bronze', 'block_bronze'].forEach(b => hide('mekanism:' + b)) // 1211: the pack has no bronze (compatRecipes.js removes the Mekanism recipes)
    hide('cae:copper_gear') // 1211: thermal
    hide('create_sa:hydraulic_engine')
    hide('create_sa:steam_engine')
    hide('create_sa:heat_engine')
    // 1211: Thermal's gems/dusts; anchored to its namespace so another mod's cinnabar or apatite isn't hidden too
    event.remove(/^thermal:.*cinnabar/)
    event.remove(/^thermal:.*niter/)
    event.remove(/^thermal:.*apatite/)
    hide('ae2:facade') // port: was appliedenergistics2:facade with ignoreNBT
    hide('alloyed:bronze_sheet') // 1211: thermal
    hide('cae:bronze_coin') // 1211: thermal
    hide('integrateddynamics:logic_director')
    hide('functionalstorage:ender_drawer')
    event.remove(/^functionalstorage:fluid/)
    event.remove(/waystones\:.*sharestone/)
    event.remove(/waystone\:.*scroll/)
    hide("waystones:warp_plate")
    event.remove(/integrateddynamics\:part.*porter_world/)
    event.remove(/integratedtunnels\:part.*porter_world/)
    hide("integratedtunnels:part_player_simulator")
    hide("integrateddynamics:part_connector_omni_directional")
    hide("integratedterminals:terminal_storage_portable")
    // 1211: both items exist in 1.21.1 (item.txt), hides restored
    hide('integratedcrafting:part_interface_crafting')
    hide('integratedcrafting:part_crafting_writer')
    // 1211: the stage items (gameStages.js shows them again when the server says a stage is reached). A /reload rebuilds this
    // list, which hid them again until the next login; the player's stages (KubeJS syncs them to the client) are checked
    // here, so the items of a reached stage stay visible
    let reached = (stage) => {
      try { return Client.player != null && Client.player.stages.has(stage) } catch (e) { return false }
    }
    if (!reached('arcane_crafting')) {
      hide('kubejs:god_actuation_fluid_bucket')
      hide('kubejs:source_essence_bucket')
      hide('kubejs:soul_essence_bucket')
      hide('kubejs:dry_essence_bucket')
      hide('kubejs:nature_essence_bucket')
      hide('kubejs:ice_essence_bucket')
    }
    if (!reached('keystone_crafting')) {
      hide('cae:source_keystone')
      hide('cae:soul_keystone')
      hide('cae:dry_keystone')
      hide('cae:nature_keystone')
      hide('cae:ice_keystone')
    }
    if (!reached('zyzzium')) {
      hide('avaritia:zizz')
      hide('avaritia:zyzzium_ingot')
    }
  })
  RecipeViewerEvents.removeEntries('fluid', event => {
    event.remove('kubejs:source_essence')
    event.remove('kubejs:soul_essence')
    event.remove('kubejs:dry_essence')
    event.remove('kubejs:nature_essence')
    event.remove('kubejs:ice_essence')
    event.remove('kubejs:god_actuation_fluid')
  })
