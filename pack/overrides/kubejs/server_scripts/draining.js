ServerEvents.recipes(event => {
    event.recipes.create.emptying([Item.of('kubejs:chrom'), Fluid.of('kubejs:chromatic_waste', 250)], Item.of('minecraft:glowstone_dust'))
    event.recipes.create.emptying([Item.of('kubejs:empty_vial'), Fluid.of('kubejs:liquid_anthraquinone', 56)], Item.of('kubejs:anthraquinone'))
    event.recipes.create.emptying([Item.of('kubejs:dirty_bowl'), Fluid.of('kubejs:impure_source', 50)], Item.of('kubejs:magebloom_sourceberry_smoothie_bowl'))
})