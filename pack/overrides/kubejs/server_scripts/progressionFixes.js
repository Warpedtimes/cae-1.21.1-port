// Progression fixes (1.21.1 port): recipes that close the gaps tools/recipes_check.py found between the FTB quests and
// what the pack can actually make. See the port's progression notes. KubeJS 7 syntax; ids use the cae:progression/ prefix.
ServerEvents.recipes(event => {
  // ---- Hephaestus Forge: no recipe, as in the original. Chapter M4 asks for forbidden_arcanus:hephaestus_forge_tier_1, which is made the
  // way it always was: build the forge pattern (smithing table in the middle of the Forbidden Arcanus 9x9 pattern, see the pack's ponder)
  // and use Mundabitur Dust (craftable in FA 2.6.1) on the smithing table. FA 2.6.1's MundabiturInteractions registers CreateForgeInteraction,
  // which places hephaestus_forge_tier_1 (verified in the jar).

  // ---- Amethyst Golem Charm: no recipe, as in the original (Ars Nouveau 2.9.0 had none either). Ritual of Awakening performed next to
  // Budding Amethyst turns it into an amethyst golem (ars_nouveau RitualAwakening, still in 5.13.3). The charm item comes from the golem:
  // AmethystGolem.dropCustomDeathLoot drops ars_nouveau:amethyst_golem_charm when it dies, and AmethystGolem.onDispel (Dispel) gives it too.

  // ---- Thermal's hardened glasses (Wither-proof, tag cae:glass/hardened), exactly the original Thermal recipes:
  //  obsidian glass: 1 obsidian + 1 quartz (gem or dust) + 1 sand -> 2 obsidian glass
  //  metal glass:    2 obsidian glass + 1 enderium / lumium / signalum (ingot or dust) -> 2 metal glass
  // (a) crafting: thermal_foundation data/thermal/recipes/fire_charge/*_glass_2.json, with the fire charge replaced by the Forbidden Arcanus
  //     smelter prism (original recipeRemoval.js:23 replaced minecraft:fire_charge in every thermal:fire_charge recipe). In 1.18.2 (FA 2.1.3) the
  //     prism was a plain item and was consumed by the recipe. In FA 2.6.1 it has durability 200 and is still consumed whole by a normal recipe;
  //     that is kept as the original behaviour (1211 substitute: none, the prism is simply used up).
  // (b) the induction smelter recipes (same inputs, no prism, 4800 RF, thermal smelter_glass_*.json) become Create mixing, superheated like the
  //     port's other induction-smelter alloys in thermalReplacements.js (signalum, lumium, enderium). 1211 substitute: the heat level, 4800 RF has
  //     no Create equivalent.
  const PRISM = 'forbidden_arcanus:smelter_prism'
  let quartzForms = [['gem', '#c:gems/quartz'], ['dust', '#c:dusts/quartz']]
  quartzForms.forEach(q => {
    event.shapeless(Item.of('cae:obsidian_glass', 2), ['#c:obsidians/normal', q[1], '#c:sands', PRISM])
      .id('cae:progression/obsidian_glass_crafting_quartz_' + q[0])
    event.recipes.create.mixing(Item.of('cae:obsidian_glass', 2), [Ingredient.of('#c:obsidians/normal'), Ingredient.of(q[1]), Ingredient.of('#c:sands')])
      .superheated().id('cae:progression/obsidian_glass_mixing_quartz_' + q[0])
  })
  let glassMetals = ['enderium', 'lumium', 'signalum']
  glassMetals.forEach(m => {
    let forms = [['ingot', '#c:ingots/' + m], ['dust', '#c:dusts/' + m]]
    forms.forEach(f => {
      event.shapeless(Item.of('cae:' + m + '_glass', 2), ['cae:obsidian_glass', 'cae:obsidian_glass', f[1], PRISM])
        .id('cae:progression/' + m + '_glass_crafting_' + f[0])
      event.recipes.create.mixing(Item.of('cae:' + m + '_glass', 2), [Ingredient.of('cae:obsidian_glass'), Ingredient.of('cae:obsidian_glass'), Ingredient.of(f[1])])
        .superheated().id('cae:progression/' + m + '_glass_mixing_' + f[0])
    })
  })

  // ---- chapter6.js lets you right click a placed kubejs:source_time_crystal for archwood saplings and a 2% chance of another
  // crystal, but the only way to get the first kubejs:source_time_crystal was that same block (circular), and the cae:source_time_crystal
  // that a time crystal dropped into Source places had no drop. Same interaction on the cae block (empty hand, like chapter6.js).
  const chance = (id, c) => ({ type: 'drop_item', id: id, if: { type: 'chance', chance: c } })
  event.custom({
    type: 'lychee:block_interacting',
    item_in: {},
    block_in: 'cae:source_time_crystal',
    post: [
      chance('ars_nouveau:blue_archwood_sapling', 0.05),
      chance('ars_nouveau:green_archwood_sapling', 0.05),
      chance('ars_nouveau:purple_archwood_sapling', 0.05),
      chance('ars_nouveau:red_archwood_sapling', 0.05),
      chance('kubejs:source_time_crystal', 0.02)
    ]
  }).id('cae:progression/source_time_crystal_interaction')
})
