CreateEvents.spoutHandler(event => {
    //Creates a handler for spout, the id is required as there's no way to generate a consistent uuid here.
    //
    //Spout will call the handler with simulate = true for every tick, if the returned value > 0, then
    //the spout will start its animation, handler will be called with simulate = false again at the end of
    //the animation.
    //
    //The returned integer is how much fluid should this operation consume.

    let spoutInteraction = (blockId, fluidId, fluidAmount, result, requiredAmount) => {
    event.add(blockId + "_spout_interaction", blockId, (block, fluid, simulate) => {
        /*
        blockId = The block required below the spout
        fluidId = The fluid to be used
        fluidAmount = The amount of fluid consumed in an interaction and the amount needed to start an interaction if requiredAmount is left undefined. 0 wont work, even if requiredAmount is defined.
        result = The block that is placed instead of the old block. A random tick will be called if left undefined.
        requiredAmount = the amount of fluid required to start an interaction. 0 doesnt work.
        */
        // port: addSpoutHandler is now CreateEvents.spoutHandler + event.add(id, blockPredicate, handler)
        if (!requiredAmount)
        requiredAmount = fluidAmount
        if (fluid.id == fluidId && fluid.amount >= requiredAmount) {
            if (!simulate)
                if (result)
                block.set(result)
                else
                block.blockState.randomTick(block.level, block.pos, block.level.random)
            return fluidAmount;
        }
        return 0;
        });
    }
    spoutInteraction("minecraft:wheat", "minecraft:water", 100)
    spoutInteraction("ars_nouveau:blue_archwood_sapling", "kubejs:cascading_juice", 1000, "chipped:blue_moss_block") // 1211: was chipped:moss_block_1 (Blue Flowery Moss); texture identical to chipped:blue_moss_block
    spoutInteraction("ars_nouveau:green_archwood_sapling", "kubejs:flourishing_juice", 1000, "immersive_weathering:rooted_grass_block")
    spoutInteraction("ars_nouveau:purple_archwood_sapling", "kubejs:vexing_juice", 1000, "chipped:loded_amethyst_block") // 1211: was chipped:amethyst_block_30 (Loded Amethyst); texture identical to chipped:loded_amethyst_block
    spoutInteraction("ars_nouveau:red_archwood_sapling", "kubejs:blazing_juice", 1000, "minecraft:netherrack")
    // 1211: the yellow archwood sapling is Ars Elemental's (ars_elemental:yellow_archwood_sapling is in the 1.21.1 registry)
    spoutInteraction("ars_elemental:yellow_archwood_sapling", "kubejs:flashing_juice", 1000, "quark:yellow_shingles")
    let corundum = ["red", "orange", "yellow", "green", "blue", "indigo", "violet", "white", "black"]
    corundum.forEach(Color => {
        spoutInteraction("quark:" + Color + "_corundum", "minecraft:water", 100)
    });


})
