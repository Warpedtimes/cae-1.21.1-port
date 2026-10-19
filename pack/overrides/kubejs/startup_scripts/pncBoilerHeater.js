// 1211: PneumaticCraft heat -> Create steam-engine boiler heat. Replaces Compressed Creativity's heater block
// (compressedcreativity:heater, 1.18.2; no 1.21.1 build). The tips quest "You can heat Create Steam Engines with
// Pneumaticcraft!" depends on this.
//
// How the original worked (HeaterBlockEntity in compressedcreativity-0.2.0, config compressedcreativity-common.toml
// [machines.heater]): the block had its own PNC heat exchanger (thermal capacity 2.0, resistance 1.0) and a Blaze Burner
// style HEAT_LEVEL from its temperature in degrees C (K - 273):
//     below 100 (temperature_passive)  -> NONE      (no heat)
//     100 .. 199                       -> SMOULDERING (passive heat, like a campfire)
//     200 .. 299 (temperature_kindled) -> KINDLED
//     300 and up (temperature_seething)-> SEETHING
// and every tick it removed heat from itself: addHeat(-max(0, 0.1 * (C - 100))) (temperature_coefficient 0.1 per degree
// over starting_temperature 100): that is the boiler's "fuel use".
//
// 1211: a KubeJS block can't host PNC heat, so the stand-in is PneumaticCraft's own Heat Pipe
// (pneumaticcraft:heat_pipe, the item the quest already shows): a plain heat conductor that takes heat from any PNC
// source next to it. Put it directly under a Create fluid tank (the boiler); Create's BoilerHeater registry (kubejs-create's
// CreateEvents.boilerHeatHandler) asks it for the heat level like it asks a Blaze Burner. Create 6's scale is
// -1 none, 0 passive, 1 kindled, 2 seething (BoilerHeaters.blazeBurner). The original's thresholds are kept.
// Create only re-reads heaters when the tank's boiler has needsHeatLevelUpdate set (the original changed its block state
// to cause that), so while a heat pipe sits under a tank a small loop drains its heat and sets that flag whenever the
// level changes. The loop (re)starts the next time Create evaluates the boiler (placing, neighbour update, world load of a
// loaded tank); it stops itself when the pipe is removed or has no tank above it.

var PNC_BOILER = {
  passive: 100, kindled: 200, seething: 300, // degrees C, config temperature_passive/kindled/seething
  start: 100, coefficient: 0.1,              // config starting_temperature / temperature_coefficient
  // 1211 (lead, 19 Oct): every tick, like the original. Draining 10 ticks' worth at once dropped a Heat Pipe (small
  // thermal capacity) by ~150 K per step, and the level read after it never reached kindled/seething in game.
  interval: 1,                               // ticks between drain steps (heat per step = interval x the per-tick amount)
  running: {}
}

function pncBoilerLevel(tempK) {
  let c = Math.floor(tempK) - 273 // original: getTemperatureAsInt() - 273
  if (c < PNC_BOILER.passive) return -1
  if (c < PNC_BOILER.kindled) return 0
  if (c < PNC_BOILER.seething) return 1
  return 2
}

function pncBoilerLogic(level, pos) {
  let PNCCapabilities = Java.loadClass('me.desht.pneumaticcraft.api.PNCCapabilities')
  return level.getCapability(PNCCapabilities.HEAT_EXCHANGER_BLOCK, pos, null)
}

function pncBoilerStep(level, pos, key, last) {
  let ok = false
  try {
    if (level.isLoaded(pos) && String(Block.getId(level.getBlockState(pos).block)) == 'pneumaticcraft:heat_pipe') {
      let above = pos.above()
      let tank = level.getBlockEntity(above)
      let logic = pncBoilerLogic(level, pos)
      if (tank != null && logic != null && String(Block.getId(level.getBlockState(above).block)) == 'create:fluid_tank') {
        ok = true
        // the level comes from the temperature before this tick's drain, as the original's heat level did
        let now = pncBoilerLevel(logic.getTemperature())
        let c = logic.getTemperature() - 273
        let drain = PNC_BOILER.coefficient * (c - PNC_BOILER.start) // original getCoolingSpeed(), per tick
        if (drain > 0) logic.addHeat(-drain * PNC_BOILER.interval)
        // 1211 (lead): also once a second, not only on a change: a change right after the tank was placed (before the
        // boiler counted as active) was lost in game, and the boiler stayed passive at 250 C until something else updated it
        if (now != last || level.time % 20 == 0) {
          last = now
          let controller = tank.getControllerBE()
          if (controller != null) controller.boiler.needsHeatLevelUpdate = true
        }
      }
    }
  } catch (e) {
    console.warn('pncBoilerHeater: ' + e)
    ok = false
  }
  if (!ok) {
    delete PNC_BOILER.running[key]
    return
  }
  let server = level.server
  server.scheduleInTicks(PNC_BOILER.interval, () => pncBoilerStep(level, pos, key, last))
}

CreateEvents.boilerHeatHandler(event => {
  event.add(Block.getBlock('pneumaticcraft:heat_pipe'), block => {
    let level = block.level
    let logic = pncBoilerLogic(level, block.pos)
    if (logic == null) return -1
    let heat = pncBoilerLevel(logic.getTemperature())
    let key = block.dimension + '|' + block.x + ',' + block.y + ',' + block.z
    if (!PNC_BOILER.running[key] && !level.isClientSide()) {
      PNC_BOILER.running[key] = true
      let pos = block.pos
      level.server.scheduleInTicks(PNC_BOILER.interval, () => pncBoilerStep(level, pos, key, heat))
    }
    return heat
  })
})
