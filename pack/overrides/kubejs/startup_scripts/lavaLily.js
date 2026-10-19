// 1211: Ars Nouveau's Lava Lily, removed in Ars Nouveau 5 (the 1.18.2 pack had Ars Nouveau 2.9.0: block
// com.hollingsworth.arsnouveau.common.block.LavaLily, item FluidBlockItem, read from the jar 19 Oct 2026). It is in the
// pack's arcane-structure and magic loot tables. What it was: a decorative lily (a BushBlock, no collision, 16 x 1.5 x 16
// box like a lily pad) that can be placed on any liquid or block; blockstate loc = 0 / 1 / 2 picks the stone / magma /
// lava look by the block underneath (stone -> 0, magma block -> 1, lava -> 2, anything else keeps the default 0); a
// fire-resistant item; and standing in one on a magma block cancels the magma's hot-floor damage (Ars EventHandler
// .livingAttackEvent). Recipe, loot and placing in server_scripts/lavaLily.js; the models and textures are Ars 1.18's, in
// kubejs/assets/cae (blockstates/lava_lily.json, models/block/lava_lily/, textures/block/lava_lily/).
// The item is a plain item, not a block item, like Ars' FluidBlockItem behaved: clicking a block never placed it (useOn
// returned PASS); using it ray-traced through any fluid and set the lily on top of the first fluid or block hit, if that
// spot was air. The server script does that.
// Ars' BushBlock dropped the lily when its support went (canSurvive); KubeJS blocks have no such hook, so the core mod does
// it (com.caeport.cae.compat.LavaLilySupport), with the self-drop loot table in kubejs/data/cae/loot_table/blocks.
// 1211 substitute: Ars' Volcanic Sourcelink also grew lilies on uncovered lava next to it; Ars 5's sourcelink doesn't, and
// that is not rebuilt.

const CAE_LILY_LOC = Java.loadClass('net.minecraft.world.level.block.state.properties.IntegerProperty').create('loc', 0, 2)
const CAE_HOT_FLOOR = Java.loadClass('net.minecraft.world.damagesource.DamageTypes').HOT_FLOOR

// the loc for a lily at pos (LavaLily.getState): by the block underneath (same function in server_scripts/lavaLily.js)
function caeLilyLoc(level, pos) {
    let below = String(level.getBlockState(pos.below()).getBlock().builtInRegistryHolder().key().location())
    if (below == 'minecraft:stone') return 0
    if (below == 'minecraft:magma_block') return 1
    if (below == 'minecraft:lava') return 2
    return 0
}

StartupEvents.registry('block', event => {
    event.create('cae:lava_lily')
        .displayName('Lava Lily')
        .property(CAE_LILY_LOC)
        .placementState(s => s.set(CAE_LILY_LOC, caeLilyLoc(s.getLevel(), s.getClickedPos())))
        .box(0, 0, 0, 16, 1.5, 16)
        .noCollision()
        .notSolid()
        .renderType('cutout')
        // Ars ModBlock.defaultProperties(): strength 2, resistance 6, stone sound
        .hardness(2.0).resistance(6.0).soundType('stone')
        .noItem()
})

StartupEvents.registry('item', event => {
    event.create('cae:lava_lily').displayName('Lava Lily').fireResistant()
})

// The magma protection. Cancelling the incoming damage (as Ars cancelled LivingAttackEvent) also skips the hurt flash and
// sound; KubeJS' EntityEvents.beforeHurt comes too late for that.
// The listener is guarded: an error thrown in a native event listener is not caught by KubeJS and crashes the server (a
// first version called entity.level(), which scripts see as a property, and took the test server down when a pig stepped
// on magma).
let caeLilyWarned = false
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    try {
        if (!event.getSource().is(CAE_HOT_FLOOR)) return
        if (String(event.getEntity().block.id) == 'cae:lava_lily') event.setCanceled(true)
    } catch (err) {
        if (!caeLilyWarned) console.warn('lavaLily.js: magma protection failed: ' + err)
        caeLilyWarned = true
    }
})
