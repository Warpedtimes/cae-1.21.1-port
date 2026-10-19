package com.caeport.cae.block;

import com.caeport.cae.CaeBlocks;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.BaseEntityBlock;
import net.minecraft.world.level.block.RenderShape;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.entity.BlockEntityTicker;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraft.world.level.block.state.BlockState;
import org.jetbrains.annotations.Nullable;

/** The Source Time Crystal: drawn by its block entity's GeckoLib model, not a block model. */
public class TimeCrystalBlock extends BaseEntityBlock {
    public static final MapCodec<TimeCrystalBlock> CODEC = simpleCodec(TimeCrystalBlock::new);

    public TimeCrystalBlock(Properties properties) {
        super(properties);
    }

    @Override
    protected MapCodec<? extends BaseEntityBlock> codec() {
        return CODEC;
    }

    @Override
    public @Nullable BlockEntity newBlockEntity(BlockPos pos, BlockState state) {
        return new TimeCrystalBlockEntity(pos, state);
    }

    @Override
    protected RenderShape getRenderShape(BlockState state) {
        return RenderShape.ENTITYBLOCK_ANIMATED;
    }

    @Override
    public @Nullable <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state,
                                                                          BlockEntityType<T> type) {
        return level.isClientSide ? null : createTickerHelper(type, CaeBlocks.TIME_CRYSTAL_BE.get(),
                (l, p, s, be) -> be.serverTick(l, p));
    }
}
