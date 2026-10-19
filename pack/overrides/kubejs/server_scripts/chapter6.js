
ServerEvents.recipes(event => {
    // port: restored. cae:essence_extractor is now a Multiblocked2 controller registered under the old ID (see the port's MBD2 notes)
    event.recipes.create.mechanical_crafting("cae:essence_extractor", [
        'ASA',
        'ZEZ',
        'ADA'
      ], {
        S: "pneumaticcraft:spawner_extractor",
        Z: "kubejs:finalpcb",
        D: "createoreexcavation:netherite_drill",
        E: "createoreexcavation:extractor",
        A: "forbidden_arcanus:arcane_polished_darkstone"
    })

    // port: byg: -> biomeswevegone:; biomeswevegone:prairie_grass -> biomeswevegone:prairie_grass (no direct equivalent)
    event.recipes.create.mechanical_crafting("cae:stem_cell", [
        'CAAAC',
        'DOLKH',
        'DFLPH',
        'DKLEH',
        'CGGGC'
      ], {
        A: "biomeswevegone:pine_leaves",
        L: "reliquary:fertile_lily_pad",
        C: "integrateddynamics:crystalized_menril_chunk",
        D: "biomeswevegone:green_enchanted_leaves",
        G: "biomeswevegone:flowering_palo_verde_leaves",
        H: "integrateddynamics:menril_leaves",
        K: "biomeswevegone:protea_flower",
        O: "minecraft:short_grass", // port (1.21.1): minecraft:short_grass is short_grass since 1.20.3
        E: "biomeswevegone:prairie_grass",
        F: "reliquary:fertile_essence",
        P: "minecraft:lily_pad"

    })

    event.recipes.create.mixing('biomeswevegone:pine_sapling', ['reliquary:fertile_essence','minecraft:short_grass']).heated()
    event.recipes.create.mixing('biomeswevegone:palo_verde_sapling', ['biomeswevegone:protea_flower','minecraft:short_grass']).heated()
    event.recipes.create.mixing('biomeswevegone:green_enchanted_sapling', ['biomeswevegone:protea_flower','biomeswevegone:prairie_grass']).heated()
    event.recipes.create.mixing('integrateddynamics:menril_sapling', ['minecraft:lily_pad','biomeswevegone:prairie_grass']).heated()
    event.recipes.create.filling("cae:nature_keystone",[Fluid.of("kubejs:nature_essence",1000),"cae:stem_cell"])

    // port (1.21.1): Lychee 6 recipes: drop_item takes "id" (not "item"), a post action's condition is "if" ("contextual" still
    // works as an alias), and an empty-hand item_in is {} (Lychee's optionalEmptyMap) instead of {"item": "air"}.
    event.custom({
        "type": "lychee:block_clicking",
        "item_in": {
            "item": "farmersdelight:iron_knife"
        },
        "block_in": "kubejs:omlett_block",
        "post": [
            {
                "type": "drop_item",
                "id": "kubejs:arcane_omelett_sheet"
            },
            {
                "type": "place",
                "block": "minecraft:air",
                "if": {
                    "type": "chance",
                    "chance": 0.2
                }
            },
            {
                "type": "damage_item"
            }
        ]
    })
    
    
    // 1211: the omlett basin cast is a Create: Metallurgy casting_in_basin recipe in tinkersReplacements.js

    event.recipes.create.emptying(['kubejs:broken_arcane_egg',Fluid.of('kubejs:liquid_egg', 1)], 'minecraft:egg')
    event.recipes.create.compacting([Fluid.of("kubejs:liquid_omlett",4), CreateItem.of("kubejs:arcane_unscrambled_egg",0.10)], [Fluid.of("kubejs:liquid_egg",10)]).heated()
    event.recipes.create.filling(Item.of("cae:soul_keystone"),[Fluid.of("kubejs:soul_essence",1000),"kubejs:arcane_omelett_sheet"])

    event.recipes.create.mechanical_crafting("kubejs:sushi", [
        'KKKK',
        'PTCS',
        'PTCS',
        'RRRR'
      ], {
        K: "minecraft:dried_kelp",
        P: "minecraft:pufferfish",
        T: "minecraft:tropical_fish",
        C: "minecraft:cod",
        S: "minecraft:salmon",
        R: "#c:crops/rice" // port (1.21.1): forge: -> c: (Farmer's Delight tags farmersdelight:rice with c:crops/rice; checked 18 Oct 2026)
    })
    
        event.custom({
            "type": "lychee:block_interacting",
            "item_in": {},
            "block_in": "minecraft:wet_sponge",
            "post": [
                {
                    "type": "drop_item",
                    "id": "minecraft:pufferfish",
                    "if": {
                        "type": "chance",
                        "chance": 0.05
                    }
                },
                {
                    "type": "drop_item",
                    "id": "minecraft:tropical_fish",
                    "if": {
                        "type": "chance",
                        "chance": 0.05
                    }
                },
                {
                    "type": "drop_item",
                    "id": "minecraft:cod",
                    "if": {
                        "type": "chance",
                        "chance": 0.05
                    }
                },
                {
                    "type": "drop_item",
                    "id": "minecraft:salmon",
                    "if": {
                        "type": "chance",
                        "chance": 0.05
                    }
                },
                {
                    "type": "place",
                    "block": "minecraft:sponge",
                    "if": {
                        "type": "chance",
                        "chance": 0.4
                    }
                }
            ]
        })
    event.recipes.create.filling(Item.of("cae:dry_keystone"),[Fluid.of("kubejs:dry_essence",1000),"kubejs:sushi"])
    event.recipes.create.crushing(CreateItem.of("kubejs:magical_ice",0.025),["minecraft:blue_ice"]) // 1211: was 64x (Create 0.5 ignored counts; Create 6 crushing takes one ingredient)
    event.recipes.create.filling(Item.of("cae:ice_keystone"),[Fluid.of("kubejs:ice_essence",1000),"kubejs:magical_ice"])
    event.recipes.create.compacting(Fluid.of("kubejs:cascading_juice",250),Item.of("ars_nouveau:blue_archwood_sapling")).superheated()
    event.recipes.create.compacting(Fluid.of("kubejs:flourishing_juice",250),Item.of("ars_nouveau:green_archwood_sapling")).superheated()
    event.recipes.create.compacting(Fluid.of("kubejs:vexing_juice",250),Item.of("ars_nouveau:purple_archwood_sapling")).superheated()
    event.recipes.create.compacting(Fluid.of("kubejs:blazing_juice",250),Item.of("ars_nouveau:red_archwood_sapling")).superheated()
    event.custom({
        "type": "lychee:block_interacting",
        "item_in": {},
        "block_in": "kubejs:source_time_crystal",
        "post": [
            {
                "type": "drop_item",
                "id": "ars_nouveau:blue_archwood_sapling",
                "if": {
                    "type": "chance",
                    "chance": 0.05
                }
            },
            {
                "type": "drop_item",
                "id": "ars_nouveau:green_archwood_sapling",
                "if": {
                    "type": "chance",
                    "chance": 0.05
                }
            },
            {
                "type": "drop_item",
                "id": "ars_nouveau:purple_archwood_sapling",
                "if": {
                    "type": "chance",
                    "chance": 0.05
                }
            },
            {
                "type": "drop_item",
                "id": "ars_nouveau:red_archwood_sapling",
                "if": {
                    "type": "chance",
                    "chance": 0.05
                }
            },
            {
                "type": "drop_item",
                "id": "kubejs:source_time_crystal",
                "if": {
                    "type": "chance",
                    "chance": 0.02
                }
            }
        ]
    })
    let t = "ars_nouveau:source_gem"
    event.recipes.create.mechanical_crafting("ars_nouveau:source_gem", [
        ' KK ',
        'KKKK',
        'KKKK',
        'KKKK',
        'KKKK',
        ' KK '
      ], {
        K: "kubejs:source_time_crystal"
    })
    event.recipes.create.sequenced_assembly([
        'kubejs:source_candy_rock',
      ], 'ars_nouveau:source_gem', [
        // port: chipped's numbered variants (moss_block_1, amethyst_block_30) are gone in 1.20.1; using the plain blocks they were variants of
        event.recipes.create.deploying(t, [t, 'minecraft:moss_block']),
        event.recipes.create.deploying(t, [t, 'minecraft:rooted_dirt']),
        event.recipes.create.deploying(t, [t, 'minecraft:amethyst_block']),
        event.recipes.create.deploying(t, [t, 'minecraft:netherrack'])
      ]).transitionalItem(t).loops(8)

    event.recipes.create.filling(Item.of("cae:source_keystone"),[Fluid.of("kubejs:source_essence",1000),"kubejs:source_candy_rock"])
})
// 1211: the ice / fire TNT handlers are gone: cae:ice_tnt / cae:fire_tnt are plain items now, lit and resolved in thermalReplacements.js
