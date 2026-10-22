
  BlockEvents.modification(event => {
    // port: ae2:sky_stone_block is ae2:sky_stone_block in 1.20.1
    event.modify('ae2:sky_stone_block', block => {
      block.destroySpeed = 4
      block.hasCollision = true
      block.explosionResistance = 1
    })
    // 1211: cae:portal_core is the MBD2 machine from mbd2_machines.js (destroy 20000, not unbreakable; the core mod does not touch it), so the original modification is restored
    event.modify('cae:portal_core', block => {
      block.destroySpeed = -1
      block.hasCollision = true
      // 1211: was -1 (as in 1.18.2), which made it weaker than dirt against blasts (vanilla takes (res + 0.3) x 0.3 off the
      // blast's power); it only exists in the arcane temple, so it resists like bedrock now
      block.explosionResistance = 3600000
    })
    event.modify('cae:veridium_catalyst', block =>{
      block.destroySpeed = -1
    })
    event.modify('cae:asurine_catalyst', block =>{
      block.destroySpeed = -1
    })
    event.modify('cae:ochrum_catalyst', block =>{
      block.destroySpeed = -1
    })
    event.modify('cae:crimsite_catalyst', block =>{
      block.destroySpeed = -1
    })
    event.modify('waystones:waystone', block =>{
      block.destroySpeed = 90
    })
    event.modify('waystones:mossy_waystone', block =>{
      block.destroySpeed = 90
    })
    event.modify('waystones:sandy_waystone', block =>{
      block.destroySpeed = 90
    })
  })
