package com.caeport.cae.heater;

import com.simibubi.create.content.processing.burner.BlazeBurnerBlock;
import com.simibubi.create.content.processing.burner.BlazeBurnerBlock.HeatLevel;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.EntityBlock;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.entity.BlockEntityTicker;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.phys.shapes.BooleanOp;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.Shapes;
import net.minecraft.world.phys.shapes.VoxelShape;
import org.jetbrains.annotations.Nullable;

import java.util.List;

/**
 * {@code compressedcreativity:heater} of Compressed Creativity 0.1.8 (1.18.2): takes heat from PneumaticCraft heat
 * pipes and machines and shows it as a Blaze Burner heat level, which Create's boilers, steam engines and basins read.
 */
public class HeaterBlock extends Block implements EntityBlock {
    /** The original's {@code CCShapes.HEATER_SHAPE}, box by box. */
    private static final VoxelShape SHAPE = box(0.0625, 0.875, 0.0625, 0.9375, 1.0, 0.9375,
            0.125, 0.125, 0.125, 0.875, 0.875, 0.875,
            0.25, 0.25, 0.0, 0.75, 0.75, 0.125,
            0.25, 0.0, 0.25, 0.75, 0.125, 0.75,
            0.25, 0.25, 0.875, 0.75, 0.75, 1.0,
            0.0, 0.25, 0.25, 0.125, 0.75, 0.75,
            0.875, 0.25, 0.25, 1.0, 0.75, 0.75);

    private static VoxelShape box(double... c) {
        VoxelShape shape = Shapes.empty();
        for (int i = 0; i < c.length; i += 6) {
            shape = Shapes.join(shape, Shapes.box(c[i], c[i + 1], c[i + 2], c[i + 3], c[i + 4], c[i + 5]), BooleanOp.OR);
        }
        return shape;
    }

    public HeaterBlock(Properties properties) {
        super(properties);
        registerDefaultState(defaultBlockState().setValue(BlazeBurnerBlock.HEAT_LEVEL, HeatLevel.NONE));
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        builder.add(BlazeBurnerBlock.HEAT_LEVEL);
        super.createBlockStateDefinition(builder);
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext context) {
        return SHAPE;
    }

    @Nullable
    @Override
    public BlockEntity newBlockEntity(BlockPos pos, BlockState state) {
        return new HeaterBlockEntity(pos, state);
    }

    @Nullable
    @Override
    public <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> type) {
        if (type != HeaterRegistry.HEATER_BE.get()) {
            return null;
        }
        return (lvl, pos, st, be) -> ((HeaterBlockEntity) be).tick();
    }

    // audit 5 C-4: NeoForge only calls onNeighborChange for comparator updates, so lava, magma or fire placed next to the
    // heater after its first tick was never taken into its heat hull; a block update does it now
    @Override
    protected void neighborChanged(BlockState state, Level level, BlockPos pos, Block neighborBlock, BlockPos neighborPos, boolean movedByPiston) {
        super.neighborChanged(state, level, pos, neighborBlock, neighborPos, movedByPiston);
        if (level.getBlockEntity(pos) instanceof HeaterBlockEntity heater) {
            heater.updateHeatExchanger();
        }
    }

    @Override
    public void onNeighborChange(BlockState state, LevelReader level, BlockPos pos, BlockPos neighbor) {
        super.onNeighborChange(state, level, pos, neighbor);
        if (level.getBlockEntity(pos) instanceof HeaterBlockEntity heater) {
            heater.updateHeatExchanger();
        }
    }

    @Override
    public void appendHoverText(ItemStack stack, Item.TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, tooltip, flag);
    }
}
