// 1211: Lychee 6.7 JSON (see data/lychee/recipe/*.json in the mod): post-action and contextual ids are registered WITHOUT the
// lychee: prefix ("drop_item", "place", "chance"; the prefixed ids throw "Unknown registry key"), "drop_item" names its stack with
// "id" (was "item"), block_in is a vanilla BlockPredicate ({"blocks": [...], "state": {"level": "0"}}).
ServerEvents.recipes(event => {
    if (CAE_THERMAL) { // 1211: thermal (mekanism:dust_sulfur)
        event.custom({
            "type": "lychee:item_inside",
            "item_in": {
                "item": "mekanism:dust_sulfur"
            },
            "block_in": {
                "blocks": ["minecraft:water"],
                "state": {
                    "level": "0"
                }
            },
            "post": [
                {
                    "type": "place",
                    "block": "kubejs:sulfuric_acid"
                }
                ]

        })
    }
    event.custom({
        "type": "lychee:item_inside",
        "item_in": {
            "item": "kubejs:chrom"
        },
        "block_in": {
            "blocks": ["minecraft:water"],
            "state": {
                "level": "0"
            }
        },
        "post": [
            {
                "type": "place",
                "block": "kubejs:dichromic_acid"
            }
            ]

    })
    event.custom({
        "type": "lychee:item_inside",
        "item_in": {
            "item": "kubejs:anthracene"
        },
        "block_in": {
            "blocks": ["kubejs:sulfuric_acid"],
            "state": {
                "level": "0"
            }
        },
        "post": [
            {

                "type": "place",
                "block": "minecraft:air",
                "contextual": {
                    "type": "chance",
                    "chance": 0.1
                }
            },
            {
                "type": "drop_item",
                "id": "kubejs:incomplete_anthraquinone"
            }
            ]

    })
    event.custom({
        "type": "lychee:item_inside",
        "item_in": {
            "item": "kubejs:incomplete_anthraquinone"
        },
        "block_in": {
            "blocks": ["kubejs:dichromic_acid"],
            "state": {
                "level": "0"
            }
        },
        "post": [
            {

                "type": "place",
                "block": "minecraft:air",
                "contextual": {
                    "type": "chance",
                    "chance": 0.10
                }
            },
            {
                "type": "drop_item",
                "id": "kubejs:anthraquinone"
            }
            ]

    })
    // port: Infernal Expansion is gone in 1.20.1 (infernalexp:glow_fire), recipe dropped
    /*
    event.custom({
        "type": "lychee:item_inside",
        "item_in": {
            "item": "gunpowder"
        },
        "block_in": {
            "blocks": ["infernalexp:glow_fire"],
        },
        "post": [
            {
                "type": "drop_item",
                "id": "glowstone_dust",
            }
            ]

    })
    */

})
