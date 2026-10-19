ServerEvents.recipes(event => {
    // 1211: forge: tags are c: tags (glass/colorless -> glass_blocks/colorless, tools/knives -> tools/knife)
    event.recipes.create.deploying('glassential:glass_ghostly', [Ingredient.of('#c:glass_blocks/colorless'),'quark:soul_bead'])

    event.recipes.create.deploying('ars_nouveau:magebloom_fiber', ['kubejs:mage_leaf', Ingredient.of('#c:tools/knife')])
    event.recipes.create.deploying('kubejs:runic_tablet', ['minecraft:smooth_stone_slab', 'forbidden_arcanus:rune'])
    event.recipes.create.deploying('kubejs:sturdy_mechanism', ['create:precision_mechanism', 'create:sturdy_sheet'])
    // 1211: Item.of(x).withChance() is gone on 1.21; KubeJS Create's CreateItem.of(item, chance) replaces it
    // 1211: create:sandpaper_polishing has a single output in Create 6, so the 70/30 tested/failed split is a one-step sequenced
    // assembly (weights 0.7/0.3) whose step is a deployer using sandpaper (the sandpaper wears, it is not consumed).
    // The transitional item is the PCB itself (same trick as the saddle in assembly.js).
    {
        let pcb = 'kubejs:mystery_pcb'
        event.recipes.create.sequenced_assembly([
            CreateItem.of('kubejs:tested_pcb', 0.7), CreateItem.of('pneumaticcraft:failed_pcb', 0.3)
        ], pcb, [
            event.recipes.create.deploying(pcb, [pcb, 'create:sand_paper']).keepHeldItem()
        ]).transitionalItem(pcb).loops(1).id('cae:mystery_pcb_polishing')
    }
})
