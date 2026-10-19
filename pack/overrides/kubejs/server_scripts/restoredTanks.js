// 1211: the fluid height of the restored Tinkers tanks (startup_scripts/restoredTanks.js). Every 10 ticks the `level` block
// state (0..8) is set to ceil(amount / capacity * 8), 0 when empty, and only written when it changed. The models draw the fluid
// as a cuboid of that height (tools/restore_tanks.py).
const RTANK_CAPACITY = {
    'tconstruct:scorched_fuel_tank': 4000,
    'tconstruct:scorched_ingot_tank': 4320,
    'tconstruct:seared_fuel_tank': 4000
}
const RtankStates = Java.loadClass('dev.latvian.mods.kubejs.block.callback.BlockStateModifyCallback')

function rtankLevel(event, capacity) {
    let block = event.block
    let entity = block.entity
    if (!entity) { return }
    let tank = entity.attachments.get('tank')
    if (!tank) { return }
    let amount = Number(tank.getFluidInTank(0).getAmount())
    let want = amount <= 0 ? 0 : Math.max(1, Math.min(8, Math.ceil(amount / capacity * 8)))
    let level = block.level
    let pos = block.pos
    let state = level.getBlockState(pos)
    let prop = state.getBlock().getStateDefinition().getProperty('level')
    if (prop == null) { return }
    // KubeJS's set(IntegerProperty, Integer): Rhino can't pass a JS number to BlockState.setValue(Property, Comparable)
    if (Number(state.getValue(prop)) != want) { level.setBlock(pos, new RtankStates(state).set(prop, want).getState(), 3) }
}

BlockEvents.blockEntityTick('tconstruct:scorched_fuel_tank', event => rtankLevel(event, RTANK_CAPACITY['tconstruct:scorched_fuel_tank']))
BlockEvents.blockEntityTick('tconstruct:scorched_ingot_tank', event => rtankLevel(event, RTANK_CAPACITY['tconstruct:scorched_ingot_tank']))
BlockEvents.blockEntityTick('tconstruct:seared_fuel_tank', event => rtankLevel(event, RTANK_CAPACITY['tconstruct:seared_fuel_tank']))
