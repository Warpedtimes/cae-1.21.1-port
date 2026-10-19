// mbd2_machines.js (startup script): the Multiblocked (1.18.2) machines rebuilt on Multiblocked2 (1.21.1, MBD2 21.1.x on LDLib2).
//
// GENERATED from original/overrides/multiblocked by scratchpad gen_data.py (the MBD_DATA block below), then edited by
// hand. See the port's MBD2 notes for how it works, the ID mapping and what changed, and the machines notes for the
// 1.20.1 -> 1.21.1 class mapping (MBD2 21.1.2, LDLib2 2.2.42).
//
// MBD2 has no data-pack format for machines (the editor writes NBT project files), but it posts a KubeJS startup
// event for them: MBDRegistryEvents.recipeType / MBDRegistryEvents.machine. On 21.1 the builder takes the machine UI
// (ConfigMachineSettings.uiTemplate) directly, so the old "fake editor project" trick is gone: the UI is built in
// StartupEvents.postInit, when the client font exists (LDLib2 text elements measure with it as soon as they are
// created). Multiblock patterns can't be given to the builder (they need Block instances), so they are attached after
// registration in StartupEvents.postInit as well.
//
// If a machine here fails, the log line starts with "[mbd2]".

let MBD_DATA = {"controllers":[
{"id":"cae:advassembly","rot":"NONE","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"multiblock","geo":"advassembly","anim":"advassembly","anims":{"formed":[["idle","LOOP"]],"working":[["working","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true,"unformed":"cae:block/mbd_pog","pattern":{"dir":["BACK","UP","RIGHT"],"layers":[["ABA"," C ","   "," D "],["I@H"," F ","   "," G "],["ABA"," C ","   "," D "]],"syms":{"D":[{"b":["pneumaticcraft:pressure_tube"],"hide":true}],"G":[{"b":["createaddition:tesla_coil"],"hide":true}],"A":[{"b":["cae:enderium_casing"],"hide":true}],"F":[{"b":["pneumaticcraft:assembly_platform"],"hide":true}],"I":[{"h":"item_out"}],"B":[{"h":"energy_in"}],"H":[{"h":"item_in"}],"@":[{"ctrl":true}],"C":[{"b":["kubejs:time_machine"],"hide":true}]," ":[{"any":true}]}},"recipe":"cae:assemb"},
{"id":"cae:arcanereactor","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"multiblock","geo":"arcanereactor","anim":"arcanereactor","anims":{"formed":[["idle","LOOP"]],"working":[["working","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":false,"unformed":"cae:block/mbd_arcanereactor","pattern":{"dir":["BACK","UP","RIGHT"],"layers":[["ABCBA","D   D","D   D","D   D","ABEBA"],["B   B","     ","     ","     ","B   B"],["F @ C","  G  ","  H  ","  G  ","E I E"],["B   B","     ","     ","     ","B   B"],["ABJBA","D   D","D   D","D   D","ABEBA"]],"syms":{"D":[{"b":["kubejs:supercritical_machine"],"hide":true}],"J":[{"b":["integrateddynamics:energy_battery"],"hide":true},{"h":"energy_out","min":true}],"G":[{"b":["forbidden_arcanus:arcane_crystal_block"],"hide":true}],"A":[{"b":["forbidden_arcanus:arcane_polished_darkstone_wall"],"hide":true}],"F":[{"h":"item_in","min":true},{"b":["pneumaticcraft:smart_chest"],"hide":true}],"I":[{"b":["kubejs:time_machine"],"hide":true}],"B":[{"b":["forbidden_arcanus:stellarite_block"],"hide":true}],"H":[{"b":["forbidden_arcanus:arcane_crystal_block"],"hide":true}],"@":[{"ctrl":true}],"C":[{"b":["pneumaticcraft:large_tank"],"hide":true},{"h":"fluid_out","min":true}],"E":[{"b":["minecraft:netherite_block"],"hide":true}]," ":[{"any":true}]}},"recipe":"cae:arcanereactor"},
{"id":"cae:end_port","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":true,"collision":true,"kind":"single","geo":"end","anim":"none","anims":{},"global":true},
{"id":"cae:essence_extractor","rot":"NONE","destroy":1.5,"resist":6.0,"occlude":true,"collision":true,"kind":"multiblock","geo":"fortnite","anim":"fortnite","anims":{"working":[["working","LOOP"]]},"global":true,"unformed":"v:minecraft:block/coarse_dirt","pattern":{"dir":["BACK","UP","RIGHT"],"layers":[[" A ","   "," B ","   "],["A@A"," C ","BDB"," E "],[" A ","   "," B ","   "]],"syms":{"D":[{"b":["forbidden_arcanus:utrem_jar"],"hide":true}],"A":[{"b":["createdeco:industrial_iron_catwalk_stairs"],"hide":true}],"B":[{"b":["createdeco:industrial_iron_bars"],"hide":true}],"@":[{"ctrl":true}],"C":[{"h":"fluid_in","min":true},{"b":["minecraft:netherite_block"],"hide":true}],"E":[{"b":["pneumaticcraft:small_tank"],"hide":true},{"h":"fluid_out","min":true}]," ":[{"any":true}]}},"recipe":"cae:essence_extractor"},
{"id":"cae:oilpump","rot":"NONE","destroy":121212125000.0,"resist":6.0,"occlude":true,"collision":true,"kind":"multiblock","unformed":"v:minecraft:block/iron_block","pattern":{"dir":["FRONT","UP","LEFT"],"layers":[["AAA"," G "," G ","   "],["AAC","   "," D ","   "],["AE@"," D "," D ","   "],["AAA","   "," D "," F "],["AAA"," H "," H ","   "]],"syms":{"D":[{"b":["create:metal_girder"],"hide":false}],"G":[{"h":"fluid_in"}],"A":[{"b":["create:industrial_iron_block"],"hide":false}],"F":[{"b":["minecraft:anvil"],"hide":false}],"H":[{"h":"fluid_out"}],"@":[{"ctrl":true}],"C":[{"h":"create_in"}],"E":[{"b":["minecraft:command_block"],"hide":false}]," ":[{"any":true}]}},"recipe":"cae:oil"},
{"id":"cae:oiltower","rot":"NONE","destroy":20000000.0,"resist":6.0,"occlude":true,"collision":true,"kind":"multiblock","unformed":"v:minecraft:block/iron_block","pattern":{"dir":["FRONT","UP","LEFT"],"layers":[["AFA","A A","A A"," A "," A ","   ","   "],["CD@"," E ","AEA","AEA","AAA"," A "," A "],["AGA","AAA","AAA"," A "," A ","   ","   "]],"syms":{"D":[{"b":["minecraft:command_block"],"hide":false}],"G":[{"h":"fluid_in"}],"A":[{"b":["create:industrial_iron_block"],"hide":false}],"F":[{"h":"fluid_out"}],"@":[{"ctrl":true}],"C":[{"h":"create_in"}],"E":[{"b":["pneumaticcraft:drill_pipe"],"hide":false}]," ":[{"any":true}]}},"recipe":"cae:oil"},
{"id":"cae:particle_accelerator","rot":"NONE","destroy":1.5,"resist":6.0,"occlude":true,"collision":true,"kind":"multiblock","geo":"particle","anim":"particle","anims":{"formed":[["idle","LOOP"]],"working":[["working","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true,"unformed":"cae:block/mbd_particle","pattern":{"dir":["LEFT","UP","BACK"],"layers":[["ABBBA","C   C","C   C","D   D"],["BE EB","     ","     ","     "],["BF@FB","  G  ","  H  ","  I  "],["BEBEB","     ","     ","     "],["ABBBA","C   C","C   C","D   D"]],"syms":{"D":[{"b":["minecraft:wither_skeleton_skull"],"hide":true}],"G":[{"h":"item_in"}],"A":[{"b":["create:shadow_steel_casing"],"hide":true}],"F":[{"b":["minecraft:beacon"],"hide":true}],"I":[{"h":"entity_out"}],"B":[{"b":["minecraft:polished_blackstone_stairs"],"hide":true}],"H":[{"b":["pneumaticcraft:pressurized_spawner"],"hide":true}],"@":[{"ctrl":true}],"C":[{"b":["minecraft:end_rod"],"hide":true}],"E":[{"b":["ae2:controller"],"hide":true}]," ":[{"any":true}]}},"recipe":"cae:particleaccelerator","traits":[{"kind":"energy","name":"energy","io":"IN","capacity":10000000,"receive":10000,"extract":10000}]},
{"id":"cae:portal_core","rot":"NON_Y_AXIS","destroy":20000.0,"resist":6.0,"occlude":true,"collision":true,"kind":"multiblock","geo":"portal","anim":"portal","anims":{"formed":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true,"unformed":"cae:block/mbd_portal","pattern":{"dir":["LEFT","UP","BACK"],"layers":[["@","A"]],"syms":{"A":[{"b":["cae:arcane_portal"],"hide":false}],"@":[{"ctrl":true}]}}},
{"id":"cae:start","rot":"ALL","destroy":121212.0,"resist":6.0,"occlude":true,"collision":true,"kind":"single","geo":"start","anim":"none","anims":{},"global":true},
{"id":"cae:stc","rot":"NONE","destroy":12121212.0,"resist":6.0,"occlude":false,"collision":true,"kind":"multiblock","unformed":"v:minecraft:block/amethyst_block","pattern":{"dir":["LEFT","UP","BACK"],"layers":[["A          ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","     B@B   ","     CDC   ","     BEB   ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","      F    ","    E GHE  ","    IJFHI  ","    E   E  ","           ","           ","           ","           ","           "],["           ","      G    ","      K    ","     JFJ   ","     JGJ   ","   EHLFL E ","   C LLF C ","   E FLH E ","      F    ","      L    ","      L    ","      H    ","           "],["      G    ","     KFG   ","     GGF   ","     FLG   ","     GLFF  ","   ELLMLFE ","NOOILLMLFIO","   EJLML E ","     FLL   ","     JFH   ","     HLH   ","     HL    ","      L    "],["           ","      K    ","      K    ","      G    ","     JFJ   ","   E  FF E ","   CJLLLHC ","   E FLL E ","     JLJ   ","      L    ","      H    ","           ","           "],["           ","           ","           ","           ","           ","    E L E  ","    PJF P  ","    E J E  ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","     BBB   ","     CIC   ","     BBB   ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "],["A          ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           ","           "]],"syms":{"D":[{"h":"item_out"}],"J":[{"b":["minecraft:magenta_stained_glass_pane"],"hide":false}],"G":[{"b":["minecraft:purple_stained_glass"],"hide":false}],"M":[{"b":["minecraft:amethyst_block"],"hide":false}],"A":[{"b":["create:polished_cut_ochrum"],"hide":false}],"L":[{"b":["minecraft:pink_stained_glass"],"hide":false}],"F":[{"b":["minecraft:magenta_stained_glass"],"hide":false}],"I":[{"h":"huge_fluid_in"}],"B":[{"b":["create:polished_cut_ochrum_stairs"],"hide":false}],"H":[{"b":["minecraft:pink_stained_glass_pane"],"hide":false}],"P":[{"b":["forbidden_arcanus:chiseled_arcane_polished_darkstone"],"hide":false}],"K":[{"b":["minecraft:purple_stained_glass_pane"],"hide":false}],"@":[{"ctrl":true}],"O":[{"b":["create:fluid_pipe"],"hide":false}],"N":[{"b":["create:glass_fluid_pipe"],"hide":false}],"C":[{"b":["forbidden_arcanus:polished_darkstone"],"hide":false}],"E":[{"b":["create:polished_cut_ochrum_slab"],"hide":false}]," ":[{"any":true}]}},"recipe":"cae:stc"},
{"id":"cae:void","rot":"ALL","destroy":23131232300.0,"resist":6.0,"occlude":false,"collision":true,"kind":"multiblock","geo":"void2","anim":"none","anims":{},"global":true,"unformed":"cae:block/mbd_void","pattern":{"dir":["LEFT","UP","BACK"],"layers":[["A   BCB@BCB   A"," DDD   E   DDD "," DDF       FDD ","DDD         DDD","GDG         GDG","FDD         DDF","DDF         FDD","FDF         FDF","FFD         DFF","HDH         HDH"," FF         FF "," DD         DD ","  DD       DD  ","   F       F   ","    D     D    "]],"syms":{"D":[{"b":["minecraft:smooth_sandstone"],"hide":false}],"G":[{"b":["minecraft:chiseled_sandstone"],"hide":false}],"A":[{"b":["minecraft:birch_stairs"],"hide":false}],"F":[{"b":["chipped:sad_stone","chipped:sad_sandstone","chipped:sandstone_bricks","minecraft:sandstone"],"hide":false}],"B":[{"b":["chipped:sad_raw_gold_block","chipped:raw_gold_block_bricks","minecraft:raw_gold_block"],"hide":false}],"H":[{"b":["minecraft:gold_block"],"hide":false}],"@":[{"ctrl":true}],"C":[{"b":["ars_nouveau:sourcestone_mosaic"],"hide":false}],"E":[{"b":["cae:void_portal"],"hide":false}]," ":[{"any":true}]}}},
{"id":"kubejs:andesite_machine","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","geo":"andesite","anim":"andesite","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true},
{"id":"kubejs:brass_machine","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","shape":[0.0,0.0,0.0,1.0,1.2000000476837158,1.0],"geo":"brass","anim":"brass","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true},
{"id":"kubejs:integrational_machine","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","geo":"menril","anim":"menril","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true},
{"id":"kubejs:plastic_machine","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","geo":"plastic","anim":"plastic","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true},
{"id":"kubejs:radiant_machine","rot":"NON_Y_AXIS","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","geo":"radiant","anim":"radiant","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true},
{"id":"kubejs:sealed_machine","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","geo":"copper","anim":"copper","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true},
{"id":"kubejs:time_machine","rot":"ALL","destroy":1.5,"resist":6.0,"occlude":false,"collision":true,"kind":"single","shape":[0.0,0.0,0.0,1.0,2.0,1.0],"geo":"time","anim":"time","anims":{"base":[["idle","LOOP"]],"waiting":[["idle","LOOP"]],"suspend":[["idle","LOOP"]]},"global":true}
]}

let MBD_CLIENT = Platform.isClientEnvironment()
// 1211: ResourceLocation's constructors are private since 1.21, use the static factory
let MBD_RLC = Java.loadClass('net.minecraft.resources.ResourceLocation')
function mbdRL(id) { return MBD_RLC.parse(String(id)) }

// MBD2 only registers a few KubeJS bindings (Shapes), so every class is loaded by name. Package map: see the port's machines notes
let MBD_PKG = 'com.lowdragmc.mbd2.'
let MBD_CFG = MBD_PKG + 'common.machine.definition.config.'
let MbdRotation = Java.loadClass(MBD_PKG + 'api.block.RotationState')
let MbdIO = Java.loadClass(MBD_PKG + 'api.capability.recipe.IO')
let MbdRegistries = Java.loadClass(MBD_PKG + 'api.registry.MBDRegistries')
let MbdMachineState = Java.loadClass(MBD_CFG + 'MachineState')
let MbdCfgBlock = Java.loadClass(MBD_CFG + 'ConfigBlockProperties')
let MbdCfgMachine = Java.loadClass(MBD_CFG + 'ConfigMachineSettings')
let MbdCfgLogic = Java.loadClass(MBD_CFG + 'ConfigRecipeLogicSettings')
let MbdFactoryPattern = Java.loadClass(MBD_PKG + 'api.pattern.FactoryBlockPattern')
let MbdPredicates = Java.loadClass(MBD_PKG + 'api.pattern.Predicates')
let MbdRelDir = Java.loadClass(MBD_PKG + 'api.pattern.util.RelativeDirection')
let MbdShapeInfo = Java.loadClass(MBD_PKG + 'api.pattern.MultiblockShapeInfo')
let MbdTraitItem = Java.loadClass(MBD_PKG + 'common.trait.item.ItemSlotCapabilityTraitDefinition')
let MbdTraitFluid = Java.loadClass(MBD_PKG + 'common.trait.fluid.FluidTankCapabilityTraitDefinition')
let MbdTraitEnergy = Java.loadClass(MBD_PKG + 'common.trait.forgeenergy.ForgeEnergyCapabilityTraitDefinition')
let MbdTraitEntity = Java.loadClass(MBD_PKG + 'common.trait.entity.EntityHandlerTraitDefinition')
let MbdShapes = Java.loadClass('net.minecraft.world.phys.shapes.Shapes')
let MbdBuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let MbdJavaArrays = Java.loadClass('java.util.Arrays')
let MbdLdPlatform = Java.loadClass('com.lowdragmc.lowdraglib2.Platform')

// Block IDs of the ports (hatches). The old patterns accepted any block with an item/fluid/energy capability
// (smart chests, tanks, barrels...); MBD2 only takes IO from its own part machines, so those cells are hatches now.
let MBD_HATCH_BLOCK = {
  item_in: 'cae:item_input_hatch', item_out: 'cae:item_output_hatch',
  fluid_in: 'cae:fluid_input_hatch', fluid_out: 'cae:fluid_output_hatch', huge_fluid_in: 'cae:huge_fluid_input_hatch',
  energy_in: 'cae:energy_input_hatch', energy_out: 'cae:energy_output_hatch',
  entity_out: 'cae:entity_output_hatch', create_in: 'cae:create_input'
}

let MBD_RECIPE_TYPES = [
  'cae:arcanereactor', 'cae:assemb', 'cae:essence_extractor', 'cae:oil', 'cae:particleaccelerator', 'cae:stc',
  'cae:thething', 'cae:nothing', 'quests:quest_station'
]

let MBD_HATCHES = [
  { id: 'cae:item_input_hatch', tex: 'item_input', trait: { kind: 'item', name: 'items', io: 'IN', slots: 9 } },
  { id: 'cae:item_output_hatch', tex: 'item_output', trait: { kind: 'item', name: 'items', io: 'OUT', slots: 9 } },
  { id: 'cae:fluid_input_hatch', tex: 'fluid_input', trait: { kind: 'fluid', name: 'tanks', io: 'IN', tanks: 2, capacity: 64000 } },
  { id: 'cae:fluid_output_hatch', tex: 'fluid_output', trait: { kind: 'fluid', name: 'tanks', io: 'OUT', tanks: 2, capacity: 64000 } },
  // the Singularity Tank Chamber (cae:stc) used five huge tanks; one 512000 mB tank per hatch
  { id: 'cae:huge_fluid_input_hatch', tex: 'huge_fluid_input', trait: { kind: 'fluid', name: 'tanks', io: 'IN', tanks: 1, capacity: 512000 } },
  { id: 'cae:energy_input_hatch', tex: 'energy_input', trait: { kind: 'energy', name: 'energy', io: 'IN', capacity: 1000000, receive: 100000, extract: 100000 } },
  { id: 'cae:energy_output_hatch', tex: 'energy_output', trait: { kind: 'energy', name: 'energy', io: 'OUT', capacity: 1000000, receive: 100000, extract: 100000 } },
  { id: 'cae:entity_output_hatch', tex: 'entity_output', trait: { kind: 'entity', name: 'entities', io: 'OUT' } },
  // old Multiblocked parts that no pattern or recipe used
  { id: 'cae:energyout', tex: 'energy_output', trait: { kind: 'energy', name: 'energy', io: 'OUT', capacity: 1000000, receive: 100000, extract: 100000 } },
  { id: 'cae:pressurecontainer', tex: 'plain', light: 15 }
]

// Machines that get a GUI, filled in while registering and built in postInit (mbdBuildUis).
// spec: { id, progress: bool (progress arrow), layout: 'quest' for the quest station's slot layout }
let MBD_UI_SPECS = []

// Rhino can't turn some Java exceptions into a string with '+' ("Cannot find default value for object")
function mbdErr(e) {
  try { return String(e) } catch (x) {}
  try { return String(e.message) } catch (x) {}
  return '(unprintable error)'
}

function mbdTrait(t) {
  let d
  if (t.kind == 'item') {
    d = new MbdTraitItem()
    d.setSlotSize(t.slots)
    d.setSlotLimit(64)
  } else if (t.kind == 'fluid') {
    d = new MbdTraitFluid()
    d.setTankSize(t.tanks)
    d.setCapacity(t.capacity)
  } else if (t.kind == 'energy') {
    d = new MbdTraitEnergy()
    d.setCapacity(t.capacity)
    d.setMaxReceive(t.receive)
    d.setMaxExtract(t.extract)
  } else {
    d = new MbdTraitEntity()
  }
  d.setName(t.name)
  d.setRecipeHandlerIO(MbdIO[t.io])
  // 1211: a recipe content with slotName('x', ...) only reaches handlers whose *slot names* contain x (RecipeCapabilityTrait.
  // getSlotNames, a separate trait setting: empty by default, it is NOT the trait name). The quest station recipes name
  // task_slot/card_slot/input1/output1, so each of its slot traits lists its own name. (Not "distinct": unnamed contents
  // such as the task's goods must still be able to spread over input1..input4.)
  if (t.slotName) d.setSlotNames(MbdJavaArrays.asList(t.slotName))
  // what a player may do in the GUI: take from output traits, put into and take from the others
  if (typeof d.setGuiIO == 'function') d.setGuiIO(MbdIO[t.gui || (t.io == 'OUT' ? 'OUT' : 'BOTH')])
  return d
}

// MBD2 calls this at RegisterCapabilitiesEvent (MBDMachineDefinition.loadFactory); an exception there would kill the boot,
// so log and fall back
function mbdSettings(id, traits, hasUi) {
  return () => {
    try {
      let ms = MbdCfgMachine.builder().hasUI(!!hasUi).build()
      traits.forEach(t => {
        if (!ms.addTraitDefinition(mbdTrait(t))) console.warn('[mbd2] ' + id + ': trait ' + t.name + ' was refused')
      })
      return ms
    } catch (e) {
      console.warn('[mbd2] ' + id + ': machine settings failed: ' + mbdErr(e))
      try { return MbdCfgMachine.builder().hasUI(false).build() } catch (e2) { return null }
    }
  }
}

function mbdBlockProps(c) {
  return MbdCfgBlock.builder()
    .rotationState(MbdRotation[c.rot || 'ALL'])
    .hasCollision(c.collision !== false)
    .canOcclude(c.occlude !== false)
    .destroyTime(c.destroy === undefined ? 1.5 : c.destroy)
    .explosionResistance(c.resist === undefined ? 6 : c.resist)
    .build()
}

function mbdShape(c) {
  if (c.shape) return MbdShapes.box(c.shape[0], c.shape[1], c.shape[2], c.shape[3], c.shape[4], c.shape[5])
  return MbdShapes.block()
}

// A GeckoLib renderer for the formed (or, for single blocks, the only) state. Client only: the renderer class
// pulls in client code. Animations are played by state name, so the animation list maps state -> animation.
function mbdGeoRenderer(c) {
  if (!MBD_CLIENT || !c.geo) return null
  try {
    let Renderer = Java.loadClass(MBD_PKG + 'integration.geckolib.GeckolibRenderer')
    let Anim = Java.loadClass(MBD_PKG + 'integration.geckolib.Animation')
    let Stage = Java.loadClass(MBD_PKG + 'integration.geckolib.AnimationStage')
    let Loop = Java.loadClass(MBD_PKG + 'integration.geckolib.AnimationStage$LoopType')
    let r = new Renderer(mbdRL('cae:geo/mbd_' + c.geo + '.geo.json'), mbdRL('cae:textures/block/mbd_' + c.geo + '.png'),
      mbdRL('cae:animations/mbd_' + c.anim + '.animation.json'))
    Object.keys(c.anims || {}).forEach(state => {
      // 1211: Animation.stages is a final list (no setStages any more), add to getStages()
      let anim = new Anim().setName(state)
      c.anims[state].forEach(s => anim.getStages().add(new Stage().setAnimationName(s[0]).setLoopType(Loop[s[1]])))
      r.getAnimations().add(anim)
    })
    if (Object.keys(c.anims || {}).length > 0) {
      // scheduleStateAnimation has no setter; it is a persisted field, so go through the NBT
      // 1211: IPersistedSerializable.serializeNBT/deserializeNBT now take a HolderLookup.Provider
      let prov = MbdLdPlatform.getFrozenRegistry()
      let tag = r.serializeNBT(prov)
      tag.putBoolean('scheduleStateAnimation', true)
      r.deserializeNBT(prov, tag)
      if (!r.isScheduleStateAnimation()) {
        console.warn('[mbd2] ' + c.id + ': could not switch on state animations (NBT keys: ' + tag.getAllKeys() + ')')
      }
    }
    return r
  } catch (e) {
    console.warn('[mbd2] ' + c.id + ': GeckoLib renderer failed: ' + mbdErr(e))
    return null
  }
}

// MachineState.Builder.modelRenderer(ResourceLocation) / renderer(Supplier) are no-ops (empty renderer) on a dedicated server
function mbdModel(b, model) {
  if (MBD_CLIENT && model) b.modelRenderer(mbdRL(model.indexOf('v:') == 0 ? model.substring(2) : model))
  return b
}

// base -> (formed -> (working -> waiting), suspend) for multiblocks; base -> (working -> waiting), suspend for singles.
// 1211: the builder takes children as child(name, consumer) and renderers as Suppliers.
function mbdStates(c, newBuilder) {
  let geo = (MBD_CLIENT && c.geo) ? () => mbdGeoRenderer(c) : null
  let isGlobal = !!c.global && !!geo
  let multi = c.kind == 'multiblock'
  let b = newBuilder().shape(mbdShape(c)).lightLevel(multi ? 0 : (c.light || 0))
  if (multi) {
    mbdModel(b, c.unformed)
    b.child('formed', f => {
      if (geo) f.renderer(geo)
      f.child('working', w => { w.child('waiting') })
      f.child('suspend')
    })
  } else {
    if (geo) b.renderer(geo)
    else mbdModel(b, c.model)
    b.child('working', w => { w.child('waiting') })
    b.child('suspend')
  }
  let root = b.build()
  if (isGlobal) (multi ? root.children().get(0) : root).isGlobalVisible(true)
  return root
}

// ---- machine UI ------------------------------------------------------------------------------------------------------
// 1211: the GUIs are built in Java (core mod, com.caeport.cae.compat.Mbd2Ui): Rhino can't reflect LDLib2's UI classes on a
// dedicated server. This only passes plain arguments: Mbd2Ui.apply(machineId, progressArrow, layout). Details:
// the port's MBD2 GUI notes. Called from StartupEvents.postInit (the client font exists by then).

function mbdBuildUis() {
  let Ui = Java.loadClass('com.caeport.cae.compat.Mbd2Ui')
  let ok = 0
  MBD_UI_SPECS.forEach(spec => {
    try {
      if (Ui.apply(String(spec.id), !!spec.progress, spec.layout ? String(spec.layout) : '')) ok++
    } catch (e) {
      console.warn('[mbd2] GUI of ' + spec.id + ' failed, it keeps the empty default one: ' + mbdErr(e))
    }
  })
  console.info('[mbd2] machine GUIs built: ' + ok + '/' + MBD_UI_SPECS.length)
}

// ---- registration ----------------------------------------------------------------------------------------------------

MBDRegistryEvents.recipeType(event => {
  // 1211: createRecipeType puts the type into MBD2's registry, and MBD2 itself registers the matching vanilla recipe
  // type and serializer for every entry (CommonProxy.register), so the old MBDRegistryEvent$MBDRecipeType hack is gone.
  MBD_RECIPE_TYPES.forEach(id => {
    try {
      event.createRecipeType(mbdRL(id))
    } catch (e) {
      console.warn('[mbd2] recipe type ' + id + ': ' + mbdErr(e))
    }
  })
})

function questStationTraits() {
  let slot = n => ({ kind: 'item', name: n, slotName: n, io: n.indexOf('output') == 0 ? 'OUT' : 'IN', slots: 1 })
  let names = ['task_slot', 'card_slot', 'input1', 'input2', 'input3', 'input4', 'output1', 'output2', 'output3', 'output4']
  let traits = names.map(slot)
  traits.push({ kind: 'energy', name: 'energy', io: 'IN', capacity: 10000, receive: 1000, extract: 0 })
  return traits
}

// event.create(kind, id) -> builder with the state tree, block properties and settings of c
function mbdMachine(event, kind, c, traits, hasUi, recipe, newState) {
  let b = event.create(kind, mbdRL(c.id))
  b.rootState(mbdStates(c, newState || (() => MbdMachineState.baseBuilder())))
  b.blockProperties(mbdBlockProps(c))
  b.machineSettings(mbdSettings(c.id, traits, hasUi))
  if (recipe) b.recipeLogicSettings(MbdCfgLogic.builder().enable(true).recipeType(mbdRL(recipe)).build())
  return b
}

MBDRegistryEvents.machine(event => {
  // ---- ports -------------------------------------------------------------------------------------------------
  MBD_HATCHES.forEach(h => {
    try {
      let c = { id: h.id, kind: 'single', model: 'cae:block/mbd_hatch_' + h.tex, light: h.light, rot: 'ALL', destroy: 3, resist: 6 }
      mbdMachine(event, 'single', c, h.trait ? [h.trait] : [], !!h.trait, null)
      if (h.trait) MBD_UI_SPECS.push({ id: h.id, progress: false })
    } catch (e) {
      console.warn('[mbd2] hatch ' + h.id + ': ' + mbdErr(e))
    }
  })

  // ---- quests:quest_station (was Custom Machinery): trade card + task items in, rewards out ----------------------
  try {
    let c = { id: 'quests:quest_station', kind: 'single', model: 'v:minecraft:block/smithing_table', rot: 'ALL', destroy: 3, resist: 6 }
    mbdMachine(event, 'single', c, questStationTraits(), true, 'quests:quest_station')
    MBD_UI_SPECS.push({ id: c.id, progress: true, layout: 'quest' })
  } catch (e) {
    console.warn('[mbd2] quests:quest_station: ' + mbdErr(e))
  }

  // Create stress port (was multiblocked:create_input). Consumes torque * |rpm| as stress capacity; 16 su/rpm means
  // the oil pump's 1024 su needs 64 rpm.
  // 1211: MBD2 21.1.2 leaves the "kinetic" type out of event.create (commented out in CommonProxy.KubeJSWrapper), so the
  // definition is built from its own class and put into the registry exactly as MBDMachineRegistryEventJS.afterPosted does.
  // The CreateRotationTrait that makes it work is added by CreateKineticMachineDefinition.loadFactory.
  try {
    let KinSettings = Java.loadClass(MBD_PKG + 'integration.create.machine.ConfigKineticMachineSettings')
    let KinDef = Java.loadClass(MBD_PKG + 'integration.create.machine.CreateKineticMachineDefinition')
    let KinState = Java.loadClass(MBD_PKG + 'integration.create.machine.CreateMachineState')
    let kc = { id: 'cae:create_input', kind: 'single', model: 'cae:block/mbd_hatch_stress_input', rot: 'ALL', destroy: 3, resist: 6 }
    let kb = KinDef.builder()
    kb.kineticMachineSettings(KinSettings.builder().isGenerator(false).torque(16).build())
    kb.id(mbdRL(kc.id))
    kb.rootState(mbdStates(kc, () => KinState.builder()))
    kb.blockProperties(mbdBlockProps(kc))
    kb.machineSettings(mbdSettings(kc.id, [], false))
    let kd = kb.build()
    MbdRegistries.MACHINE_DEFINITIONS.register(mbdRL(kc.id), kd)
  } catch (e) {
    console.warn('[mbd2] cae:create_input: ' + mbdErr(e))
  }

  // ---- the 18 controllers ---------------------------------------------------------------------------------------
  MBD_DATA.controllers.forEach(c => {
    try {
      mbdMachine(event, c.kind, c, c.traits || [], !!c.recipe, c.recipe)
      if (c.recipe) MBD_UI_SPECS.push({ id: c.id, progress: true })
    } catch (e) {
      console.warn('[mbd2] controller ' + c.id + ': ' + mbdErr(e))
    }
  })
})

// ---- patterns ------------------------------------------------------------------------------------------------------

function mbdBlock(id) {
  let o = MbdBuiltInRegistries.BLOCK.getOptional(mbdRL(id))
  return o.isPresent() ? o.get() : null
}

function mbdTerm(c, t) {
  if (t.any) return MbdPredicates.any()
  if (t.air) return MbdPredicates.air()
  if (t.ctrl) return MbdPredicates.controller(MbdPredicates.blocks(mbdBlock(c.id)))
  if (t.h) {
    let hb = mbdBlock(MBD_HATCH_BLOCK[t.h])
    if (hb == null) {
      console.warn('[mbd2] ' + c.id + ': hatch block ' + MBD_HATCH_BLOCK[t.h] + ' is not registered')
      return MbdPredicates.any()
    }
    let p = MbdPredicates.blocks(hb)
    if (t.min) p.setMinGlobalLimited(1)
    return p
  }
  let blocks = t.b.map(mbdBlock).filter(x => x != null)
  if (blocks.length == 0) {
    console.warn('[mbd2] ' + c.id + ': none of ' + t.b + ' exists, cell accepts anything')
    return MbdPredicates.any()
  }
  let p = MbdPredicates.blocks(blocks)
  // 1211: disableRenderFormed is gone. proxyWhileFormed() swaps the block for MBD2's invisible ProxyPartBlock while the
  // structure is formed and puts the original back (with its data) when it breaks: the same "hide" effect.
  if (t.hide) p.proxyWhileFormed()
  return p
}

function mbdBuildPattern(c) {
  let p = c.pattern
  let fb = MbdFactoryPattern.start(MbdRelDir[p.dir[0]], MbdRelDir[p.dir[1]], MbdRelDir[p.dir[2]])
  p.layers.forEach(rows => fb.aisle(rows))
  Object.keys(p.syms).forEach(ch => {
    let tp = null
    p.syms[ch].forEach(t => {
      let x = mbdTerm(c, t)
      tp = tp == null ? x : tp.or(x)
    })
    fb.where(ch, tp)
  })
  return fb.build()
}

// a MultiblockShapeInfo[] holding one element; Rhino has no typed-array constructor, so go through java.util.Arrays
function mbdShapeInfoArray(info) {
  let cls = null
  try {
    cls = Java.loadClass('[L' + MBD_PKG + 'api.pattern.MultiblockShapeInfo;')
  } catch (e) {
    console.warn('[mbd2] cannot load the MultiblockShapeInfo[] class: ' + mbdErr(e))
  }
  return MbdJavaArrays.copyOf([info], 1, cls)
}

// Attach the real pattern and shape info to a registered multiblock definition (MultiblockMachineDefinition.blockPatternFactory
// / shapeInfoFactory). 1211: machines registered through the builder have no pattern at all, so this is the only source.
function mbdAttachPattern(c) {
  try {
    let def = MbdRegistries.MACHINE_DEFINITIONS.get(mbdRL(c.id))
    if (def == null) {
      console.warn('[mbd2] ' + c.id + ' was not registered, no pattern attached')
      return
    }
    let pattern = mbdBuildPattern(c)
    def.blockPatternFactory(machine => pattern)
    let infos = null
    def.shapeInfoFactory(d => {
      try {
        if (infos == null) {
          let info = new MbdShapeInfo(pattern.getPreview(c.pattern.layers.map(() => 1)))
          infos = mbdShapeInfoArray(info)
        }
        return infos
      } catch (e) {
        console.warn('[mbd2] shape info of ' + c.id + ' failed: ' + mbdErr(e))
        return null
      }
    })
    // read back what was built, to compare with the data
    let L = c.pattern.layers
    let expected = 0
    L.forEach(rows => rows.forEach(row => row.split('').forEach(ch => {
      let t = c.pattern.syms[ch]
      if (!(t.length == 1 && (t[0].any || t[0].air))) expected++
    })))
    let seen = '?'
    try {
      let box = pattern.getPreview(L.map(() => 1))
      let n = 0
      for (let i = 0; i < box.length; i++) for (let j = 0; j < box[i].length; j++) for (let k = 0; k < box[i][j].length; k++) if (box[i][j][k] != null) n++
      seen = box.length + 'x' + box[0].length + 'x' + box[0][0].length + ' box, ' + n + ' blocks in the preview'
    } catch (e) {
      seen = 'preview failed: ' + mbdErr(e)
    }
    console.info('[mbd2] pattern ' + c.id + ': data ' + L.length + 'x' + L[0].length + 'x' + L[0][0].length + ' (aisles x rows x chars), '
      + expected + ' predicate cells; built ' + pattern.aisleRepetitions.length + ' aisles, ' + seen)
  } catch (e) {
    console.warn('[mbd2] pattern for ' + c.id + ': ' + mbdErr(e))
  }
}

StartupEvents.postInit(event => {
  MBD_DATA.controllers.forEach(c => {
    if (c.kind == 'multiblock') mbdAttachPattern(c)
  })

  // Hatches have to be MBD2 "parts" for a formed controller to use them, and code-registered machines get disabled part
  // settings (ConfigPartSettings.enable defaults to false). The core mod's helper switches it on (Rhino can't touch
  // ConfigPartSettings on a server).
  let parts = Java.loadClass('com.caeport.cae.compat.Mbd2Parts')
  let ids = MBD_HATCHES.map(h => h.id).concat(['cae:create_input'])
  let failed = ids.filter(id => !parts.enable(id))
  console.info('[mbd2] part hatches enabled: ' + (ids.length - failed.length) + '/' + ids.length
    + (failed.length ? ' (not: ' + failed.join(', ') + ')' : ''))

  mbdBuildUis()
})
