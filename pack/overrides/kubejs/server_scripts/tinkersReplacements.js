// 1211: Tinkers' Construct has no 1.21.1 build. Its smeltery/casting recipes in this pack are re-expressed here for Create: Metallurgy
// (createmetallurgy 1.0.3), using the JSON of the mod's own data/createmetallurgy/recipe files:
//   createmetallurgy:melting         { heat_requirement: "heated"|"superheated", ingredients: [ingredient], processing_time, results: [{id, amount}] }
//   createmetallurgy:entity_melting  { entity: {type, damage}, ingredients: [], minHeatRequirement: int, results: [{id, amount}] }
//   createmetallurgy:casting_in_basin / casting_in_table
//                                    { ingredients: [{type:"neoforge:single", fluid, amount}, (mold/ingredient)], processing_time,
//                                      mold_consumed?, result: {item: {id, count}} }
// This file replaces: tinkers.js (all of it), the two tconstruct blocks in compatRecipes.js (bee/honey, ~60 orestone melts) and the
// casting_basin recipe in chapter6.js. Delete those originals (see the port's id-map notes); this file does not touch them.
// Tinkers melting_fuel (thermal:refined_fuel; 75 mB, duration 300, temperature 1900) has no Metallurgy equivalent and is dropped: heat comes from blaze burners.
//
// How the Tinkers numbers were carried over (every number that is NOT the original is marked "1211 substitute:" and keeps the original in the comment):
//  - fluid amounts, casting times (cooling_time -> processing_time, both ticks), item and fluid ids: the original values.
//  - Tinkers "temperature" -> Metallurgy heat_requirement. Metallurgy only has "heated" (2) and "superheated" (3); its own recipes use
//    "heated" for iron/gold/copper/zinc (Tinkers 700-800) and "superheated" for netherite (Tinkers ~1250). So: temperature <= 1000 -> heated,
//    above (tar 1400, diamond 1450) -> superheated. 1211 substitute: that threshold is mine, read off Metallurgy's own recipes.
//  - Tinkers melting "time" -> Metallurgy processing_time. Metallurgy melts at about 4/9 tick per mB (ingot 90 mB = 40, nugget 10 mB = 4,
//    gear 360 mB = 160, netherite too). Copied from the original: redstone 90/10 and honey block 94. 1211 substitute: tar, the orestones and
//    diamond use that 4/9 tick per mB rule instead of the Tinkers `time`, because Tinkers' unit is smeltery heat, not ticks (unverified).

// 1211: createmetallurgy:entity_melting cannot go through event.custom(): Create: Metallurgy's KubeJS schema for it is the foundry
// schema, whose "ingredients" list must not be empty ("Component 'either<create:sized_fluid_ingredient, ingredient>[]' is not
// allowed to be empty!"), while the mod's own recipes (data/createmetallurgy/recipe/entity_melting/*.json) have "ingredients": [].
// So these are generated as plain data pack files (KubeJS 7 ServerEvents.generateData, KubeResourceGenerator.json), which skips the
// schema. Same JSON as the mod's own files: entity {type, damage}, ingredients [], minHeatRequirement, results [{id, amount}].
// Format check (javap on createmetallurgy-1.0.3-1.21.1.jar and its data): matches piglin.json / iron_golem.json.
ServerEvents.generateData('after_mods', event => {
    if (!Platform.isLoaded('createmetallurgy')) { return }
    let entityMelt = (id, entityType, damage, heat, fluid, amount) => {
        event.json('cae:recipe/metallurgy/entity_melting/' + id, {
            type: 'createmetallurgy:entity_melting',
            entity: { type: entityType, damage: damage },
            ingredients: [],
            minHeatRequirement: heat,
            results: [{ id: fluid, amount: amount }]
        })
    }
    // Create contraptions -> inertia essence; bees -> honey. (Wraiths and vexes -> liquid resent is NOT a recipe any more: see resentStream.js.)
    // Original amounts: 10 mB inertia essence, 25 mB honey. Original damage (tinkers.js): contraptions 0, bee 2
    // (compatRecipes.js; Tinkers' default is 2).
    // 1211 substitute: no wraith/vex entity_melting recipes. Metallurgy's crucible only pays out when the entity dies, which turned the
    // 1.18.2 endless name-tagged-wraith stream into 10 mB per kill; resentStream.js adds the 10 mB every 20 ticks to a heated crucible
    // while a living wraith/vex stands in it, without hurting it. No one-off death payout is kept: 1.18.2 had none, and a recipe makes
    // the crucible hurt (and kill) the entity.
    // 1211 substitute: damage 1 (original 0) for the contraptions. Metallurgy's crucible hurts the entity by `damage` every tick
    // and gives the fluid only when the entity dies (CrucibleBlockEntity), whereas Tinkers gives fluid per hit. With 0 the entity takes no damage from the
    // crucible and only dies if the fire it sets (15 ticks) kills it, and a contraption entity can never die that way. The codec accepts 0,
    // so it is valid, but it would not melt anything reliably. Whether a Create contraption entity can die from damage 1 is untested.
    // 1211 substitute: minHeatRequirement 2 for all (Tinkers entity melting had no temperature). 2 is Metallurgy's "heated" level (superheated
    // = 3; the mod's own mob recipes use 6 and 9, which need a big crucible full of burners).
    ;['create:carriage_contraption', 'create:contraption', 'create:gantry_contraption', 'create:stationary_contraption'].forEach(t => {
        entityMelt(t.replace(':', '_'), t, 1, 2, 'kubejs:inertia_essence', 10)
    })
    entityMelt('bee', 'minecraft:bee', 2, 2, 'create:honey', 25)
})

ServerEvents.recipes(event => {
    if (!Platform.isLoaded('createmetallurgy')) { return }
    const CM = 'createmetallurgy:'
    // 1211: thermal. thermal:redstone (Destabilized Redstone) became cae:redstone (thermalReplacements.js), the fluid the rose quartz
    // filling and the heated-mixer melting use; this constant still named the Thermal id, so the foundry route was never built
    const REDSTONE_FLUID = 'cae:redstone'

    let fl = (fluid, amount) => ({ type: 'neoforge:single', fluid: fluid, amount: amount })
    let melt = (id, ingredient, results, time, heat, extra) => {
        let json = {
            type: CM + 'melting',
            heat_requirement: heat || 'heated',
            ingredients: [ingredient],
            processing_time: time,
            results: results
        }
        if (extra) { Object.keys(extra).forEach(k => { json[k] = extra[k] }) }
        event.custom(json).id('cae:metallurgy/melting/' + id)
    }
    let castBasin = (id, ingredients, time, resultId, consumed) => {
        let json = {
            type: CM + 'casting_in_basin',
            ingredients: ingredients,
            processing_time: time,
            result: { item: { id: resultId, count: 1 } }
        }
        if (consumed) { json.mold_consumed = true }
        event.custom(json).id('cae:metallurgy/casting_in_basin/' + id)
    }
    let castTable = (id, ingredients, time, resultId, consumed) => {
        let json = {
            type: CM + 'casting_in_table',
            ingredients: ingredients,
            processing_time: time,
            result: { item: { id: resultId, count: 1 } }
        }
        if (consumed) { json.mold_consumed = true }
        event.custom(json).id('cae:metallurgy/casting_in_table/' + id)
    }

    // ------------------------------------------------------------------ tinkers.js
    // redstone (thermal:redstone fluid): melting x2 + basin casting
    if (Fluid.exists(REDSTONE_FLUID)) { // 1211: thermal
        melt('redstone_block', { item: 'minecraft:redstone_block' }, [{ id: REDSTONE_FLUID, amount: 900 }], 90)
        melt('redstone', { item: 'minecraft:redstone' }, [{ id: REDSTONE_FLUID, amount: 100 }], 10)
        castBasin('redstone_block', [fl(REDSTONE_FLUID, 900)], 225, 'minecraft:redstone_block')
    }

    // entity melting: wraiths and vexes -> liquid resent; Create contraptions -> inertia essence
    // (entity melting is written by ServerEvents.generateData at the top of this file, not here)

    // tar -> superheated anthracene (c:tar is empty without Thermal; the condition keeps the recipe from loading then)
    // original: 144 mB, temperature 1400, time 400. 1211 substitute: time 64 (144 mB x 4/9, Metallurgy's rate); superheated because 1400 > 1000.
    melt('tar', { tag: 'c:tar' }, [{ id: 'kubejs:superheated_anthracene', amount: 144 }], 64, 'superheated', {
        'neoforge:conditions': [{ type: 'neoforge:not', value: { type: 'neoforge:tag_empty', tag: 'c:tar' } }]
    })

    // runic tablet "cast" + source -> source gem (the tablet is consumed, as in Tinkers)
    castTable('source_gem', [fl('kubejs:source', 200), { item: 'kubejs:runic_tablet' }], 100, 'ars_nouveau:source_gem', true)
    // any nugget + molten gold -> nugget mold (Tinkers nugget cast), usable in Metallurgy's own table recipes
    castTable('nugget_mold', [fl(CM + 'molten_gold', 90), { tag: 'c:nuggets' }], 40, CM + 'graphite_nugget_mold', true)

    // ------------------------------------------------------------------ compatRecipes.js
    melt('honey_block', { item: 'minecraft:honey_block' }, [{ id: 'create:honey', amount: 1000 }], 94)

    // 4 Create ore stones x 15 blocks -> molten metal (40 mB each, as in the original; original temperature 800 -> heated, time 400).
    // 1211 substitute: time 18 (40 mB x 4/9, Metallurgy's rate).
    let orestones = [
        ['veridium', CM + 'molten_copper'], ['asurine', CM + 'molten_zinc'], ['crimsite', CM + 'molten_iron'], ['ochrum', CM + 'molten_gold']
    ]
    orestones.forEach(i => {
        let blocks = [
            'create:' + i[0],
            'create:cut_' + i[0],
            'create:cut_' + i[0] + '_stairs',
            'create:cut_' + i[0] + '_wall',
            'create:polished_cut_' + i[0],
            'create:polished_cut_' + i[0] + '_stairs',
            'create:polished_cut_' + i[0] + '_wall',
            'create:cut_' + i[0] + '_bricks',
            'create:cut_' + i[0] + '_brick_stairs',
            'create:cut_' + i[0] + '_brick_wall',
            'create:small_' + i[0] + '_bricks',
            'create:small_' + i[0] + '_brick_stairs',
            'create:small_' + i[0] + '_brick_wall',
            'create:layered_' + i[0],
            'create:' + i[0] + '_pillar'
        ]
        blocks.forEach(block => {
            if (!Item.exists(block)) { return }
            melt('orestone/' + block.replace(':', '_'), { item: block }, [{ id: i[1], amount: 40 }], 18)
        })
    })

    // ------------------------------------------------------------------ chapter6.js
    castBasin('omlett_block', [fl('kubejs:liquid_omlett', 1000)], 225, 'kubejs:omlett_block')

    // ------------------------------------------------------------------ new items (portReplacements.js)
    // molten diamond: no Metallurgy fluid for it (the engineering circuit in assembly.js fills with it)
    // Tinkers' own recipes (TConstruct 3.6.4 jar, smeltery/melting/diamond/{gem,block}.json, casting/diamond/block.json): gem 100 mB,
    // block 900 mB, temperature 1450, time 79 / 237; basin 900 mB, cooling_time 250. Amounts are the originals; superheated because 1450 > 1000.
    // 1211 substitute: melting time 44 / 400 (4/9 tick per mB) instead of 79 / 237; basin processing_time 480 (Metallurgy's block-casting time)
    // instead of 250.
    melt('diamond', { item: 'minecraft:diamond' }, [{ id: 'cae:molten_diamond', amount: 100 }], 44, 'superheated')
    melt('diamond_block', { item: 'minecraft:diamond_block' }, [{ id: 'cae:molten_diamond', amount: 900 }], 400, 'superheated')
    castBasin('diamond_block', [fl('cae:molten_diamond', 900)], 480, 'minecraft:diamond_block')

    // necrotic bone (Tinkers dropped it from wither skeletons; reliquary withered_rib and a slaying task need it): haunt a bone
    event.recipes.create.haunting('cae:necrotic_bone', 'minecraft:bone').id('cae:necrotic_bone_from_haunting')
})

// 1211 caetools: the pack's Tinkers' tools mod (caetools/PORT-TOOLS.md) brings its own Metallurgy recipes, and two melt what
// this file already melts. This file's win: cae:molten_diamond is what the engineering circuit fills with (assembly.js), and
// Create's honey is the pack's honey. So caetools' diamond and honey block melting go, and the pack's molten diamond joins the
// fluid tag caetools' diamond recipes read (its honey recipes read c:honey, which already holds Create's honey).
ServerEvents.recipes(event => {
    if (!Platform.isLoaded('caetools')) { return }
    ;['diamond/gem', 'diamond/block', 'slime/honey_block'].forEach(p => {
        event.remove({ id: 'caetools:metallurgy/melting/smeltery/melting/' + p })
    })
})

ServerEvents.tags('fluid', event => {
    if (!Platform.isLoaded('caetools')) { return }
    event.add('caetools:molten_diamond', 'cae:molten_diamond')
})

// The necrotic bone: config/caetools-common.toml turns off caetools' wither skeleton drop (Architect's Palette's withered
// bone wins that drop, as in 1.18.2), so the pack's haunted bone above joins the tags caetools' necrotic material,
// modifier and severing read.
ServerEvents.tags('item', event => {
    if (!Platform.isLoaded('caetools')) { return }
    event.add('c:wither_bones', 'cae:necrotic_bone')
    event.add('c:bones/wither', 'cae:necrotic_bone')
})
