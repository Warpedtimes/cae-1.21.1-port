// 1211: Thermal and Tinkers are gone. Their replacements (cae:, Mekanism, Create: Metallurgy) are registered in
// startup_scripts/thermalReplacements.js / portReplacements.js and wired up in server_scripts/thermalReplacements.js and
// tinkersReplacements.js; the old recipes that named them were removed from this file. The machine-crafting tables skip any
// entry naming an unregistered item (caeItemsKnown). Item stacks in the tables are written as "3x ns:id" strings, not Item.of().
// Skipped entries are logged once at the end of the handler.
let wrencharray = []
// 1211: KubeJS Create reads a '#tag' string in a processing recipe input as a FLUID tag (the sized_fluid_ingredient side of
// either<..., ingredient> wins), so item tags must be wrapped in Ingredient.of(). Plain ids pass through unchanged.
function tagIngredient(s) {
    return (typeof s == 'string' && s.startsWith('#')) ? Ingredient.of(s) : s
}
let dumbshitarray = [
    "cae:gold_casing",
    "2x create:portable_storage_interface",
    "2x create:mechanical_harvester",
    "2x create:mechanical_plough",
    "4x create:andesite_funnel",
    "4x create:andesite_tunnel",
    "2x create:weighted_ejector",
    "createaddition:rolling_mill",
    //"alloyedguns:basic_gun_kit",
    "create:encased_fan",
    "create:mechanical_drill",
    "create:mechanical_saw",
    "mekanismgenerators:bio_generator",
    // 1211: Compressed Creativity has no 1.21.1 build; the ids are kept so the tags and recipes below work if it appears
    "compressedcreativity:industrial_air_blower",
    "compressedcreativity:air_blower",
    "compressedcreativity:compressed_air_engine",
    "compressedcreativity:rotational_compressor",
    "create:mechanical_press",
    "create:mechanical_mixer",
    "create:deployer",
    "cae:device_tree_extractor",
    "ae2:meteorite_compass",
    "4x createaddition:connector",
    "createaddition:alternator",
    "3x create:mechanical_crafter",
    "torchmaster:feral_flare_lantern",
    "mekanismgenerators:solar_generator",
    "createaddition:tesla_coil",
    "createaddition:modular_accumulator",
    "createaddition:portable_energy_interface",
    "createaddition:electric_motor",
    // port: step 5 (Multiblocked2)
    // "custommachinery:custom_machine_block",
    "4x create:redstone_link",
    "create:powered_toggle_latch",
    "create:powered_latch",
    "create:pulse_extender",
    "create:pulse_repeater",
    "minecraft:repeater",
    "minecraft:comparator",
    "minecraft:daylight_detector",
    "2x create:sequenced_gearshift",
    "create:rotation_speed_controller",
    "create:mechanical_arm",
    "2x create:stockpile_switch",
    "2x create:content_observer",
    "2x create:stockpile_switch",
    "4x create:brass_funnel",
    "4x create:brass_tunnel",
    "2x create:display_link",
    "6x create:display_board",
    "2x create:smart_fluid_pipe",
    "create:hose_pulley",
    "2x create:portable_fluid_interface",
    "3x create:steam_engine",
    // "alloyedguns:advanced_gun_kit",
    "create:copper_backtank",
    "2x create:spout",
    "create:item_drain",
    "mekanismgenerators:heat_generator",
    "mekanism:electric_pump",
    "mekanism:basic_fluid_tank",
    "2x createmetallurgy:foundry_basin",
    "2x functionalstorage:void_upgrade",
    "mekanism:basic_tier_installer",
    "railways:track_coupler",
    "create:controls",
    "create:track_observer",
    "mekanism:basic_energy_cube",
    "2x create:track_station",
    "4x create:track_signal",
    "mekanism:advanced_tier_installer",
    "8x pneumaticcraft:thermal_lagging",
    "mekanismgenerators:advanced_solar_generator",
    "pneumaticcraft:turbine_rotor",
    "pneumaticcraft:air_compressor",
    "pneumaticcraft:liquid_compressor",
    "pneumaticcraft:thermal_compressor",
    "pneumaticcraft:refinery_output",
    "pneumaticcraft:refinery",
    "pneumaticcraft:gas_lift",
    "pneumaticcraft:thermopneumatic_processing_plant",
    "4x pneumaticcraft:turbine_blade",
    "8x pneumaticcraft:heat_pipe",
    "16x pneumaticcraft:pressure_tube",
    "4x pneumaticcraft:manual_compressor",
    "pneumaticcraft:charging_station",
    "cae:device_collector", // 1211: Thermal's Vacuumulator (the original listed thermal:device_collector here)
    "cae:device_rock_gen",
    // 1211: the other Thermal devices, real blocks of the core mod (the original listed all of them)
    "cae:device_soil_infuser",
    "cae:tinker_bench",
    "cae:device_composter",
    "cae:device_fisher",
    "cae:device_hive_extractor",
    "cae:device_potion_diffuser",
    "cae:device_nullifier",
    "mekanism:elite_tier_installer",
    "pneumaticcraft:elevator_base",
    "pneumaticcraft:programmer",
    "pneumaticcraft:electrostatic_compressor",
    "pneumaticcraft:air_cannon",
    "pneumaticcraft:advanced_liquid_compressor",
    "pneumaticcraft:advanced_air_compressor",
    "pneumaticcraft:omnidirectional_hopper",
    "pneumaticcraft:liquid_hopper",
    "pneumaticcraft:pneumatic_dynamo",
    "pneumaticcraft:vacuum_trap",
    "pneumaticcraft:pressurized_spawner",
    "pneumaticcraft:spawner_agitator",
    "pneumaticcraft:solar_compressor",
    "mekanismgenerators:gas_burning_generator",
    "createmetallurgy:industrial_crucible",
    "mekanism:energized_smelter",
    "createmetallurgy:casting_table",
    "mekanism:resistive_heater",
    "create:spout",
    "mekanism:isotopic_centrifuge",
    "pneumaticcraft:refinery",
    "mekanism:crusher",
    "mekanism:metallurgic_infuser",
    "mekanism:precision_sawmill",
    "mekanism:chemical_infuser",
    "mekanism:combiner",
    "mekanism:chemical_crystallizer",
    "mekanism:osmium_compressor",
    "mekanism:formulaic_assemblicator",
    "pneumaticcraft:assembly_controller",
    "pneumaticcraft:assembly_laser",
    "pneumaticcraft:assembly_drill",
    "pneumaticcraft:assembly_io_unit_export",
    "pneumaticcraft:assembly_io_unit_import",
    "pneumaticcraft:assembly_platform",
    //"alloyedguns:complex_gun_kit",
    "mekanismgenerators:wind_generator",
    "integrateddynamics:delay",
    "integrateddynamics:mechanical_drying_basin",
    "integrateddynamics:mechanical_squeezer",
    "integrateddynamics:materializer",
    "integrateddynamics:proxy",
    "integrateddynamics:energy_battery",
    "integrateddynamics:variablestore",
    "integratednbt:nbt_extractor",
    "integrateddynamics:logic_programmer",
    "integrateddynamics:portable_logic_programmer",
    "4x ae2:formation_core",
    "4x ae2:annihilation_core",
    "ae2:controller",
    "ae2:inscriber",
    "mekanismgenerators:rotational_complex",
    "ae2:semi_dark_monitor",
    "ae2:condenser",
    "ae2:terminal",
    "2x entangled:block",
    "pneumaticcraft:aerial_interface",
    "cae:zinc_casing",
    "cae:gold_casing",
    "cae:enderium_casing",
    "cae:supercritical_casing"
]

BlockEvents.rightClicked(event => {
    if (event.block.id == 'minecraft:diamond_block' && event.item.id == "minecraft:flint_and_steel") {
        // 1211: only in the Overworld and the Nether (built in cae:arcane or cae:void it skipped the endgame), only where the 7x8
        // frame around the block is free (the fills overwrote anything there, block entities too), and the click is cancelled so
        // it doesn't light a fire as well
        let dim = String(event.level.dimension)
        if (dim != 'minecraft:overworld' && dim != 'minecraft:the_nether') { return }
        let bx = event.block.x, by = event.block.y, bz = event.block.z
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = 0; dy <= 7; dy++) {
                if ((dx != 0 || dy != 0) && !event.level.getBlock(bx + dx, by + dy, bz).blockState.canBeReplaced()) {
                    event.player.setStatusMessage(Text.darkRed("The portal needs a free space 7 wide and 8 high around the block"))
                    return
                }
            }
        }

        event.server.runCommandSilent(`execute in ${event.block.level.dimension} positioned ${event.block.x} ${event.block.y} ${event.block.z} run fill ~-2 ~1 ~ ~2 ~4 ~ minecraft:nether_portal`)
        // 1211: sign lines are text components in SNBT now (plain strings are literal text); the JSON-in-a-string form would show the quotes.
        // Note: this command has no `run` after `positioned ...`, so it has never been valid; kept as it was.
        event.server.runCommandSilent(`execute in ${event.block.level.dimension} positioned ${event.block.x} ${event.block.y} ${event.block.z} setblock ~ ~ ~-1 minecraft:oak_sign[rotation=1]{front_text:{messages:["Please Do Not","Update Portal Blocks","The portal will break","You will cry!"]}}`)

        event.server.runCommandSilent(`execute in ${event.block.level.dimension} positioned ${event.block.x} ${event.block.y} ${event.block.z} run fill ~-3 ~ ~ ~3 ~7 ~ minecraft:crying_obsidian`)
        event.server.runCommandSilent(`execute in ${event.block.level.dimension} positioned ${event.block.x} ${event.block.y} ${event.block.z} run fill ~ ~ ~ ~ ~ ~ minecraft:shroomlight`)
        event.server.runCommandSilent(`execute in ${event.block.level.dimension} positioned ${event.block.x} ${event.block.y} ${event.block.z} run fill ~-2 ~1 ~ ~2 ~6 ~ minecraft:nether_portal`)
        event.cancel() // last: cancel() ends the handler
    }

})
BlockEvents.broken(event => {
    if (event.player.isCreative()) { return }
    if (event.player.mainHandItem.id.includes("gavel") && (event.player.mainHandItem.hasEnchantment("minecraft:silk_touch", 1) || event.block.id == "minecraft:ancient_debris")) {
        event.player.setStatusMessage(Text.darkRed("Thou shall not mine stuff with a Gavel and Silk Touch"))
        event.cancel()
    }
})

ServerEvents.recipes(event => {
    let caeSkipped = [] // 1211: entries skipped because they name an item that is not registered
    if (CAE_THERMAL) { // 1211: thermal
        event.recipes.create.mixing("mekanism:ingot_steel", ["createmetallurgy:coke", "mekanism:dust_iron"])
    }
    let t = 'kubejs:incomplete_cogwheel'

    event.recipes.create.sequenced_assembly([
        '16x create:cogwheel',
    ], 'create:shaft', [
        event.recipes.create.deploying(t, [t, Ingredient.of('#minecraft:wooden_buttons')]),
        event.recipes.create.cutting(t, t)
    ]).transitionalItem('kubejs:incomplete_cogwheel').loops(4)
    function nineitemstoitem(o, i) {
        event.shaped(o, [
            'SSS',
            'SSS',
            'SSS'
        ], {
            S: i
        })
    }
    function itemtoninetimes(o, i) {
        event.shapeless(Item.of(o, 9), Item.of(i))
    }
    event.shapeless("4x ars_nouveau:source_gem", "ars_nouveau:source_gem_block")
    itemtoninetimes("forbidden_arcanus:arcane_crystal", "forbidden_arcanus:arcane_crystal_block")
    itemtoninetimes("create:andesite_alloy", "create:andesite_alloy_block")
    if (CAE_THERMAL) { // 1211: thermal
        itemtoninetimes("cae:invar_ingot", "cae:invar_block")
        nineitemstoitem("cae:invar_ingot", "cae:invar_nugget")
    }
    event.remove({ id: 'forbidden_arcanus:yellow_orchid' })
    event.remove({ output: 'architects_palette:ancient_plating_slab' })
    event.remove({ id: 'create:crafting/kinetics/belt_connector' })
    //event.shapeless('create:large_cogwheel',['create:cogwheel','#minecraft:planks'])
    // port: mod gone in 1.20.1
    // event.remove({ id: 'tinkers_reforged:smeltery/melting/redstone' })
    // port: mod gone in 1.20.1
    // event.remove({ id: 'tinkers_reforged:smeltery/melting/redstone_block' })
    // port: mod gone in 1.20.1
    // event.remove({ mod: 'extendedgears' })
    // port: mod gone in 1.20.1
    // event.remove({ id: 'beyond_earth:steel_ingot' })
    // port: mod gone in 1.20.1
    // event.remove({ id: 'rocketcraft' })
    //event.remove({id: 'create:deploying/large_cogwheel'})
    //event.remove({id: 'create:deploying/cogwheel'})
    //event.remove({id: 'create:crafting/kinetics/cogwheel'})
    //event.remove({id: 'create:crafting/kinetics/large_cogwheel'})
    if (CAE_THERMAL) { // 1211: thermal
        event.remove({ output: 'cae:invar_ingot' })
    }
    event.remove({ id: 'create:crafting/materials/electron_tube' })
    event.remove({ id: 'create:sequenced_assembly/precision_mechanism' })
    event.remove({ id: 'ae2:network/blocks/crystal_processing_charger' })
    event.remove({ id: 'create:crushing/tuff' })
    event.remove({ id: 'ae2:blasting/silicon_from_certus_quartz_dust' })
    event.smelting('ae2:certus_quartz_crystal', 'ae2:certus_quartz_dust')
    event.replaceInput({ id: "chunkymcchunkface:chunk_loader" }, "#c:nether_stars", "kubejs:integrational_machine")
    //making stuff renewable
    event.recipes.create.mixing('8x minecraft:deepslate', ['8x minecraft:cobblestone', Ingredient.of('#minecraft:coals')]).id('renewabledeepslate')
    event.recipes.create.haunting('minecraft:tuff', 'minecraft:infested_deepslate').id('tufffromdeepslate')
    event.recipes.create.filling('minecraft:ink_sac', ['minecraft:dried_kelp', Fluid.of('kubejs:chromatic_waste', 500)]).id('inksacsrenewables')
    //dye automations
    let corundum = ["red", "orange", "yellow", "green", "blue", "white", "black"]
    corundum.forEach(Color => {
        event.recipes.create.pressing(Item.of('minecraft:' + Color + '_dye'), 'quark:' + Color + '_corundum_cluster')
    });
    /*event.shaped('8x create:cogwheel', [ //TODO: Check if ME controller is wrenchpickupable
        'GGG',
        'GAG',
        'GGG'
      ], {
        G: '#minecraft:wooden_buttons',
        A: 'create:andesite_alloy'
    })
    event.shaped('2x create:large_cogwheel', [
        'GPG',
        'PAP',
        'GPG'
      ], {
        G: '#minecraft:wooden_buttons',
        A: 'create:andesite_alloy',
        P: '#minecraft:planks'
    })*/
    if (CAE_THERMAL) { // 1211: thermal
        event.shaped('kubejs:screwdriver', [
            '  G',
            'PAP',
            ' P '
        ], {
            G: 'minecraft:iron_ingot',
            A: 'create:andesite_alloy',
            P: 'cae:cured_rubber'
        })
    }
    event.shaped('kubejs:screwdriver', [ // 1211: was 2x, but the screwdriver stacks to 1 now ("Item stack with stack size of 2 was larger than maximum: 1")
        '  G',
        'PAP',
        ' P '
    ], {
        G: 'minecraft:iron_ingot',
        A: 'create:andesite_alloy',
        P: 'kubejs:enriched_rubber'
    })

    const cogswoodnatural = ["birch", "oak", "dark_oak", "acacia", "jungle"]
    const cogsunatural = ["crimson", "warped"]
    const cogsmetal = ['iron', 'steel', 'copper']

    /*cogswoodnatural.forEach(element => {
        event.shapeless(Item.of('extendedgears:'+ element + '_cogwheel', 8),["8x create:cogwheel" ,'immersive_weathering:' + element + "_bark"])
        event.shapeless(Item.of('extendedgears:large_'+ element +'_cogwheel', 4),["4x create:large_cogwheel" ,'immersive_weathering:' + element + "_bark"])
        event.shapeless(Item.of('extendedgears:large_'+ element + '_cogwheel'),["extendedgears:"+element +'_cogwheel',Item.of('minecraft:' + element + '_planks ',2)])
        event.shapeless('create:cogwheel','extendedgears:'+element+ '_cogwheel')
        event.shapeless( 'create:large_cogwheel','extendedgears:large_'+element+ '_cogwheel')
    });
    cogsunatural.forEach(element => {
        event.shapeless(Item.of('extendedgears:'+ element + '_cogwheel', 8),["8x create:cogwheel" ,'immersive_weathering:' + element + '_scales'])
        event.shapeless(Item.of('extendedgears:large_'+ element + '_cogwheel', 4),["4x create:large_cogwheel" ,'immersive_weathering:' + element + "_scales"])
        event.shapeless(Item.of('extendedgears:large_'+ element + '_cogwheel'),["extendedgears:"+element +'_cogwheel' ,Item.of('minecraft:' + element + '_planks ',2)])
        event.shapeless('create:cogwheel','extendedgears:'+element+ '_cogwheel')
        event.shapeless('create:large_cogwheel','extendedgears:large_'+element+ '_cogwheel')
    });
    cogsmetal.forEach(element => {
        event.shapeless(Item.of('extendedgears:'+ element + '_cogwheel', 8),["8x create:cogwheel" , '#forge:plates/' + element])
        event.shapeless(Item.of('extendedgears:large_'+ element + '_cogwheel', 4),["4x create:large_cogwheel" ,'#forge:plates/' + element])
        event.shapeless(Item.of('extendedgears:large_'+ element + '_cogwheel'),["extendedgears:"+element +'_cogwheel' ,Item.of('#forge:nuggets/' + element,2)])
        event.shapeless('create:cogwheel','extendedgears:'+element+ '_cogwheel')
        event.shapeless('create:large_cogwheel','extendedgears:large_'+element+ '_cogwheel')
    });
    
    event.shapeless('create:cogwheel','#forge:cogwheels')
    event.shapeless('create:large_cogwheel','#forge:large_cogwheels')
    */

    event.shaped("kubejs:andesite_machine", [
        'SSS',
        'SCS',
        'SSS'
    ], {
        C: "create:andesite_casing",
        S: '#create:kinetic_mechanisms'
    })
    event.shaped("kubejs:sealed_machine", [
        'SSS',
        'SCS',
        'SSS'
    ], {
        C: "create:copper_casing",
        S: "kubejs:sealed_mechanism"
    })
    event.shaped("kubejs:brass_machine", [
        'SSS',
        'SCS',
        'SSS'
    ], {
        C: "create:brass_casing",
        S: "create:precision_mechanism"
    })
    event.shaped("kubejs:sturdy_machine", [
        'SSS',
        'SCS',
        'SSS'
    ], {
        C: 'create:railway_casing',
        S: "kubejs:sturdy_mechanism"
    })

    function dolesheet(In, out) {
        event.custom({
            "type": "lychee:block_crushing",
            "item_in": [
                {
                    "item": In
                },
            ],
            "post": [
                {
                    "type": "drop_item",
                    "id": out,
                    "contextual": {
                        "type": "chance",
                        "chance": 0.80
                    }
                }
            ]
        })
    }
    let dolesheetarray = [
        ["minecraft:copper_ingot", "create:copper_sheet"],
        ["create:brass_ingot", "create:brass_sheet"],
        ["minecraft:iron_ingot", "create:iron_sheet"],
        ["minecraft:gold_ingot", "create:golden_sheet"],
        ["create:zinc_ingot", "createdeco:zinc_sheet"],
        ["createdeco:industrial_iron_ingot", "createdeco:industrial_iron_sheet"],
        ["create:refined_radiance", "kubejs:radiant_sheet"]
    ]
    dolesheetarray.forEach(i => {
        dolesheet(i[0], i[1])
    });

    // traintracks
    event.forEachRecipe({ output: /^railways\:track_/ }, r => {
        if (String(r.getOriginalRecipeResult().id) != "railways:track_coupler" && String(r.getOriginalRecipeResult().id) != "railways:track_switch_andesite" && String(r.getOriginalRecipeResult().id) != "railways:track_switch_brass" && String(r.getOriginalRecipeResult().id) != "railways:track_monorail") {
            let wood = String(r.getOriginalRecipeResult().id).replace("railways:track_", "")
            // port: Steam 'n' Rails 1.7 has tracks for many mods' woods ("bwg_aspen", "quark_azalea"...): the prefix is
            // the mod, the rest its wood; woods without a slab or an incomplete track keep Rails' own recipe.
            let woodId = wood.replace("white_mangrove", "mangrove")
            let sep = woodId.indexOf("_")
            let prefix = sep > 0 ? woodId.substring(0, sep) : ""
            if (prefix == "bwg" || prefix == "byg") { woodId = "biomeswevegone:" + woodId.substring(sep + 1) }
            else if (prefix && Platform.isLoaded(prefix)) { woodId = prefix + ":" + woodId.substring(sep + 1) }
            let nuggets = Ingredient.of('#create:funkynuggets')
            let count = 16
            if (!woodId.includes(":")) { woodId = "minecraft:" + woodId }
            // 1211: slab ids that do not follow "<wood id>_slab" in 1.21.1 (BWG names it white_mangrove, Quark names its
            // slabs "<wood>_planks_slab"; Rails' own stripped bamboo track recipe takes minecraft:bamboo_slab)
            let slabOverride = {
                "byg_white_mangrove": "biomeswevegone:white_mangrove",
                "quark_ancient": "quark:ancient_planks",
                "quark_azalea": "quark:azalea_planks",
                "quark_blossom": "quark:blossom_planks",
                "stripped_bamboo": "minecraft:bamboo"
            }
            // 1211: BYG is not on 1.21.1 and Biomes We've Gone has no nether woods, so these seven tracks have no slab to
            // assemble from. The original removed Rails' recipe for every track, so the stock one goes and nothing replaces it.
            let noSlabWoods = ["byg_bulbis", "byg_embur", "byg_ether", "byg_imparius", "byg_lament", "byg_nightshade", "byg_sythian"]
            if (noSlabWoods.indexOf(wood) >= 0) {
                event.remove({ output: String(r.getOriginalRecipeResult().id) })
                return
            }
            if (slabOverride[wood]) { woodId = slabOverride[wood] }
            let slabCheck = (wood == "ender" || wood == "tieless" || wood == "phantom") ? "minecraft:stone" : woodId + "_slab"
            // 1211: Item.of(unknownId) throws on 1.21 (it used to give an empty stack), so test with Item.exists
            if (!Item.exists(slabCheck) || !Item.exists('railways:track_incomplete_' + wood)) { return }
            event.remove({ output: String(r.getOriginalRecipeResult().id) })

            if (wood == "ender") {
                woodId = "minecraft:end_stone_brick"
                nuggets = "forbidden_arcanus:ender_pearl_fragment"
            }
            if (wood == "blackstone" || wood == "crimson" || wood == "warped") { nuggets = "minecraft:gold_nugget" }

            let slabs = woodId + '_slab'

            if (wood == "tieless") { slabs = "minecraft:glass_pane" }
            if (wood == "phantom") { slabs = "minecraft:phantom_membrane", count = 48 }

            let c = 'railways:track_incomplete_' + wood

            try {
                event.recipes.create.sequenced_assembly([
                    count + 'x ' + String(r.getOriginalRecipeResult().id)
                ], slabs, [
                    event.recipes.create.deploying(c, [c, nuggets]),
                    event.recipes.create.deploying(c, [c, nuggets]),
                    event.recipes.create.pressing(c, c)
                ]).transitionalItem(c).loops(1)
            } catch (e) {
                console.warn('track recipe for ' + wood + ' skipped: ' + e)
            }
        }
    })
    let c = "railways:track_incomplete_monorail"
    if (Item.exists("railways:track_monorail") && Item.exists(c)) { // 1211: Steam 'n' Rails moved to a new NeoForge page; the item ids are in the 1.21.1 registry
        event.remove({ output: "railways:track_monorail" })
        event.recipes.create.sequenced_assembly([
            '16x railways:track_monorail'
        ], "create:metal_girder", [
            event.recipes.create.deploying(c, [c, "create:metal_bracket"]),
            event.recipes.create.deploying(c, [c, "create:iron_sheet"]),
            event.recipes.create.pressing(c, c)
        ]).transitionalItem(c).loops(1)
    }

    event.remove({ id: 'create:sequenced_assembly/track' })
    c = 'create:incomplete_track'
    event.recipes.create.sequenced_assembly([
        '16x create:track',
    ], '#create:sleepers', [
        event.recipes.create.deploying(c, [c, Ingredient.of('#create:funkynuggets')]),
        event.recipes.create.deploying(c, [c, Ingredient.of('#create:funkynuggets')]),
        event.recipes.create.pressing(c, c)
    ]).transitionalItem(c).loops(1)



    const runicrelics = [['zombie_heart', '6x minecraft:rotten_flesh'], ['squid_beak', '3x minecraft:ink_sac'], ['rib_bone', '5x minecraft:bone'], ['catalyzing_gland', '4x minecraft:gunpowder'], ['chelicerae', '2x minecraft:spider_eye'], ['slime_pearl', '4x minecraft:slime_ball'], ['bat_wing', '2x minecraft:feather'], ['withered_rib', '2x cae:necrotic_bone'], ['molten_core', '2x minecraft:blaze_rod'], ['eye_of_the_storm', '2x minecraft:breeze_rod'], ['nebulous_heart', '3x minecraft:ender_eye'], ['frozen_core', '5x minecraft:snowball']]

    runicrelics.forEach(element => {
        // 1211: 'withered_rib' needs cae:necrotic_bone and 'eye_of_the_storm' minecraft:breeze_rod; entries naming an unregistered item are skipped
        if (!caeItemsKnown(['reliquary:' + element[0], element[1]])) { caeSkipped.push('runic relic ' + element[0]); return }
        event.shapeless('reliquary:' + element[0], [element[1], 'kubejs:runic_tablet'])
    });

    event.shapeless('create:blaze_burner', ['create:empty_blaze_burner', 'kubejs:runic_tablet'])



    // 1211: Create Crafts & Additions 1.7.2 liquid_burning is a Create 6 ProcessingRecipe: "input" {fluidTag, amount} ->
    // "ingredients": [{"type": "neoforge:tag", "tag", "amount"}], "burnTime" -> "burn_time", "results": [] (see
    // createaddition/recipe/liquid_burning/*.json in the mod); the conditions key is neoforge:conditions. forge:kerosene / forge:lpg
    // are c:kerosene / c:lpg (PNC 8.2 defines both under data/c/tags/fluid).
    event.custom({
        "type": "createaddition:liquid_burning",
        "neoforge:conditions": [
            {
                "fluidTag": "c:kerosene",
                "type": "createaddition:has_fluid_tag"
            }
        ],
        "ingredients": [
            {
                "type": "neoforge:tag",
                "tag": "c:kerosene",
                "amount": 1000
            }
        ],
        "results": [],
        "burn_time": 15000,
        "superheated": true
    })
    event.custom({
        "type": "createaddition:liquid_burning",
        "neoforge:conditions": [
            {
                "fluidTag": "c:lpg",
                "type": "createaddition:has_fluid_tag"
            }
        ],
        "ingredients": [
            {
                "type": "neoforge:tag",
                "tag": "c:lpg",
                "amount": 1000
            }
        ],
        "results": [],
        "burn_time": 15000,
        "superheated": true
    })






    //start of the multicut shit
    let multicut = (outputs, input, remove_old) => {
        outputs.forEach(output => {
            // 1211: skip entries naming an unregistered item (Item.of would throw); their stock recipe stays
            if (!caeItemsKnown([output, input])) { caeSkipped.push('multicut ' + output); return }
            // port: stacks are inspected with Item.of(...).id/.count (ItemStack.toString() changed in 1.20)
            let out = Item.of(output)
            if (remove_old) {
                event.remove({ output: out.id })
            };
            event.stonecutting(out, input)
            if (remove_old) {
                event.recipes.create.compacting(input, [out, "kubejs:radiant_mechanism"])
            }
            wrencharray.push(Item.of(out.id))
        });
    };
    const andesite_machines_cutting = [
        '2x create:portable_storage_interface',
        '2x create:mechanical_harvester',
        '2x create:mechanical_plough',
        '4x create:andesite_funnel',
        '4x create:andesite_tunnel',
        '2x create:weighted_ejector',
        //Item.of('alloyedguns:basic_gun_kit'),
        'createaddition:rolling_mill'

    ];
    multicut(andesite_machines_cutting, "kubejs:andesite_machine", true);


    //smithin
    // port: 1.20.1 smithing needs a template item, so these became shapeless crafting recipes (base + addition).
    let smithing = (output, base, addition) => {
        let ing = s => {
            let str = (typeof s == 'string') ? s : Item.of(s).id
            str = String(str).replace(/^\d+x /, '')
            return str
        }
        let out = Item.of(output)
        event.shapeless(out, [String(ing(base)), String(ing(addition))])
    }
    let machine_smithing = (recipes, machine, remove_old) => {
        recipes.forEach(entry => {
            // 1211: skip entries naming an unregistered item (Item.of would throw); their stock recipe stays
            if (!caeItemsKnown([entry[1], entry[0], machine])) { caeSkipped.push('machine ' + entry[1]); return }
            // port: stacks are inspected with Item.of(...).id/.count (ItemStack.toString() changed in 1.20)
            let out = Item.of(entry[1])
            if (remove_old) {
                event.remove({ output: out.id })
            };
            smithing(out, machine, entry[0])
            // port: a tag can't be a recipe output, so the un-smithing (compacting) recipe is skipped for tag additions
            if (remove_old && !(typeof entry[0] == 'string' && entry[0].startsWith('#'))) {
                // 1211: Item.of(x).withChance(0.4) is CreateItem.of(x, 0.4)
                event.recipes.create.compacting([machine, CreateItem.of(entry[0], 0.4)], [out, "kubejs:radiant_mechanism"])
            }
            if (out.count == 1) {
                if (out.block != null) { // 1211: ItemStack.isBlock() is gone; block is null for items that are not block items
                    event.recipes.create.item_application(out, [machine, tagIngredient(entry[0])])
                }
            } else {
                event.recipes.create.deploying(out, [machine, tagIngredient(entry[0])])
            }

            wrencharray.push(Item.of(out.id))

        });
    };


    // 1211: thermal:rf_coil became Mekanism's electromagnetic coil, whose own recipe needs an energy tablet (infused alloy,
    // i.e. the radiant-tier metallurgic infuser), so the generator rows below were dead until then. The coil is used
    // nowhere else, so it gets the RF Coil's recipe (thermal_foundation 1.18.2 rf_coil.json: 1 gold ingot, 2 redstone).
    event.remove({ id: 'mekanismgenerators:electromagnetic_coil' })
    event.shaped('mekanismgenerators:electromagnetic_coil', ['  R', ' I ', 'R  '], { I: '#c:ingots/gold', R: '#c:dusts/redstone' })
        .id('cae:rf_coil')
    const andesite_smithing = [
        ["cae:drill_head", "create:mechanical_drill"], // 1211: thermal
        ["cae:saw_blade", "create:mechanical_saw"], // 1211: thermal
        ["mekanismgenerators:electromagnetic_coil", "mekanismgenerators:bio_generator"], // 1211: thermal
        ["create:propeller", "create:encased_fan"],
        ["minecraft:iron_block", 'create:mechanical_press'],
        ["create:whisk", 'create:mechanical_mixer'],
        ['create:brass_hand', 'create:deployer'],
        ["minecraft:bucket", "cae:device_tree_extractor"], // 1211: thermal
        ['minecraft:compass', 'ae2:meteorite_compass'],
        ['createaddition:copper_rod', '4x createaddition:connector'],
        ['createaddition:capacitor', 'createaddition:alternator']

    ];
    machine_smithing(andesite_smithing, "kubejs:andesite_machine", true);
    const brass_smithing = [
        ["minecraft:crafting_table", '3x create:mechanical_crafter'],
        ["minecraft:glowstone_dust", 'torchmaster:feral_flare_lantern'],
        ["mekanismgenerators:electromagnetic_coil", 'mekanismgenerators:solar_generator'], // 1211: thermal
        ['#ae2:all_fluix', 'createaddition:tesla_coil'],
        ["createaddition:capacitor", "createaddition:modular_accumulator"],
        ['createaddition:connector', "createaddition:portable_energy_interface"],
        ['create:rotation_speed_controller', "createaddition:electric_motor"],
        // port: step 5 (Multiblocked2)
        //         ['cae:silver_coin', Item.of('custommachinery:custom_machine_item', '{machine:"quests:quest_station"}')],
        ['#functionalstorage:drawer', 'functionalstorage:storage_controller']

    ];
    machine_smithing(brass_smithing, "kubejs:brass_machine", true)
    const brass_machines_cutting = [
        '2x create:sequenced_gearshift',
        'create:rotation_speed_controller',
        'create:mechanical_arm',
        '2x create:stockpile_switch',
        '2x create:content_observer',
        '2x create:stockpile_switch',
        '4x create:brass_funnel',
        '4x create:brass_tunnel',
        '2x create:display_link',
        '6x create:display_board'
    ];
    const brass_redstone = [
        '4x create:redstone_link',
        '2x create:powered_toggle_latch',
        '2x create:powered_latch',
        '2x create:pulse_extender',
        '2x create:pulse_repeater',
        '2x minecraft:repeater',
        '2x minecraft:comparator',
        '2x minecraft:daylight_detector'
    ]
    multicut(brass_redstone, 'kubejs:brass_machine', false)
    multicut(brass_machines_cutting, "kubejs:brass_machine", true)

    const copper_machines_cutting = [
        '2x create:smart_fluid_pipe',
        'create:hose_pulley',
        '2x create:portable_fluid_interface',
        //Item.of('alloyedguns:advanced_gun_kit'),
        '3x create:steam_engine',


    ];
    const copper_smithing = [
        ["minecraft:copper_block", 'create:copper_backtank'],
        ["minecraft:hopper", '2x create:spout'],
        ["minecraft:iron_bars", 'create:item_drain'],
        ["mekanismgenerators:electromagnetic_coil", 'mekanismgenerators:heat_generator'], // 1211: thermal
        ["minecraft:bucket", 'mekanism:electric_pump'], // 1211: thermal
        // 1211: Thermal's Batch Composter, Aquatic Entangler, Hive Hopper and Tinker's Workbench, real blocks of the core mod
        // (com.caeport.cae.device); the original had all four on these casings (copper_smithing)
        ["minecraft:crafting_table", 'cae:tinker_bench'],
        ["minecraft:composter", 'cae:device_composter'],
        ["minecraft:fishing_rod", 'cae:device_fisher'],
        ["minecraft:shears", 'cae:device_hive_extractor'],
        ['create:fluid_tank', 'mekanism:basic_fluid_tank'], // 1211: thermal
        ['createmetallurgy:gauge_attachment', '2x createmetallurgy:foundry_basin'], // 1211: tinkers
        ['minecraft:obsidian', '2x functionalstorage:void_upgrade'],
        ['minecraft:redstone', 'mekanism:basic_tier_installer'] // 1211: thermal

    ];
    multicut(copper_machines_cutting, "kubejs:sealed_machine", true)
    machine_smithing(copper_smithing, "kubejs:sealed_machine", true)
    const sturdy_smithing = [
        ["minecraft:lever", 'create:controls'],
        ["minecraft:observer", '2x create:track_observer'],
        ['createaddition:capacitor', 'mekanism:basic_energy_cube'], // 1211: thermal
        ["minecraft:compass", '2x create:track_station'],
        ["create:electron_tube", '4x create:track_signal'],
        ['minecraft:redstone', 'mekanism:advanced_tier_installer'], // 1211: thermal
        ['#c:glass_blocks', "8x pneumaticcraft:thermal_lagging"],
        ['mekanismgenerators:electromagnetic_coil', 'mekanismgenerators:advanced_solar_generator'], // 1211: thermal
        ['pneumaticcraft:turbine_rotor', 'pneumaticcraft:fluid_mixer'],
        ['minecraft:furnace', 'pneumaticcraft:air_compressor'],
        ['pneumaticcraft:small_tank', 'pneumaticcraft:liquid_compressor'],
        ['create:blaze_burner', 'pneumaticcraft:thermal_compressor'],
        ['minecraft:diamond', 'pneumaticcraft:refinery_output'],
        ['create:precision_mechanism', 'pneumaticcraft:refinery'],
        ['pneumaticcraft:drill_pipe', 'pneumaticcraft:gas_lift'],
        ['create:basin', 'pneumaticcraft:thermopneumatic_processing_plant'],
        // 1211: Compressed Creativity has no 1.21.1 build, but the core mod registers its heater under the old id, so this one is made
        ["create:blaze_burner", "compressedcreativity:heater"]
    ];
    const sturdy_cutting = [
        '4x pneumaticcraft:turbine_blade',
        "8x pneumaticcraft:heat_pipe",
        "2x railways:track_coupler"

    ]
    const sturdy_cutting2 = [
        '16x pneumaticcraft:pressure_tube',
        '4x pneumaticcraft:manual_compressor'
    ]
    machine_smithing(sturdy_smithing, "kubejs:sturdy_machine", true)
    multicut(sturdy_cutting, "kubejs:sturdy_machine", true)
    multicut(sturdy_cutting2, "kubejs:sturdy_machine", false)
    const plastic_machines_smithing = [
        // 1211: Compressed Creativity has no 1.21.1 build, so these four are skipped by caeItemsKnown (stock recipes stay)
        ['pneumaticcraft:reinforced_pressure_tube', 'compressedcreativity:industrial_air_blower'],
        ['create:copper_casing', 'compressedcreativity:air_blower'],
        ['compressedcreativity:engine_rotor', 'compressedcreativity:compressed_air_engine'],
        ['create:brass_casing', 'compressedcreativity:rotational_compressor'],
        ['minecraft:glass_bottle', 'cae:device_potion_diffuser'], // 1211: Thermal's Decoctive Diffuser, a real block of the core mod
        ['minecraft:ender_pearl', 'cae:device_collector'], // 1211: Thermal's Vacuumulator (thermal:device_collector), rebuilt in the core mod
        ['minecraft:piston', 'cae:device_rock_gen'], // 1211: thermal
        ['minecraft:redstone', 'mekanism:elite_tier_installer'], // 1211: thermal
        ['create:gantry_carriage', 'pneumaticcraft:elevator_base'],
        ['create:precision_mechanism', 'pneumaticcraft:programmer'],
        ['kubejs:runic_tablet', 'pneumaticcraft:electrostatic_compressor'],
        ['pneumaticcraft:cannon_barrel', 'pneumaticcraft:air_cannon'],
        ['pneumaticcraft:liquid_compressor', 'pneumaticcraft:advanced_liquid_compressor'],
        ['pneumaticcraft:air_compressor', 'pneumaticcraft:advanced_air_compressor'],
        ['minecraft:hopper', 'pneumaticcraft:omnidirectional_hopper'],
        ['pneumaticcraft:small_tank', 'pneumaticcraft:liquid_hopper'],
        ['mekanismgenerators:electromagnetic_coil', 'pneumaticcraft:pneumatic_dynamo'], // 1211: thermal
        ['minecraft:ender_eye', 'pneumaticcraft:vacuum_trap'],
        ['pneumaticcraft:printed_circuit_board', 'pneumaticcraft:pressurized_spawner'],
        // port: Spirit is gone; Forbidden & Arcanus' spawner scrap stands in for its broken spawner.
        ['forbidden_arcanus:spawner_scrap', 'pneumaticcraft:spawner_agitator'],
        ['pneumaticcraft:solar_cell', 'pneumaticcraft:solar_compressor']
    ]
    const plastic_cutting = [
        "pneumaticcraft:charging_station"
    ]
    event.remove({ id: "ae2:vibration_chamber" })
    event.remove({ id: "ae2:growth_accelerator" })
    // 1211: glassential:glass_ghostly comes from Glassential Renewed (new NeoForge page; the id is in the 1.21.1 registry); replaceInput throws on an unknown item
    if (Item.exists("glassential:glass_ghostly")) {
        event.replaceInput({ id: "forbidden_arcanus:utrem_jar" }, "#c:glass_blocks/colorless", "glassential:glass_ghostly")
    }


    multicut(plastic_cutting, 'kubejs:plastic_machine', true)
    machine_smithing(plastic_machines_smithing, "kubejs:plastic_machine", true)
    const invar_machines_smithing = [
        ['minecraft:glowstone_dust', 'ae2:semi_dark_monitor'],
        ['minecraft:redstone_block', 'ae2:energy_acceptor'],
        ["mekanism:formulaic_assemblicator", 'ae2:crafting_terminal'], // 1211: thermal
        ['ae2:crafting_terminal', 'ae2:wireless_crafting_terminal'],
        ['ae2:terminal', 'ae2:wireless_terminal'],
        ['ae2:wireless_terminal', 'ae2:wireless_crafting_terminal'],
        ["ae2:fluix_pearl", "ae2:condenser"],
        ["minecraft:chest", "ae2:chest"],
        ['integratedterminals:part_terminal_storage', 'ae2:terminal'],
        ["mekanismgenerators:electromagnetic_coil", "mekanismgenerators:gas_burning_generator"], // 1211: thermal
        // 1211: Thermal's Magma Crucible (nether bricks), Blast Chiller (packed ice) and Fluid Encapsulator (bucket) have no
        // row: their stand-ins (Metallurgy's industrial crucible and casting table, Create's spout) are made earlier,
        // the first two ungated like the Tinkers smeltery and casting table they also replace, the spout on the copper
        // table. A radiant row would delete those recipes, and the spout's un-smithing would turn spouts into radiant machines.
        ["minecraft:bricks", "mekanism:energized_smelter"], // 1211: thermal
        ["minecraft:blaze_rod", "mekanism:resistive_heater"], // 1211: thermal
        ["minecraft:compass", "mekanism:isotopic_centrifuge"], // 1211: thermal
        ['#c:glass_blocks', "pneumaticcraft:refinery"], // 1211: thermal
        ["minecraft:flint", "mekanism:crusher"], // 1211: thermal
        ["minecraft:blast_furnace", "mekanism:metallurgic_infuser"], // 1211: thermal
        ["cae:saw_blade", "mekanism:precision_sawmill"], // 1211: thermal
        ["minecraft:brewing_stand", "mekanism:chemical_infuser"], // 1211: thermal
        ["minecraft:dirt", "mekanism:combiner"], // 1211: thermal
        ["minecraft:quartz", "mekanism:chemical_crystallizer"], // 1211: thermal
        ['minecraft:cactus', 'cae:device_nullifier'], // 1211: Thermal's Nullifier, a real block of the core mod
        ['#functionalstorage:drawer', "functionalstorage:controller_extension"],
        ["create:mechanical_press", "mekanism:osmium_compressor"], // 1211: thermal
        ["minecraft:crafting_table", "mekanism:formulaic_assemblicator"], // 1211: thermal
        ['create:precision_mechanism', 'pneumaticcraft:assembly_controller'],
        ['pneumaticcraft:pneumatic_cylinder', 'pneumaticcraft:assembly_laser'],
        ['create:mechanical_drill', 'pneumaticcraft:assembly_drill'],
        ['create:mechanical_arm', 'pneumaticcraft:assembly_io_unit_export'],
        ['create:deployer', 'pneumaticcraft:assembly_io_unit_import'],
        ['create:depot', 'pneumaticcraft:assembly_platform']
    ]
    event.remove({ id: 'integrateddynamics:crafting/logic_director' })
    event.remove({ id: "ae2:network/cables/glass_fluix" })
    event.remove({ id: "ae2:network/cables/covered_fluix" })
    event.remove({ id: "ae2:network/cables/smart_fluix" })
    event.shapeless("3x ae2:fluix_smart_cable", ["ae2:fluix_covered_cable", "redstone", "glowstone_dust"])
    event.remove({ id: "ae2:network/cables/dense_smart_fluix" })
    event.shapeless("3x ae2:fluix_smart_dense_cable", ["ae2:fluix_covered_dense_cable", "redstone", "glowstone_dust"])

    event.shapeless("12x ae2:fluix_glass_cable", ["2x ae2:fluix_crystal", "ae2:quartz_fiber"])
    event.recipes.create.filling("ae2:fluix_covered_cable", ["ae2:fluix_glass_cable", Fluid.of("pneumaticcraft:plastic", 90)])
    machine_smithing(invar_machines_smithing, "kubejs:radiant_machine", true)
    const integrational_smithing = [

        ['mekanismgenerators:electromagnetic_coil', 'mekanismgenerators:wind_generator'], // 1211: thermal
        ['integrateddynamics:part_display_panel', 'integratedterminals:part_terminal_storage'],
        ['minecraft:crafting_table', 'integratedterminals:part_terminal_crafting_job'],
        ['integrateddynamics:part_static_light_panel', 'integrateddynamics:part_display_panel'],
        ['minecraft:clock', 'integrateddynamics:delay'],
        ['integrateddynamics:drying_basin', 'integrateddynamics:mechanical_drying_basin'],
        ['integrateddynamics:squeezer', 'integrateddynamics:mechanical_squeezer'],
        ['integrateddynamics:variable', 'integrateddynamics:materializer'],
        ['integrateddynamics:variablestore', 'integrateddynamics:proxy'],
        ['minecraft:chest', 'integrateddynamics:variablestore'],

        ['integrateddynamics:variable_transformer_input', 'integratednbt:nbt_extractor']

    ]
    const integrational_manual = [
        ['createaddition:modular_accumulator', 'integrateddynamics:energy_battery']
    ]
    machine_smithing(integrational_manual, 'kubejs:integrational_machine', false)
    const radiant_cutting = [
        //Item.of('alloyedguns:complex_gun_kit')
    ]
    if (CAE_THERMAL) { // 1211: thermal
        event.replaceInput({ id: "create:crafting/kinetics/elevator_pulley" }, 'minecraft:dried_kelp_block', 'cae:cured_rubber_block')
    }
    event.replaceInput({ id: "create:crafting/kinetics/train_door" }, "create:brass_sheet", "create:sturdy_sheet")
    event.remove({ id: "ars_creo:starbuncle_wheel" })
    event.shaped("ars_creo:starbuncle_wheel", ["XXX", "XWX", "XXX"], { X: "ars_nouveau:starbuncle_shards", W: "create:water_wheel" })
    event.replaceInput({ id: "create:crafting/kinetics/train_trapdoor" }, "create:brass_sheet", "create:sturdy_sheet")

    event.replaceInput({}, "ae2:sky_stone_block", "#cae:skystone")

    //event.recipes.create.deploying('ars_nouveau:magebloom_crop',['#c:seeds','kubejs:runic_tablet'])
    multicut(radiant_cutting, "kubejs:radiant_machine", true)
    // 1211: Modern Train Parts 0.2.5 is back; its item ids are moderntrainparts:<color>_container (jar lang/models)
    let containercolors = [
        'black', 'blue', 'brown', 'cyan', 'gray', 'green', 'light_blue', 'light_gray', 'lime', 'magenta', 'orange', 'pink', 'purple', 'red', 'white', 'yellow'
    ]
    containercolors.forEach(i => {
        if (!Item.exists('moderntrainparts:' + i + '_container')) { return }
        event.remove({ output: 'moderntrainparts:' + i + '_container' })
        event.shapeless('3x moderntrainparts:' + i + '_container', ['minecraft:' + i + '_dye', 'create:item_vault', 'create:item_vault'])
    });
    machine_smithing(integrational_smithing, 'kubejs:integrational_machine', true)
    const integrational_cutting = [
        '4x integrateddynamics:variable_transformer_output',
        '4x integrateddynamics:variable_transformer_input',
        '4x integrateddynamics:part_static_light_panel',
        'integrateddynamics:logic_programmer',
        'integrateddynamics:portable_logic_programmer',
        '4x integrateddynamics:cable'
    ]

    multicut(integrational_cutting, "kubejs:integrational_machine", true)
    event.remove({ id: "create_sa:quartz_gem_crushing" })
    event.remove({ id: "create_sa:magma_cream_recipe" })
    event.remove({ id: "create_sa:netherrack_recipe" })
    event.remove({ id: "create_sa:incomplete_web_recipe" })
    event.remove({ id: "create_sa:incomplete_book_recipe" })
    event.replaceInput({ id: 'create:mechanical_crafting/wand_of_symmetry' }, 'minecraft:ender_pearl', "create:refined_radiance")
    // 1211: Create Stuff & Additions 1.21 - replaceInput throws on an item that is not registered, so check each (all in the 1.21.1 registry)
    if (Item.exists("create_sa:hydraulic_engine")) { event.replaceInput({}, "create_sa:hydraulic_engine", "kubejs:sealed_mechanism") }
    if (Item.exists("create_sa:steam_engine")) { event.replaceInput({}, "create_sa:steam_engine", "create:precision_mechanism") }
    if (Item.exists("create_sa:heat_engine")) { event.replaceInput({}, "create_sa:heat_engine", "#create:kinetic_mechanisms") }
    event.replaceInput({ id: 'create:mechanical_crafting/wand_of_symmetry' }, 'create:precision_mechanism', "kubejs:radiant_mechanism")

    event.remove({ id: 'integrateddynamics:crafting/coal_generator' })
    event.replaceInput({ id: "ae2:network/cells/item_storage_components_cell_1k_part" }, "ae2:logic_processor", "kubejs:time_mechanism")
    event.replaceInput({ id: "ae2:network/cells/item_storage_components_cell_4k_part" }, "ae2:calculation_processor", "kubejs:time_mechanism")

    event.remove({ id: "ae2:network/parts/terminals_pattern_encoding" })
    event.shapeless("ae2:pattern_encoding_terminal", ["ae2:crafting_terminal", "4x pneumaticcraft:printed_circuit_board"])
    const timesmithing = [
        ['mekanismgenerators:electromagnetic_coil', 'mekanismgenerators:rotational_complex'], // 1211: thermal
        ['ae2:chest', 'ae2:drive'],
        ['pneumaticcraft:printed_circuit_board', 'ae2:pattern_provider'],
        ['ae2:engineering_processor', 'ae2:molecular_assembler'],
        ['ae2:calculation_processor', 'ae2:advanced_card'],
        ['minecraft:piston', 'ae2:storage_bus'],
        ['create:portable_storage_interface', 'ae2:io_port'],
        ['ae2:logic_processor', 'ae2:crafting_unit'],
        ['create:brass_funnel', 'ae2:interface'],
        ['minecraft:smithing_table', 'ae2:cell_workbench'],
        ['ae2:wireless_receiver', 'ae2:wireless_access_point'],
        ["waystones:warp_stone", "waystones:waystone"],
        ["waystones:warp_stone", "waystones:mossy_waystone"],
        ["waystones:warp_stone", "waystones:sandy_waystone"]
    ]
    event.remove({ id: "waystones:warp_stone" })

    const timecutting = [
        "4x ae2:formation_core",
        "ae2:wireless_booster",
        "ae2:cell_workbench",
        "6x ae2:basic_card",
        "4x ae2:annihilation_core",

        "ae2:controller",

        "ae2:inscriber"
    ]
    /*event.remove({output:'computercraft:wireless_modem_normal'})
    event.remove({output:'computercraft:wireless_modem_advanced'})*/

    multicut(timecutting, 'kubejs:time_machine', true)

    event.replaceInput({ id: 'ae2:network/cables/covered_fluix' }, '#minecraft:occludes_vibration_signals', 'minecraft:string')
    event.recipes.create.deploying('2x ae2:engineering_processor', ['ae2:printed_engineering_processor', 'pneumaticcraft:printed_circuit_board'])
    event.recipes.create.deploying('2x ae2:calculation_processor', ['ae2:printed_calculation_processor', 'pneumaticcraft:printed_circuit_board'])
    event.recipes.create.deploying('2x ae2:logic_processor', ['ae2:printed_logic_processor', 'pneumaticcraft:printed_circuit_board'])
    event.shapeless('ae2:fluix_covered_cable', ['#ae2:covered_cable', '#ae2:can_remove_color'])

    event.shapeless('ae2:semi_dark_monitor', 'ae2:dark_monitor')
    machine_smithing(timesmithing, 'kubejs:time_machine', true)


    const supercriticalcutting = [
        '2x entangled:block',
        // port (1.21.1): the particle accelerator's entity part (was multiblocked:entity) is the MBD2 entity hatch
        'cae:entity_output_hatch'
    ]
    multicut(supercriticalcutting, 'kubejs:supercritical_machine', true)
    const supercriticalmachining = [
        ['minecraft:nether_star', 'pneumaticcraft:aerial_interface']
    ]
    event.recipes.create.mixing('2x kubejs:supercritical_mechanism', ['2x pneumaticcraft:printed_circuit_board', 'forbidden_arcanus:eternal_stella']).superheated()

    machine_smithing(supercriticalmachining, 'kubejs:supercritical_machine', true)

    event.remove({ id: "pneumaticcraft:compressed_iron_block_from_ingot" })
    event.shapeless('pneumaticcraft:compressed_iron_block', "9x pneumaticcraft:ingot_iron_compressed")
    event.remove({ id: "ae2:network/blocks/quantum_ring" })

    //this is where the fun begins
    //also thanks for simibubi code here
    event.replaceInput({}, "pneumaticcraft:ingot_iron_compressed", "create:sturdy_sheet")
    event.remove({ id: "ae2:smelting/silicon_from_certus_quartz_dust" })
    event.replaceInput({ id: "createaddition:mixing/bioethanol" }, "create:cinder_flour", "minecraft:sugar")
    event.replaceInput({}, '#c:plates/iron', "create:iron_sheet")
    event.replaceInput({}, '#c:plates/gold', "create:golden_sheet")

    // 1211: no bronze in this pack: drop every recipe that makes bronze (Mekanism's, Alloyed's ingot, sheet, blocks, casing
    // and bell, Create: Metallurgy's molten bronze) before bronze inputs become copper below. Otherwise a copper ingot in a
    // press also matched Alloyed's bronze sheet recipe, and copper made bronze blocks, casings and molten bronze.
    // Mekanism's are hidden in JEI by client_scripts/jeiHideItems.js.
    // caetools is left out: its amethyst bronze is copper and amethyst, not bronze, and nothing of its makes plain bronze
    event.remove({ output: /bronze/, not: { mod: 'caetools' } })
    ;['alloying/bronze', 'bulk_melting/bronze/block', 'bulk_melting/bronze/raw_block', 'casting_in_basin/bronze/block',
        'casting_in_table/bronze/gear', 'casting_in_table/bronze/ingot', 'casting_in_table/bronze/nugget',
        'casting_in_table/bronze/plate', 'casting_in_table/bronze/rod', 'melting/bronze/coin', 'melting/bronze/dirty_dust',
        'melting/bronze/dust', 'melting/bronze/gear', 'melting/bronze/ingot', 'melting/bronze/nugget', 'melting/bronze/plate',
        'melting/bronze/raw_material', 'melting/bronze/rod', 'melting/bronze/wire'
    ].forEach(id => event.remove({ id: 'createmetallurgy:' + id }))
    // not in caetools: its bronze tool material would take copper ingots too, so copper could become bronze parts
    event.replaceInput({ not: { mod: 'caetools' } }, '#c:ingots/bronze', "minecraft:copper_ingot")
    event.replaceInput({ not: { mod: 'caetools' } }, '#c:nuggets/bronze', "create:copper_nugget")
    if (CAE_THERMAL) { // 1211: thermal
        event.replaceInput({}, '#c:dusts/iron', "mekanism:dust_iron")
        event.replaceInput({}, '#c:dusts/copper', "mekanism:dust_copper")
    }
    event.replaceInput({}, '#c:plates/copper', "create:copper_sheet")
    if (CAE_THERMAL) { // 1211: thermal
        event.replaceOutput({}, '#c:nuggets/silver', "cae:silver_nugget")
        event.replaceOutput({}, '#c:ingots/silver', "cae:silver_ingot")
        event.replaceOutput({}, '#c:storage_blocks/silver', "cae:silver_block")
    }
    // 1211: Item.of(x, 1).withChance(0.25) is CreateItem.of(x, 0.25)
    event.recipes.create.splashing(CreateItem.of("minecraft:clay_ball", 0.25), Ingredient.of('#c:sands'))
    event.remove({ id: "create:splashing/sand" })
    // 1211: checked again. Ars Nouveau 5.13.3 only ships orphan models/textures for end_fiber and blaze_fiber; neither item is
    // registered (absent from the 1.21.1 item list, only ars_nouveau:magebloom_fiber exists), so this mixing can't exist.
    //     event.recipes.create.mixing('3x ars_nouveau:end_fiber', ['3x ars_nouveau:blaze_fiber', Fluid.of("integrateddynamics:liquid_chorus", 200)])
    let woodcutting = (mod, log, planks, slab) => {
        event.recipes.create.cutting([mod + ":stripped_" + log], mod + ":" + log).processingTime(50)
        // 1211: count-prefixed strings instead of Item.of(id, n), which throws for an unregistered item
        event.recipes.create.cutting(['6x ' + mod + ":" + planks], mod + ":stripped_" + log).processingTime(50)
        event.recipes.create.cutting(['2x ' + mod + ":" + slab], mod + ":" + planks).processingTime(50)
    }

    // port: forbidden_arcanus cherrywood is aurum in 1.20.1
    woodcutting("forbidden_arcanus", "aurum_log", "aurum_planks", "aurum_slab")

    let woodcuttingfuckyouid = (mod, log, planks, slab) => {
        event.recipes.create.cutting([mod + ":" + log + "_stripped"], mod + ":" + log).processingTime(50)
        event.recipes.create.cutting(['6x ' + mod + ":" + planks], mod + ":" + log + "_stripped").processingTime(50)
        event.recipes.create.cutting(['2x ' + mod + ":" + slab], mod + ":" + planks).processingTime(50)
    }
    woodcuttingfuckyouid("integrateddynamics", "menril_log", "menril_planks", "menril_slab")
    // port: mysterywood (edelwood in 1.20.1) has no stripped log; recipe dropped
    woodcutting("architects_palette", "twisted_log", "twisted_planks", "twisted_slab")
    //ae2 begin:
    // 1211: PneumaticCraft 8.2 fluid_mixer JSON (flat fluid inputs, "id" outputs, both outputs required)
    event.custom({
        "type": "pneumaticcraft:fluid_mixer",
        "input1": {
            "fluid": 'kubejs:magebloom_juice',
            "amount": 400
        },
        "input2": {
            "fluid": 'kubejs:sourceberry_juice',
            "amount": 400
        },
        "fluid_output": {
            "id": 'kubejs:magebloom_sourceberry_smoothie',
            "amount": 800
        },
        "item_output": {},
        "pressure": 3.0,
        "time": 60
    })
    // 1211: Immersive Weathering moved to "Renewed" (new page); replaceOutput throws on an unregistered item, so check it exists (it is in the 1.21.1 registry)
    if (Item.exists("immersive_weathering:vitrified_sand")) {
        event.replaceOutput({}, "immersive_weathering:vitrified_sand", "minecraft:glass")
    }
    function bookgate(item, ingredients) {
        event.remove({ id: `ars_nouveau:${item}_spell_book` })
        // 1211: Ars Nouveau 5's ids: <tier>_book_upgrade (was <tier>_spell_book_upgrade) and a second novice recipe
        event.remove({ id: `ars_nouveau:${item}_book_upgrade` })
        if (item == 'novice') event.remove({ id: 'ars_nouveau:novice_spellbook_alt' })
        event.shapeless(`ars_nouveau:${item}_spell_book`, ingredients)
    }
    bookgate('novice', ['minecraft:book', 'kubejs:sourcegem_fragments'])
    // port: restored, tiab:time_in_a_bottle is back (core mod); bookgate() also removes the default apprentice recipes
    bookgate('apprentice', ['ars_nouveau:novice_spell_book', 'tiab:time_in_a_bottle'])
    bookgate('archmage', ['ars_nouveau:apprentice_spell_book', 'forbidden_arcanus:eternal_stella', 'ars_nouveau:wilden_tribute'])


    // port: the villager trade removal moved out of this recipes handler (MoreJS.villagerTrades, below)
    event.forEachRecipe({ output: 'reliquary:alkahestry_tome' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.forEachRecipe({ input: 'reliquary:alkahestry_tome' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.forEachRecipe({ id: 'reliquary:alkahestry/charging/redstone' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.forEachRecipe({ id: 'reliquary:alkahestry/charging/glowstone' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.forEachRecipe({ id: 'reliquary:alkahestry/charging/glowstone_dust' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.forEachRecipe({ id: 'reliquary:alkahestry/charging/redstone_block' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.forEachRecipe({ id: 'reliquary:alkahestry/drain/redstone' }, recipe => {
        recipe.id(recipe.getOrCreateId() + '_manual_only')
    })
    event.remove({ id: "reliquary:alkahestry/crafting/netherrack" })
    let alkahestryshit = [
        'sand',
        'sandstone',
        'iron_ingot',
        'lapis_lazuli',
        'diamond',
        'clay',
        'end_stone',
        'dirt',
        'flint',
        'gravel',
        'soul_sand',
        'obsidian',
        'nether_star',
        'charcoal',
        'gold_ingot',
        'silver_ingot',
        'gunpowder',
        'tin_ingot',
        'emerald',
        'steel_ingot',
        'copper_ingot'

    ]
    alkahestryshit.forEach(i => {
        event.forEachRecipe({ id: `reliquary:alkahestry/crafting/${i}` }, recipe => {
            recipe.id(recipe.getOrCreateId() + '_manual_only')
        })
    });
    event.remove({ output: 'create:tree_fertilizer' })
    function machineration(Mechanism, Casing) {
        event.shaped("kubejs:" + Mechanism + "_machine", [
            'SSS',
            'SCS',
            'SSS'
        ], {
            C: Casing,
            S: "kubejs:" + Mechanism + "_mechanism"
        }).id("wrenchation" + Mechanism)
    }
    if (CAE_THERMAL) { // 1211: thermal (the radiant machine's casing is mekanism:steel_casing)
        machineration('radiant', 'mekanism:steel_casing')
    }
    event.remove({ mod: 'integrateddynamics', output: "minecraft:netherrack" })
    event.remove({ output: 'functionalstorage:ender_drawer' })
    event.remove({ output: /^functionalstorage\:fluid_/ })
    machineration('integrational', 'cae:gold_casing')
    machineration('plastic', 'cae:zinc_casing')
    machineration('time', 'cae:enderium_casing')
    machineration('supercritical', 'cae:supercritical_casing')

    // 1211: forge:stripped_wood is c:stripped_woods (renamed), forge:stripped_logs is c:stripped_logs, forge:plates/* is c:plates/*
    if (CAE_THERMAL) { // 1211: thermal (cae:enderium_ingot)
        event.recipes.create.item_application('cae:enderium_casing', [Ingredient.of('#c:stripped_logs'), "cae:enderium_ingot"])


        event.recipes.create.deploying('cae:enderium_casing', [Ingredient.of('#c:stripped_logs'), "cae:enderium_ingot"])
        event.recipes.create.item_application('cae:enderium_casing', [Ingredient.of('#c:stripped_woods'), "cae:enderium_ingot"])
        event.recipes.create.deploying('cae:enderium_casing', [Ingredient.of('#c:stripped_woods'), "cae:enderium_ingot"])
    }
    event.recipes.create.item_application('cae:zinc_casing', [Ingredient.of('#c:stripped_logs'), Ingredient.of('#c:plates/zinc')])
    event.recipes.create.deploying('cae:zinc_casing', [Ingredient.of('#c:stripped_logs'), Ingredient.of('#c:plates/zinc')])
    event.recipes.create.item_application('cae:zinc_casing', [Ingredient.of('#c:stripped_woods'), Ingredient.of('#c:plates/zinc')])
    event.recipes.create.deploying('cae:zinc_casing', [Ingredient.of('#c:stripped_woods'), Ingredient.of('#c:plates/zinc')])

    function casineration(o, I, i) {
        event.recipes.create.item_application(o, [tagIngredient(i), I])
        event.recipes.create.deploying(o, [tagIngredient(i), I])
    }

    casineration("create:refined_radiance_casing", 'create:refined_radiance', '#c:stripped_woods')
    casineration("create:refined_radiance_casing", 'create:refined_radiance', '#c:stripped_logs')
    casineration("create:shadow_steel_casing", 'create:shadow_steel', '#c:stripped_woods')
    casineration("create:shadow_steel_casing", 'create:shadow_steel', '#c:stripped_logs')
    casineration("cae:supercritical_casing", "create:refined_radiance_casing", "create:shadow_steel_casing")

    event.recipes.create.item_application('cae:gold_casing', [Ingredient.of('#c:stripped_logs'), Ingredient.of('#c:plates/gold')])
    event.recipes.create.deploying('cae:gold_casing', [Ingredient.of('#c:stripped_logs'), Ingredient.of('#c:plates/gold')])
    event.recipes.create.item_application('cae:gold_casing', [Ingredient.of('#c:stripped_woods'), Ingredient.of('#c:plates/gold')])
    event.recipes.create.deploying('cae:gold_casing', [Ingredient.of('#c:stripped_woods'), Ingredient.of('#c:plates/gold')])
    //machineration('radiant','mekanism:steel_casing')
    event.remove({ output: 'createaddition:zinc_sheet' })

    event.remove({ id: "create:splashing/crushed_raw_iron" })

    // 1211: one line listing what the guards above skipped, for the later mapping pass
    if (caeSkipped.length > 0) {
        console.info('compatRecipes: skipped ' + caeSkipped.length + ' entries naming unregistered items (their stock recipes stay): ' + caeSkipped.join(', '))
    }
});
ServerEvents.tags('block', thing => {
    dumbshitarray.forEach(entry => {
        let dumbmachines = ["kubejs:andesite_machine", "kubejs:sealed_machine", "kubejs:brass_machine", "kubejs:sturdy_machine", "kubejs:integrational_machine", "kubejs:radiant_machine", "kubejs:plastic_machine", "kubejs:time_machine", "kubejs:supercritical_machine"]
        if (entry.startsWith("x ", 1)) { entry = entry.slice(3) }
        if (entry.startsWith("x ", 2)) { entry = entry.slice(4) }
        // 1211: Item.of(entry).isBlock() would throw for an unregistered item (Thermal, Tinkers...). A tag add of an id that is not
        // in the block registry is skipped by KubeJS, so non-block items need no check.
        thing.add("create:wrench_pickup", entry)
        dumbmachines.forEach(i => {
            thing.add("create:wrench_pickup", i)
        });
    })

})
ServerEvents.tags('fluid', event => {
    event.add('create:bottomless/allow', 'pneumaticcraft:oil')
})

// 1211: MoreJS 0.16: removeModdedTrades(profession, level) is gone from VillagerTradingEventJS; removeModdedTypedTrades(professions,
// levels) replaces it (professions: a list, levels: a number, [min, max] or omitted for all levels). It removes the modded
// (non-vanilla, non-MoreJS) item listings, which is what removeModdedTrades did. Levels 1 to 5 = all levels.
MoreJS.villagerTrades(event => {
    event.removeModdedTypedTrades(['pneumaticcraft:mechanic'], [1, 5]);
})
