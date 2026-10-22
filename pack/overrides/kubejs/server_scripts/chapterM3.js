// port: Forbidden Arcanus 1.20.1 renamed arcane_gold_* to deorum_* and dark_soul to soul
ServerEvents.recipes(event => {
    event.remove({id: 'create:haunting/soul_sand'})
    event.remove({id: 'forbidden_arcanus:blasting/arcane_crystal_dust_from_blasting'})
    event.remove({id: 'forbidden_arcanus:smelting/arcane_crystal_dust_from_smelting'})
    event.remove({id: 'forbidden_arcanus:aureal_bottle'})
    event.remove({id: 'tiab:time_in_a_bottle'}) // 1211: tiab is back (core mod), the original removed its stock recipe
    event.remove({id: 'forbidden_arcanus:deorum_ingot'})
    event.remove({id: 'forbidden_arcanus:mundabitur_dust'})
    event.remove({id: 'create:splashing/soul_sand'})
    // port (1.21.1): ItemStack.withChance() throws on 1.21; CreateItem.of(stack, chance) (KubeJS Create) replaces it
    event.recipes.create.splashing([Item.of('minecraft:quartz',2),CreateItem.of('minecraft:gold_nugget',0.69)],'minecraft:soul_sand')
    event.remove({output: 'forbidden_arcanus:arcane_crystal'})
    event.remove({output: 'cae:corrupted_pixie'})
    event.recipes.create.haunting('forbidden_arcanus:soulless_sand',Ingredient.of('#c:sands')) // port (1.21.1): forge:sand -> c:sands
    // port: pixie_utrem_jar is both an item and a fluid ID in 1.20.1, so items are spelled out as Item.of here.
    // port: ...but cae:pixie / corrupted_pixie_utrem_jar are not registered items in FA 1.20.1
    // (the 1.20.1 item list has only pixie, corrupted_pixie and utrem_jar), so the emptying and splashing recipes
    // below were loaded as nothing. They now use the pixie items themselves (see the port's progression notes).
    // 1211: the original emptied a Pixie Utrem Jar and gave the jar back; with no jar going in, giving one out made Utrem Jars for free
    event.recipes.create.emptying([Fluid.of('kubejs:aureal_essence', 723)], Item.of('cae:pixie'))
    event.recipes.create.emptying([Fluid.of('kubejs:aureal_essence', 333), Item.of('kubejs:empty_vial')], Item.of('forbidden_arcanus:aureal_bottle'))
    event.recipes.create.splashing(Item.of('cae:pixie'), Item.of('cae:corrupted_pixie'))
    event.recipes.create.crushing(Item.of('forbidden_arcanus:arcane_crystal_dust_speck', 50), 'forbidden_arcanus:arcane_crystal_obelisk')
    event.recipes.create.haunting('forbidden_arcanus:darkstone','minecraft:blackstone')
    // port: dark_soul is gone in 1.20.1 (now plain soul); dropped its remove and soul-from-haunting recipes
    event.recipes.create.deploying('cae:corrupted_pixie', ['forbidden_arcanus:soul', 'forbidden_arcanus:arcane_crystal_dust'])
    event.recipes.create.filling('forbidden_arcanus:aureal_bottle', ['kubejs:empty_vial', Fluid.of('kubejs:aureal_essence', 333)])
    event.recipes.create.mixing('forbidden_arcanus:mundabitur_dust', ['forbidden_arcanus:arcane_crystal_dust','quark:soul_bead'])
    event.recipes.create.mixing('forbidden_arcanus:deorum_ingot', [Item.of('minecraft:gold_nugget', 9),'forbidden_arcanus:mundabitur_dust'])
    event.smelting('forbidden_arcanus:arcane_crystal_dust', '#forbidden_arcanus:arcane_crystal_ores')
    //todo:e +remove nipas entirely +redo mundabitur recipe +  soul recipe + remove serene seasons + soulsand info/ponder + remove aureal bottles from dungeons
    let t = 'forbidden_arcanus:arcane_crystal_dust_speck'
    event.recipes.create.sequenced_assembly([
      'forbidden_arcanus:arcane_crystal',
    ], t, [
    event.recipes.create.filling(t, [t, Fluid.of("kubejs:aureal_essence", 16)]),
    event.recipes.create.pressing(t, t),
    event.recipes.create.filling(t, [t, Fluid.of("kubejs:aureal_essence", 16)]),
    event.recipes.create.pressing(t, t)
    ]).transitionalItem(t).loops(2)

    // port: tiab (Time in a Bottle) now lives in our core mod (tiab:time_in_a_bottle exists again), so the Create
    // sequenced assembly is back; without it nothing made the item and the cae:arcanereactor / lst chain was dead.
    // The Ars Nouveau apparatus recipe below is the original's second way to make it.
    t = 'forbidden_arcanus:aureal_bottle'
    event.recipes.create.sequenced_assembly([
      'tiab:time_in_a_bottle',
    ], t, [
    event.recipes.create.deploying(t, [t, 'forbidden_arcanus:arcane_crystal']),
    event.recipes.create.deploying(t, [t, 'kubejs:sourcegem_fragments']),
    event.recipes.create.deploying(t, [t, 'forbidden_arcanus:deorum_nugget']),
    event.recipes.create.deploying(t, [t, 'forbidden_arcanus:deorum_nugget']),
    event.recipes.create.filling(t, [t, Fluid.of("kubejs:source", 144)]),
    event.recipes.create.pressing(t, t)
    ]).transitionalItem(t).loops(1)
    event.recipes.create.crushing(CreateItem.of('kubejs:sourcegem_fragments', 0.4), 'ars_nouveau:source_gem')

    // 1211: Ars Nouveau 5.13.3 format (see data/ars_nouveau/recipe/potion_diffuser.json): reagent is a single ingredient,
    // pedestalItems plain ingredients, "result" is {id, count} (was "output": {item}), sourceCost and keepNbtOfReagent as before.
    // The original had this alongside the Create sequenced assembly above; both are kept.
    event.custom({
      "type": "ars_nouveau:enchanting_apparatus",
      "reagent": {
        "item": "forbidden_arcanus:aureal_bottle"
      },
      "pedestalItems": [
        {
          "item": "forbidden_arcanus:arcane_crystal"
        },
        {
          "item": "kubejs:sourcegem_fragments"
        },
        {
          "item": "forbidden_arcanus:deorum_nugget"
        },
        {
          "item": "forbidden_arcanus:deorum_nugget"
        }
      ],
      "result": {
        "count": 1,
        "id": "tiab:time_in_a_bottle"
      },
      "sourceCost": 2000,
      "keepNbtOfReagent": false
    })
})

BlockEvents.rightClicked(event =>{
  if (event.block.id == 'minecraft:soul_sand' && event.item.id == "forbidden_arcanus:soul_extractor") {
      event.block.set('forbidden_arcanus:soulless_sand')
      event.block.popItemFromFace("forbidden_arcanus:soul", "up")
  }
})
// port: no '@e[type=...]' selector in KubeJS 6; filter level.entities. 1211: every dimension, once a second each: the
// 1.18.2 handler ticked in the overworld, but its position-less selector found wraiths in every dimension (they spawn in
// soul sand valleys). The sand under the wraith counts too, not only the block at its feet.
LevelEvents.tick(event =>{
  if (event.level.time % 20 != 0) {return}
  event.level.entities.forEach(Wraith =>{
    if (String(Wraith.type) != 'quark:wraith') return
    let sand = Wraith.block.id == 'forbidden_arcanus:soulless_sand' ? Wraith.block : Wraith.block.down
    if (sand.id == 'forbidden_arcanus:soulless_sand'){
      sand.set('minecraft:soul_sand')
      event.server.runCommandSilent(`execute in ${event.level.dimension} run playsound cae:wraith_soulconvert block @a ${sand.x} ${sand.y} ${sand.z}`)
    }
  })
})
