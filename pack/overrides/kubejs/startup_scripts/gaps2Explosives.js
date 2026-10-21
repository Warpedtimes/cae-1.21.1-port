// 1211: Thermal's explosives, behaving as in the 1.18.2 pack (gaps2, 20 Oct 2026). The blocks, the grenade items, the glow /
// ender air and the Chilled / Enderference effects are registered in startup_scripts/gaps2Content.js; the right click that
// throws a grenade is in server_scripts/gaps2Explosives.js. This file holds the detonation, in a startup script because it
// listens to NeoForge events (a native listener registered from a server script would pile up with every /reload).
//
// What 1.18.2 did (read from Thermal Foundation 1.18.2-1.1.x and CoFH Core 1.18.2-9.2.3.47, decompiled 20 Oct 2026):
//   TNT      cofh.lib.entity.PrimedTntCoFH: fuse 80, radius 9, effect amplifier 1, effect duration 300 ticks. The primed TNT
//            runs the detonate action where it stands when the fuse ends (no vanilla explosion). A chain explosion primes it
//            with a fuse of nextInt(fuse / 4) + fuse / 8 (10..29) ticks (TntBlockCoFH.wasExploded).
//   grenade  cofh.core.entity.AbstractGrenade / GrenadeItem: thrown with speed 1.5 and inaccuracy 0.5, 20 tick cooldown,
//            radius 1 + 4 = 5, effect amplifier 1, duration 300; it detonates when it hits something (no fuse).
//   actions  thermal DetonateUtils + cofh.core.util.AreaUtils: every sphere is "distSqr < min(32, r)^2" around the block the
//            explosive is in (y clamped to min(16, r)).
//     ice       ICE_TRANSFORM: lit campfire out, snow layer on air with a valid snow position, fire to air, water source to
//               ice, lava source to obsidian; CHILL_ENTITIES: fire put out and the Chilled effect.
//     fire      only when not in water: IGNITE_ENTITIES (burn duration / 20 = 15 s), FIRE_TRANSFORM_SPECIAL at 60 % (unlit
//               campfire lit, TNT lit, ice / frosted ice to water, snow layer to air), FIRE_TRANSFORM at 20 % (fire on air
//               where fire can stand).
//     glow      GLOW_AIR_TRANSFORM (air and cave air to glow air, light 15, gone after 200 ticks) and GLOW_ENTITIES (Glowing
//               amplifier 1 for 300 ticks; undead also take 4 damage and burn for 15 s).
//     ender     only when not in water: ENDER_AIR_TRANSFORM (air to ender air, light 3, 200 ticks) and ENDERFERE_ENTITIES
//               (Endermen and Endermites: Enderference for 300 ticks and 4 damage).
//     explosive Level.explode(power 1.9, no fire, breaks blocks) at the entity.
//     nuke      DetonateUtils.nuke (see caeNuke).
//   The 1.18.2 pack's own chapter6.js ran on top of Thermal's ice and fire TNT: at fuse <= 6 it replaced magma blocks
//   within 3 (ice) / stone within 3 (fire) and removed the TNT, so Thermal's own action never ran for primed TNT. Its
//   handler ticked in the overworld only, but its '@e[type=...]' selector has no position, so it searched every
//   dimension (the void's ice room is built for it). Grenades and the other kinds keep Thermal's actions.
// 1211 substitutes: the primed TNT / grenade entities are vanilla (PrimedTnt, Snowball carrying the grenade item) with a tag
//   (cae_ice, cae_fire, cae_glow, cae_ender, cae_nuke; cae_glow_small, cae_boom, cae_nuke_small for the grenades); a vanilla
//   explosion that comes from a tagged TNT is cancelled and replaced by the action. Particles: CoFH's frost / blast wave
//   particles are vanilla snowflakes / portal / flame / glow ones in an area effect cloud that grows to the radius in 20 ticks.

const CAE_PrimedTnt = Java.loadClass('net.minecraft.world.entity.item.PrimedTnt')
const CAE_MinecartTnt = Java.loadClass('net.minecraft.world.entity.vehicle.MinecartTNT')
const CAE_Items = Java.loadClass('net.minecraft.world.item.Items')
const CAE_ItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity')
const CAE_Bonemealable = Java.loadClass('net.minecraft.world.level.block.BonemealableBlock')
const CAE_BoneMealItem = Java.loadClass('net.minecraft.world.item.BoneMealItem')
const CAE_Explosion = Java.loadClass('net.minecraft.world.level.Explosion')
const CAE_Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const CAE_Vec3 = Java.loadClass('net.minecraft.world.phys.Vec3')
const CAE_Snowball = Java.loadClass('net.minecraft.world.entity.projectile.Snowball')
const CAE_Entity = Java.loadClass('net.minecraft.world.entity.Entity')
const CAE_AABB = Java.loadClass('net.minecraft.world.phys.AABB')
const CAE_BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const CAE_Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
const CAE_Block = Java.loadClass('net.minecraft.world.level.block.Block')
const CAE_BSP = Java.loadClass('net.minecraft.world.level.block.state.properties.BlockStateProperties')
const CAE_LiquidBlock = Java.loadClass('net.minecraft.world.level.block.LiquidBlock')
const CAE_TntBlock = Java.loadClass('net.minecraft.world.level.block.TntBlock')
const CAE_CampfireBlock = Java.loadClass('net.minecraft.world.level.block.CampfireBlock')
const CAE_BaseFireBlock = Java.loadClass('net.minecraft.world.level.block.BaseFireBlock')
const CAE_Direction = Java.loadClass('net.minecraft.core.Direction')
const CAE_Registries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const CAE_RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
const CAE_CollisionContext = Java.loadClass('net.minecraft.world.phys.shapes.CollisionContext')
const CAE_ExplosionInteraction = Java.loadClass('net.minecraft.world.level.Level$ExplosionInteraction')

// tag -> action, radius and what carries it. kind names the DetonateUtils action; src is 'tnt' (primed TNT, radius 9), 'grenade'
// (snowball, radius 5) or 'cart' (TNT minecart, AbstractTNTMinecart radius 8).
// Tags: TNT cae_<kind> (cae_glow for glowstone), grenades cae_<kind>_small (cae_boom for the explosive one), carts cae_<kind>_cart.
const CAE_BOMBS = {}
const CAE_KINDS = ['ice', 'fire', 'glow', 'ender', 'nuke', 'earth', 'lightning', 'phyto', 'redstone', 'slime']
CAE_KINDS.forEach(k => {
    CAE_BOMBS['cae_' + k] = { kind: k, r: 9, src: 'tnt' }
    CAE_BOMBS['cae_' + k + '_cart'] = { kind: k, r: 8, src: 'cart' }
    if (k != 'nuke' || true) CAE_BOMBS['cae_' + k + '_small'] = { kind: k, r: 5, src: 'grenade' }
})
CAE_BOMBS['cae_boom'] = { kind: 'explosive', r: 5, src: 'grenade' }
// the TNT block of each tag (glow is glowstone_tnt)
const CAE_TNT_TAG_OF_BLOCK = {}
CAE_KINDS.forEach(k => { CAE_TNT_TAG_OF_BLOCK['cae:' + (k == 'glow' ? 'glowstone' : k) + '_tnt'] = 'cae_' + k })

const CAE_BLOCK_OF_TAG = {}
Object.keys(CAE_TNT_TAG_OF_BLOCK).forEach(id => { CAE_BLOCK_OF_TAG[CAE_TNT_TAG_OF_BLOCK[id]] = id })

let caeInBoom = false
let caeAirLoaded = false
// electric fields (ElectricField entity of CoFH): {level, pos, radius, expire}
const CAE_FIELDS = []
// grenades in flight: {e, level, last position}. Whatever removes one without the impact handler having detonated it (tag cae_spent)
// detonates it here, at the position it had a tick earlier.
const CAE_THROWN = []
// TNT blocks a running explosion is about to destroy: "dimension|x|y|z" -> {tag, id, time}. NeoForge sets the block to air
// before it calls wasExploded, so the primed TNT of a chain explosion can't read the block it came from.
const CAE_PENDING_TNT = {}
// glow / ender air placed by a bomb: {level, expire, blocks}
const CAE_AIR_QUEUE = []

// BlockState.is(Block) is ambiguous to Rhino (Block / Holder / TagKey / HolderSet overloads): compare the block instead
function caeIs(state, block) {
    return state.getBlock() == block
}

function caeBlockId(state) {
    return String(CAE_Registries.BLOCK.getKey(state.getBlock()))
}

function caeBombOf(entity) {
    let tags = entity.getTags()
    let found = null
    Object.keys(CAE_BOMBS).forEach(t => { if (tags.contains(t)) found = t })
    return found
}

function caeDimKey(level) {
    // level.dimension is the ResourceKey property; its string form is "ResourceKey[minecraft:dimension / minecraft:overworld]"
    let m = String(level.dimension).match(/\/ ([^\]]+)\]/)
    return m ? m[1] : String(level.dimension)
}

function caePos(x, y, z) {
    return new CAE_BlockPos(Math.floor(x), Math.floor(y), Math.floor(z))
}

// ---------------------------------------------------------------------------------------------------------------------
// tagging the primed TNT of a TNT block, and the explosion that comes from it
// ---------------------------------------------------------------------------------------------------------------------
NativeEvents.onEvent('net.neoforged.neoforge.event.level.ExplosionEvent$Detonate', event => {
    try {
        let level = event.getLevel()
        if (level.isClientSide()) return
        let blocks = event.getAffectedBlocks()
        let now = level.time
        for (let i = 0; i < blocks.size(); i++) {
            let p = blocks.get(i)
            let id = caeBlockId(level.getBlockState(p))
            if (CAE_TNT_TAG_OF_BLOCK[id]) {
                CAE_PENDING_TNT[caeDimKey(level) + '|' + p.getX() + '|' + p.getY() + '|' + p.getZ()] = { tag: CAE_TNT_TAG_OF_BLOCK[id], id: id, time: now }
            }
        }
    } catch (err) {
        console.warn('gaps2Explosives.js: Detonate: ' + err)
    }
})

NativeEvents.onEvent('net.neoforged.neoforge.event.entity.EntityJoinLevelEvent', event => {
    try {
        let e = event.getEntity()
        if (e instanceof CAE_Snowball) {
            let lv = event.getLevel()
            if (!lv.isClientSide() && caeBombOf(e) != null) CAE_THROWN.push({ e: e, level: lv, x: e.getX(), y: e.getY(), z: e.getZ(), born: lv.time })
            return
        }
        if (!(e instanceof CAE_PrimedTnt)) return
        let level = event.getLevel()
        if (level.isClientSide()) return
        let already = caeBombOf(e)
        if (already != null) {
            // tagged by someone else (the core mod's dispenser, a script): make it look like its block
            let own = CAE_BLOCK_OF_TAG[already]
            if (own && caeIs(e.getBlockState(), CAE_Blocks.TNT)) e.setBlockState(CAE_Registries.BLOCK.get(CAE_RL.parse(own)).defaultBlockState())
            return
        }
        let bp = e.blockPosition()
        let id = caeBlockId(level.getBlockState(bp))
        let tag = CAE_TNT_TAG_OF_BLOCK[id]
        if (!tag) {
            let key = caeDimKey(level) + '|' + bp.getX() + '|' + bp.getY() + '|' + bp.getZ()
            let pend = CAE_PENDING_TNT[key]
            if (pend && level.time - pend.time <= 1) {
                tag = pend.tag
                id = pend.id
            }
            delete CAE_PENDING_TNT[key]
        }
        if (!tag) return
        e.addTag(tag)
        // the entity is drawn as the block (1.20.3+ primed TNT carry their block state)
        e.setBlockState(CAE_Registries.BLOCK.get(CAE_RL.parse(id)).defaultBlockState())
    } catch (err) {
        console.warn('gaps2Explosives.js: join: ' + err)
    }
})

NativeEvents.onEvent('net.neoforged.neoforge.event.level.ExplosionEvent$Start', event => {
    try {
        if (caeInBoom) return
        let level = event.getLevel()
        if (level.isClientSide()) return
        let src = event.getExplosion().getDirectSourceEntity()
        if (src == null || !(src instanceof CAE_PrimedTnt || src instanceof CAE_MinecartTnt)) return
        let tag = caeBombOf(src)
        if (tag == null) return
        event.setCanceled(true)
        caeDetonate(level, src, CAE_BOMBS[tag], tag, src.position())
        // AbstractTNTMinecart.explode drops the plain minecart it was built from
        if (src instanceof CAE_MinecartTnt) {
            caeRun(level, 'execute in ' + caeDimKey(level) + ' run summon minecraft:item ' + src.getX() + ' ' + src.getY() + ' ' + src.getZ() + ' {Item:{id:"minecraft:minecart",count:1}}')
        }
    } catch (err) {
        console.warn('gaps2Explosives.js: explosion: ' + err)
    }
})

// A grenade is a snowball carrying the grenade item (server_scripts/gaps2Explosives.js throws it); it detonates where it hits.
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.ProjectileImpactEvent', event => {
    try {
        let proj = event.getProjectile()
        if (!(proj instanceof CAE_Snowball)) return
        let level = proj.level
        if (level.isClientSide()) return
        let tag = caeBombOf(proj)
        if (tag == null || proj.getTags().contains('cae_spent')) return
        proj.addTag('cae_spent')
        caeDetonate(level, proj, CAE_BOMBS[tag], tag, event.getRayTraceResult().getLocation())
        proj.discard()
    } catch (err) {
        console.warn('gaps2Explosives.js: impact: ' + err)
    }
})

// glow / ender air goes after 200 ticks; stale pending TNT entries go too
NativeEvents.onEvent('net.neoforged.neoforge.event.tick.LevelTickEvent$Post', event => {
    try {
        let level = event.getLevel()
        if (level.isClientSide()) return
        let now = level.time
        if (!caeAirLoaded) {
            caeAirLoaded = true
            caeAirLoad(level.getServer())
        }
        let removed = false
        for (let i = CAE_AIR_QUEUE.length - 1; i >= 0; i--) {
            let q = CAE_AIR_QUEUE[i]
            if (q.level !== level || now < q.expire) continue
            CAE_AIR_QUEUE.splice(i, 1)
            removed = true
            let air = CAE_Blocks.AIR.defaultBlockState()
            for (let j = 0; j < q.blocks.length; j++) {
                let p = q.blocks[j]
                if (level.hasChunkAt(p) && caeBlockId(level.getBlockState(p)) == q.block) level.setBlock(p, air, 3)
            }
        }
        if (removed) caeAirSave(level.getServer())
        caeFieldsTick(level, now)
        for (let i = CAE_THROWN.length - 1; i >= 0; i--) {
            let g = CAE_THROWN[i]
            if (g.level !== level) continue
            if (g.e.isRemoved()) {
                CAE_THROWN.splice(i, 1)
                if (!g.e.getTags().contains('cae_spent')) {
                    let tag = caeBombOf(g.e)
                    if (tag != null) {
                        g.e.addTag('cae_spent')
                        caeDetonate(level, g.e, CAE_BOMBS[tag], tag, new CAE_Vec3(g.x, g.y, g.z))
                    }
                }
            } else if (now - g.born > 400) {
                CAE_THROWN.splice(i, 1)
            } else {
                g.x = g.e.getX(); g.y = g.e.getY(); g.z = g.e.getZ()
            }
        }
        if (now % 100 == 0) {
            Object.keys(CAE_PENDING_TNT).forEach(k => { if (now - CAE_PENDING_TNT[k].time > 5) delete CAE_PENDING_TNT[k] })
        }
    } catch (err) {
        console.warn('gaps2Explosives.js: tick: ' + err)
    }
})

// Enderference (CoFH Core EffectEvents): no chorus fruit, Enderman or ender pearl teleports
let caeEnderferenceHolder = null
function caeHasEnderference(living) {
    if (living == null) return false
    if (caeEnderferenceHolder == null) caeEnderferenceHolder = CAE_Registries.MOB_EFFECT.getHolder(CAE_RL.parse('cae:enderference')).get()
    return living.hasEffect(caeEnderferenceHolder)
}
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.EntityTeleportEvent$EnderEntity', event => {
    try { if (caeHasEnderference(event.getEntity())) event.setCanceled(true) } catch (err) { console.warn('gaps2Explosives.js: enderference: ' + err) }
})
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.EntityTeleportEvent$ChorusFruit', event => {
    try { if (caeHasEnderference(event.getEntity())) event.setCanceled(true) } catch (err) { console.warn('gaps2Explosives.js: enderference: ' + err) }
})
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.EntityTeleportEvent$EnderPearl', event => {
    try { if (caeHasEnderference(event.getPlayer())) event.setCanceled(true) } catch (err) { console.warn('gaps2Explosives.js: enderference: ' + err) }
})

// ---------------------------------------------------------------------------------------------------------------------
// the actions
// ---------------------------------------------------------------------------------------------------------------------
function caeRun(level, cmd) {
    level.getServer().runCommandSilent(cmd)
}

function caeCloud(level, particle, pos, radius) {
    // DetonateUtils.makeAreaOfEffectCloud: radius 1, grows to `radius` over its 20 tick life, no wait time
    // a particle with options (dust) is passed as its compound body, e.g. 'minecraft:dust|color:[1.0f,0.0f,0.0f],scale:1.0f'
    let parts = particle.split('|')
    let body = '{type:"' + parts[0] + '"' + (parts.length > 1 ? ',' + parts[1] : '') + '}'
    caeRun(level, 'execute in ' + caeDimKey(level) + ' run summon minecraft:area_effect_cloud ' + pos.x + ' ' + pos.y + ' ' + pos.z +
        ' {Particle:' + body + ',Radius:1f,RadiusPerTick:' + ((radius - 1) / 20) + 'f,Duration:20,WaitTime:0}')
}

// IBlockTransformer.transformSphere: every position with distSqr < min(32, r)^2 from the explosive's block, y limited to
// min(16, r); `chance` < 1 rolls per position
function caeSphere(level, pos, radius, chance, fn) {
    let f = Math.min(32, radius)
    let v = Math.min(16, radius)
    let f2 = f * f
    let ox = Math.floor(pos.x)
    let oy = Math.floor(pos.y)
    let oz = Math.floor(pos.z)
    for (let dx = -f; dx <= f; dx++) {
        for (let dy = -v; dy <= v; dy++) {
            for (let dz = -f; dz <= f; dz++) {
                if (dx * dx + dy * dy + dz * dz >= f2) continue
                if (chance < 0.99999 && level.random.nextDouble() >= chance) continue
                fn(new CAE_BlockPos(ox + dx, oy + dy, oz + dz))
            }
        }
    }
}

// IEffectApplier.applyEffectNearby: every non-spectator entity in the box pos +- radius, grown by 1
function caeEntitiesNear(level, pos, radius, fn) {
    let box = new CAE_AABB(pos.x - radius, pos.y - radius, pos.z - radius, pos.x + radius, pos.y + radius, pos.z + radius).inflate(1.0)
    let list = level.getEntitiesOfClass(CAE_Entity, box)
    for (let i = 0; i < list.size(); i++) {
        let e = list.get(i)
        if (e.isSpectator()) continue
        fn(e)
    }
}

function caeEffect(level, ent, effect, ticks, amplifier, particles) {
    caeRun(level, 'effect give ' + ent.uuid + ' ' + effect + ' ' + Math.floor(ticks / 20) + ' ' + amplifier + (particles ? ' false' : ' true'))
}

function caeHurt(level, ent, amount) {
    caeRun(level, 'damage ' + ent.uuid + ' ' + amount + ' minecraft:explosion')
}

// AreaUtils.isValidSnowPosition
function caeValidSnowPos(level, p) {
    let below = p.below()
    let bs = level.getBlockState(below)
    if (caeIs(bs, CAE_Blocks.ICE) || caeIs(bs, CAE_Blocks.PACKED_ICE) || caeIs(bs, CAE_Blocks.BARRIER) || caeIs(bs, CAE_Blocks.FROSTED_ICE)) return false
    return CAE_Block.isFaceFull(bs.getCollisionShape(level, below), CAE_Direction.UP) ||
        (caeIs(bs, CAE_Blocks.SNOW) && bs.getValue(CAE_BSP.LAYERS) == 8)
}

function caeIceBlock(level, p) {
    let st = level.getBlockState(p)
    if ((caeIs(st, CAE_Blocks.CAMPFIRE) || caeIs(st, CAE_Blocks.SOUL_CAMPFIRE)) && st.getValue(CAE_BSP.LIT)) {
        level.setBlock(p, st.setValue(CAE_BSP.LIT, false), 3)
    }
    if (st.isAir() && caeValidSnowPos(level, p)) {
        level.setBlock(p, CAE_Blocks.SNOW.defaultBlockState(), 3)
    }
    if (caeIs(st, CAE_Blocks.FIRE)) {
        level.setBlock(p, CAE_Blocks.AIR.defaultBlockState(), 3)
    }
    let ctx = CAE_CollisionContext.empty()
    if (caeIs(st, CAE_Blocks.WATER) && st.getValue(CAE_LiquidBlock.LEVEL) == 0) {
        let ice = CAE_Blocks.ICE.defaultBlockState()
        if (ice.canSurvive(level, p) && level.isUnobstructed(ice, p, ctx)) level.setBlock(p, ice, 3)
    }
    if (caeIs(st, CAE_Blocks.LAVA) && st.getValue(CAE_LiquidBlock.LEVEL) == 0) {
        let obs = CAE_Blocks.OBSIDIAN.defaultBlockState()
        if (obs.canSurvive(level, p) && level.isUnobstructed(obs, p, ctx)) level.setBlock(p, obs, 3)
    }
}

function caeFireSpecial(level, p, igniter) {
    let st = level.getBlockState(p)
    let b = st.getBlock()
    if (b instanceof CAE_CampfireBlock && !st.getValue(CAE_BSP.WATERLOGGED) && !st.getValue(CAE_BSP.LIT)) {
        level.setBlock(p, st.setValue(CAE_BSP.LIT, true), 3)
    } else if (b instanceof CAE_TntBlock) {
        b.onCaughtFire(st, level, p, CAE_Direction.UP, null)
        level.setBlock(p, CAE_Blocks.AIR.defaultBlockState(), 3)
    } else if (caeIs(st, CAE_Blocks.ICE) || caeIs(st, CAE_Blocks.FROSTED_ICE)) {
        level.setBlock(p, CAE_Blocks.WATER.defaultBlockState(), 3)
    } else if (caeIs(st, CAE_Blocks.SNOW)) {
        level.setBlock(p, CAE_Blocks.AIR.defaultBlockState(), 3)
    }
}

function caeFireBlock(level, p) {
    if (level.getBlockState(p).isAir() && CAE_BaseFireBlock.canBePlacedAt(level, p, CAE_Direction.DOWN)) {
        level.setBlock(p, CAE_BaseFireBlock.getState(level, p), 11)
    }
}

// air -> glow / ender air, remembered for the 200 tick removal
function caeAirFill(level, pos, radius, blockId) {
    let st = CAE_Registries.BLOCK.get(CAE_RL.parse(blockId)).defaultBlockState()
    let placed = []
    caeSphere(level, pos, radius, 1.0, p => {
        let s = level.getBlockState(p)
        if (caeIs(s, CAE_Blocks.AIR) || caeIs(s, CAE_Blocks.CAVE_AIR)) {
            level.setBlock(p, st, 3)
            placed.push(p)
        }
    })
    CAE_AIR_QUEUE.push({ level: level, expire: level.time + 200, blocks: placed, block: blockId })
    caeAirSave(level.getServer())
}

// The queue is kept in the server's persistent data, so air left by a bomb when the server stops is still removed after the restart
// (signal air would otherwise power its blocks for ever).
function caeAirSave(server) {
    try {
        let arr = []
        CAE_AIR_QUEUE.forEach(q => {
            arr.push({ dim: caeDimKey(q.level), expire: q.expire, block: q.block, pos: q.blocks.map(p => p.getX() + ',' + p.getY() + ',' + p.getZ()).join(';') })
        })
        server.persistentData.putString('caeAirQueue', JSON.stringify(arr))
    } catch (err) {
        console.warn('gaps2Explosives.js: save air queue: ' + err)
    }
}
function caeAirLoad(server) {
    try {
        let text = String(server.persistentData.getString('caeAirQueue'))
        if (!text || text == 'undefined') return
        let arr = JSON.parse(text)
        server.getAllLevels().forEach(lv => {
            arr.forEach(e => {
                if (e.dim != caeDimKey(lv)) return
                let blocks = []
                e.pos.split(';').forEach(t => { if (t) { let c = t.split(','); blocks.push(new CAE_BlockPos(Number(c[0]), Number(c[1]), Number(c[2]))) } })
                CAE_AIR_QUEUE.push({ level: lv, expire: e.expire, blocks: blocks, block: e.block })
            })
        })
    } catch (err) {
        console.warn('gaps2Explosives.js: load air queue: ' + err)
    }
}

// blocks DetonateUtils.nuke tests against: its resistance rule (see caeNuke) uses Block.getExplosionResistance
function caeNuke(level, explosive, pos, R) {
    let bp = caePos(pos.x, pos.y, pos.z)
    level.setBlock(explosive.blockPosition(), CAE_Blocks.AIR.defaultBlockState(), 3)
    if (R <= 0) return
    // 1. everything living within 3R takes clamp(9R^2 - distSq, 3R, 9R^2) damage and Wither (300 ticks, amplifier 1, no particles)
    let r3 = 3 * R
    let full = r3 * r3
    let box = new CAE_AABB(bp.getX() - r3, bp.getY() - r3, bp.getZ() - r3, bp.getX() + 1 + r3, bp.getY() + 1 + r3, bp.getZ() + 1 + r3)
    let list = level.getEntitiesOfClass(CAE_Entity, box)
    for (let i = 0; i < list.size(); i++) {
        let t = list.get(i)
        if (t.isSpectator() || !t.living) continue
        let d2 = pos.distanceToSqr(t.position())
        if (d2 < full) {
            caeHurt(level, t, Math.min(full, Math.max(r3, full - d2)))
            caeEffect(level, t, 'minecraft:wither', 300, 1, false)
        }
    }
    // 2. blocks: a position within min(32, 2R) of the explosive (x, z that far, y from -b/2 to +b) goes when its blast
    //    resistance is below 400 (2R)^2 (1 - distSq / b^2); the distance is to the explosive's centre
    let b = Math.min(32, 2 * R)
    let b2 = b * b
    let maxRes = 400 * (2 * R) * (2 * R)
    let air = CAE_Blocks.AIR.defaultBlockState()
    let ex = explosive.getX()
    let ey = explosive.getY()
    let ez = explosive.getZ()
    for (let dx = -b; dx <= b; dx++) {
        for (let dz = -b; dz <= b; dz++) {
            for (let dy = -Math.floor(b / 2); dy <= b; dy++) {
                let p = new CAE_BlockPos(bp.getX() + dx, bp.getY() + dy, bp.getZ() + dz)
                let cx = p.getX() + 0.5 - ex
                let cy = p.getY() + 0.5 - ey
                let cz = p.getZ() + 0.5 - ez
                let dist = cx * cx + cy * cy + cz * cz
                if (dist >= b2) continue
                let st = level.getBlockState(p)
                if (st.isAir()) continue
                if (st.getBlock().getExplosionResistance() < maxRes - maxRes * dist / b2) level.setBlock(p, air, 3)
            }
        }
    }
    // 3. an explosion of power 0.38 R with fire that destroys blocks
    caeInBoom = true
    try {
        level.explode(explosive, ex, ey, ez, 0.38 * R, true, CAE_ExplosionInteraction.BLOCK)
    } finally {
        caeInBoom = false
    }
}

// ---- DetonateUtils.earth: AreaUtils.EARTH_TRANSFORM destroys (with drops) the blocks of Material.DIRT / Material.STONE-like kinds and
// anything SnowyDirtBlock; SUNDER_ENTITIES gives Sundered; items near the centre (age < 10) are pulled to it.
// 1211 substitute: Material is gone; the blocks are dirt, sand, gravel, clay and snow (the shovel-mineable ones) and the stone family
// (pickaxe-mineable blocks whose sound is stone, deepslate, tuff, netherrack or basalt-like) that can be broken at all (hardness >= 0).
let caeEarthSounds = null
function caeEarthBlock(level, p) {
    let st = level.getBlockState(p)
    if (st.isAir()) return false
    if (st.getDestroySpeed(level, p) < 0) return false
    if (caeEarthSounds == null) {
        let S = Java.loadClass('net.minecraft.world.level.block.SoundType')
        caeEarthSounds = [S.STONE, S.DEEPSLATE, S.TUFF, S.NETHERRACK, S.BASALT, S.GRAVEL, S.SAND, S.SOUL_SAND, S.SOUL_SOIL, S.ROOTED_DIRT, S.DEEPSLATE_BRICKS, S.NETHER_BRICKS, S.CALCITE, S.DRIPSTONE_BLOCK, S.AMETHYST, S.MUD]
    }
    let sound = st.getSoundType()
    if (caeEarthSounds.indexOf(sound) >= 0) return true
    // dirt, grass, podzol, mycelium, snow, clay, farmland: what the shovel mines
    return /^minecraft:(dirt|coarse_dirt|rooted_dirt|podzol|mycelium|grass_block|dirt_path|farmland|mud|packed_mud|clay|snow_block|snow|moss_block)$/.test(caeBlockId(st))
}
function caeEarth(level, explosive, pos, R) {
    caeSphere(level, pos, R, 1.0, p => { if (caeEarthBlock(level, p)) level.destroyBlock(p, true, explosive) })
    caeEntitiesNear(level, pos, R, e => { if (e.living) caeEffect(level, e, 'cae:sundered', 300, 1, true) })
    let box = new CAE_AABB(pos.x - R, pos.y - R, pos.z - R, pos.x + R, pos.y + R, pos.z + R).inflate(1.0)
    let items = level.getEntitiesOfClass(CAE_ItemEntity, box)
    for (let i = 0; i < items.size(); i++) {
        let it = items.get(i)
        if (it.getAge() < 10 && !it.isSpectator()) it.teleportTo(pos.x, pos.y, pos.z)
    }
}

// ---- DetonateUtils.lightning: a bolt at the block when it sees the sky, Shocked on everything near, and an electric field of the
// radius for 100 ticks (ElectricField). 1211 substitute: the field is a script object; every tick it has a 1 in 16 chance to strike
// (ElectricField.summonArc): an entity within the radius when nextInt(5) < the number of entities, otherwise the ground at a gaussian
// spot above (radius 1.5 arc: 5 lightning damage and Shocked for 100 ticks to everything alive within 1.5 blocks).
function caeLightning(level, explosive, pos, R) {
    let bp = caePos(pos.x, pos.y, pos.z)
    if (level.canSeeSky(bp)) {
        caeRun(level, 'execute in ' + caeDimKey(level) + ' run summon minecraft:lightning_bolt ' + pos.x + ' ' + pos.y + ' ' + pos.z)
    }
    caeEntitiesNear(level, pos, R, e => { if (e.living) caeEffect(level, e, 'cae:shocked', 300, 1, true) })
    CAE_FIELDS.push({ level: level, x: pos.x, y: pos.y, z: pos.z, radius: R, expire: level.time + 100 })
}
function caeArc(level, x, y, z) {
    caeRun(level, 'execute in ' + caeDimKey(level) + ' run particle minecraft:electric_spark ' + x + ' ' + y + ' ' + z + ' 0.8 0.3 0.8 0.1 30')
    caeRun(level, 'execute in ' + caeDimKey(level) + ' run playsound minecraft:entity.lightning_bolt.impact weather @a ' + x + ' ' + y + ' ' + z + ' 0.6 1.6')
    let box = new CAE_AABB(x - 1.5, y - 1.5, z - 1.5, x + 1.5, y + 1.5, z + 1.5)
    let list = level.getEntitiesOfClass(CAE_Entity, box.inflate(1.5))
    for (let i = 0; i < list.size(); i++) {
        let e = list.get(i)
        if (!e.isAlive() || !e.living) continue
        caeRun(level, 'damage ' + e.uuid + ' 5 minecraft:lightning_bolt')
        caeEffect(level, e, 'cae:shocked', 100, 0, true)
    }
}
function caeFieldsTick(level, now) {
    for (let i = CAE_FIELDS.length - 1; i >= 0; i--) {
        let f = CAE_FIELDS[i]
        if (f.level !== level) continue
        if (now >= f.expire) { CAE_FIELDS.splice(i, 1); continue }
        if (level.random.nextInt(16) != 0) continue
        let rr = f.radius * f.radius
        let box = new CAE_AABB(f.x - f.radius, f.y - f.radius, f.z - f.radius, f.x + f.radius, f.y + f.radius, f.z + f.radius).inflate(1.0)
        let list = level.getEntitiesOfClass(CAE_Entity, box)
        let near = []
        for (let k = 0; k < list.size(); k++) {
            let e = list.get(k)
            if (e.isSpectator() || (e.isCreative && e.isCreative())) continue
            let dx = e.getX() - f.x, dy = e.getY() - f.y, dz = e.getZ() - f.z
            if (dx * dx + dy * dy + dz * dz < rr) near.push(e)
        }
        if (level.random.nextInt(5) < near.length) {
            let e = near[level.random.nextInt(near.length)]
            caeArc(level, e.getX(), e.getY(), e.getZ())
        } else {
            let sx = f.x + level.random.nextGaussian() * f.radius * 0.5
            let sz = f.z + level.random.nextGaussian() * f.radius * 0.5
            // the ground below a point radius blocks above the field: scan down 2 radii for the first solid block
            let top = Math.floor(f.y + f.radius)
            for (let dy = 0; dy < 2 * f.radius; dy++) {
                let p = new CAE_BlockPos(Math.floor(sx), top - dy, Math.floor(sz))
                if (!level.getBlockState(p).getCollisionShape(level, p).isEmpty()) { caeArc(level, sx, p.getY() + 1, sz); break }
            }
        }
    }
}

// ---- DetonateUtils.redstone: air -> signal air (power 15 on every side, light 7, 200 ticks); a red dust cloud
function caeRedstone(level, pos, R) {
    caeAirFill(level, pos, R, 'cae:signal_air')
    caeCloud(level, 'minecraft:dust|color:[1.0f,0.0f,0.0f],scale:1.0f', pos, R)
}

// ---- DetonateUtils.phyto: bone meal on every growable block of the sphere, then GROW_WATER_PLANT twice at the explosive
function caePhyto(level, explosive, pos, R) {
    caeSphere(level, pos, R, 1.0, p => {
        let st = level.getBlockState(p)
        let b = st.getBlock()
        if (b instanceof CAE_Bonemealable && b.isValidBonemealTarget(level, p, st) && b.isBonemealSuccess(level, level.random, p, st)) {
            try { b.performBonemeal(level, level.random, p, st) } catch (err) { /* bamboo throws at its height limit, as in 1.18.2 */ }
        }
    })
    for (let i = 0; i < 2; i++) CAE_BoneMealItem.growWaterPlant(CAE_Items.BONE_MEAL.getDefaultInstance(), level, explosive.blockPosition(), null)
    caeCloud(level, 'minecraft:happy_villager', pos, R)
}

// ---- DetonateUtils.slime: everything living in the box gets Slimed and is knocked away from the explosive:
// strength = (radius - sqrt(distSq / 32)) * seenPercent * (1 - knockback resistance), a quarter of it for players
function caeSlime(level, explosive, pos, R, ticks) {
    let bp = caePos(pos.x, pos.y, pos.z)
    let box = new CAE_AABB(bp.getX() - R, bp.getY() - R, bp.getZ() - R, bp.getX() + 1 + R, bp.getY() + 1 + R, bp.getZ() + 1 + R)
    let list = level.getEntitiesOfClass(CAE_Entity, box)
    let ex = explosive.position()
    for (let i = 0; i < list.size(); i++) {
        let mob = list.get(i)
        if (mob.isSpectator() || !mob.living) continue
        try {
        caeEffect(level, mob, 'cae:slimed', ticks, 1, true)
        let dx = mob.getX() - explosive.getX(), dy = mob.getY() - explosive.getY(), dz = mob.getZ() - explosive.getZ()
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist == 0) continue
        dx /= dist; dy /= dist; dz /= dist
        let d12 = Math.sqrt(explosive.distanceToSqr(mob) / 32)
        let seen = CAE_Explosion.getSeenPercent(ex, mob)
        let d11 = (R - d12) * seen
        d11 *= 1 - mob.getAttributeValue(CAE_Attributes.KNOCKBACK_RESISTANCE)
        if (mob.isPlayer()) d11 /= 4
        mob.setMotion(mob.motionX + dx * d11, mob.motionY + dy * d11, mob.motionZ + dz * d11)
        mob.hurtMarked = true // sends the new velocity to a player's client
        } catch (err) {
            console.warn('gaps2Explosives.js: slime on ' + mob.type + ': ' + err)
        }
    }
    caeCloud(level, 'minecraft:item_slime', pos, R)
}
// Slimed (CoFH): a living thing with the effect bounces on landing as on a slime block: no fall damage, and it is thrown back up
// with the speed it came down with (about 80 % of it, slime block: -vy). The fall height gives the speed.
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingFallEvent', event => {
    try {
        let e = event.getEntity()
        if (e.level.isClientSide()) return
        if (caeSlimedHolder == null) caeSlimedHolder = CAE_Registries.MOB_EFFECT.getHolder(CAE_RL.parse('cae:slimed')).get()
        if (!e.hasEffect(caeSlimedHolder) || e.isSuppressingBounce()) return
        event.setDamageMultiplier(0.0)
        // speed after falling d blocks: v ~ sqrt(2 * 0.08 * d) / 0.98 per tick; the slime block throws it up at -v
        let up = Math.min(1.6, Math.sqrt(0.16 * event.getDistance()) * 1.0)
        if (up > 0.1) {
            e.setMotion(e.motionX, up, e.motionZ)
            e.hurtMarked = true
            e.setOnGround(false)
        }
    } catch (err) {
        console.warn('gaps2Explosives.js: slimed: ' + err)
    }
})
let caeSlimedHolder = null

function caeDetonate(level, explosive, def, tag, pos) {
    let kind = def.kind
    let R = def.r
    let silent = false
    if (kind == 'ice' || kind == 'fire') {
        if (def.src == 'tnt') {
            // the pack's chapter6.js (replaced Thermal's action in every dimension): radius 3 cube, one block type each
            let bp = explosive.blockPosition()
            let from = kind == 'ice' ? CAE_Blocks.MAGMA_BLOCK : CAE_Blocks.STONE
            let to = kind == 'ice' ? CAE_Blocks.BLUE_ICE.defaultBlockState() : CAE_Blocks.MAGMA_BLOCK.defaultBlockState()
            for (let a = -3; a <= 3; a++) {
                for (let b = -3; b <= 3; b++) {
                    for (let c = -3; c <= 3; c++) {
                        let p = new CAE_BlockPos(bp.getX() + a, bp.getY() + b, bp.getZ() + c)
                        if (caeIs(level.getBlockState(p), from)) level.setBlock(p, to, 3)
                    }
                }
            }
            silent = true
        } else if (kind == 'ice') {
            caeSphere(level, pos, R, 1.0, p => caeIceBlock(level, p))
            caeEntitiesNear(level, pos, R, e => {
                if (e.isOnFire()) e.clearFire()
                if (e.living) caeEffect(level, e, 'cae:chilled', 300, 1, true)
            })
            caeCloud(level, 'minecraft:snowflake', pos, R)
        } else if (!explosive.isInWater()) {
            caeEntitiesNear(level, pos, R, e => {
                if (!e.fireImmune() && !e.isInWater() && !e.isOnFire()) e.igniteForSeconds(15)
            })
            caeSphere(level, pos, R, 0.6, p => caeFireSpecial(level, p, null))
            caeSphere(level, pos, R, 0.2, p => caeFireBlock(level, p))
            caeCloud(level, 'minecraft:flame', pos, R)
        }
    } else if (kind == 'glow') {
        caeAirFill(level, pos, R, 'cae:glow_air')
        caeEntitiesNear(level, pos, R, e => {
            if (!e.living) return
            caeEffect(level, e, 'minecraft:glowing', 300, 1, true)
            // 1211 substitute: MobType.UNDEAD is gone; the entity type tag that replaced its healing / harm use is the same set
            let undead = false
            try { undead = e.isInvertedHealAndHarm() } catch (err) { undead = false }
            if (undead) {
                caeHurt(level, e, 4)
                e.igniteForSeconds(15)
            }
        })
        caeCloud(level, 'minecraft:glow', pos, R)
    } else if (kind == 'ender') {
        if (!explosive.isInWater()) {
            caeAirFill(level, pos, R, 'cae:ender_air')
            caeEntitiesNear(level, pos, R, e => {
                let t = String(e.type)
                if (t == 'minecraft:enderman' || t == 'minecraft:endermite') {
                    caeEffect(level, e, 'cae:enderference', 300, 1, true)
                    caeHurt(level, e, 4)
                }
            })
            caeCloud(level, 'minecraft:portal', pos, R)
        }
    } else if (kind == 'explosive') {
        caeInBoom = true
        try {
            level.explode(explosive, explosive.getX(), explosive.getY(), explosive.getZ(), 1.9, false, CAE_ExplosionInteraction.BLOCK)
        } finally {
            caeInBoom = false
        }
        silent = true
    } else if (kind == 'nuke') {
        caeNuke(level, explosive, pos, R)
        silent = true
    } else if (kind == 'earth') {
        caeEarth(level, explosive, pos, R)
    } else if (kind == 'lightning') {
        caeLightning(level, explosive, pos, R)
    } else if (kind == 'redstone') {
        caeRedstone(level, pos, R)
    } else if (kind == 'phyto') {
        caePhyto(level, explosive, pos, R)
    } else if (kind == 'slime') {
        caeSlime(level, explosive, pos, R, 300)
    }
    if (!silent) {
        // PrimedTntCoFH / AbstractGrenade play the vanilla explosion sound (TNT 2.0, grenade 0.5) at the explosive
        caeRun(level, 'execute in ' + caeDimKey(level) + ' run playsound minecraft:entity.generic.explode block @a ' + explosive.getX() + ' ' +
            explosive.getY() + ' ' + explosive.getZ() + ' ' + (def.src == 'grenade' ? 0.5 : 2) + ' 0.7')
    }
}
