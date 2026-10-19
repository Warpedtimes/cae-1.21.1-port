// 1211: the tick logic of the Decoctive Diffuser (cae:device_potion_diffuser) and the Nullifier (cae:device_nullifier), two Thermal
// Foundation devices rebuilt without Thermal. Blocks are registered in startup_scripts/thermalDevicesB.js. The numbers are read from
// thermal_foundation 9.2.2.58 (cofh.thermal.core.block.entity.device.DevicePotionDiffuserTile / DeviceNullifierTile and the
// potion_diffuser_boost recipes), see the port's device notes.
// Not rebuilt: thermal:device_soil_infuser and thermal:tinker_bench (notes, "why not").

const CAEB_FLUID_ACTION = Java.loadClass('net.neoforged.neoforge.fluids.capability.IFluidHandler$FluidAction')
const CAEB_DATA_COMPONENTS = Java.loadClass('net.minecraft.core.component.DataComponents')
const CAEB_MOB_EFFECT_INSTANCE = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
const CAEB_AABB = Java.loadClass('net.minecraft.world.phys.AABB')

// ---------------------------------------------------------------------------------------------------------------------
// Decoctive Diffuser
//   - TIME_CONSTANT 60 ticks between two diffusions (getTimeConstant); `process` starts at 1 and is reset to 1 whenever the device
//     is inactive, so the first diffusion happens on the first tick after the tank holds 25 mB
//   - FLUID_AMOUNT 25 mB per diffusion; the device is only active with at least 25 mB in the tank (isValid)
//   - RADIUS 4: the area is AABB(pos + (-4, -1, -4), pos + (5, 5, 5)) (getArea; BlockPos corners, not +1)
//   - diffuse(): needs effects and at least one living entity in the area, otherwise nothing is used up. Boost: while boostCycles > 0
//     it counts down; else a valid boost item in the slot starts boostCycles = 16 (PotionDiffuserManager default energy), is consumed,
//     and sets the amplifier / duration modifiers; else the modifiers are cleared. Every living (alive) entity gets every effect:
//     instant effects through applyInstantenousEffect(..., amplifier, 0.5); others as a new MobEffectInstance with
//       amplifier = amp > 3 ? amp : min(3, round(amp + potionAmpMod(0) + boostAmplifier))
//       duration  = min(72000, round(duration * (1 + potionDurMod(0) + boostDuration))) / 4 (integer division)
//     then 25 mB leave the tank.
//   - boosts (data/thermal/recipes/devices/potion_diffuser): glowstone dust amplifier +1, duration_mod -0.25; redstone dust
//     duration_mod +1.0; both 16 cycles.
// Differences (1211 substitute): the tick runs every 20 ticks (CAEB_DIFFUSER_STEP, must equal tickFrequency in the startup script), so
// `process` counts down in steps of 20; no augments (radius / potion amplifier / duration), no filter, redstone control is "ignore".
// ---------------------------------------------------------------------------------------------------------------------
const CAEB_DIFFUSER_STEP = 20
const CAEB_DIFFUSER_TIME = 60
const CAEB_DIFFUSER_FLUID = 25
const CAEB_DIFFUSER_RADIUS = 4
const CAEB_DIFFUSER_CYCLES = 16
// item id -> [amplifier, duration mod]
const CAEB_DIFFUSER_BOOSTS = {
    'minecraft:glowstone_dust': [1, -0.25],
    'minecraft:redstone': [0, 1.0]
}

function caebFluidId(fs) {
    try { return String(fs.id) } catch (err) { return '' }
}

// the potion effects the fluid in the tank carries (Create's create:potion fluid: minecraft:potion_contents)
function caebTankEffects(tank) {
    let out = []
    let fs = tank.getFluid()
    if (fs.isEmpty() || caebFluidId(fs) != 'create:potion') { return out }
    let contents = fs.get(CAEB_DATA_COMPONENTS.POTION_CONTENTS)
    if (contents == null) { return out }
    let it = contents.getAllEffects().iterator()
    while (it.hasNext()) { out.push(it.next()) }
    return out
}

BlockEvents.blockEntityTick('cae:device_potion_diffuser', event => {
    let block = event.block
    let entity = block.entity
    if (!entity) { return }
    let tank = entity.attachments.get('tank')
    if (!tank) { return }
    let data = entity.data
    // isValid(): at least 25 mB; inactive resets process to 1
    if (tank.getFluidAmount() < CAEB_DIFFUSER_FLUID) {
        if (data.contains('process') && data.getInt('process') != 1) { data.putInt('process', 1); entity.save() }
        return
    }
    let process = data.contains('process') ? data.getInt('process') : 1
    process -= CAEB_DIFFUSER_STEP
    if (process > 0) {
        data.putInt('process', process)
        entity.save()
        return
    }
    data.putInt('process', CAEB_DIFFUSER_TIME)
    entity.save()

    let effects = caebTankEffects(tank)
    if (effects.length == 0) { return }
    let r = CAEB_DIFFUSER_RADIUS
    let aabb = new CAEB_AABB(block.x - r, block.y - 1, block.z - r, block.x + 1 + r, block.y + 1 + r, block.z + 1 + r)
    let targets = []
    block.level.getEntitiesWithin(aabb).forEach(ent => {
        if (ent.living && ent.alive) { targets.push(ent) }
    })
    if (targets.length == 0) { return }

    // boost
    let cycles = data.getInt('boostCycles')
    let boostAmp = data.getInt('boostAmp')
    let boostDur = data.getFloat('boostDur')
    if (cycles > 0) {
        cycles--
    } else {
        let inv = entity.attachments.get('boost')
        let stack = inv ? inv.getStackInSlot(0) : null
        let def = stack && !stack.isEmpty() ? CAEB_DIFFUSER_BOOSTS[String(stack.id)] : null
        if (def) {
            cycles = CAEB_DIFFUSER_CYCLES
            boostAmp = def[0]
            boostDur = def[1]
            inv.extractItem(0, 1, false)
        } else {
            cycles = 0
            boostAmp = 0
            boostDur = 0
        }
    }
    data.putInt('boostCycles', cycles)
    data.putInt('boostAmp', boostAmp)
    data.putFloat('boostDur', boostDur)

    targets.forEach(ent => {
        effects.forEach(inst => {
            let holder = inst.getEffect()
            let amp = inst.getAmplifier()
            let outAmp = amp > 3 ? amp : Math.min(3, Math.round(amp + boostAmp))
            if (holder.value().isInstantenous()) {
                holder.value().applyInstantenousEffect(null, null, ent, outAmp, 0.5)
            } else {
                let dur = Math.floor(Math.min(72000, Math.round(inst.getDuration() * (1 + boostDur))) / 4)
                ent.addEffect(new CAEB_MOB_EFFECT_INSTANCE(holder, dur, outAmp, inst.isAmbient(), inst.isVisible()))
            }
        })
    })
    tank.drain(tank.getFluidInTank(0).copyWithAmount(CAEB_DIFFUSER_FLUID), CAEB_FLUID_ACTION.EXECUTE) // 1211: drain(int, ..) is read as drain(FluidStack, ..) by Rhino; pass a FluidStack
    entity.save()
})

// Potion bottles. Thermal's tank took potion fluid from other mods' tanks / pipes and from its own fluid items; a Create potion fluid cannot
// come out of a bucket, so a right click with a potion bottle (regular, splash or lingering) pours its 250 mB in (Create's own
// getFluidFromPotionItem) and gives back the glass bottle.
BlockEvents.rightClicked('cae:device_potion_diffuser', event => {
    if (event.item.empty) { return }
    let PotionFluidHandler = Java.loadClass('com.simibubi.create.content.fluids.potion.PotionFluidHandler')
    if (!PotionFluidHandler.isPotionItem(event.item)) { return }
    let entity = event.block.entity
    if (!entity) { return }
    let tank = entity.attachments.get('tank')
    if (!tank) { return }
    let fs = PotionFluidHandler.getFluidFromPotionItem(event.item)
    if (fs.isEmpty() || tank.fill(fs, CAEB_FLUID_ACTION.SIMULATE) < fs.getAmount()) { return }
    tank.fill(fs, CAEB_FLUID_ACTION.EXECUTE)
    entity.save()
    if (!event.player.isCreative()) {
        event.item.shrink(1)
        event.player.give('minecraft:glass_bottle')
    }
    event.cancel()
})

// ---------------------------------------------------------------------------------------------------------------------
// Nullifier. DeviceNullifierTile: a NullItemStorage (the input slot), nine bin slots, a 64000 mB NullFluidStorage; whatever automation
// puts in is destroyed at once, a filter augment can restrict what is accepted. Here: every tick the nine buffer slots and the tank are
// emptied. Anything an item / fluid handler accepted before that is gone, so nothing ever builds up.
// ---------------------------------------------------------------------------------------------------------------------
BlockEvents.blockEntityTick('cae:device_nullifier', event => {
    let entity = event.block.entity
    if (!entity) { return }
    let inv = entity.attachments.get('trash')
    if (inv) {
        for (let i = 0; i < 9; i++) {
            let s = inv.getStackInSlot(i)
            if (!s.isEmpty()) { inv.extractItem(i, s.getCount(), false) }
        }
    }
    let tank = entity.attachments.get('tank')
    if (tank && tank.getFluidAmount() > 0) { tank.drain(tank.getFluidInTank(0).copy(), CAEB_FLUID_ACTION.EXECUTE) }
})

// "Items inserted manually must be destroyed with the button": here a right click with a stack in the hand destroys that stack.
BlockEvents.rightClicked('cae:device_nullifier', event => {
    if (event.item.empty) { return }
    event.item.shrink(event.item.count)
    event.cancel()
})
