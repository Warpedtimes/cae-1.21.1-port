// mbd2_lang.js: names for the Multiblocked2 ports and recipe types added by startup_scripts/mbd2_machines.js.
// (The 18 old controllers keep the names they already have in assets/cae/lang and assets/kubejs/lang.)
// 1211: unchanged. KubeJS 7's ClientEvents.lang(lang, event) and event.add(namespace, key, value) are the same, and MBD2 21.1
// still names recipe types with Component.translatable(id.toLanguageKey("recipe_type")) = "recipe_type.<ns>.<path>".
ClientEvents.lang('en_us', event => {
  let names = {
    'block.cae.item_input_hatch': 'Item Input Hatch',
    'block.cae.item_output_hatch': 'Item Output Hatch',
    'block.cae.fluid_input_hatch': 'Fluid Input Hatch',
    'block.cae.fluid_output_hatch': 'Fluid Output Hatch',
    'block.cae.huge_fluid_input_hatch': 'Huge Fluid Input Hatch',
    'block.cae.energy_input_hatch': 'Energy Input Hatch',
    'block.cae.energy_output_hatch': 'Energy Output Hatch',
    'block.cae.entity_output_hatch': 'Entity Output Hatch',
    'block.cae.create_input': 'Stress Input Port',
    'block.cae.energyout': 'Energy Output Port',
    'block.cae.pressurecontainer': 'Pressure Container',
    'block.cae.stc': 'Singularity Tank Chamber',
    'block.cae.oilpump': 'Oil Pump',
    'block.cae.oiltower': 'Oil Tower',
    'block.cae.start': 'Starting Point',
    'block.cae.end_port': 'End Port',
    'block.cae.void': 'Void Altar',
    // 1211: the 1.18.2 Custom Machinery machine was named in its JSON ("name": "Quest Station"); MBD2 names blocks by key
    'block.quests.quest_station': 'Quest Station',
    'recipe_type.cae.arcanereactor': 'Arcane Reactor',
    'recipe_type.cae.assemb': 'Advanced Assembly',
    'recipe_type.cae.essence_extractor': 'Essence Extractor',
    'recipe_type.cae.oil': 'Oil',
    'recipe_type.cae.particleaccelerator': 'Particle Accelerator',
    'recipe_type.cae.stc': 'Singularity Tank Chamber',
    'recipe_type.quests.quest_station': 'Quest Station'
  }
  Object.keys(names).forEach(k => event.add('cae', k, names[k]))
})
