// 1211: throwing Thermal's grenades (gaps2, 20 Oct 2026). The detonation is in startup_scripts/gaps2Explosives.js (read its header
// for the 1.18.2 numbers). GrenadeItem.use: a 0.5 volume throw sound, a 20 tick cooldown, the stack shrinks unless the player is in
// creative mode, and the grenade leaves the player's head with shootFromRotation(pitch, yaw, 0, speed 1.5, inaccuracy 0.5).
// 1211 substitute: Thermal's grenade entity is a vanilla snowball that carries the grenade item (so it is drawn as it) and a tag;
// the startup script detonates it where it hits. A snowball that hits a blaze does 3 damage (a grenade did none).
const CAE_GRENADES = {
    'cae:glowstone_grenade': 'cae_glow_small',
    'cae:explosive_grenade': 'cae_boom',
    'cae:nuke_grenade': 'cae_nuke_small'
}
;['ice', 'fire', 'ender', 'earth', 'lightning', 'phyto', 'redstone', 'slime'].forEach(k => { CAE_GRENADES['cae:' + k + '_grenade'] = 'cae_' + k + '_small' })

// ---- TNT minecarts. Thermal's were their own entity types (AbstractTNTMinecart: fuse 80, radius 8, explodes on hard impact, falls of 3+
// blocks, fire / flaming arrows, an activator rail, or when broken while moving; it drops a plain minecart). 1211 substitute: the
// item places a vanilla TNT minecart (which already does all of those), tagged cae_<kind>_cart and drawn as the TNT block; the
// startup script turns its explosion into the action with radius 8. Breaking it while standing drops vanilla's minecart and
// vanilla TNT instead of Thermal's TNT block.
const CAE_CARTS = {}
;['ice', 'fire', 'glow', 'ender', 'nuke', 'earth', 'lightning', 'phyto', 'redstone', 'slime'].forEach(k => {
    CAE_CARTS['cae:' + (k == 'glow' ? 'glowstone' : k) + '_tnt_minecart'] = { tag: 'cae_' + k + '_cart', block: 'cae:' + (k == 'glow' ? 'glowstone' : k) + '_tnt' }
})

BlockEvents.rightClicked(event => {
    const def = CAE_CARTS[event.item.id]
    if (!def || String(event.hand).toLowerCase().indexOf('main') < 0) { return }
    const level = event.level
    if (level.clientSide || !event.block.hasTag('minecraft:rails')) { return }
    const MinecartTNT = Java.loadClass('net.minecraft.world.entity.vehicle.MinecartTNT')
    const RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
    const Registries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    const cart = new MinecartTNT(level, event.block.x + 0.5, event.block.y + 0.0625, event.block.z + 0.5)
    cart.addTag(def.tag)
    cart.setDisplayBlockState(Registries.BLOCK.get(RL.parse(def.block)).defaultBlockState())
    level.addFreshEntity(cart)
    if (!event.player.isCreative()) { event.item.shrink(1) }
    event.cancel()
})

// ---- recipes (thermal_foundation / thermal_locomotion 1.18 recipes/*.json; the elementals, redstone, slime, phyto and ender
// grenade ones). TNT: gunpowder + 4 of the powder in a ring, grenades: 4 per craft with an iron ingot in the middle, minecarts: TNT
// above a minecart. The pack removed only Thermal's ender TNT recipe (chapter5.js: haunting instead) and has nuke ones in shaped.js.
ServerEvents.recipes(event => {
    const G = '#c:gunpowders'
    const powders = {
        earth: 'cae:basalz_powder', lightning: 'cae:blitz_powder', redstone: '#c:dusts/redstone', slime: '#c:slime_balls',
        phyto: 'cae:phytogro', ice: 'cae:blizz_powder', fire: 'minecraft:blaze_powder', ender: '#c:ender_pearls'
    }
    const safe = fn => { try { fn() } catch (err) { console.warn('gaps2Explosives.js: recipe: ' + err) } }
    const tnt = (k, P) => safe(() => event.shaped('cae:' + k + '_tnt', ['GPG', 'PGP', 'GPG'], { G: G, P: P }).id('cae:gaps2/' + k + '_tnt'))
    const grenade = (k, P) => safe(() => event.shaped('4x cae:' + k + '_grenade', ['GPG', 'PIP', 'GPG'], { G: G, P: P, I: '#c:ingots/iron' }).id('cae:gaps2/' + k + '_grenade'))
    ;['earth', 'lightning', 'redstone', 'slime', 'phyto'].forEach(k => tnt(k, powders[k]))
    ;['earth', 'lightning', 'redstone', 'slime', 'phyto', 'ice', 'fire', 'ender'].forEach(k => grenade(k, powders[k]))
    ;['ice', 'fire', 'glowstone', 'ender', 'nuke', 'earth', 'lightning', 'phyto', 'redstone', 'slime'].forEach(k => {
        safe(() => event.shaped('cae:' + k + '_tnt_minecart', ['A', 'B'], { A: 'cae:' + k + '_tnt', B: 'minecraft:minecart' }).id('cae:gaps2/' + k + '_tnt_minecart'))
    })
})

ItemEvents.rightClicked(event => {
    const tag = CAE_GRENADES[event.item.id]
    if (!tag) { return }
    const player = event.player
    const level = event.level
    if (level.clientSide) { return }
    const Snowball = Java.loadClass('net.minecraft.world.entity.projectile.Snowball')
    const ball = new Snowball(level, player)
    ball.setItem(event.item.copyWithCount(1))
    ball.addTag(tag)
    // KubeJS hides getXRot/getYRot; shoot along the look vector (speed 1.5, inaccuracy 0.5) as shootFromRotation does
    const look = player.lookAngle
    ball.shoot(look.x, look.y, look.z, 1.5, 0.5)
    level.addFreshEntity(ball)
    event.server.runCommandSilent('execute in ' + level.dimension + ' run playsound minecraft:entity.snowball.throw neutral @a ' +
        player.x + ' ' + player.y + ' ' + player.z + ' 0.5 ' + (0.4 / (Math.random() * 0.4 + 0.8)).toFixed(2))
    player.getCooldowns().addCooldown(event.item.item, 20)
    if (!player.isCreative()) { event.item.shrink(1) }
})
