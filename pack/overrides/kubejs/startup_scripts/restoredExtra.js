// 1211: 1.18.2 blocks of the finale rooms that restoredBlocks.js's generator can't rebuild (block states it doesn't
// model), brought back by hand under their 1.18.2 IDs with their 1.18.2 assets (kubejs/assets/<namespace>).
//   - forbidden_arcanus:runic_chiseled_polished_darkstone: Forbidden Arcanus 2.6 dropped it (its runic_darkstone is a
//     rough ore-like block, nothing like it). The dry room is lined with 48 (44 activated). In 1.18.2 a right click with
//     an Arcane Crystal activated it (server_scripts/restoredExtra.js); cutout render, Forbidden Arcanus' darkstone
//     strength.
//   - forbidden_arcanus:arcane_polished_darkstone_rod: the 48 rods of the dry room; FA 2.6 only keeps its textures. Same
//     properties as 1.18.2 (axis, type = Forbidden Arcanus' PillarType single/top/middle/bottom, waterlogged), thin rod box.
//   - createdeco:cast_iron_catwalk, createdeco:gold_catwalk: Create Deco 1.3.3's catwalks (Create Deco 2's differ). Only the
//     bottom=true form (floor at the bottom of the block) is this block: collision is that floor. The multipart blockstate
//     still draws the bottom=false floor / rails, but the templates are rewritten so that form is Create Deco 2's catwalk.
//   - createdeco:orange_decal, createdeco:red_decal: wall plates (facing, waterlogged), no collision.
//   - davebuildingmod:gauge_outer: Dave's Building Extended gauge (face, facing), no collision.
//   - davebuildingmod:soft_air: Dave's invisible fluid-stopping block (the arcane temple's water channels), see below.
//   - davebuildingmod:small_smoke_passive_generator: Dave's invisible smoke emitter (the ice room has one). In 1.18.2 its
//     client display tick drew smoke; KubeJS blocks have no display tick, so a block entity ticks on the server and
//     sends the smoke (server_scripts/restoredExtra.js).
// The assets (1.18.2 blockstates / models / textures; models and textures under cae:block/restored/<namespace>/) were
// copied from the old jars by tools/restore_extra.py. Block properties are the 1.18.2 ones, so the structure templates'
// palettes (axis=y,type=...,waterlogged=false / bottom,north,south,east,west,waterlogged / facing,waterlogged /
// face=wall,facing=south) stay valid as they are.

StartupEvents.registry('block', event => {
    let BSP = Java.loadClass('net.minecraft.world.level.block.state.properties.BlockStateProperties')

    try {
        // Forbidden Arcanus' own "type" property (Rhino can't pick an EnumProperty.create overload to make one)
        let pillarType = Java.loadClass('com.stal111.forbidden_arcanus.common.block.properties.ModBlockStateProperties')
            .PILLAR_TYPE
        event.create('forbidden_arcanus:arcane_polished_darkstone_rod')
            .displayName('Arcane Polished Darkstone Rod')
            .property(BSP.AXIS)
            .property(pillarType)
            .property(BSP.WATERLOGGED)
            // enum values by serialized name: KubeJS's set(EnumProperty, String) looks them up by it
            .defaultState(s => s.set(BSP.AXIS, 'y').set(pillarType, 'single').set(BSP.WATERLOGGED, false))
            .box(5, 14, 5, 11, 16, 11).box(6, 2, 6, 10, 14, 10).box(5, 0, 5, 11, 2, 11)
            .hardness(1.5).resistance(6.0).requiresTool(true).soundType('stone')
            .renderType('cutout').notSolid()
            .tagBlock('minecraft:mineable/pickaxe')
    } catch (err) {
        console.warn('restoredExtra.js: arcane_polished_darkstone_rod not registered: ' + err)
    }

    event.create('createdeco:cast_iron_catwalk')
        .displayName('Cast Iron Catwalk')
        .property(BSP.BOTTOM).property(BSP.NORTH).property(BSP.SOUTH).property(BSP.EAST).property(BSP.WEST)
        .property(BSP.WATERLOGGED)
        .defaultState(s => s.set(BSP.BOTTOM, true).set(BSP.NORTH, false).set(BSP.SOUTH, false).set(BSP.EAST, false)
            .set(BSP.WEST, false).set(BSP.WATERLOGGED, false))
        .box(0, 0, 0, 16, 2, 16)
        .hardness(5.0).resistance(6.0).requiresTool(true).soundType('metal')
        .renderType('cutout').notSolid()
        .tagBlock('minecraft:mineable/pickaxe')

    event.create('createdeco:gold_catwalk')
        .displayName('Gold Catwalk')
        .property(BSP.BOTTOM).property(BSP.NORTH).property(BSP.SOUTH).property(BSP.EAST).property(BSP.WEST)
        .property(BSP.WATERLOGGED)
        .defaultState(s => s.set(BSP.BOTTOM, true).set(BSP.NORTH, false).set(BSP.SOUTH, false).set(BSP.EAST, false)
            .set(BSP.WEST, false).set(BSP.WATERLOGGED, false))
        .box(0, 0, 0, 16, 2, 16)
        .hardness(5.0).resistance(6.0).requiresTool(true).soundType('metal')
        .renderType('cutout').notSolid()
        .tagBlock('minecraft:mineable/pickaxe')

    event.create('createdeco:orange_decal')
        .displayName('Orange Decal')
        .property(BSP.HORIZONTAL_FACING).property(BSP.WATERLOGGED)
        .defaultState(s => s.set(BSP.HORIZONTAL_FACING, 'north').set(BSP.WATERLOGGED, false))
        .noCollision().notSolid()
        .hardness(1.0).resistance(3.0).soundType('metal')
        .renderType('cutout')
        .tagBlock('minecraft:mineable/pickaxe')

    event.create('createdeco:red_decal')
        .displayName('Red Decal')
        .property(BSP.HORIZONTAL_FACING).property(BSP.WATERLOGGED)
        .defaultState(s => s.set(BSP.HORIZONTAL_FACING, 'north').set(BSP.WATERLOGGED, false))
        .noCollision().notSolid()
        .hardness(1.0).resistance(3.0).soundType('metal')
        .renderType('cutout')
        .tagBlock('minecraft:mineable/pickaxe')

    event.create('davebuildingmod:gauge_outer')
        .displayName('Gauge Outer')
        .property(BSP.ATTACH_FACE).property(BSP.HORIZONTAL_FACING)
        .defaultState(s => s.set(BSP.ATTACH_FACE, 'wall').set(BSP.HORIZONTAL_FACING, 'north'))
        .noCollision().notSolid()
        .hardness(1.0).resistance(3.0).soundType('metal')
        .renderType('cutout')
        .tagBlock('minecraft:mineable/pickaxe')

    // Dave's soft air: invisible and walked through, but of 1.18's glass material, which water can't flow into; the
    // arcane temple's water channels end against it (as plain air the water ran off the island). 1.21 has no materials:
    // forceSolidOn() is what keeps fluids out of a block without collision. A vanilla Block, as KubeJS's builder can't.
    try {
        let Block = Java.loadClass('net.minecraft.world.level.block.Block')
        let Props = Java.loadClass('net.minecraft.world.level.block.state.BlockBehaviour$Properties')
        let SoundType = Java.loadClass('net.minecraft.world.level.block.SoundType')
        event.createCustom('davebuildingmod:soft_air', () => new Block(Props.of().noCollission().noOcclusion()
            .forceSolidOn().instabreak().noLootTable().sound(SoundType.GLASS).isRedstoneConductor((s, l, p) => false)))
    } catch (err) {
        console.warn('restoredExtra.js: soft_air not registered: ' + err)
    }

    event.create('davebuildingmod:small_smoke_passive_generator')
        .displayName('Small Smoke Passive Generator')
        .noCollision().notSolid().transparent(true)
        .hardness(0.0).resistance(0.0).soundType('glass')
        .renderType('cutout')
        .blockEntity(info => {
            info.serverTicking()
            info.tickFrequency(10)
        })

    let BooleanProperty = Java.loadClass('net.minecraft.world.level.block.state.properties.BooleanProperty')
    let activated = BooleanProperty.create('activated')
    event.create('forbidden_arcanus:runic_chiseled_polished_darkstone')
        .displayName('Runic Chiseled Polished Darkstone')
        .property(activated)
        .defaultState(s => s.set(activated, false))
        .hardness(1.5).resistance(6.0).requiresTool(true).soundType('stone')
        .renderType('cutout')
        .tagBlock('minecraft:mineable/pickaxe')
})
