package com.caeport.cae.compat;

import com.caeport.cae.Cae;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelAccessor;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.IntegerProperty;
import net.minecraft.world.level.material.Fluids;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.level.BlockEvent;

/**
 * The pack's Lava Lily ({@code cae:lava_lily}, a KubeJS block standing in for Ars Nouveau 2.9.0's) breaks and drops
 * itself when the block under it goes, as Ars' lily did (a BushBlock: canSurvive failed once its support was air). KubeJS
 * blocks have no canSurvive hook, and a script listener on every neighbour update would cost tick time, so the check is
 * here: a block that changes notifies its neighbours, and if it became air with a lily on top, the lily is destroyed with
 * drops (its loot table, kubejs/data/cae/loot_table/blocks/lava_lily.json, gives the lily back).
 */
@EventBusSubscriber(modid = Cae.ID)
public final class LavaLilySupport {
    private static final ResourceLocation LILY_ID = ResourceLocation.fromNamespaceAndPath("cae", "lava_lily");
    private static Block lily;

    private LavaLilySupport() {
    }

    /**
     * What Ars 2.9.0's Volcanic Sourcelink did first on every random tick: the first air block of the 3x3 ring around it
     * (its own height) with lava (source or flowing) underneath gets a lily, its look picked by the block under it.
     * Called by VolcanicSourcelinkLilyMixin.
     */
    public static void growAround(Level level, BlockPos origin) {
        if (lily == null) {
            lily = BuiltInRegistries.BLOCK.get(LILY_ID);
        }
        if (lily == Blocks.AIR) {
            return;
        }
        var loc = lily.getStateDefinition().getProperty("loc");
        for (BlockPos p : (Iterable<BlockPos>) BlockPos.withinManhattanStream(origin, 1, 0, 1)::iterator) {
            if (!level.getBlockState(p).isAir()) {
                continue;
            }
            var fluid = level.getFluidState(p.below()).getType();
            if (fluid != Fluids.LAVA && fluid != Fluids.FLOWING_LAVA) {
                continue;
            }
            BlockState state = lily.defaultBlockState();
            Block under = level.getBlockState(p.below()).getBlock();
            if (loc instanceof IntegerProperty prop) {
                state = state.setValue(prop, under == Blocks.STONE ? 0 : under == Blocks.MAGMA_BLOCK ? 1 : under == Blocks.LAVA ? 2 : 0);
            }
            level.setBlockAndUpdate(p, state);
            return;
        }
    }

    @SubscribeEvent
    public static void onNeighborNotify(BlockEvent.NeighborNotifyEvent event) {
        LevelAccessor level = event.getLevel();
        if (level.isClientSide() || !event.getState().isAir()) {
            return;
        }
        if (lily == null) {
            lily = BuiltInRegistries.BLOCK.get(LILY_ID);
        }
        if (lily == Blocks.AIR) {
            return;
        }
        BlockPos above = event.getPos().above();
        if (level.getBlockState(above).is(lily)) {
            level.destroyBlock(above, true);
        }
    }
}
