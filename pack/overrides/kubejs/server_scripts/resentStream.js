// 1211: the wraith/vex -> Liquid Resent stream of the 1.18.2 pack (finding 13 of the progression audit).
// 1.18.2 (TConstruct 3.x jar, EntityMeltingModule / HeatingStructureBlockEntity / SmelteryBlockEntity): a working smeltery (it has, or
// can find, fuel) ran interactWithEntities once every 20 ticks; every living, non-boss, non-immune entity inside whose type has an
// entity_melting recipe is hurt (damage 0 from tinkers.js, so it never died; fire-immune ones like wraiths by the magic source), and
// each successful hurt fills the recipe's fluid: 10 mB of kubejs:liquid_resent for quark:wraith and minecraft:vex. So a name-tagged
// wraith in the melter was 10 mB every second, forever.
// Create: Metallurgy's industrial crucible only pays an entity_melting recipe out when the entity dies, so the wraith/vex recipes are
// gone from tinkersReplacements.js (the crucible no longer touches them) and this script does the 1.18.2 thing instead: a living
// wraith or vex standing in an industrial crucible that is heated (heat 2 = "heated", the level the old recipes asked for) fills the
// crucible's tank with 10 mB of liquid resent every 20 ticks, without hurting it. A crucible that is full (or has no room) just
// pays nothing; a cold one pays nothing, like a smeltery without fuel.
// 1211 substitute: Metallurgy's crucible heat comes from blaze burners etc. instead of Tinkers' smeltery fuel.
var CaeResentFluidAction = Java.loadClass('net.neoforged.neoforge.fluids.capability.IFluidHandler$FluidAction')
var CAE_RESENT_TYPES = { 'quark:wraith': true, 'minecraft:vex': true }
var CAE_RESENT_AMOUNT = 10 // mB per entity per pulse (the 1.18.2 recipe)
var CAE_RESENT_PERIOD = 20 // ticks between pulses (the smeltery's entity interval)
// audit 4 N-2: was 2, which is a seething (superheated) burner: FoundryData sums Create's BoilerHeaters.findHeat, where a
// kindled Blaze Burner gives 1 and a seething one 2. "Heated" (a lit burner, like the 1.18.2 smeltery's any fuel) is 1.
var CAE_RESENT_MIN_HEAT = 1
// audit 4 S-4 (same kind): only the two entity types are looked up (in Java), not every entity in the level
var CaeResentEntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
var CAE_RESENT_ENTITY_TYPES = Object.keys(CAE_RESENT_TYPES).map(id => CaeResentEntityType.byString(id).orElse(null)).filter(t => t != null)
// 1211: this is the only source of liquid resent, so a crucible it can't read is logged (once) instead of paying nothing quietly
var CAE_RESENT_WARNED = false
function caeResentWarn(msg) {
    if (CAE_RESENT_WARNED) return
    CAE_RESENT_WARNED = true
    console.warn('resentStream: ' + msg)
}

LevelEvents.tick(event => {
    if (event.level.time % CAE_RESENT_PERIOD != 0) return
    try {
        CAE_RESENT_ENTITY_TYPES.forEach(type => event.level.getEntities(type, x => true).forEach(e => {
            if (!e.alive) return
            if (String(e.block.id) != 'createmetallurgy:industrial_crucible') return
            let be = e.block.entity
            if (be == null) { caeResentWarn('a crucible at ' + e.block.pos + ' has no block entity'); return }
            let ctrl = be.isController() ? be : event.level.getBlockEntity(be.getController())
            if (ctrl == null || ctrl.foundryData == null) { caeResentWarn('no controller or foundryData for the crucible at ' + e.block.pos); return }
            if (ctrl.foundryData.getCurrentHeat() < CAE_RESENT_MIN_HEAT) return
            ctrl.getTank().fill(Fluid.of('kubejs:liquid_resent', CAE_RESENT_AMOUNT), CaeResentFluidAction.EXECUTE)
        }))
    } catch (err) {
        console.warn('resentStream: ' + err)
    }
})
