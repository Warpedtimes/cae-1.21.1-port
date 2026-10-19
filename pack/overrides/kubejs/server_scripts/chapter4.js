//most stuff from ch4 isnt here but it is what it is
ServerEvents.recipes(event => {
  let r = 3;
    event.recipes.create.compacting('kubejs:dryed_board_stack', r+'x kubejs:dryed_board')
    event.recipes.create.compacting('kubejs:separated_board_stack', r+'x kubejs:separated_board')
    event.custom({
        "type": "pneumaticcraft:assembly_drill",
        "input": {
          "item": "kubejs:pcb_assembly"
        },
        "result": {
          "id": "pneumaticcraft:empty_pcb", // port (1.21.1): PneumaticCraft 8 results are item stacks ({id, count})
          "count": r
        },
        "program": "drill"
      })
      event.custom({
        "type": "pneumaticcraft:assembly_laser",
        "input": {
          "item": "kubejs:pcb_assembly_2"
        },
        "result": {
          "id": "kubejs:legend_pcb",
          "count": r
        },
        "program": "laser"
      })
    event.recipes.create.deploying('kubejs:pcb_assembly_2', ['kubejs:dryed_board_stack', 'pneumaticcraft:pcb_blueprint'])
    let t = KJ("incomplete_masked_pcb")
    event.recipes.create.sequenced_assembly([
      r+'x kubejs:masked_pcb',
    ], 'kubejs:separated_board_stack', [
      event.recipes.create.deploying(t, [t, 'pneumaticcraft:pcb_blueprint']),
      event.recipes.create.filling(t, [t, Fluid.of("kubejs:green_anthraquinone", 144)])
    ]).transitionalItem(t).loops(1)
    t = KJ("incomplete_pcb_blueprint")
  event.recipes.create.sequenced_assembly([
    '3x pneumaticcraft:pcb_blueprint',
  ], 'create:empty_schematic', [
    event.recipes.create.deploying(t, [t, 'ae2:printed_calculation_processor']),
    event.recipes.create.deploying(t, [t, 'ae2:printed_logic_processor']),
    event.recipes.create.deploying(t, [t, 'ae2:printed_engineering_processor'])
  ]).transitionalItem(t).loops(1)

  t = KJ("incomplete_pcb_assembly")
  event.recipes.create.sequenced_assembly([
    'kubejs:pcb_assembly',
  ], 'pneumaticcraft:plastic', [
    event.recipes.create.deploying(t, [t, 'pneumaticcraft:pcb_blueprint']),
    event.recipes.create.deploying(t, [t, 'create:copper_sheet'])
  ]).transitionalItem(t).loops(1)

  let corundum = ["red", "orange", "yellow", "green", "blue", "indigo", "violet", "white", "black"]
  // 1211: corundum duplication (cluster + 1000 mB water -> 2) is a Create mixing recipe in thermalReplacements.js

  // port: restored. cae:advassembly is now a Multiblocked2 controller registered under the old ID (see the port's MBD2 notes), so its
  // crafting recipe is back; without it the quest and the whole advanced assembler chain were dead.
  event.recipes.create.mechanical_crafting("cae:advassembly", [
    'PZP',
    'DDD',
    'PZP'
  ], {
    P: "kubejs:supercritical_mechanism",
    Z: "kubejs:finalpcb",
    D: "cae:supercritical_casing"
})
})
