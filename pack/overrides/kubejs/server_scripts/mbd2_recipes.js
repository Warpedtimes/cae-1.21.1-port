// priority: 0
// mbd2_recipes.js: the recipes of the 1.18.2 Multiblocked recipe maps (original/overrides/multiblocked/recipe_map)
// and of the Custom Machinery quest station, as Multiblocked2 recipes. The recipe types are registered in
// startup_scripts/mbd2_machines.js. Notes and the old -> new mapping: see the port's MBD2 notes.
// 1211: MBD2 21.1.2 registers a recipe schema for every MBD recipe type (MBDKubeJSPlugin.registerRecipeSchemas), so
// event.recipes.<namespace>.<type>() still works; MBDRecipeSchema.MBDRecipeJS has the same builder methods as before
// (inputItems/outputItems/inputFluids/outputFluids/inputFE/outputFE/inputStress/outputEntities/perTick/chance/slotName/
// biome/duration). Item and fluid arguments are SizedIngredient/SizedFluidIngredient now; KubeJS 7 converts '3x mod:item'
// strings and Fluid.of(...) for those.

// Quest station recipes need a machine called quests:quest_station that has the item slots task_slot, card_slot,
// input1..input4, output1..output4 (and energy). It is registered (with a GUI) by startup_scripts/mbd2_machines.js.
let MBD2_QUEST_STATION_RECIPES = true

ServerEvents.recipes(event => {
  let R = event.recipes
  let errText = e => {
    try { return String(e) } catch (x) {}
    try { return String(e.message) } catch (x) {}
    return '(unprintable error)'
  }
  let fail = (what, e) => console.error('[mbd2] recipe ' + what + ' failed: ' + errText(e))

  // ---- cae:arcanereactor (map "arcanreeactor") ---------------------------------------------------------------
  try {
    let items = ['kubejs:sourcegem_fragments', 'forbidden_arcanus:eternal_stella']
    // port: tiab (Time in a Bottle) has no 1.20.1 build; the recipe asks for it again once the core mod adds it
    // 1211: tiab:time_in_a_bottle is the core mod's; the check below keeps the recipe out if it ever goes
    if (Item.exists('tiab:time_in_a_bottle')) items.unshift('tiab:time_in_a_bottle')
    if (items.length == 3) {
      R.cae.arcanereactor()
        .id('cae:arcanereactor/memory_essence')
        .duration(500)
        .inputItems(items)
        .outputFluids([Fluid.of('pneumaticcraft:memory_essence', 6000), Fluid.of('cae:lst', 1000)])
        .outputFE(320000)
    } else {
      console.warn('[mbd2] cae:arcanereactor recipe skipped: tiab:time_in_a_bottle does not exist in this pack')
    }
  } catch (e) { fail('cae:arcanereactor', e) }

  // ---- cae:assemb (advanced assembly) -------------------------------------------------------------------------
  try {
    R.cae.assemb().id('cae:assemb/legend_pcb').duration(290)
      .inputItems('12x kubejs:pcb_assembly_2').outputItems('36x kubejs:legend_pcb')
      .perTick(b => b.inputFE(1000))
    R.cae.assemb().id('cae:assemb/source_fragments').duration(290)
      .inputItems('2x ars_nouveau:source_gem').outputItems('kubejs:sourcegem_fragments')
      .chance(0.6, b => b.outputItems('kubejs:sourcegem_fragments'))
      .perTick(b => b.inputFE(2000))
    R.cae.assemb().id('cae:assemb/mystery_pcb').duration(290)
      .inputItems('7x kubejs:untested_pcb').outputItems('7x kubejs:mystery_pcb')
      .perTick(b => b.inputFE(1000))
    R.cae.assemb().id('cae:assemb/empty_pcb').duration(290)
      .inputItems('12x kubejs:pcb_assembly').outputItems('36x pneumaticcraft:empty_pcb')
      .perTick(b => b.inputFE(1000))
  } catch (e) { fail('cae:assemb', e) }

  // ---- cae:stc (Singularity Tank Chamber, map e74b5f1f-...) -------------------------------------------------
  try {
    R.cae.stc().id('cae:stc/god_actuation_fluid').duration(2000)
      .inputFluids([
        Fluid.of('kubejs:source_essence', 512000), Fluid.of('kubejs:ice_essence', 512000),
        Fluid.of('kubejs:dry_essence', 512000), Fluid.of('kubejs:soul_essence', 512000),
        Fluid.of('kubejs:nature_essence', 512000)
      ])
      .outputItems('kubejs:god_actuation_fluid_bucket')
  } catch (e) { fail('cae:stc', e) }

  // ---- essence extractor (map essence_extractor) and the unused copy "thething" ------------------------------
  let essences = [
    ['kubejs:nature_essence', 'kubejs:soul_essence', 'cae:soul_forest'],
    ['kubejs:dry_essence', 'kubejs:nature_essence', 'cae:arcane_plains'],
    [null, 'kubejs:source_essence', 'cae:source_valley'],
    ['kubejs:source_essence', 'kubejs:ice_essence', 'cae:arcane_snow'],
    ['kubejs:ice_essence', 'kubejs:dry_essence', 'cae:arcane_desert']
  ]
  essences.forEach((e, i) => {
    try {
      ;[['essence_extractor', 5], ['thething', 120]].forEach(m => {
        let r = R.cae[m[0]]().id('cae:' + m[0] + '/' + i).duration(m[1])
        if (e[0] != null) r.inputFluids(Fluid.of(e[0], 3))
        r.outputFluids(Fluid.of(e[1], 10)).biome(e[2])
      })
    } catch (err) { fail('essence ' + e[1], err) }
  })

  // ---- cae:oil (oil pump and oil tower) ------------------------------------------------------------------------
  try {
    // 1024 su of stress per tick while it runs; the stress port gives 16 su per rpm, so 64 rpm
    R.cae.oil().id('cae:oil/crude_oil').duration(100)
      .inputFluids(Fluid.of('kubejs:sky_solution', 100))
      // 1211: thermal (pneumaticcraft:oil fluid id stays until the Thermal replacement is decided)
      .perTick(b => b.inputStress(1024).outputFluids(Fluid.of('pneumaticcraft:oil', 20)))
  } catch (e) { fail('cae:oil', e) }

  // ---- cae:particleaccelerator ---------------------------------------------------------------------------------
  try {
    R.cae.particleaccelerator().id('cae:particleaccelerator/essentialorb').duration(160)
      .inputItems('pneumaticcraft:spawner_core')
      .outputEntities('1x cae:essentialorb')
      .perTick(b => b.inputFE(500))
  } catch (e) { fail('cae:particleaccelerator', e) }

  // cae:nothing (map "nothing", one empty 1000 tick recipe) has no recipes: nothing uses it

  // ---- quests:quest_station (Custom Machinery in 1.18.2) ----------------------------------------------------
  if (!MBD2_QUEST_STATION_RECIPES) return
  let taskCost = 8 // same value as tasks.js
  let capitalize = s => s.split(/[ _]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  let count = 0
  let add = (what, fn) => {
    try { fn(); count++ } catch (e) { if (count == 0) fail('quests:quest_station ' + what, e) }
  }
  let station = () => R.quests.quest_station()

  // hand in a task item plus the requested goods, get silver coins
  ;(global.questLists || []).forEach(array => {
    if (array[0] == undefined) return
    let identifier = 0
    array[0].forEach(element => {
      identifier++
      let n = identifier
      add('task ' + array[1] + ' #' + n, () => {
        let silverOutput = Math.round(element[0][1] * element[1][0] + element[1][1])
        let itemAmount = Math.round(element[0][2] * element[1][0])
        // 1211: item NBT is data components now. The task item carries its number in minecraft:custom_data; this string
        // is a data-component ingredient (non-strict: custom_data must equal {identifier:n}, other components such as the
        // name are ignored). tasks.js has to create the stack with exactly that custom data. The identifier must be a BYTE
        // tag on the item: the recipe goes through JSON and comes back with the number narrowed to a byte (DFU JsonOps), and
        // NBT equality is type-strict. tasks.js's loot entry uses NBT.b(identifier).
        let task = '1x ' + array[1] + '[custom_data={identifier:' + n + '}]'
        // 1211: thermal (cae:silver_coin stays until the Thermal replacement is decided)
        station().id('quests:quest_station/task/' + array[1].replace(/^.*:/, '') + '_' + n).duration(20)
          .slotName('task_slot', b => b.inputItems(task))
          .inputItems(itemAmount + 'x ' + element[0][0].toLowerCase().replace(/ /g, '_'))
          .outputItems(silverOutput + 'x cae:silver_coin', taskCost + 'x cae:silver_coin')
          .perTick(b => b.inputFE(1000 / 20))
      })
    })
  })

  // trades: a trade card in card_slot (not used up) turns the input into the output
  for (let i = 0; i < (global.trades || []).length; i++) {
    let card = Item.of('trade:trade_card_' + global.trades[i])
    ;(global.transactions[i] || []).forEach((trade, j) => {
      add('trade ' + global.trades[i] + ' #' + j, () => {
        let input = trade.in.includes('x ') ? trade.in : '1x ' + trade.in
        let output = trade.out.includes('x ') ? trade.out : '1x ' + trade.out
        station().id('quests:quest_station/trade/' + global.trades[i] + '_' + j).duration(20)
          .chance(0, b => b.slotName('card_slot', c => c.inputItems(card)))
          .slotName('input1', b => b.inputItems(input))
          .slotName('output1', b => b.outputItems(output))
          .perTick(b => b.inputFE(1000 / 20))
      })
    })
  }

  // buy a task: an import card (not used up) and silver coins give the task item
  ;(global.questLists || []).forEach(array => {
    add('task import ' + array[1], () => {
      let task = array[1]
      let taskImport = Item.of(task.replace(/^.*:/, 'trade:').concat('_import'))
      // port: the 1.18.2 recipe also rolled a loot table for the task's identifier (lootTableOutput); MBD2 has no
      // equivalent, so the plain task item is the output
      station().id('quests:quest_station/buy/' + task.replace(/^.*:/, '')).duration(20)
        .chance(0, b => b.slotName('task_slot', c => c.inputItems(taskImport)))
        .inputItems(taskCost + 'x cae:silver_coin') // 1211: thermal
        .outputItems(task)
        .perTick(b => b.inputFE(1000 / 20))
    })
  })
  console.log('[mbd2] quest station recipes added: ' + count)
})
