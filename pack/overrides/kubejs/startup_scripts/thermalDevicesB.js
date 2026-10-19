// 1211: two more Thermal Foundation devices the port dropped, rebuilt as KubeJS block entities like cae:device_tree_extractor /
// cae:device_rock_gen in thermalReplacements.js. Tick logic is in server_scripts/thermalDevicesB.js; the numbers come from
// thermal_foundation 9.2.2.58 (see the port's device notes).
//   cae:device_potion_diffuser  Decoctive Diffuser   (DevicePotionDiffuserTile: 8000 mB potion tank, 1 boost slot)
//   cae:device_nullifier        Nullifier            (DeviceNullifierTile: voids items and fluids put into it)
// Not built (see the notes): thermal:device_soil_infuser (it only charges Thermal's Phyto-Soil blocks, which are not in the
// pack) and thermal:tinker_bench (it augments Thermal tools / armor, which are not in the pack).
// Textures and models are copied from Thermal 9.2.2.58 (kubejs/assets/cae/blockstates, models/block, textures/block: device_*). Both
// blocks are TileBlockActive4Way in Thermal: a horizontal `facing` (front towards the player who placed it) and `active`.
// Item sides of the diffuser's boost slot: startup_scripts/thermalDevicesA.js, "Item sides".

// Thermal's ACTIVE blockstate property (BlockStatePropertiesCoFH.ACTIVE); the server script sets it while the diffuser works
const CAEB_ACTIVE = Java.loadClass('net.minecraft.world.level.block.state.properties.BooleanProperty').create('active')

StartupEvents.registry('block', event => {
    // Decoctive Diffuser: 8000 mB tank that only takes potion fluid (DevicePotionDiffuserTile: FluidStorageCoFH(8000, hasPotionTag)),
    // a 1 slot input for the boost (glowstone dust / redstone dust, PotionDiffuserManager) and no energy.
    // 1211 substitute: Thermal's potion fluid is Create's create:potion here (the potion is its data component, minecraft:potion_contents);
    // the tank is filtered to that fluid. The boost slot filter is the two boost items of the 1.18.2 recipes (data/thermal/recipes/devices/
    // potion_diffuser): #forge:dusts/glowstone and #forge:dusts/redstone.
    // 1211 substitute: Thermal drew the tank's potion behind the little windows of the active faces (UnderlayBakedModel); a block
    // model can't know the potion, so the windows stay dark.
    event.create('cae:device_potion_diffuser', 'cardinal')
        .displayName('Decoctive Diffuser')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .property(CAEB_ACTIVE)
        .defaultState(s => s.set(CAEB_ACTIVE, false))
        .textures({
            particle: 'cae:block/device_potion_diffuser_side',
            bottom: 'cae:block/device_potion_diffuser_bottom',
            top: 'cae:block/device_potion_diffuser_top',
            front: 'cae:block/device_potion_diffuser',
            side: 'cae:block/device_potion_diffuser_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(20)
            // tank: potion fluid only. The filter needs the create:potion fluid object; if anything about it fails the tank is
            // left unfiltered and the tick refuses every other fluid instead.
            let filtered = false
            try {
                let Registries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
                let RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
                // FluidIngredient.single(...) is ambiguous to Rhino (Fluid / Holder / FluidStack overloads); the record's one
                // constructor isn't
                let SingleFluidIngredient = Java.loadClass('net.neoforged.neoforge.fluids.crafting.SingleFluidIngredient')
                let potion = Registries.FLUID.get(RL.parse('create:potion'))
                if (String(Registries.FLUID.getKey(potion)) == 'create:potion') {
                    info.fluidTank('tank', [], 8000, new SingleFluidIngredient(potion.builtInRegistryHolder()))
                    filtered = true
                }
            } catch (err) {
                console.warn('thermalDevicesB.js: potion tank filter failed (' + err + '), using an unfiltered tank')
            }
            if (!filtered) { info.fluidTank('tank', [], 8000) }
            let slotOk = false
            try {
                info.inventory('boost', [], 1, 1, ['minecraft:redstone', 'minecraft:glowstone_dust'])
                slotOk = true
            } catch (err) {
                console.warn('thermalDevicesB.js: boost slot filter failed (' + err + '), using an unfiltered slot')
            }
            if (!slotOk) { info.inventory('boost', [], 1, 1) }
            info.rightClickFillsTank('tank')
        })

    // Nullifier: destroys everything put into it. Thermal: NullItemStorage + 64000 mB NullFluidStorage; items and fluid
    // inserted by automation are destroyed at once. 1211 substitute: the destroying is done by a 1 tick block entity tick that empties
    // a 9 slot item buffer and a 64000 mB tank, so hoppers / pipes see an ordinary container that never fills up. The Thermal filter
    // (an augment, not a slot) and the 9 slot GUI bin with its "Destroy Items" button are replaced by: right click with an item to
    // destroy the held stack (server script).
    // Thermal's nullifier is always active once placed (isValid() is never false and redstone control defaults to "ignored"), so
    // its blockstate file shows the active (swirling) front on every facing, and it gives the active light, 7
    // (BlockHelper.lightValue(ACTIVE, 7)); lightLevel is a fraction of 15 (0.467 * 15 = 7). The item keeps the plain model.
    event.create('cae:device_nullifier', 'cardinal')
        .displayName('Nullifier')
        .hardness(3.0).resistance(6.0).requiresTool(true).soundType('metal')
        .lightLevel(0.467)
        .textures({
            particle: 'cae:block/device_nullifier_side',
            bottom: 'cae:block/device_nullifier_bottom',
            top: 'cae:block/device_nullifier_top',
            front: 'cae:block/device_nullifier',
            side: 'cae:block/device_nullifier_side'
        })
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(1)
            info.inventory('trash', [], 3, 3)
            info.fluidTank('tank', [], 64000)
        })
})
