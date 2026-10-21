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
//   5. the explosives: moved to gaps2Explosives.js (startup and server)
// (The Arboreal Extractor and the Rock Generator were sections 4a and 4b: they are real blocks of the core mod now, com.caeport.cae.device,
// with the tree table in its data/cae/device/tree_extractor.json.)
//
// Nothing in this file was run in game when it was written: if the log complains, start with the TNT handlers.

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
    // (the devices are blocks of the core mod now, with their own mineable tags in its data)
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
                // 1211 substitute: superheated; the 1.18.2 crystallizer was a radiant-tier machine that took power
                event.recipes.create.mixing('2x ' + id, [id, Fluid.of('minecraft:water', 1000)]).superheated().id(R('dupe_' + c + suffix))
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
            // 1211 substitute: heated; the insolator took power (radiant tier in 1.18.2), a free copy was too cheap
            event.recipes.create.mixing('2x ' + id, [id, Fluid.of('minecraft:water', 250)]).heated().id(R('flower_' + f))
        })
    })
})

// ---------------------------------------------------------------------------------------------------------------------
// 5. the explosives (TNT blocks, grenades, their effects) moved to startup_scripts/gaps2Explosives.js and server_scripts/gaps2Explosives.js
