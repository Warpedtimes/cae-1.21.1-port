ServerEvents.recipes(event => {
  event.shaped('2x create:belt_connector', [
    '   ',
    'SSS',
    'SSS'
  ], {
    S: 'kubejs:enriched_rubber'
  })
  if (CAE_THERMAL) { // 1211: thermal
    event.shaped('create:belt_connector', [
      '   ',
      'RRR',
      'RRR'
    ], {
      R: 'cae:cured_rubber'
    })
  }
  event.shaped('1x minecraft:chest', [
    'SSS',
    'S S',
    'SSS'
  ], {
    S: '#minecraft:planks'
  })

  event.shaped('3x kubejs:empty_vial', [
    '   ',
    'G G',
    ' G '
  ], {
    G: 'glassential:glass_ghostly'
  })

  if (CAE_THERMAL) { // 1211: thermal
    event.shaped('2x cae:nuke_tnt', [
      'WGW',
      'GOG',
      'WGW'
    ], {
      G: 'ae2:singularity',
      W: 'kubejs:warp_fragments',
      O: 'cae:orb_of_temporary_flight'
    })
    event.shaped('8x cae:nuke_grenade', [
      'WGW',
      'GOG',
      'WGW'
    ], {
      G: 'ae2:singularity',
      W: 'kubejs:warp_fragments',
      O: 'cae:orb_of_temporary_flight'
    })
  }

  event.shaped('kubejs:saw', [
    '  G',
    ' G ',
    'W  '
  ], {
    G: 'minecraft:iron_ingot',
    W: '#minecraft:planks'
  })
  event.shaped('kubejs:resonator', ["R B", "I I", "III"], {R: "minecraft:red_dye", B: "minecraft:blue_dye", I: "minecraft:iron_ingot"})

  //Tyr Samurai Cost change
  if (CAE_THERMAL) {
    event.shaped('samurai_dynasty:master_samurai_chestplate', [
      'GSG',
      'AGA',
      'AAA'
    ], {
      S: 'mekanism:ingot_steel',
      G: 'forbidden_arcanus:golden_dragon_scale',
      A: 'forbidden_arcanus:aquatic_dragon_scale'
    })
  }
})
