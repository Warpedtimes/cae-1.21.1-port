// 1211: Known Differences closed for items, materials and explosives (gaps2, 20 Oct 2026). Server half:
// server_scripts/gaps2Content.js (blood) and server_scripts/gaps2Explosives.js (explosives).
//
// 1. Blood Slime Ball (tconstruct:blood_slime_ball, "Coagulated Blood" in 1.18.2). Tinkers' Construct has no 1.21.1
//    version; the item comes back under its old ID with Tinkers 3.x's texture and model (assets/tconstruct). The 1.18.2
//    pack gave the Netherrack chapter's quest and its sequenced assembly this item (the port had used a Magma Cream).
//    Tinkers' source of it was a casting table: 250 mB of blood fluid (tag tconstruct:blood) -> one ball; blood came from
//    melting rotten flesh (50 mB each), a ball (250), or a zombie in the smeltery (25 mB, damage 2).
//    1211 substitute: the blood fluid is back as tconstruct:blood (Tinkers' texture) and Create handles it, see the server
//    script. Tinkers' blood slime blocks and the bloody island that dropped them are gone.
//
// 2. Explosives. Thermal's five TNT were real TNT blocks (TntBlockCoFH extends TntBlock: hardness 0, grass sound, lit by fire,
//    flint and steel, fire charges, redstone, other explosions or a dispenser), so they are vanilla TntBlock instances again
//    under their cae: IDs (the pack moved them out of Thermal's namespace). Their primed entity is a vanilla primed TNT that
//    server_scripts/gaps2Explosives.js tags and draws as the block. The grenades stay items; the mob effects and the two
//    "special air" blocks Thermal's explosives used (CoFH Core's Chilled and Enderference effects, glow air and ender air) are
//    registered here too.
StartupEvents.registry('fluid', event => {
    event.create('tconstruct:blood', 'thin')
        .displayName('Blood')
        .stillTexture('tconstruct:block/fluid/blood/still')
        .flowingTexture('tconstruct:block/fluid/blood/flowing')
})

StartupEvents.registry('item', event => {
    event.create('tconstruct:blood_slime_ball')
        .displayName('Coagulated Blood')
        .texture('tconstruct:item/materials/blood_slime_ball')
        // Tinkers: forge:slimeball/blood, which forge:slimeballs held
        .tag('c:slime_balls').tag('c:slime_balls/blood')
})

// The original pack never removed Thermal's other explosives (earth, lightning, phyto, redstone, slime TNT; the ice, fire, ender,
// earth, lightning, phyto, redstone, slime grenades; a TNT minecart for each of the ten TNT), so all of them are here.
const CAE_TNT_NAMES = ['ice_tnt', 'fire_tnt', 'glowstone_tnt', 'ender_tnt', 'nuke_tnt', 'earth_tnt', 'lightning_tnt', 'phyto_tnt', 'redstone_tnt', 'slime_tnt']
const CAE_GRENADES_NEW = [['ice', 'Glacial Grenade'], ['fire', 'Inferno Grenade'], ['ender', 'Disruption Grenade'], ['earth', 'Tectonic Grenade'],
    ['lightning', 'Fulminating Grenade'], ['phyto', 'Phyto-Gronade'], ['redstone', 'Redstone Grenade'], ['slime', 'Slime Grenade']]
const CAE_CARTS = [['ice', 'Glacial'], ['fire', 'Inferno'], ['glowstone', 'Radiant'], ['ender', 'Disruption'], ['nuke', 'Nuclear'],
    ['earth', 'Tectonic'], ['lightning', 'Fulminating'], ['phyto', 'PNT'], ['redstone', 'Redstone'], ['slime', 'Slime']]
StartupEvents.registry('item', event => {
    CAE_GRENADES_NEW.forEach(g => event.create('cae:' + g[0] + '_grenade').displayName(g[1]).maxStackSize(16))
    CAE_CARTS.forEach(c => event.create('cae:' + c[0] + '_tnt_minecart').displayName('Minecart with ' + c[1] + (c[1] == 'PNT' ? '' : ' Explosive')).maxStackSize(1))
})

StartupEvents.registry('block', event => {
    let TntBlock = Java.loadClass('net.minecraft.world.level.block.TntBlock')
    let Props = Java.loadClass('net.minecraft.world.level.block.state.BlockBehaviour$Properties')
    let SoundType = Java.loadClass('net.minecraft.world.level.block.SoundType')
    let MapColor = Java.loadClass('net.minecraft.world.level.material.MapColor')
    let Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
    CAE_TNT_NAMES.forEach(n => {
        try {
            // RegistrationHelper.registerTNT: Properties.of(Material.EXPLOSIVE, MaterialColor.FIRE).strength(0).sound(GRASS)
            event.createCustom('cae:' + n, () => {
                // vanilla TNT's own properties are exactly these (mapColor FIRE, instabreak, GRASS, ignitedByLava); copying
                // them avoids Rhino's ambiguous mapColor(DyeColor|MapColor) overload
                let b = new TntBlock(Props.ofFullCopy(Blocks.TNT))
                // vanilla TNT burns when fire spreads to it (igniteOdds 15, burnOdds 100); Thermal's did too (Blocks.TNT's entry
                // is per block in FireBlock)
                Blocks.FIRE.setFlammable(b, 15, 100)
                return b
            })
        } catch (err) {
            console.warn('gaps2Content.js: ' + n + ' not registered: ' + err)
        }
    })

    // CoFH Core's glow air and ender air: invisible air-like blocks the explosives fill the air with for 200 ticks. Light
    // 15 and 3 (CoreBlocks). A KubeJS block can't be a real AirBlock with callbacks, so they are empty-shaped, non-solid,
    // replaceable blocks; the explosives script removes them after 200 ticks and the random tick is the fallback.
    // 1211 substitute: CoFH's removed itself with a block entity ticking down 200 per block (3000 block entities per bomb);
    // the script clears a whole bomb's blocks at once instead.
    let air = (id, light) => {
        return event.create(id)
            .noItem().noCollision().notSolid().transparent(true).suffocating(false).viewBlocking(false)
            .redstoneConductor(false).noValidSpawns(true).noDrops().noSoundType()
            .box(0, 0, 0, 0, 0, 0)
            .hardness(0.0).resistance(0.0)
            .lightLevel(light)
            .canBeReplaced(cb => true)
            .renderType('cutout')
            .randomTick(cb => { cb.block.set('minecraft:air') })
    }
    // CoFH Core's signal air (CoreBlocks.SIGNAL_AIR: light 7): gives redstone power 15 on every side for 200 ticks (redstone TNT).
    // The vanilla redstone block's class (PoweredBlock in Mojang's names) does exactly that (isSignalSource, getSignal 15); it
    // can't have an empty shape, so it is a non-colliding, replaceable block with an invisible model.
    try {
        let PoweredBlock = Java.loadClass('net.minecraft.world.level.block.PoweredBlock')
        event.createCustom('cae:signal_air', () => new PoweredBlock(Props.of().noCollission().noOcclusion().replaceable().instabreak()
            .noLootTable().lightLevel(s => 7).isViewBlocking((s, l, p) => false).isSuffocating((s, l, p) => false)))
    } catch (err) {
        console.warn('gaps2Content.js: signal_air not registered: ' + err)
    }
    air('cae:glow_air', 1.0)
    // EnderAirBlock.entityInside: anything but items and xp orbs is thrown to a random spot (x/z +-128, y 0..7 up) that is not
    // solid; living things get Enderference for 40 ticks after it, other entities move once every 40 ticks.
    air('cae:ender_air', 0.2).entityInside(cb => {
        try {
            let level = cb.level
            let ent = cb.entity
            if (level.clientSide) return
            let kind = String(ent.type)
            if (kind == 'minecraft:item' || kind == 'minecraft:experience_orb') return
            if (!ent.living && level.time % 40 != 0) return
            let p = cb.block.pos
            let r = level.random
            let dest = p.offset(-128 + r.nextInt(257), r.nextInt(8), -128 + r.nextInt(257))
            if (!level.hasChunkAt(dest) || level.getBlockState(dest).isSolid()) return
            ent.teleportTo(dest.x + 0.5, dest.y, dest.z + 0.5)
            level.server.runCommandSilent('playsound minecraft:entity.enderman.teleport block @a ' + dest.x + ' ' + dest.y + ' ' + dest.z + ' 1 1')
            if (ent.living) level.server.runCommandSilent('effect give ' + ent.uuid + ' cae:enderference 2 0 true')
        } catch (err) {
            console.warn('gaps2Content.js: ender air: ' + err)
        }
    })
})

// block items for the createCustom TNT (KubeJS builders make their own)
StartupEvents.registry('item', event => {
    let BlockItem = Java.loadClass('net.minecraft.world.item.BlockItem')
    let ItemProps = Java.loadClass('net.minecraft.world.item.Item$Properties')
    let Registry = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    let RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
    CAE_TNT_NAMES.forEach(n => {
        try {
            event.createCustom('cae:' + n, () => new BlockItem(Registry.BLOCK.getOptional(RL.parse('cae:' + n)).get(), new ItemProps()))
        } catch (err) {
            console.warn('gaps2Content.js: item ' + n + ' not registered: ' + err)
        }
    })
})

// CoFH Core's mob effects the explosives apply (CoreMobEffects). Icons are CoFH Core 1.18's.
//   chilled: harmful, colour 8826621; movement speed -10 % and attack speed -0.2 per level (the amplifier counts one more:
//     amplifier 1 is -20 % and -0.4); each tick it adds freezing ticks, 2 + 2 * amplifier (ChilledMobEffect).
//   enderference: neutral, colour 1791821; stops chorus fruit, Enderman and ender pearl teleports (the script cancels them).
StartupEvents.registry('mob_effect', event => {
    let Op = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
    event.create('cae:chilled')
        .harmful().color(0x86AEFD)
        .modifyAttribute('cae:chilled_movement_speed', 'minecraft:generic.movement_speed', -0.1, Op.ADD_MULTIPLIED_TOTAL)
        .modifyAttribute('cae:chilled_attack_speed', 'minecraft:generic.attack_speed', -0.2, Op.ADD_VALUE)
        .effectTick((living, amplifier) => {
            if (living.canFreeze()) {
                living.setTicksFrozen(Math.min(living.getTicksRequiredToFreeze(), living.getTicksFrozen() + 2 + amplifier * 2))
            }
        })
    event.create('cae:enderference').color(0x1B574D)
    // shocked: harmful, colour 16774309, attack damage -3 (CoreMobEffects.SHOCKED); sundered: harmful, colour 9202268, armour and
    // armour toughness -25 % per level (x1 for amplifier 0); slimed: neutral, colour 9230210; the script makes it bounce
    event.create('cae:shocked').harmful().color(0xFFF4A5)
        .modifyAttribute('cae:shocked_attack_damage', 'minecraft:generic.attack_damage', -3.0, Op.ADD_VALUE)
    event.create('cae:sundered').harmful().color(0x8C6A5C)
        .modifyAttribute('cae:sundered_armor', 'minecraft:generic.armor', -0.25, Op.ADD_MULTIPLIED_TOTAL)
        .modifyAttribute('cae:sundered_armor_toughness', 'minecraft:generic.armor_toughness', -0.25, Op.ADD_MULTIPLIED_TOTAL)
    event.create('cae:slimed').color(0x8CD782)
})
