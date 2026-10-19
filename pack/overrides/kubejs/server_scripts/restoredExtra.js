// 1211: the server half of startup_scripts/restoredExtra.js (blocks of the finale rooms brought back by hand).

ServerEvents.recipes(event => {
    // Forbidden Arcanus 1.18.2: shapeless, chiseled polished darkstone + rune
    event.shapeless('forbidden_arcanus:runic_chiseled_polished_darkstone',
        ['forbidden_arcanus:chiseled_polished_darkstone', 'forbidden_arcanus:rune'])
        .id('cae:restored/runic_chiseled_polished_darkstone')
})

// Forbidden Arcanus 1.18.2: a right click with an Arcane Crystal activates it (one crystal used up unless creative)
BlockEvents.rightClicked('forbidden_arcanus:runic_chiseled_polished_darkstone', event => {
    let { block, player, item } = event
    if (item.id != 'forbidden_arcanus:arcane_crystal' || String(block.properties.get('activated')) == 'true') { return }
    block.set(block.id, { activated: 'true' })
    if (!player.isCreative()) { item.shrink(1) }
    event.server.runCommandSilent(`execute in ${block.level.dimension} run particle minecraft:enchant ${block.x + 0.5} ${block.y + 1.2} ${block.z + 0.5} 0.3 0.2 0.3 0.5 12`)
    event.cancel()
})

// Dave's small smoke generator: 1.18.2 drew 8 smoke puffs inside the block on each client display tick (about 4 a
// second for a player close by); the block entity ticks every 10 ticks and sends 2
const RSMOKE = Java.loadClass('net.minecraft.core.particles.ParticleTypes').SMOKE
BlockEvents.blockEntityTick('davebuildingmod:small_smoke_passive_generator', event => {
    let b = event.block
    b.level.sendParticles(RSMOKE, b.x + 0.5, b.y + 0.5, b.z + 0.5, 2, 0.25, 0.25, 0.25, 0.05)
})
