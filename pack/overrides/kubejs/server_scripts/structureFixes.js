// 1211: small fixes so the structure templates come out as they did in 1.18.2.

ServerEvents.tags('block', event => {
    // the sun temple's salt island has dead bushes on Biomes O' Plenty dried salt; 1.21 only lets them stand on
    // minecraft:dead_bush_may_place_on (sand, terracotta, dirt), so placing the template popped them
    event.add('minecraft:dead_bush_may_place_on', 'biomesoplenty:dried_salt')
})
