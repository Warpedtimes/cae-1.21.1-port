// priority: 300
let MOD = (domain, id, x) => (x ? `${x}x ` : "") + (id.startsWith('#') ? '#' : "") + domain + ":" + id.replace('#', '')
let AE2 = (id, x) => MOD("ae2", id, x)
let AP = (id, x) => MOD("architects_palette", id, x)
let LV = (id, x) => MOD("libvulpes", id, x)
let CR = (id, x) => MOD("create", id, x)
let MC = (id, x) => MOD("minecraft", id, x)
let KJ = (id, x) => MOD("kubejs", id, x)
function EG(id, x) {
  return MOD("endergetic", id, x)
}
let FD = (id, x) => MOD("farmersdelight", id, x)
let BOP = (id, x) => MOD("biomesoplenty", id, x)
let PR_C = (id, x) => MOD("projectred-core", id, x)
let PR_T = (id, x) => MOD("projectred-transmission", id, x)
let PR_I = (id, x) => MOD("projectred-illumination", id, x)
let RQ = (id, x) => MOD("xreliquary", id, x)
let SD = (id, x) => MOD("storagedrawers", id, x)
let SP = (id, x) => MOD("supplementaries", id, x)
let F = (id, x) => MOD("forge", id, x)
let AC = (id, x) => MOD("aquaculture", id, x)
let PP = (id, x) => MOD("prettypipes", id, x)
let OC = (id, x) => MOD("occultism", id, x)

ServerEvents.tags('item', event => {
  // 1211: forge: -> c: (the pack's own tags, same paths)
  event.add('c:menril_logs', 'integrateddynamics:menril_log_filled')
  event.add('c:menril_logs', 'integrateddynamics:menril_log')
  event.add('c:saws', 'kubejs:saw')
  event.add('c:screwdrivers', 'kubejs:screwdriver')
});

ServerEvents.recipes(event => {
  let t = 'kubejs:incomplete_kinetic_mechanism'
  event.recipes.create.sequenced_assembly([
    'kubejs:kinetic_mechanism',
  ], 'integrateddynamics:menril_slab', [
    event.recipes.create.deploying(t, [t, 'create:andesite_alloy']),
    event.recipes.create.deploying(t, [t, 'create:andesite_alloy']),
    event.recipes.create.deploying(t, [t, Ingredient.of('#c:saws')])
  ]).transitionalItem('kubejs:incomplete_kinetic_mechanism').loops(1)
  
  t = 'minecraft:leather'
  event.recipes.create.sequenced_assembly([
    'minecraft:saddle',
  ], 'minecraft:leather', [
    event.recipes.create.deploying(t, [t, 'minecraft:iron_ingot']),
    event.recipes.create.deploying(t, [t, 'minecraft:iron_ingot'])
  ]).transitionalItem(t).loops(1)

  t = 'minecraft:tall_grass'
  event.recipes.create.sequenced_assembly([
    '2x minecraft:tall_grass',
  ], 'minecraft:tall_grass', [
    event.recipes.create.filling(t, [t, Fluid.of('minecraft:water')])
  ]).transitionalItem(t).loops(200)

t = KJ('quartz_seed')
	// 1211: Item.of(x).withChance(w) is CreateItem.of(x, chance) now, and that clamps to 0..1. In a sequenced assembly the
	// chance is only a weight, so the 30/70 weights became 0.3/0.7 (same ratio).
	event.recipes.create.sequenced_assembly([
		CreateItem.of('kubejs:quartz_cluster', 0.3), CreateItem.of('kubejs:quartz_seed', 0.7),
	], KJ('quartz_seed'), [
		event.recipes.create.filling(t, [t, Fluid.of(KJ("sky_solution"), 50)]),
    event.recipes.create.deploying(t, [t, 'minecraft:sand'])
	]).transitionalItem(t)
		.loops(1)
		.id('minecraft:quartz')

  // port: ae2:certus_crystal_seed no longer exists in AE2 15; the certus seed -> cluster recipe is dropped
  // t = 'ae2:certus_crystal_seed'
  // event.recipes.create.sequenced_assembly([
  // 	Item.of('kubejs:certus_quartz_seed_cluster').withChance(30), Item.of('ae2:certus_crystal_seed').withChance(70),
  // ], 'ae2:certus_crystal_seed', [
  // 	event.recipes.create.filling(t, [t, Fluid.of(KJ("sky_solution"), 50)]),
  //   event.recipes.create.deploying(t, [t, 'minecraft:sand'])
  // ]).transitionalItem(t)
  // 	.loops(1)
  // 	.id('ae2:certus_quartz_crystal')
  // 1211: restored with cae:certus_crystal_seed (startup_scripts/aeSeeds.js); weights 30/70 -> 0.3/0.7 like quartz_seed above
  t = 'cae:certus_crystal_seed'
  event.recipes.create.sequenced_assembly([
  	CreateItem.of('kubejs:certus_quartz_seed_cluster', 0.3), CreateItem.of(t, 0.7),
  ], t, [
  	event.recipes.create.filling(t, [t, Fluid.of(KJ("sky_solution"), 50)]),
    event.recipes.create.deploying(t, [t, 'minecraft:sand'])
  ]).transitionalItem(t)
  	.loops(1)
  	.id('ae2:certus_quartz_crystal')

  t = KJ('redstone_seed')
  event.recipes.create.sequenced_assembly([
  	CreateItem.of('kubejs:redstone_cluster', 0.45), CreateItem.of(t, 0.7) // 1211: weights 45/70 -> 0.45/0.7
  ], t, [
  	event.recipes.create.filling(t, [t, Fluid.of(KJ("sky_solution"), 150)]),
    event.recipes.create.deploying(t, [t, 'minecraft:sand'])
  ]).transitionalItem(t)
  	.loops(1)
  	.id('cae:redstonequartz')


  t = CR('incomplete_precision_mechanism')
  event.recipes.create.sequenced_assembly([
    'create:precision_mechanism',
  ], KJ('kinetic_mechanism'), [
    event.recipes.create.deploying(t, [t, 'create:electron_tube']),
    event.recipes.create.deploying(t, [t, 'create:electron_tube']),
    event.recipes.create.deploying(t, [t, Ingredient.of('#c:screwdrivers')])
  ]).transitionalItem(t).loops(1)

  event.recipes.create.sequenced_assembly([
    'create:precision_mechanism',
  ], KJ('kinetic_mechanism'), [
    event.recipes.create.deploying(t, [t, 'integrateddynamics:variable']),
    event.recipes.create.deploying(t, [t, 'create:electron_tube']),
    event.recipes.create.deploying(t, [t, Ingredient.of('#c:screwdrivers')])
  ]).transitionalItem(t).loops(1)
  t = KJ("incomplete_integrational_mechanism")
  event.recipes.create.sequenced_assembly([
    'kubejs:integrational_mechanism',
  ], CR('precision_mechanism'), [
    event.recipes.create.deploying(t, [t, 'ars_nouveau:source_gem']),
    event.recipes.create.deploying(t, [t, 'kubejs:sourcegem_fragments']),
    event.recipes.create.pressing(t, [t])
  ]).transitionalItem(t).loops(1)

  t = KJ("incomplete_plastic_mechanism")
  event.recipes.create.sequenced_assembly([
    'kubejs:plastic_mechanism',
  ], KJ('radiant_mechanism'), [
    event.recipes.create.deploying(t, [t, Item.of('pneumaticcraft:plastic')]),
    event.recipes.create.filling(t, [t, Fluid.of('pneumaticcraft:plastic',250)]),
    event.recipes.create.pressing(t, [t])
  ]).transitionalItem(t).loops(1)

  t = KJ("incomplete_radiant_mechanism")
  event.recipes.create.sequenced_assembly([
    'kubejs:radiant_mechanism',
  ], 'create:precision_mechanism', [
    event.recipes.create.deploying(t, [t, 'kubejs:radiant_coil']),
    event.recipes.create.deploying(t, [t, 'kubejs:radiant_coil']),
    event.recipes.create.deploying(t, [t, Ingredient.of('#c:resonators')])
  ]).transitionalItem(t).loops(1)


{ // molten_diamond, molten_gold
t = "kubejs:incomplete_engineering_circuit"
event.recipes.create.sequenced_assembly([
  'ae2:printed_engineering_processor',
], 'kubejs:radiant_mechanism', [
  event.recipes.create.filling(t, [t, Fluid.of("cae:molten_diamond", 100)]),
  event.recipes.create.pressing(t,[t])
]).transitionalItem(t).loops(1)

t = "kubejs:incomplete_calculation_circuit"
event.recipes.create.sequenced_assembly([
  'ae2:printed_logic_processor',
], 'create:precision_mechanism', [
  event.recipes.create.filling(t, [t, Fluid.of("createmetallurgy:molten_gold", 90)]),
  event.recipes.create.pressing(t,[t])
]).transitionalItem(t).loops(1)
}

t = "kubejs:incomplete_logic_circuit"
event.recipes.create.sequenced_assembly([
  'ae2:printed_calculation_processor',
], 'kubejs:kinetic_mechanism', [
  event.recipes.create.deploying(t, [t, "ae2:certus_quartz_crystal"]),
  event.recipes.create.pressing(t,[t])
]).transitionalItem(t).loops(1)


{ // molten_nickel, mekanism dust_gold
t = KJ("incomplete_tested_pcb")
event.recipes.create.sequenced_assembly([
  'kubejs:untested_pcb',
], 'kubejs:legend_pcb', [
  event.recipes.create.filling(t, [t, Fluid.of("createmetallurgy:molten_nickel", 90)]),
  event.recipes.create.deploying(t, [t, 'mekanism:dust_gold'])
]).transitionalItem(t).loops(1)
}




event.recipes.create.mixing('architects_palette:ancient_plating_slab',[Ingredient.of('#c:sands'),"forbidden_arcanus:soul","minecraft:red_dye","minecraft:obsidian","minecraft:stone","kubejs:runic_tablet","create:cinder_flour"])
t = 'minecraft:stone'
// 1211: Tinkers' blood slime ball is back under its 1.18.2 ID (startup_scripts/gaps2Content.js)
let netherrackSteps = [
  event.recipes.create.deploying(t, [t, 'minecraft:emerald']),
  event.recipes.create.deploying(t, [t, 'minecraft:slime_ball'])
]
netherrackSteps.push(event.recipes.create.deploying(t, [t, 'tconstruct:blood_slime_ball']))
netherrackSteps.push(
  event.recipes.create.deploying(t, [t, 'minecraft:pink_terracotta']),
  event.recipes.create.deploying(t, [t, 'minecraft:nether_bricks']),
  event.recipes.create.deploying(t, [t, 'minecraft:red_sand']),
  event.recipes.create.deploying(t, [t, 'quark:red_corundum_cluster']),
  event.recipes.create.deploying(t, [t, 'minecraft:soul_sand'])
)
event.recipes.create.sequenced_assembly([
  Item.of('minecraft:netherrack', 12),
  CreateItem.of('8x minecraft:netherrack', 0.666), // 1211: Item.of(x, n).withChance(w) -> CreateItem.of('nx x', w)
  CreateItem.of('6x minecraft:netherrack', 0.33),
  CreateItem.of('4x minecraft:netherrack', 0.215),
  CreateItem.of('2x minecraft:netherrack', 0.075),
], 'architects_palette:ancient_plating_slab', netherrackSteps).transitionalItem(t).loops(1)

});

