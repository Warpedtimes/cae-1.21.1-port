package com.caeport.cae.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.Direction;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.block.state.properties.DirectionProperty;
import net.minecraft.world.level.block.state.properties.EnumProperty;
import net.minecraft.world.level.block.state.properties.Half;
import net.minecraft.world.level.block.state.properties.IntegerProperty;

/** A vein the singularity core grows; it points away from the core and thickens through {@link #STAGE}. */
public class SingularityVeinBlock extends Block {
    public static final MapCodec<SingularityVeinBlock> CODEC = simpleCodec(SingularityVeinBlock::new);
    public static final IntegerProperty STAGE = IntegerProperty.create("stage", 0, 15);
    public static final DirectionProperty FACING = BlockStateProperties.FACING;
    public static final EnumProperty<Half> HALF = BlockStateProperties.HALF;

    public SingularityVeinBlock(Properties properties) {
        super(properties);
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        builder.add(FACING, STAGE, HALF);
    }

    public BlockState vein(Direction facing, int stage) {
        return defaultBlockState().setValue(FACING, facing).setValue(HALF, Half.BOTTOM).setValue(STAGE, stage);
    }
}
