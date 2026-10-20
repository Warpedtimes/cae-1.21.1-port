package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.RandomSource;
import net.minecraft.world.item.context.UseOnContext;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.block.AttachedStemBlock;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.BushBlock;
import net.minecraft.world.level.block.CropBlock;
import net.minecraft.world.level.block.FenceGateBlock;
import net.minecraft.world.level.block.piston.MovingPistonBlock;
import net.minecraft.world.level.block.StemBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.IntegerProperty;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;
import net.neoforged.neoforge.common.ItemAbilities;
import net.neoforged.neoforge.common.ItemAbility;
import net.neoforged.neoforge.common.util.TriState;
import org.jetbrains.annotations.Nullable;

import java.util.function.Supplier;

/**
 * Phyto-Soil, the dirt Phytogro makes (Thermal Cultivation's {@code phytosoil} / {@code phytosoil_tilled}, with Thermal Foundation's
 * ChargedSoilBlock logic): it roughly doubles the growth of what stands on it, and a {@code charged} level from 0 to 4, which the
 * Phyto-Soil Infuser raises, adds that many more growth ticks per random tick, using one charge up now and then. Crops need the tilled
 * kind; it does not need water and cannot be trampled.
 */
public class PhytoSoilBlock extends Block {
    public static final IntegerProperty CHARGED = IntegerProperty.create("charged", 0, 4);
    protected static final VoxelShape SHAPE_TILLED = Block.box(0.0, 0.0, 0.0, 16.0, 15.0, 16.0);

    protected final boolean tilled;
    protected final Supplier<Block> otherBlock;

    public PhytoSoilBlock(Properties properties, boolean tilled, Supplier<Block> otherBlock) {
        super(properties);
        this.tilled = tilled;
        this.otherBlock = otherBlock;
        registerDefaultState(defaultBlockState().setValue(CHARGED, 0));
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        builder.add(CHARGED);
    }

    @Override
    protected boolean isRandomlyTicking(BlockState state) {
        return true;
    }

    @Override
    protected void randomTick(BlockState state, ServerLevel level, BlockPos pos, RandomSource random) {
        BlockPos abovePos = pos.above();
        BlockState above = level.getBlockState(abovePos);
        if (above.isRandomlyTicking() && (above.getBlock() instanceof BushBlock || above.getBlock() instanceof CropBlock || above.getBlock() instanceof StemBlock)) {
            int charge = state.getValue(CHARGED);
            int boost = 1 + charge;
            for (int i = 0; i < boost; i++) {
                above.randomTick(level, abovePos, random);
            }
            if (random.nextInt(boost) > 0) {
                level.setBlock(pos, state.setValue(CHARGED, Math.max(0, charge - 1)), 2);
            }
        }
    }

    /** the Phyto-Soil Infuser's work: one more charge, or, when full, a growth tick of the crop above */
    public static void charge(BlockState state, Level level, BlockPos pos) {
        int charge = state.getValue(CHARGED);
        if (charge < 4) {
            level.setBlock(pos, state.setValue(CHARGED, charge + 1), 2);
        } else if (level instanceof ServerLevel sl) {
            state.randomTick(sl, pos, sl.random);
        }
    }

    @Override
    public TriState canSustainPlant(BlockState state, BlockGetter level, BlockPos pos, Direction facing, BlockState plant) {
        Block p = plant.getBlock();
        if (p instanceof AttachedStemBlock) {
            return TriState.TRUE;
        }
        if (p instanceof CropBlock || p instanceof StemBlock) {
            return tilled ? TriState.TRUE : TriState.FALSE;
        }
        if (p instanceof BushBlock) {
            return tilled ? TriState.FALSE : TriState.TRUE;
        }
        return TriState.DEFAULT;
    }

    @Override
    public boolean isFertile(BlockState state, BlockGetter level, BlockPos pos) {
        return true;
    }

    @Override
    public @Nullable BlockState getToolModifiedState(BlockState state, UseOnContext context, ItemAbility ability, boolean simulate) {
        if (!tilled && ability == ItemAbilities.HOE_TILL && context.getLevel().getBlockState(context.getClickedPos().above()).isAir()) {
            return otherBlock.get().defaultBlockState().setValue(CHARGED, state.getValue(CHARGED));
        }
        return null;
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext context) {
        return tilled ? SHAPE_TILLED : Shapes_block();
    }

    private static VoxelShape Shapes_block() {
        return net.minecraft.world.phys.shapes.Shapes.block();
    }

    @Override
    protected void neighborChanged(BlockState state, Level level, BlockPos pos, Block block, BlockPos from, boolean moving) {
        if (tilled && !state.canSurvive(level, pos)) {
            level.setBlockAndUpdate(pos, Block.pushEntitiesUp(state, otherBlock.get().defaultBlockState().setValue(CHARGED, state.getValue(CHARGED)), level, pos));
        }
        super.neighborChanged(state, level, pos, block, from, moving);
    }

    @Override
    protected boolean canSurvive(BlockState state, LevelReader level, BlockPos pos) {
        if (!tilled) {
            return true;
        }
        BlockState above = level.getBlockState(pos.above());
        return !above.isSolid() || above.getBlock() instanceof FenceGateBlock || above.getBlock() instanceof MovingPistonBlock;
    }

    @Override
    protected boolean useShapeForLightOcclusion(BlockState state) {
        return tilled;
    }

    @Override
    protected boolean isPathfindable(BlockState state, net.minecraft.world.level.pathfinder.PathComputationType type) {
        return !tilled;
    }

    public static ItemStack asItem(Block b) {
        return new ItemStack(b);
    }

    @SuppressWarnings("unused")
    private static Block dirt() {
        return Blocks.DIRT;
    }
}
