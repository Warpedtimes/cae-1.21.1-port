// 1211: what the Thermal Series did for this pack, rebuilt without it (Thermal has no 1.21.1 build). Pack decision:
// Mekanism + Mekanism Generators replace Thermal; the Thermal coins became cae: items. See the port's Thermal id-map notes and
// the Thermal id map; items / blocks / fluids registered under cae: are in
// startup_scripts/thermalReplacements.js.
//
// What lives here:
//   1. item / block tags for the new items (the c: convention Create: Metallurgy and the rest read)
//   2. recipes: metals, rubber, parts, explosives, fluids
//   3. the Thermal machine recipes the pack used, re-made in Mekanism / Create (PCB centrifuge + dryer, corundum duplication,
//      honey, insolator, molten redstone)
//   4. the Arboreal Extractor (tree table + block entity tick) and the Rock Generator (block entity tick)
//   5. the explosives (right click throws / primes them, a level tick applies the effect)
//
// KubeJS 7 notes: BlockEvents.blockEntityTick(blockId, e => ...) is a common event with e.block / e.tick / e.cycle; the tank / inventory
// attachments are in block.entity.attachments.get('tank' | 'out') (KubeJS block/entity/KubeBlockEntity.java). Nothing in this
// file was run in game when it was written: if the log complains, start with the block entity ticks and the TNT handlers.

// ---------------------------------------------------------------------------------------------------------------------
// 1. tags
// ---------------------------------------------------------------------------------------------------------------------
const CAE_NEW_METALS = ['silver', 'nickel', 'invar', 'constantan', 'signalum', 'lumium', 'enderium']

ServerEvents.tags('item', event => {
    CAE_NEW_METALS.forEach(m => {
        event.add('c:ingots/' + m, 'cae:' + m + '_ingot')
        event.add('c:ingots', 'cae:' + m + '_ingot')
        event.add('c:nuggets/' + m, 'cae:' + m + '_nugget')
        event.add('c:nuggets', 'cae:' + m + '_nugget')
        event.add('c:dusts/' + m, 'cae:' + m + '_dust')
        event.add('c:dusts', 'cae:' + m + '_dust')
        event.add('c:plates/' + m, 'cae:' + m + '_plate')
        event.add('c:plates', 'cae:' + m + '_plate')
        event.add('c:storage_blocks/' + m, 'cae:' + m + '_block')
        event.add('c:storage_blocks', 'cae:' + m + '_block')
    })
    event.add('c:raw_materials/silver', 'cae:raw_silver')
    event.add('c:raw_materials/nickel', 'cae:raw_nickel')
    event.add('c:raw_materials', ['cae:raw_silver', 'cae:raw_nickel'])
    // coins: c:coins is what recipeRemoval.js strips recipes of; the per-metal tags are what Create: Metallurgy melts
    event.add('c:coins', ['cae:silver_coin', 'cae:gold_coin', 'cae:bronze_coin'])
    event.add('c:coins/silver', 'cae:silver_coin')
    event.add('c:coins/gold', 'cae:gold_coin')
    event.add('c:coins/bronze', 'cae:bronze_coin')
    event.add('c:gears', 'cae:copper_gear')
    event.add('c:gears/copper', 'cae:copper_gear')
    event.add('c:tar', 'cae:tar')
    event.add('c:rubber', ['cae:rubber', 'cae:cured_rubber'])
    event.add('c:glass_blocks', ['cae:obsidian_glass', 'cae:enderium_glass', 'cae:lumium_glass', 'cae:signalum_glass'])
    event.add('cae:glass/hardened', ['cae:obsidian_glass', 'cae:enderium_glass', 'cae:lumium_glass', 'cae:signalum_glass'])
})

ServerEvents.tags('block', event => {
    CAE_NEW_METALS.forEach(m => {
        event.add('c:storage_blocks/' + m, 'cae:' + m + '_block')
        event.add('c:storage_blocks', 'cae:' + m + '_block')
        event.add('minecraft:mineable/pickaxe', 'cae:' + m + '_block')
        event.add('minecraft:needs_stone_tool', 'cae:' + m + '_block')
    })
    const glass = ['cae:obsidian_glass', 'cae:enderium_glass', 'cae:lumium_glass', 'cae:signalum_glass']
    event.add('c:glass_blocks', glass)
    event.add('cae:glass/hardened', glass)
    event.add('minecraft:wither_immune', glass) // "Completely Indestructible by Withers." (tooltips.js)
    event.add('minecraft:mineable/pickaxe', glass)
    event.add('minecraft:mineable/pickaxe', ['cae:device_tree_extractor', 'cae:device_rock_gen'])
    // the devices rebuilt on 19 Oct (startup_scripts/thermalDevicesA.js, thermalDevicesB.js)
    event.add('minecraft:mineable/pickaxe', ['cae:device_fisher', 'cae:device_hive_extractor', 'cae:device_composter',
        'cae:device_potion_diffuser', 'cae:device_nullifier'])
    event.add('minecraft:mineable/pickaxe', 'cae:cured_rubber_block')
})

// small helper: a recipe handler that cannot take the others down with it
function caeSafe(name, fn) {
    try {
        fn()
    } catch (err) {
        console.error('thermalReplacements.js: section "' + name + '" failed: ' + err)
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. + 3. recipes
// ---------------------------------------------------------------------------------------------------------------------
ServerEvents.recipes(event => {
    const R = (s) => 'cae:thermal/' + s

    // ---- ingot / nugget / block conversions for the seven metals -----------------------------------------------------
    caeSafe('metal storage', () => {
        CAE_NEW_METALS.forEach(m => {
            event.shaped('cae:' + m + '_ingot', ['NNN', 'NNN', 'NNN'], { N: 'cae:' + m + '_nugget' }).id(R(m + '_ingot_from_nuggets'))
            event.shapeless('9x cae:' + m + '_nugget', 'cae:' + m + '_ingot').id(R(m + '_nuggets_from_ingot'))
            event.shaped('cae:' + m + '_block', ['III', 'III', 'III'], { I: 'cae:' + m + '_ingot' }).id(R(m + '_block_from_ingots'))
            event.shapeless('9x cae:' + m + '_ingot', 'cae:' + m + '_block').id(R(m + '_ingots_from_block'))
            // dust is smelted back to the ingot (the pack did the same with invar_dust)
            event.smelting('cae:' + m + '_ingot', 'cae:' + m + '_dust').id(R(m + '_ingot_smelting_dust'))
            event.blasting('cae:' + m + '_ingot', 'cae:' + m + '_dust').id(R(m + '_ingot_blasting_dust'))
        })
    })

    // ---- ingot -> dust (Create crushing) and ingot -> plate (Create pressing). This replaces the crush2dust / press2plate loops
    // that compatRecipes.js built with "thermal:" + metal + "_dust" names. Delete that block (see the notes).
    caeSafe('dusts and plates', () => {
        // metal -> [dust item, plate item or null]
        const table = {
            silver: ['cae:silver_dust', 'cae:silver_plate'],
            nickel: ['cae:nickel_dust', 'cae:nickel_plate'],
            invar: ['cae:invar_dust', 'cae:invar_plate'],
            constantan: ['cae:constantan_dust', 'cae:constantan_plate'],
            signalum: ['cae:signalum_dust', 'cae:signalum_plate'],
            lumium: ['cae:lumium_dust', 'cae:lumium_plate'],
            enderium: ['cae:enderium_dust', 'cae:enderium_plate'],
            // metals Mekanism already has dusts for; plates come from Create / Alloyed / Create Crafts & Additions, which have their own
            // pressing recipes, so only the dust is added
            tin: ['mekanism:dust_tin', null],
            lead: ['mekanism:dust_lead', null],
            steel: ['mekanism:dust_steel', null],
            gold: ['mekanism:dust_gold', null],
            copper: ['mekanism:dust_copper', null],
            netherite: ['mekanism:dust_netherite', null],
            iron: ['mekanism:dust_iron', null]
        }
        Object.keys(table).forEach(m => {
            event.recipes.create.crushing(table[m][0], Ingredient.of('#c:ingots/' + m)).id(R('crushing_' + m + '_ingot'))
            if (table[m][1]) {
                event.recipes.create.pressing(table[m][1], Ingredient.of('#c:ingots/' + m)).id(R('pressing_' + m + '_ingot'))
            }
        })
        // gems -> Mekanism dusts
        const gems = { diamond: 'mekanism:dust_diamond', emerald: 'mekanism:dust_emerald', lapis: 'mekanism:dust_lapis_lazuli', quartz: 'mekanism:dust_quartz' }
        Object.keys(gems).forEach(g => {
            event.recipes.create.crushing(gems[g], Ingredient.of('#c:gems/' + g)).id(R('crushing_' + g + '_gem'))
        })
    })

    // ---- silver / nickel ore chain (Create's own recipes for them are conditioned on the thermal mod being loaded) ------
    caeSafe('silver and nickel ores', () => {
        ;['silver', 'nickel'].forEach(m => {
            event.smelting('cae:' + m + '_ingot', 'cae:raw_' + m).xp(0.7).id(R(m + '_ingot_smelting_raw'))
            event.blasting('cae:' + m + '_ingot', 'cae:raw_' + m).xp(0.7).id(R(m + '_ingot_blasting_raw'))
            event.smelting('cae:' + m + '_ingot', 'create:crushed_raw_' + m).xp(0.7).id(R(m + '_ingot_smelting_crushed'))
            event.blasting('cae:' + m + '_ingot', 'create:crushed_raw_' + m).xp(0.7).id(R(m + '_ingot_blasting_crushed'))
            event.recipes.create.crushing(['create:crushed_raw_' + m, CreateItem.of('create:experience_nugget', 0.75)], 'cae:raw_' + m).id(R('crushing_raw_' + m))
            event.recipes.create.splashing('9x cae:' + m + '_nugget', 'create:crushed_raw_' + m).id(R('splashing_crushed_' + m))
            // Mekanism: ore doubling in the enrichment chamber, ingot -> dust in the crusher
            event.custom({
                type: 'mekanism:enriching',
                input: { count: 1, item: 'cae:raw_' + m },
                output: { count: 2, id: 'cae:' + m + '_dust' }
            }).id(R(m + '_dust_enriching_raw'))
            event.custom({
                type: 'mekanism:crushing',
                input: { count: 1, item: 'cae:' + m + '_ingot' },
                output: { count: 1, id: 'cae:' + m + '_dust' }
            }).id(R(m + '_dust_crushing_ingot'))
        })
    })

    // ---- alloys (the pack removed Tinkers' versions and the invar one; invar stays the PneumaticCraft slurry route) ----------
    caeSafe('alloys', () => {
        // Thermal induction smelter, read from thermal_expansion / thermal_foundation machines/smelter/smelter_alloy_*.json:
        //   signalum   3 copper + 1 silver + 4 redstone -> 4 signalum
        //   lumium     3 tin + 1 silver + 2 glowstone dust -> 4 lumium (the pack swapped the glowstone for refined radiance, recipeRemoval.js)
        //   enderium   3 lead + 1 diamond dust + 2 ender pearl -> 2 enderium (two, not four)
        //   constantan 1 copper + 1 nickel -> 2 constantan
        // 1211 substitute: Create mixing (superheated / heated basin) stands in for the Induction Smelter and its RF cost, and the smelter
        // took the metal's dust in place of the ingot where the basin only takes the ingots.
        event.recipes.create.mixing('4x cae:signalum_ingot', [Ingredient.of('#c:ingots/copper'), Ingredient.of('#c:ingots/copper'), Ingredient.of('#c:ingots/copper'), Ingredient.of('#c:ingots/silver'), '4x minecraft:redstone']).superheated().id(R('signalum_mixing'))
        event.recipes.create.mixing('4x cae:lumium_ingot', [Ingredient.of('#c:ingots/tin'), Ingredient.of('#c:ingots/tin'), Ingredient.of('#c:ingots/tin'), Ingredient.of('#c:ingots/silver'), '2x create:refined_radiance']).superheated().id(R('lumium_mixing'))
        event.recipes.create.mixing('2x cae:enderium_ingot', [Ingredient.of('#c:ingots/lead'), Ingredient.of('#c:ingots/lead'), Ingredient.of('#c:ingots/lead'), Ingredient.of('#c:dusts/diamond'), '2x minecraft:ender_pearl']).superheated().id(R('enderium_mixing'))
        event.recipes.create.mixing('2x cae:constantan_ingot', [Ingredient.of('#c:ingots/copper'), Ingredient.of('#c:ingots/nickel')]).heated().id(R('constantan_mixing'))
    })

    // ---- rubber, small parts --------------------------------------------------------------------------------------------
    // These are the thermal_foundation recipes (recipes/parts, recipes/tools, recipes/smelting) with the thermal: items swapped for cae:.
    caeSafe('rubber and parts', () => {
        event.smelting('cae:cured_rubber', 'cae:rubber').xp(0.2).cookingTime(200).id(R('cured_rubber_smelting'))
        event.shaped('cae:cured_rubber_block', ['RRR', 'RRR', 'RRR'], { R: 'cae:cured_rubber' }).id(R('cured_rubber_block'))
        event.shapeless('9x cae:cured_rubber', 'cae:cured_rubber_block').id(R('cured_rubber_from_block'))
        event.shaped('cae:copper_gear', [' C ', 'CNC', ' C '], { C: '#c:ingots/copper', N: '#c:nuggets/iron' }).id(R('copper_gear'))
        event.shaped('cae:saw_blade', ['II ', 'ICI', ' II'], { I: '#c:ingots/iron', C: '#c:ingots/copper' }).id(R('saw_blade'))
        event.shaped('cae:drill_head', [' I ', 'ICI', 'III'], { I: '#c:ingots/iron', C: '#c:ingots/copper' }).id(R('drill_head'))
        // experience crystal (recipes/tools/xp_crystal.json): lapis above and below, emerald left and right, an experience bottle in the middle
        event.shaped('cae:xp_crystal', [' L ', 'EBE', ' L '], { L: '#c:gems/lapis', E: '#c:gems/emerald', B: 'minecraft:experience_bottle' }).id(R('xp_crystal'))
        // 1211 substitute: Thermal's Blizz / Basalz mobs are gone. In 1.18.2 their rods were mob drops with no recipe; these Create mixing
        // recipes are the port's way to get them. Blitz is the vanilla Breeze rod (id map).
        event.recipes.create.mixing('cae:blizz_rod', ['minecraft:blaze_rod', '4x minecraft:snowball']).id(R('blizz_rod'))
        event.recipes.create.mixing('cae:basalz_rod', ['minecraft:blaze_rod', '4x minecraft:basalt']).id(R('basalz_rod'))
    })

    // ---- explosives --------------------------------------------------------------------------------------------------------
    // thermal_foundation recipes/{glowstone,ice,fire}_tnt.json and recipes/{glowstone,explosive}_grenade_4.json. nuke_tnt / nuke_grenade
    // have their recipes in shaped.js; ender_tnt is a haunting recipe in chapter5.js (the pack removed Thermal's own recipe).
    caeSafe('explosives', () => {
        event.shaped('cae:glowstone_tnt', ['GPG', 'PGP', 'GPG'], { G: '#c:gunpowders', P: '#c:dusts/glowstone' }).id(R('glowstone_tnt'))
        event.shaped('cae:ice_tnt', ['GPG', 'PGP', 'GPG'], { G: '#c:gunpowders', P: 'cae:blizz_powder' }).id(R('ice_tnt'))
        event.shaped('cae:fire_tnt', ['GPG', 'PGP', 'GPG'], { G: '#c:gunpowders', P: 'minecraft:blaze_powder' }).id(R('fire_tnt'))
        event.shaped('4x cae:glowstone_grenade', ['GPG', 'PIP', 'GPG'], { G: '#c:gunpowders', P: '#c:dusts/glowstone', I: '#c:ingots/iron' }).id(R('glowstone_grenade'))
        event.shaped('4x cae:explosive_grenade', ['GPG', 'PIP', 'GPG'], { G: '#c:gunpowders', P: '#c:sands', I: '#c:ingots/iron' }).id(R('explosive_grenade'))
    })

    // ---- fluids ------------------------------------------------------------------------------------------------------------
    caeSafe('fluids', () => {
        // molten redstone: Tinkers melted it, now a heated basin does (filling.js and the rose quartz recipe use cae:redstone)
        event.recipes.create.mixing(Fluid.of('cae:redstone', 100), 'minecraft:redstone').heated().id(R('liquid_redstone'))
        event.recipes.create.mixing(Fluid.of('cae:redstone', 900), 'minecraft:redstone_block').heated().id(R('liquid_redstone_from_block'))
        // honey, for the thermal centrifuge / crucible recipes compatRecipes.js had: honeycomb 100 mB, honey block 1000 mB. The third one,
        // honey bottle -> glass bottle + 250 mB, is covered by Create's own create:emptying/honey_bottle.json (checked in create-1.21.1-6.0.10:
        // 250 mB create:honey + glass bottle), so it is not repeated here.
        event.recipes.create.mixing(Fluid.of('create:honey', 100), 'minecraft:honeycomb').id(R('honey_from_comb'))
        event.recipes.create.mixing(Fluid.of('create:honey', 1000), 'minecraft:honey_block').id(R('honey_from_block'))
    })

    // ---- PCB line: Thermal centrifuge + induction smelter --------------------------------------------------------------
    caeSafe('pcb line', () => {
        // etched board -> separated board + chromatic waste (was a Thermal centrifuge recipe)
        event.recipes.create.mixing(['kubejs:separated_board', Fluid.of('kubejs:chromatic_waste', 50)], 'kubejs:etched_board').id(R('pcb_separating'))
        // masked pcb -> dried board (was the Thermal induction smelter). Mekanism metallurgic infuser, carbon infusion.
        event.custom({
            type: 'mekanism:metallurgic_infusing',
            chemical_input: { amount: 10, tag: 'mekanism:carbon' },
            item_input: { count: 1, item: 'kubejs:masked_pcb' },
            output: { count: 1, id: 'kubejs:dryed_board' },
            per_tick_usage: false
        }).id(R('pcb_drying'))
    })

    // ---- corundum duplication (was Thermal crystallizer in chapter4.js, delete those lines there) ------------------------
    caeSafe('corundum', () => {
        const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'white', 'black']
        colours.forEach(c => {
            ;['_corundum_cluster', '_corundum'].forEach(suffix => {
                const id = 'quark:' + c + suffix
                if (!Item.exists(id)) { return }
                event.recipes.create.mixing('2x ' + id, [id, Fluid.of('minecraft:water', 1000)]).id(R('dupe_' + c + suffix))
            })
        })
    })

    // ---- insolator: flower duplication ------------------------------------------------------------------------------------
    // The Thermal Phytogenic Insolator recipes the pack's progression used were the flower ones: thermal_expansion
    // machines/insolator/insolator_<flower>.json, 1 flower (+ water in the machine) -> 2 of the same flower, for these 16 flowers.
    // 1211 substitute: a Create basin (mixing) with 250 mB of water stands in for the insolator; no extra consumable. Mekanism's
    // enriching chamber would take the flower with energy alone but already turns flowers into dye, so it is not used.
    // Not ported (not pack progression): the insolator's sapling, crop, mushroom, coral, kelp, vine, cactus, sugar cane, bamboo, berry,
    // melon / pumpkin, moss and lily pad recipes, and the three catalysts (bone meal, compost, phytogro). insolator_wither_rose is
    // removed by the pack (chapterM4.js).
    caeSafe('insolator', () => {
        let flowers = ['blue_orchid', 'allium', 'azure_bluet', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'red_tulip', 'orange_tulip',
            'white_tulip', 'pink_tulip', 'poppy', 'dandelion', 'sunflower', 'lilac', 'rose_bush', 'peony']
        flowers.forEach(f => {
            let id = 'minecraft:' + f
            if (!Item.exists(id)) { return }
            event.recipes.create.mixing('2x ' + id, [id, Fluid.of('minecraft:water', 250)]).id(R('flower_' + f))
        })
    })
})

// ---------------------------------------------------------------------------------------------------------------------
// 4a. Arboreal Extractor: block cae:device_tree_extractor (startup script: ticks every 20, tank 'tank' of 8000 mB). The tick logic
// follows cofh.thermal.core.block.entity.device.DeviceTreeExtractorTile of thermal_foundation 9.2.2.58 (decompiled 18 Oct 2026).
// ---------------------------------------------------------------------------------------------------------------------
// R / S are the two Thermal saps, now cae:resin / cae:sap. Every row is [trunk log, leaves, fluid, mB per cycle (25 if left
// out)]. The first 42 rows are the pack's former kubejs/data/thermal/recipe/tree_extractor/cae_*.json files (the tconstruct ender
// slime one is dropped); they come first, so they win where Thermal had a row for the same tree. The rest are the recipes the
// 1.18.2 pack got from Thermal Expansion 9.2.2 and Thermal Integration 9.2.1 jars (read from the jars, 18 Oct 2026; an
// earlier version of this list guessed them and had oak, birch and acacia on sap).
const CAE_TREE_ROWS = [
    ['architects_palette:twisted_log', 'architects_palette:twisted_leaves', 'R'],
    ['ars_nouveau:green_archwood_log', 'ars_nouveau:green_archwood_leaves', 'kubejs:flourishing_juice'],
    ['ars_nouveau:purple_archwood_log', 'ars_nouveau:purple_archwood_leaves', 'kubejs:vexing_juice'],
    ['ars_nouveau:red_archwood_log', 'ars_nouveau:red_archwood_leaves', 'minecraft:lava'],
    ['biomesoplenty:dead_log', 'biomesoplenty:dead_leaves', 'R'],
    ['biomesoplenty:palm_log', 'biomesoplenty:palm_leaves', 'S'],
    ['biomeswevegone:blue_enchanted_log', 'biomeswevegone:blue_enchanted_leaves', 'R'],
    ['biomeswevegone:fir_log', 'biomeswevegone:fir_leaves', 'R'],
    ['biomeswevegone:green_enchanted_log', 'biomeswevegone:green_enchanted_leaves', 'R'],
    ['biomeswevegone:holly_log', 'biomeswevegone:holly_berry_leaves', 'S'],
    ['biomeswevegone:holly_log', 'biomeswevegone:holly_leaves', 'S'],
    ['biomeswevegone:jacaranda_log', 'biomeswevegone:flowering_indigo_jacaranda_leaves', 'R'],
    ['biomeswevegone:jacaranda_log', 'biomeswevegone:indigo_jacaranda_leaves', 'R'],
    ['biomeswevegone:maple_log', 'biomeswevegone:maple_leaves', 'S'],
    ['biomeswevegone:maple_log', 'biomeswevegone:red_maple_leaves', 'S'],
    ['biomeswevegone:palm_log', 'biomeswevegone:palm_leaves', 'R'],
    ['biomeswevegone:pine_log', 'biomeswevegone:araucaria_leaves', 'R'],
    ['biomeswevegone:pine_log', 'biomeswevegone:pine_leaves', 'R'],
    ['biomeswevegone:rainbow_eucalyptus_log', 'biomeswevegone:rainbow_eucalyptus_leaves', 'R'],
    ['biomeswevegone:skyris_log', 'biomeswevegone:green_apple_skyris_leaves', 'R'],
    ['biomeswevegone:skyris_log', 'biomeswevegone:skyris_leaves', 'R'],
    ['biomeswevegone:zelkova_log', 'biomeswevegone:brown_zelkova_leaves', 'R'],
    ['biomeswevegone:zelkova_log', 'biomeswevegone:zelkova_leaves', 'R'],
    ['forbidden_arcanus:aurum_log', 'forbidden_arcanus:aurum_leaves', 'R'],
    ['integrateddynamics:menril_log', 'integrateddynamics:menril_leaves', 'integrateddynamics:menril_resin'],
    // 1211: Integrated Dynamics grows menril trunks with about 1 in 11 logs "filled"; the 1.18.2 recipe named only the plain
    // log, so a tree with a filled log in its bottom three was rejected (in 1.18.2 too). Filled logs count as trunk here.
    ['integrateddynamics:menril_log_filled', 'integrateddynamics:menril_leaves', 'integrateddynamics:menril_resin'],
    ['minecraft:birch_log', 'biomeswevegone:brown_birch_leaves', 'R'],
    ['minecraft:birch_log', 'biomeswevegone:orange_birch_leaves', 'R'],
    ['minecraft:birch_log', 'biomeswevegone:red_birch_leaves', 'R'],
    ['minecraft:birch_log', 'biomeswevegone:yellow_birch_leaves', 'R'],
    ['minecraft:dark_oak_log', 'biomesoplenty:orange_maple_leaves', 'S'],
    ['minecraft:oak_log', 'biomeswevegone:brown_oak_leaves', 'R'],
    ['minecraft:oak_log', 'biomeswevegone:orange_oak_leaves', 'R'],
    ['minecraft:oak_log', 'biomeswevegone:orchard_leaves', 'R'],
    ['minecraft:oak_log', 'biomeswevegone:red_oak_leaves', 'R'],
    ['minecraft:spruce_log', 'biomeswevegone:blue_spruce_leaves', 'S'],
    ['minecraft:spruce_log', 'biomeswevegone:orange_spruce_leaves', 'R'],
    ['minecraft:spruce_log', 'biomeswevegone:red_spruce_leaves', 'R'],
    ['minecraft:spruce_log', 'biomeswevegone:yellow_spruce_leaves', 'R'],
    ['quark:blossom_log', 'quark:blue_blossom_leaves', 'R'],
    ['quark:blossom_log', 'quark:lavender_blossom_leaves', 'R'],
    ['quark:blossom_log', 'quark:red_blossom_leaves', 'R'],
    ['quark:blossom_log', 'quark:yellow_blossom_leaves', 'R'],
    // Thermal Expansion 9.2.2 (vanilla trees). Jungle gave thermal:latex, which only Thermal's own rubber used; there is no
    // latex in this pack, so jungle gives nothing, as it gave neither resin nor sap before.
    ['minecraft:oak_log', 'minecraft:oak_leaves', 'R'],
    ['minecraft:birch_log', 'minecraft:birch_leaves', 'R'],
    ['minecraft:spruce_log', 'minecraft:spruce_leaves', 'R', 50],
    ['minecraft:acacia_log', 'minecraft:acacia_leaves', 'R'],
    ['minecraft:dark_oak_log', 'minecraft:dark_oak_leaves', 'S'],
    // Thermal Integration 9.2.1 (Biomes O' Plenty), with BOP's 1.21 names: maple_leaves -> red_maple_leaves, orange/yellow
    // autumn -> orange/yellow maple (on BOP's new maple log as well as the old trunk), white cherry -> snowblossom (vanilla
    // cherry log), BOP pink cherry -> vanilla cherry. The pack's own palm row above wins over Thermal's (resin).
    ['biomesoplenty:fir_log', 'biomesoplenty:fir_leaves', 'R', 50],
    ['minecraft:oak_log', 'biomesoplenty:flowering_oak_leaves', 'R'],
    ['biomesoplenty:hellbark_log', 'biomesoplenty:hellbark_leaves', 'minecraft:lava'],
    ['biomesoplenty:jacaranda_log', 'biomesoplenty:jacaranda_leaves', 'R'],
    ['biomesoplenty:magic_log', 'biomesoplenty:magic_leaves', 'R'],
    ['biomesoplenty:mahogany_log', 'biomesoplenty:mahogany_leaves', 'R'],
    ['minecraft:oak_log', 'biomesoplenty:red_maple_leaves', 'S'],
    ['biomesoplenty:maple_log', 'biomesoplenty:red_maple_leaves', 'S'],
    ['minecraft:oak_log', 'biomesoplenty:orange_maple_leaves', 'R'],
    ['biomesoplenty:maple_log', 'biomesoplenty:orange_maple_leaves', 'R'],
    ['minecraft:birch_log', 'biomesoplenty:yellow_maple_leaves', 'R'],
    ['biomesoplenty:maple_log', 'biomesoplenty:yellow_maple_leaves', 'R'],
    ['minecraft:oak_log', 'biomesoplenty:origin_leaves', 'R'],
    ['biomesoplenty:palm_log', 'biomesoplenty:palm_leaves', 'R'],
    ['minecraft:cherry_log', 'minecraft:cherry_leaves', 'R'],
    ['minecraft:cherry_log', 'biomesoplenty:snowblossom_leaves', 'R'],
    ['minecraft:birch_log', 'biomesoplenty:rainbow_birch_leaves', 'R'],
    ['biomesoplenty:redwood_log', 'biomesoplenty:redwood_leaves', 'R'],
    ['biomesoplenty:umbran_log', 'biomesoplenty:umbran_leaves', 'R'],
    ['biomesoplenty:willow_log', 'biomesoplenty:willow_leaves', 'R'],
    // not in the 1.18.2 pack (mangroves came in 1.19): resin like the other vanilla trees (easy to change)
    ['minecraft:mangrove_log', 'minecraft:mangrove_leaves', 'R'],
    // 1211: leaf variants the 1.18.2 table left out, so those trees never worked (found by growing every tree in the table):
    // BWG's plain and flowering jacaranda (only the indigo one was listed), silver maple, flowering skyris, Quark's orange
    // blossom (added after the original pack), and Forbidden & Arcanus' nuggety aurum leaves (aurum leaves turn into them).
    ['biomeswevegone:jacaranda_log', 'biomeswevegone:jacaranda_leaves', 'R'],
    ['biomeswevegone:jacaranda_log', 'biomeswevegone:flowering_jacaranda_leaves', 'R'],
    ['biomeswevegone:maple_log', 'biomeswevegone:silver_maple_leaves', 'S'],
    ['biomeswevegone:skyris_log', 'biomeswevegone:flowering_skyris_leaves', 'R'],
    ['quark:blossom_log', 'quark:orange_blossom_leaves', 'R'],
    ['forbidden_arcanus:aurum_log', 'forbidden_arcanus:nuggety_aurum_leaves', 'R']
]
const CAE_SAP_FLUID = { R: 'cae:resin', S: 'cae:sap' }
// trunk id -> list of [leaves id, fluid id, mB]
const CAE_TREES_BY_TRUNK = {}
CAE_TREE_ROWS.forEach(r => {
    if (!CAE_TREES_BY_TRUNK[r[0]]) { CAE_TREES_BY_TRUNK[r[0]] = [] }
    CAE_TREES_BY_TRUNK[r[0]].push([r[1], CAE_SAP_FLUID[r[2]] || r[2], r[3] || 25])
})
const CAE_FLUID_ACTION = Java.loadClass('net.neoforged.neoforge.fluids.capability.IFluidHandler$FluidAction')

// Thermal's numbers: ThermalDeviceConfig "Arboreal Extractor / Time Constant" defaults to 500 ticks; NUM_LEAVES = 3. CAE_TREE_STEP must
// equal tickFrequency in startup_scripts/thermalReplacements.js.
const CAE_TREE_STEP = 20
const CAE_TREE_TIME_CONSTANT = 500
const CAE_TREE_NUM_LEAVES = 3

// DeviceTreeExtractorTile.isTrunkBase checks Material.GRASS / DIRT / STONE under the trunk. 1211 substitute: Materials are gone in
// 1.21.1, so the same idea is a handful of block tags (dirt incl. grass / podzol / mycelium, the base stones, nylium, the c: stone groups).
// 1211: sand too (palms grow on beaches; Thermal's Material.SAND wasn't GRASS / DIRT / STONE, so they failed in 1.18.2 as well).
function caeTreeGround(b) {
    return b.hasTag('minecraft:dirt') || b.hasTag('minecraft:base_stone_overworld') || b.hasTag('minecraft:base_stone_nether') ||
        b.hasTag('minecraft:nylium') || b.hasTag('c:stones') || b.hasTag('c:cobblestones') || b.hasTag('c:netherracks') || b.hasTag('c:end_stones') ||
        b.hasTag('minecraft:sand') || b.hasTag('c:sands')
}

// isTrunkBase(pos): ground under pos, and pos, pos + 1 and pos + 2 are all trunk blocks (validTrunk)
function caeTreeTrunkBase(b) {
    if (!caeTreeGround(b.offset(0, -1, 0))) { return false }
    return !!CAE_TREES_BY_TRUNK[b.id] && !!CAE_TREES_BY_TRUNK[b.offset(0, 1, 0).id] && !!CAE_TREES_BY_TRUNK[b.offset(0, 2, 0).id]
}

// The trunk an extractor next to b works on: b itself when it is a trunk base, or, when b is a one-block "root" log on the
// ground, the trunk base next to it. 1211: Integrated Dynamics' menril trees stand on a plus of one-high root logs that
// covers all four sides of the trunk at ground level, so with Thermal's rule alone (the extractor must touch a trunk base)
// nothing could tap a natural menril tree, in 1.18.2 either, unless a root was broken first.
function caeTreeTrunkFor(b) {
    if (caeTreeTrunkBase(b)) { return b }
    if (!CAE_TREES_BY_TRUNK[b.id] || !caeTreeGround(b.offset(0, -1, 0))) { return null }
    let sides = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    for (let s = 0; s < sides.length; s++) {
        let n = b.offset(sides[s][0], 0, sides[s][1])
        if (caeTreeTrunkBase(n)) { return n }
    }
    return null
}

// Leaning trunks. 1211: BWG palms grow two logs straight up and then step sideways every two blocks, so no column holds the
// three logs Thermal's isTrunkBase wants, and their fronds hang beside the top, out of the 3x3 above the extractor. When the
// normal check fails, caeTreeFindLeaning follows the trunk up from a log on the ground (each step the log straight above, else
// one diagonally above) and, if it climbs at least three logs, looks for the leaves around the top of the climb instead.
function caeTreeClimb(b, max) {
    let chain = [b]
    let cur = b
    while (chain.length < max) {
        let next = null
        if (CAE_TREES_BY_TRUNK[cur.offset(0, 1, 0).id]) {
            next = cur.offset(0, 1, 0)
        } else {
            for (let dx = -1; dx <= 1 && next == null; dx++) {
                for (let dz = -1; dz <= 1 && next == null; dz++) {
                    if ((dx != 0 || dz != 0) && CAE_TREES_BY_TRUNK[cur.offset(dx, 1, dz).id]) { next = cur.offset(dx, 1, dz) }
                }
            }
        }
        if (next == null) { break }
        chain.push(next)
        cur = next
    }
    return chain
}

function caeTreeFindLeaning(block) {
    let sides = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    for (let s = 0; s < sides.length; s++) {
        let base = block.offset(sides[s][0], 0, sides[s][1])
        if (!CAE_TREES_BY_TRUNK[base.id] || !caeTreeGround(base.offset(0, -1, 0))) { continue }
        let chain = caeTreeClimb(base, 40)
        if (chain.length < 3) { continue }
        let topLog = chain[chain.length - 1]
        let leafRows = {}
        CAE_TREES_BY_TRUNK[base.id].forEach(c => { leafRows[c[0]] = c })
        let hits = []
        for (let dy = -3; dy <= 4 && hits.length < CAE_TREE_NUM_LEAVES; dy++) {
            for (let dx = -2; dx <= 2 && hits.length < CAE_TREE_NUM_LEAVES; dx++) {
                for (let dz = -2; dz <= 2 && hits.length < CAE_TREE_NUM_LEAVES; dz++) {
                    let lb = topLog.offset(dx, dy, dz)
                    if (leafRows[lb.id]) { hits.push(lb) }
                }
            }
        }
        if (hits.length >= CAE_TREE_NUM_LEAVES) { return { trunk: base, pick: leafRows[hits[0].id] } }
    }
    return null
}

// updateValidity(): trunk = the first of west / east / north / south that isTrunkBase; the first 3 leaf blocks (in BlockPos iteration order:
// x fastest, then y, then z) of the 3x3 columns around the extractor, from its own height up to 40 blocks, that belong to the trunk;
// the trunk column up to the first leaf holds no ground block, and no other extractor stands above in the extractor's column.
// Returns { trunk, pick } with pick = [leaves, fluid, mB] or null when invalid.
// 1211 substitute: Thermal keyed the fluid on the trunk alone (the last mapping loaded won); here it follows the first matched leaf block
// so that the per-leaf rows of CAE_TREE_ROWS (e.g. oak trunk with red maple leaves = sap) keep working.
function caeTreeFind(block) {
    let found = caeTreeFindStraight(block)
    if (found.pick == null) {
        let lean = caeTreeFindLeaning(block)
        if (lean != null) { return lean }
    }
    return found
}

function caeTreeFindStraight(block) {
    let sides = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    let trunk = null
    for (let s = 0; s < sides.length; s++) {
        let t = caeTreeTrunkFor(block.offset(sides[s][0], 0, sides[s][1]))
        if (t != null) { trunk = t; break }
    }
    if (trunk == null) { return { trunk: null, pick: null } }
    let leafRows = {}
    CAE_TREES_BY_TRUNK[trunk.id].forEach(c => { leafRows[c[0]] = c })
    let top = Math.min(block.level.maxBuildHeight - block.y, 40)
    let hits = []
    for (let dz = -1; dz <= 1 && hits.length < CAE_TREE_NUM_LEAVES; dz++) {
        for (let dy = 0; dy <= top && hits.length < CAE_TREE_NUM_LEAVES; dy++) {
            for (let dx = -1; dx <= 1 && hits.length < CAE_TREE_NUM_LEAVES; dx++) {
                let lb = block.offset(dx, dy, dz)
                if (leafRows[lb.id]) { hits.push(lb) }
            }
        }
    }
    if (hits.length < CAE_TREE_NUM_LEAVES) { return { trunk: trunk, pick: null } }
    let ly = hits[0].y - block.y
    for (let k = Math.min(0, ly); k <= Math.max(0, ly); k++) {
        if (caeTreeGround(trunk.offset(0, k, 0))) { return { trunk: trunk, pick: null } }
    }
    for (let k = Math.min(1, ly); k <= Math.max(1, ly); k++) {
        if (block.offset(0, k, 0).id == 'cae:device_tree_extractor') { return { trunk: trunk, pick: null } }
    }
    return { trunk: trunk, pick: leafRows[hits[0].id] }
}

BlockEvents.blockEntityTick('cae:device_tree_extractor', event => {
    const block = event.block
    const entity = block.entity
    if (!entity) { return }
    const data = entity.data
    // `process` counts down like the tile's: it starts at timeConstant / 2, a cycle runs when it reaches 0
    let process = data.contains('process') ? data.getInt('process') : CAE_TREE_TIME_CONSTANT / 2
    process -= CAE_TREE_STEP
    if (process > 0) {
        data.putInt('process', process)
        entity.save()
        return
    }
    const found = caeTreeFind(block)
    // getTimeConstant(): timeConstant / 2 + timeConstant / 2 per extractor in the 3x3 around the trunk (itself included), clamped to
    // timeConstant .. 2 * timeConstant. 1211: `let`, not `const`, inside loops (Rhino throws "redeclaration of var" on the second pass).
    const centre = found.trunk || block
    let extractors = 0
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (centre.offset(dx, 0, dz).id == 'cae:device_tree_extractor') { extractors++ }
        }
    }
    const half = CAE_TREE_TIME_CONSTANT / 2
    data.putInt('process', Math.max(CAE_TREE_TIME_CONSTANT, Math.min(2 * CAE_TREE_TIME_CONSTANT, half + half * extractors)))
    if (found.pick != null) {
        // boost: while boostCycles > 0 the cycle counts one down with the stored multiplier; otherwise a bone meal from the virtual
        // stock starts 8 cycles at x1.5 (thermal:tree_extractor_boost bone_meal: output 1.5, cycles 8); otherwise x1
        let cycles = data.getInt('boostCycles')
        let mult = data.contains('boostMult') ? data.getFloat('boostMult') : 1
        let stock = data.getInt('boostStock')
        if (cycles > 0) {
            cycles--
        } else if (stock > 0) {
            cycles = 8
            mult = 1.5
            stock--
        } else {
            cycles = 0
            mult = 1
        }
        data.putInt('boostCycles', cycles)
        data.putFloat('boostMult', mult)
        data.putInt('boostStock', stock)
        const tank = entity.attachments.get('tank')
        // the tank only takes one fluid at a time and ignores a fill that does not fit, like the tile's own tank
        if (tank) { tank.fill(Fluid.of(found.pick[1], Math.floor(found.pick[2] * mult)), CAE_FLUID_ACTION.EXECUTE) }
    }
    entity.save()
})

// Boosts. The tile has a 1 slot item input; a KubeJS block entity can only have one right click action (it is the bucket fill here), so
// the slot is a virtual stock of up to 64 bone meal that a right click with bone meal fills (consumed like the slot item: 1 per boost).
// 1211 substitute: no slot GUI / hopper input. Compost (thermal:compost, output 1.5, cycles 8) and Phytogro (output 2.0, cycles 16)
// are not ported: neither item exists in this pack.
BlockEvents.rightClicked('cae:device_tree_extractor', event => {
    if (event.item.id != 'minecraft:bone_meal') { return }
    const entity = event.block.entity
    if (!entity) { return }
    const stock = entity.data.getInt('boostStock')
    const n = Math.min(event.item.count, 64 - stock)
    if (n <= 0) { return }
    entity.data.putInt('boostStock', stock + n)
    entity.save()
    if (!event.player.isCreative()) { event.item.shrink(n) }
    event.cancel()
})

// ---------------------------------------------------------------------------------------------------------------------
// 4b. Rock Generator: block cae:device_rock_gen (startup script: ticks every 20, 1 slot inventory 'out'). It follows
// cofh.thermal.core.block.entity.device.DeviceRockGenTile / RockGenManager of thermal_foundation 9.2.2.58 (decompiled 18 Oct 2026):
//   - the tile is only valid with at least one adjacent LAVA SOURCE (field `adjLava`; the Igneous Extruder needs lava);
//   - the four horizontal neighbours give the "adjacent" blocks (a fluid counts only as a source block; a flowing fluid counts as air);
//   - a mapping with a `below` block matching the block underneath wins, tried in neighbour order; otherwise the mappings without `below`;
//   - one item per `time` ticks (the default, 20); a Nether biome halves that (min 1).
// ---------------------------------------------------------------------------------------------------------------------
// [below block or null, adjacent block, result]
const CAE_ROCK_RULES = [
    // thermal_foundation data/thermal/recipes/devices/rock_gen/*.json, exactly
    [null, 'minecraft:water', 'minecraft:cobblestone'],
    ['minecraft:magma_block', 'minecraft:water', 'minecraft:stone'],
    [null, 'minecraft:blue_ice', 'minecraft:blackstone'],
    ['minecraft:soul_soil', 'minecraft:blue_ice', 'minecraft:basalt'],
    [null, 'minecraft:packed_ice', 'minecraft:cobbled_deepslate'],
    ['minecraft:magma_block', 'minecraft:packed_ice', 'minecraft:deepslate']
]
// The pack's own 23 entries (kubejs/server_scripts/thermal.js, bedrock_cobblegen: adjacent water, below == result), BYG ids mapped to
// 1.21.1 ids. Mapped: byg:dacite_cobblestone / red_rock / black, blue, purple, pink, white sandstone / dacite -> biomeswevegone:*.
// Dropped, nothing equivalent in this pack (checked against the 1.21.1 block list): byg:ether_stone, byg:purpur_stone,
// byg:soapstone. byg:scoria_stone is dropped as well because create:scoria is already one of the 23. That leaves 19 of the 23.
const CAE_ROCK_PACK = [
    'biomeswevegone:dacite_cobblestone', 'biomeswevegone:red_rock', 'minecraft:tuff', 'minecraft:blackstone',
    'minecraft:andesite', 'minecraft:diorite', 'minecraft:granite',
    'biomeswevegone:black_sandstone', 'biomeswevegone:blue_sandstone', 'biomeswevegone:dacite', 'biomeswevegone:purple_sandstone',
    'biomeswevegone:pink_sandstone', 'biomeswevegone:white_sandstone', 'minecraft:red_sandstone', 'minecraft:sandstone',
    'quark:limestone', 'quark:permafrost', 'create:scoria', 'create:limestone'
]
CAE_ROCK_PACK.forEach(r => { CAE_ROCK_RULES.push([r, 'minecraft:water', r]) })
const CAE_NETHER_BIOMES = ['minecraft:nether_wastes', 'minecraft:soul_sand_valley', 'minecraft:crimson_forest', 'minecraft:warped_forest', 'minecraft:basalt_deltas']

function caeRockLookup(below, adjacent) {
    // mappings with a `below` first, in neighbour order; then the ones without
    for (let i = 0; i < adjacent.length; i++) {
        for (let j = 0; j < CAE_ROCK_RULES.length; j++) {
            if (CAE_ROCK_RULES[j][0] == below && CAE_ROCK_RULES[j][1] == adjacent[i]) { return CAE_ROCK_RULES[j][2] }
        }
    }
    for (let i = 0; i < adjacent.length; i++) {
        for (let j = 0; j < CAE_ROCK_RULES.length; j++) {
            if (CAE_ROCK_RULES[j][0] == null && CAE_ROCK_RULES[j][1] == adjacent[i]) { return CAE_ROCK_RULES[j][2] }
        }
    }
    return null
}

BlockEvents.blockEntityTick('cae:device_rock_gen', event => {
    const block = event.block
    const entity = block.entity
    if (!entity) { return }
    const inv = entity.attachments.get('out')
    if (!inv) { return }
    const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    let adjacent = []
    let lava = 0
    for (let s = 0; s < sides.length; s++) {
        let nb = block.offset(sides[s][0], 0, sides[s][1])
        let isSource = true
        try { isSource = nb.blockState.getFluidState().isSource() || nb.blockState.getFluidState().isEmpty() } catch (err) { isSource = true }
        if (nb.id == 'minecraft:lava' && isSource) { lava++ }
        adjacent.push(isSource ? String(nb.id) : 'minecraft:air')
    }
    if (lava <= 0) { return }
    const out = caeRockLookup(String(block.offset(0, -1, 0).id), adjacent)
    if (out == null || !Item.exists(out)) { return }
    // one item per 20 ticks, doubled (a 10 tick cycle) in the Nether. 1211 substitute: Nether = the vanilla Nether biomes or the
    // Nether dimension; Thermal asked for Biome.BiomeCategory.NETHER.
    let nether = false
    try { nether = CAE_NETHER_BIOMES.indexOf(String(block.biomeId)) >= 0 || String(block.level.dimension) == 'minecraft:the_nether' } catch (err) { nether = false }
    const amount = nether ? 2 : 1
    inv.insertItem(0, Item.of(out, amount), false)
})

// ---------------------------------------------------------------------------------------------------------------------
// 5. explosives. Right click: the TNT is lit where the player stands, the grenades are thrown. A primed vanilla TNT carries a
// scoreboard tag; the level tick below applies the effect a few ticks before the fuse runs out and removes the TNT (the old
// chapter6.js handlers for thermal:ice_tnt / thermal:fire_tnt did exactly that, delete them).
//
// Numbers are from the 1.18.2 jars (decompiled 18 Oct 2026): cofh_core PrimedTntCoFH (fuse 80, radius 9, effect amplifier 1, effect
// duration 300 ticks), cofh_core AbstractGrenade (radius 5, amplifier 1, duration 300; a grenade detonates when it hits something, no
// fuse), thermal_foundation DetonateUtils (glow / ender / explosive / nuke) and cofh_core AreaUtils.
// 1211 substitute: Thermal's TNT were placeable blocks (lit by fire / redstone) and its grenades projectile entities; here an item right
// click spawns a vanilla primed TNT with a tag, and a grenade is that TNT thrown with a short fuse (30 ticks) instead of exploding on impact.
// Ice and fire TNT keep the pack's own chapter6.js behaviour (radius 3 fills, the TNT removed at fuse <= 6 without its own effect).
// ---------------------------------------------------------------------------------------------------------------------
const CAE_BOMBS = {
    'cae:ice_tnt': { tag: 'cae_ice', fuse: 80, throwSpeed: 0.0, r: 9 },
    'cae:fire_tnt': { tag: 'cae_fire', fuse: 80, throwSpeed: 0.0, r: 9 },
    'cae:glowstone_tnt': { tag: 'cae_glow', fuse: 80, throwSpeed: 0.0, r: 9 },
    'cae:ender_tnt': { tag: 'cae_ender', fuse: 80, throwSpeed: 0.0, r: 9 },
    'cae:nuke_tnt': { tag: 'cae_nuke', fuse: 80, throwSpeed: 0.0, r: 9 },
    'cae:glowstone_grenade': { tag: 'cae_glow_small', fuse: 30, throwSpeed: 0.9, r: 5 },
    'cae:explosive_grenade': { tag: 'cae_boom', fuse: 30, throwSpeed: 0.9, r: 5 },
    'cae:nuke_grenade': { tag: 'cae_nuke_small', fuse: 30, throwSpeed: 0.9, r: 5 }
}
const CAE_BOMB_RADIUS = {}
Object.keys(CAE_BOMBS).forEach(k => { CAE_BOMB_RADIUS[CAE_BOMBS[k].tag] = CAE_BOMBS[k].r })
const CAE_BOMB_TAGS = {}
Object.keys(CAE_BOMBS).forEach(k => { CAE_BOMB_TAGS[CAE_BOMBS[k].tag] = true })

ItemEvents.rightClicked(event => {
    const def = CAE_BOMBS[event.item.id]
    if (!def) { return }
    const player = event.player
    const look = player.lookAngle
    const v = def.throwSpeed
    const motion = '[' + (look.x * v).toFixed(3) + 'd,' + (look.y * v + 0.15).toFixed(3) + 'd,' + (look.z * v).toFixed(3) + 'd]'
    // 1211: player.runCommandSilent runs at the player's own permission level in KubeJS 7, and /summon needs op, so for normal
    // players nothing was summoned (found by the 19 Oct sweep). The server runs it at the player instead.
    event.server.runCommandSilent('execute as ' + player.uuid + ' at @s run summon minecraft:tnt ~ ~1.5 ~ {fuse:' + def.fuse + ',Tags:["' + def.tag + '"],Motion:' + motion + '}')
    if (!player.isCreative()) { event.item.shrink(1) }
})

function caeFill(level, x, y, z, r, block, filter) {
    const cmd = 'execute in ' + level.dimension + ' run fill ' + (x - r) + ' ' + (y - r) + ' ' + (z - r) + ' ' + (x + r) + ' ' + (y + r) + ' ' + (z + r) + ' ' + block + ' replace ' + filter
    level.server.runCommandSilent(cmd)
}

// A vanilla creeper that is already ignited stands in for level.explode(): ExplosionRadius is its power (an integer).
function caeBoom(level, x, y, z, radius) {
    level.server.runCommandSilent('execute in ' + level.dimension + ' run summon minecraft:creeper ' + x + ' ' + y + ' ' + z + ' {ExplosionRadius:' + radius + 'b,Fuse:0s,ignited:1b,Silent:1b,Invulnerable:1b}')
}

// every living entity within r of (x, y, z), like AreaUtils' sphere (squared distance <= r * r)
function caeNearLiving(level, x, y, z, r, fn) {
    const rr = r * r
    level.entities.forEach(ent => {
        if (!ent.living) { return }
        const dx = ent.x - x
        const dy = ent.y - y
        const dz = ent.z - z
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 <= rr) { fn(ent, d2) }
    })
}

// DetonateUtils.glow: air within the radius becomes glow air (CoFH's invisible light block), and every living entity there gets Glowing
// (300 ticks, amplifier 1); undead also take 4 damage and are set on fire for 15 s.
// 1211 substitute: minecraft:light (level 15) stands in for CoFH's glow air.
function caeGlow(level, x, y, z, r) {
    const rr = r * r
    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dz = -r; dz <= r; dz++) {
                if (dx * dx + dy * dy + dz * dz > rr) { continue }
                let b = level.getBlock(x + dx, y + dy, z + dz)
                let id = String(b.id)
                if (id == 'minecraft:air' || id == 'minecraft:cave_air') { b.set('minecraft:light') }
            }
        }
    }
    caeNearLiving(level, x, y, z, r, ent => {
        level.server.runCommandSilent('effect give ' + ent.uuid + ' minecraft:glowing 15 1 true')
        let undead = false
        try { undead = ent.isUndead() } catch (err) { undead = false }
        if (undead) {
            level.server.runCommandSilent('damage ' + ent.uuid + ' 4 minecraft:magic')
            try { ent.setRemainingFireTicks(300) } catch (err) { }
        }
    })
}

// DetonateUtils.ender: living Endermen and Endermites in the radius get CoFH's Enderference effect (they cannot teleport) and 4 damage;
// air in the radius becomes CoFH's ender air.
// 1211 substitute: Enderference and ender air do not exist here, so only the 4 damage (magic) to Endermen and Endermites is kept.
function caeEnder(level, x, y, z, r) {
    caeNearLiving(level, x, y, z, r, ent => {
        let t = String(ent.type)
        if (t == 'minecraft:enderman' || t == 'minecraft:endermite') {
            level.server.runCommandSilent('damage ' + ent.uuid + ' 4 minecraft:magic')
        }
    })
}

// blocks DetonateUtils.nuke cannot remove: blast resistance 3600000 (never) and 1200 (only near the centre, see caeNuke)
const CAE_NUKE_NEVER = ['minecraft:bedrock', 'minecraft:barrier', 'minecraft:command_block', 'minecraft:chain_command_block', 'minecraft:repeating_command_block',
    'minecraft:structure_block', 'minecraft:jigsaw', 'minecraft:end_portal', 'minecraft:end_portal_frame', 'minecraft:end_gateway', 'minecraft:test_block', 'minecraft:test_instance_block']
const CAE_NUKE_HARD = ['minecraft:obsidian', 'minecraft:crying_obsidian', 'minecraft:respawn_anchor', 'minecraft:ancient_debris', 'minecraft:netherite_block',
    'minecraft:enchanting_table', 'minecraft:anvil', 'minecraft:chipped_anvil', 'minecraft:damaged_anvil', 'minecraft:reinforced_deepslate']

// DetonateUtils.nuke (R = the entity's radius: 9 for the TNT, 5 for the grenade):
//   1. every living entity within 3R takes clamp(9R^2 - distSq, 3R, 9R^2) damage and the Wither effect (300 ticks, amplifier 1);
//   2. b = min(32, 2R); a block with distSq < b^2 from the centre, y from -b/2 to +b, is removed when its blast resistance is below
//      400 * (2R)^2 * (1 - distSq / b^2), which is every block except bedrock-like ones and, near the rim, the 1200 resistance ones;
//   3. an explosion of power 0.38 R with fire that destroys blocks.
// 1211 substitute: step 3 is a creeper explosion of power round(0.38 R) (3 for the TNT, 2 for the grenade) without the fire; the damage
// is applied with /damage as minecraft:explosion; the blast resistance table above is a short list of the blocks that matter.
function caeNuke(level, x, y, z, R) {
    const r3 = 3 * R
    const full = 9 * R * R
    caeNearLiving(level, x, y, z, r3, (ent, d2) => {
        let dmg = Math.min(full, Math.max(r3, full - d2))
        level.server.runCommandSilent('damage ' + ent.uuid + ' ' + dmg + ' minecraft:explosion')
        level.server.runCommandSilent('effect give ' + ent.uuid + ' minecraft:wither 15 1 false')
    })
    const b = Math.min(32, 2 * R)
    const b2 = b * b
    const limit = 400 * (2 * R) * (2 * R)
    for (let dx = -b; dx <= b; dx++) {
        for (let dz = -b; dz <= b; dz++) {
            for (let dy = -Math.floor(b / 2); dy <= b; dy++) {
                let d2 = dx * dx + dy * dy + dz * dz
                if (d2 >= b2) { continue }
                let blk = level.getBlock(x + dx, y + dy, z + dz)
                let id = String(blk.id)
                if (id == 'minecraft:air' || id == 'minecraft:cave_air' || id == 'minecraft:void_air') { continue }
                if (CAE_NUKE_NEVER.indexOf(id) >= 0) { continue }
                if (CAE_NUKE_HARD.indexOf(id) >= 0 && 1200 >= limit - limit * d2 / b2) { continue }
                blk.set('minecraft:air')
            }
        }
    }
    caeBoom(level, x, y, z, Math.round(0.38 * R))
}

LevelEvents.tick(event => {
    if (event.level.time % 5 != 0) { return }
    event.level.entities.forEach(e => {
        if (String(e.type) != 'minecraft:tnt') { return }
        const tags = e.tags
        let kind = null
        tags.forEach(t => { if (CAE_BOMB_TAGS[t]) { kind = t } })
        if (kind == null) { return }
        const nbt = e.nbt
        const fuse = nbt.contains('fuse') ? nbt.getInt('fuse') : nbt.getInt('Fuse')
        if (fuse > 6) { return }
        const level = e.level
        const x = Math.floor(e.x)
        const y = Math.floor(e.y)
        const z = Math.floor(e.z)
        const r = CAE_BOMB_RADIUS[kind]
        if (kind == 'cae_ice') {
            // chapter6.js: r = 3, magma block -> blue ice
            caeFill(level, x, y, z, 3, 'minecraft:blue_ice', 'minecraft:magma_block')
        } else if (kind == 'cae_fire') {
            // chapter6.js: r = 3, stone -> magma block
            caeFill(level, x, y, z, 3, 'minecraft:magma_block', 'minecraft:stone')
        } else if (kind == 'cae_glow' || kind == 'cae_glow_small') {
            caeGlow(level, x, y, z, r)
        } else if (kind == 'cae_ender') {
            caeEnder(level, x, y, z, r)
        } else if (kind == 'cae_boom') {
            // DetonateUtils.explosive: Level.explode(entity, x, y, z, 1.9, no fire, BREAK). 1211 substitute: power 2 (creeper radius is an integer)
            caeBoom(level, x, y, z, 2)
        } else if (kind == 'cae_nuke_small' || kind == 'cae_nuke') {
            caeNuke(level, x, y, z, r)
        }
        e.discard()
    })
})
