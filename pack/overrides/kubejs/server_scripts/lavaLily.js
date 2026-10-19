// 1211: the Lava Lily's placing and recipe (the block, the item and the magma protection are in startup_scripts/lavaLily.js,
// which explains what Ars Nouveau 2.9.0's Lava Lily was). Its loot-table entries are back in data/cae/loot_table/arcane*.json
// and data/loot/loot_table/magic/magic_basic.json, as in the 1.18.2 pack.

const CAE_LILY_BLOCK = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries').BLOCK
    .get(Java.loadClass('net.minecraft.resources.ResourceLocation').parse('cae:lava_lily'))

// by the block underneath (LavaLily.getState; same as the startup script's caeLilyLoc)
function caeLilyLocAt(level, pos) {
    let below = String(level.getBlock(pos.below()).id)
    if (below == 'minecraft:magma_block') return 1
    if (below == 'minecraft:lava') return 2
    return 0
}

// FluidBlockItem.use: the player's look ray stops at the first block or fluid (ClipContext.Fluid.ANY); the lily goes on top
// of it if that spot is air.
ItemEvents.rightClicked('cae:lava_lily', event => {
    let player = event.player
    let level = event.level
    let hit = player.pick(player.blockInteractionRange(), 1.0, true)
    if (String(hit.getType()) != 'BLOCK') return
    let pos = hit.getBlockPos().above()
    if (!level.getBlockState(pos).isAir()) return
    let loc = CAE_LILY_BLOCK.getStateDefinition().getProperty('loc')
    level.setBlockAndUpdate(pos, CAE_LILY_BLOCK.defaultBlockState().setValue(loc, Java.loadClass('java.lang.Integer').valueOf(caeLilyLocAt(level, pos))))
    event.server.runCommandSilent(`execute in ${level.dimension} run playsound minecraft:block.stone.place block @a ${pos.x + 0.5} ${pos.y + 0.5} ${pos.z + 0.5}`)
    if (!player.isCreative()) event.item.shrink(1)
    player.swing(event.hand, true)
})

ServerEvents.recipes(event => {
    // Ars 2.9.0 data/ars_nouveau/recipes/lava_lily.json: a lily pad and 8 source gems make 8
    event.shapeless(Item.of('cae:lava_lily', 8), ['minecraft:lily_pad', '#c:gems/source', '#c:gems/source', '#c:gems/source',
        '#c:gems/source', '#c:gems/source', '#c:gems/source', '#c:gems/source', '#c:gems/source']).id('cae:lava_lily')
})
