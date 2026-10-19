
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
      block.explosionResistance = -1
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
