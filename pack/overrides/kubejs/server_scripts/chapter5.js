ServerEvents.recipes(event => {
    event.remove({id: 'pneumaticcraft:spawner_core_shell'})
    // port: dropped event.remove for beyond_earth:fuel_refining/fuel_from_oil (Beyond Earth has no 1.20.1 pack mod)
    event.remove({id: 'forbidden_arcanus:dark_nether_star'})
    event.remove({id: 'cae:ender_tnt'}) // 1211: thermal
    event.recipes.create.haunting('forbidden_arcanus:dark_nether_star','minecraft:nether_star')
    // port (1.21.1): ItemStack.withChance() throws on 1.21; KubeJS Create's CreateItem.of(stack, chance) is the replacement
    event.recipes.create.haunting(CreateItem.of('cae:ender_tnt',0.65),'minecraft:tnt') // 1211: thermal
    event.recipes.create.mixing([Fluid.of('kubejs:portal_actuation_fluid',1),'pneumaticcraft:spawner_core_shell'],[Fluid.of('pneumaticcraft:gasoline',1000),Fluid.of('pneumaticcraft:diesel',800), 'cae:orb_of_temporary_flight']).superheated()
    event.shaped('pneumaticcraft:spawner_core_shell', [
        'NBN',
        'BSB',
        'NBN'
      ], {
        S: 'forbidden_arcanus:dark_nether_star',
        N: 'minecraft:netherite_scrap',
        B: 'forbidden_arcanus:eternal_stella'
      })
      // port: restored. cae:arcanereactor is now a Multiblocked2 controller registered under the old ID (see the port's MBD2 notes)
      event.recipes.create.mechanical_crafting("cae:arcanereactor", [
        'PZP',
        'ZZZ',
        'PZP'
      ], {
        P: "forbidden_arcanus:eternal_stella",
        Z: "kubejs:finalpcb"
    })
    // port: Spirit is gone; Forbidden & Arcanus' spawner scrap (what a broken spawner leaves) takes its broken spawner's place.
    event.recipes.create.mechanical_crafting("cae:particle_accelerator", [
      'PZP',
      'ZZZ',
      'PZP'
    ], {
      P: "forbidden_arcanus:spawner_scrap",
      Z: "kubejs:finalpcb"
  })

    event.custom({
        "type": "pneumaticcraft:explosion_crafting",
        "input": {
          "item": "forbidden_arcanus:rune"
        },
        "loss_rate": 30,
        "results": [
          {
            "id": "forbidden_arcanus:corrupti_dust" // port (1.21.1): PneumaticCraft 8 results are item stacks ({id, count})
          }
        ]
      })
      event.custom({
        "type": "pneumaticcraft:explosion_crafting",
        "input": {
          "item": "ae2:matter_ball"
        },
        "loss_rate": 20,
        "results": [
          {
            "id": "forbidden_arcanus:dark_matter"
          }
        ]
      })
    event.recipes.create.crushing([CreateItem.of('ae2:singularity',0.30)],'create:crushing_wheel') // 1211: was '2x' (Create 0.5 ignored ingredient counts; Create 6 crushing takes exactly one ingredient)
})
LevelEvents.tick(event => {
  // port: no '@e[type=...]' selector in KubeJS 6; filter level.entities
  event.level.entities.forEach(Orb => {
    if (String(Orb.type) != 'cae:essentialorb') return
    // port: the core mod's orb saves "kubejsdoshit" as a boolean in its own NBT (EssentialOrb.addAdditionalSaveData). On 1.21.1
    // that is still the entity's own saved data, not the cae:properties attachment, so Entity.nbt (saveWithoutId) still has it.
    let orbNbt = Orb.nbt
    if (orbNbt.getBoolean('kubejsdoshit')){
      Orb.block.popItem('cae:orb_of_temporary_flight')
      Orb.discard()
      return
    }
    // 1211: the core mod's orb advances from stage 1 to 2 when a "thermal:ender_tnt" entity is next to it, and there is no
    // Thermal on 1.21.1 (cae:ender_tnt is a KubeJS item; thermalReplacements.js lights it as a vanilla primed TNT tagged
    // cae_ender). The core mod cannot be changed, so do its stage-1 step here, through the orb's saved data (what
    // EssentialOrb.nextStage(250) does): same box as the core mod (block pos -2..+3 / -1..+2 / -2..+3), the TNT is removed.
    if (orbNbt.getInt('Stage') == 1) {
      let bx = Math.floor(Orb.x), by = Math.floor(Orb.y), bz = Math.floor(Orb.z)
      let hit = false
      event.level.entities.forEach(tnt => {
        if (hit || String(tnt.type) != 'minecraft:tnt' || !tnt.tags.contains('cae_ender')) return
        if (tnt.x >= bx - 2 && tnt.x <= bx + 3 && tnt.y >= by - 1 && tnt.y <= by + 2 && tnt.z >= bz - 2 && tnt.z <= bz + 3) {
          hit = true
          tnt.discard()
        }
      })
      if (hit) Orb.mergeNbt('{Stage:2,TimeTillDETH:250}')
    }
  });
})
//todo: fix the Liquid resent
