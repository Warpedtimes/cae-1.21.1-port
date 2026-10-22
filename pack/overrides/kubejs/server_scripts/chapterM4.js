ServerEvents.recipes(event => {
    // port: 1.20.1 Forbidden Arcanus rituals are datapack entries (data/forbidden_arcanus/forbidden_arcanus/hephaestus_forge/ritual/eternal_stella.json), not recipes, so event.remove can't reach this one; the lead handles it as data
    // event.remove({id: 'forbidden_arcanus:hephaestus_forge/rituals/eternal_stella'})
    event.recipes.create.mixing('minecraft:wither_rose',[Ingredient.of('#minecraft:small_flowers'), Fluid.of('kubejs:liquid_resent', 666)]).heated()
    // port: restored, tiab:time_in_a_bottle is back (core mod); the time crystal chain depends on it
    event.recipes.create.compacting('cae:time_crystal',["minecraft:amethyst_cluster", "tiab:time_in_a_bottle"])
    // port (1.21.1): Lychee 6 format; block_in with blocks/state is unchanged ("level" is a string in Lychee's own examples, but 0 works too)
    event.custom({
        "type": "lychee:item_inside",
        "item_in": {
            "item": "cae:time_crystal"
        },
        "block_in": {
            "blocks": ["kubejs:source"],
            "state": {
                "level": "0"
            }
        },
        "post": [
            {
                "type": "place",
                "block": "cae:source_time_crystal"
            }
            ]

    })
    let t = "create:experience_nugget"
    event.recipes.create.sequenced_assembly([
        'forbidden_arcanus:xpetrified_orb',
      ], 'create:experience_block', [
        event.recipes.create.pressing(t, ["create:experience_nugget"])
    ]).transitionalItem(t).loops(10)


})
/*onEvent('entity.death', event =>{
    //event.server.tell(event.entity.block.offset(0,1,0))
    if (event.entity.block.offset(0,1,0) == "create:crushing_wheel_controller") {
        if (event.entity.type == 'minecraft:silverfish') {
            let NuggetIE = event.entity.block.createEntity("item")
            NuggetIE.item = Item.of("create:experience_nugget")
            NuggetIE.item.count = 3
            NuggetIE.y-=0.01
            NuggetIE.z+=0.5
            NuggetIE.motionX = 0
            NuggetIE.motionY = 1
            NuggetIE.motionZ = 0
            NuggetIE.spawn() //improve this with pop from block
        }
        let EntityCrushing = (Entity, item, amount) => {
            if (event.entity.type == Entity) {
                let IE = event.entity.block.createEntity("item")
                IE.item = Item.of(item)
                IE.item.count = amount
                IE.y-=0.01
                IE.z+=0.5
                IE.motionX = 0
                IE.motionY = 1
                IE.motionZ = 0
                IE.spawn()
            }
          }
          //recipes here
        EntityCrushing("ars_nouveau:amethyst_golem","minecraft:amethyst_cluster",1)
    }
})*/
EntityEvents.death(event =>{
    //event.server.tell(event.entity.block.offset(0,1,0))

    // port: DamageSource.toString() in 1.20.1 is "DamageSource (<message id>)"; Create 6's crush message id is create.crush
    // port (1.21.1): same toString on 1.21.1 ("DamageSource (" + type().msgId() + ")"), but check the msgId directly. Create 6.0's
    // crush damage type is the datapack type create:crush with message_id "create.crush" (checked in Create 6.0.10's data, 18 Oct 2026).
    if (String(event.source.type().msgId()) == "create.crush" || String(event.source) == "DamageSource (create.crush)") {
        if (String(event.entity.type) == "minecraft:player" && String(event.entity.name.string) == '_Pouffy_'){
            event.server.tell(`OMG I CANT BELIEVE ${event.entity.name.string} Allowed themselves to get Crushed!`)
            event.server.runCommandSilent(`execute in ${event.level.dimension} run loot spawn ${event.entity.x} ${event.entity.y} ${event.entity.z} loot cae:pig`)
        }
      let EntityCrushing = (Entity, loot) => {
            if (String(event.entity.type) == Entity) {
                event.server.runCommandSilent(`execute in ${event.level.dimension} run loot spawn ${event.entity.x} ${event.entity.y} ${event.entity.z} loot ${loot}`)
            }
          }
    //Recipes Here EntityCrushing(blahblahblah) script by the godly pino
    EntityCrushing("ars_nouveau:whirlisprig","cae:whirl")
    EntityCrushing("minecraft:silverfish","cae:silverfish")
    EntityCrushing("ars_nouveau:amethyst_golem","cae:golem")
    }


})

// 1211: Ars Nouveau 5's whirlisprig and amethyst golem only take damage from players (SummonUtil.canSummonTakeDamage), so
// Create's crushing wheels can never kill them and the death handler above never sees them. One held by a running crushing
// wheel controller is crushed here instead: same loot as the death would have given. discard() skips the death, so it would
// lose the Charm (the quest promises "its Charm and an Amethyst Cluster"): the summon's own onDispel (the path Ars' dispel spell
// takes) drops the Charm with its familiar data (plus a golem's held item, and only a tamed whirlisprig's charm) and removes it.
// Both the Charm and the loot are put in the block below the controller (where Create's wheels put a crushed mob), not inside it,
// or the controller would take the dropped cluster in and crush it into shards.
var caeArsCrushLoot = { 'ars_nouveau:whirlisprig': 'cae:whirl', 'ars_nouveau:amethyst_golem': 'cae:golem' }
LevelEvents.tick(event => {
    if (event.level.time % 10 != 0) return
    try {
        // audit 5 H-3: typed lookups (orbitMagic.js entitiesOfType), not every entity of the level wrapped for JS
        Object.keys(caeArsCrushLoot).forEach(type => entitiesOfType(event.level, type).forEach(e => {
            let loot = caeArsCrushLoot[String(e.type)]
            if (!loot || String(e.block.id) != 'create:crushing_wheel_controller') return
            let controller = e.block.entity
            if (controller == null || controller.crushingspeed == 0) return
            let ox = e.block.x + 0.5, oy = e.block.y - 0.75, oz = e.block.z + 0.5
            e.setPos(ox, oy, oz)
            try { e.onDispel(null) } catch (err) { console.warn('caeArsCrushLoot: onDispel failed: ' + err) }
            // a wild whirlisprig's onDispel does nothing (only a tamed one drops its charm): it dies all the same
            if (e.isAlive()) e.discard()
            event.server.runCommandSilent(`execute in ${event.level.dimension} run loot spawn ${ox} ${oy} ${oz} loot ${loot}`)
        }))
    } catch (err) {
        console.warn('caeArsCrushLoot: ' + err)
    }
})



// port (1.21.1): EntityEvents.hurt was split into beforeHurt (cancellable, fires before damage like the old hurt) and afterHurt
// 1211: the 1.18.2 check read the NBT key "fireType", which Infernal Expansion (no 1.21.1 build) kept on burning entities. The
// script now remembers it itself in the skeleton's persistent data: hurt while standing in soul fire (or a soul campfire) marks
// it, hurt by normal fire / lava / a campfire or while no longer burning clears it. Burning + marked + in a wither rose converts.
EntityEvents.beforeHurt(event =>{
        if (String(event.entity.type) == 'minecraft:skeleton'){
            let here = String(event.entity.block.id)
            let mark = event.entity.persistentData
            if (here == 'minecraft:soul_fire' || here == 'minecraft:soul_campfire') mark.putBoolean('caeSoulFire', true)
            else if (here == 'minecraft:fire' || here == 'minecraft:lava' || here == 'minecraft:campfire' || !event.entity.isOnFire()) mark.remove('caeSoulFire')

            if (here == "minecraft:wither_rose" && event.entity.isOnFire() && mark.getBoolean('caeSoulFire')) {
                event.entity.discard()

                //event.server.tell("fortnite")
                //event.server.tell(Skeleton.block)
                event.server.runCommandSilent(`execute in ${event.entity.level.dimension} run summon minecraft:wither_skeleton ${event.entity.x} ${event.entity.y} ${event.entity.z} {DeathLootTable:"cae:basedskellie",PersistenceRequired:1b}`)

                event.server.runCommandSilent(`playsound cae:skeleton_convert hostile @e[type=player] ${event.entity.x} ${event.entity.y} ${event.entity.z}`)
                event.entity.block.set("minecraft:air")
                //event.entity.block.playSound('ars_nouveau:fire_family')
            }
        }
})
// 1211: Dave's Building Extended is gone; its skeletons are restored blocks under their old IDs (startup_scripts/restoredBlocks.js)
BlockEvents.rightClicked(event =>{
    let id = String(event.block.id)
    if (event.item.id == "forbidden_arcanus:soul" && id.includes('davebuildingmod') && id.includes('skeleton')) {
       event.item.setCount(event.item.getCount()-1)
       event.block.set('minecraft:air')
       event.server.runCommandSilent(`playsound cae:skeleton_convert hostile @e[type=player] ${event.block.x} ${event.block.y} ${event.block.z}`)
       event.server.runCommandSilent(`execute in ${event.block.level.dimension} run summon minecraft:skeleton ${event.block.x} ${event.block.y} ${event.block.z} {DeathLootTable:"cae:skellie",PersistenceRequired:1b}`)
    }
})
let fortnite = 0;
let CaeM4EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
LevelEvents.tick(event => {
    if (fortnite != 0){fortnite--}
    else{
    fortnite = 20;
    // port: '@e[type=item, nbt={Item:{id:"minecraft:nether_star"}}]' replaced by a filter over level.entities
    // audit 5 (quests reviewer, S-4 kind): only item entities are looked up (the type test runs in Java), not every entity
    event.level.getEntities(CaeM4EntityType.ITEM, e => true).forEach(Orb => {
        if (Orb.y >= 320 && Orb.item.id == 'minecraft:nether_star'){
        const amt = Orb.item.count
        let pos = Orb.block
        Orb.discard()
        for (let i = 0; i < amt; i++) {
            pos.popItem('forbidden_arcanus:stellarite_piece')
        }
        // port: the original used event.entity here, which a level tick doesn't have
        // 1211: a vanilla primed TNT tagged cae_glow, drawn as the Radiant Explosive; startup_scripts/gaps2Explosives.js applies the
        // glowstone effect. The 1.18.2 entity was created with ThermalTNTEntity's default fuse, 80 ticks (it was 60 here before).
        let glow = pos.createEntity("minecraft:tnt")
        glow.addTag('cae_glow')
        glow.mergeNbt({fuse: 80, block_state: {Name: 'cae:glowstone_tnt'}})
        glow.setPosition(Orb.x, Orb.y, Orb.z)
        glow.spawn()

        }

    })
    }
})
