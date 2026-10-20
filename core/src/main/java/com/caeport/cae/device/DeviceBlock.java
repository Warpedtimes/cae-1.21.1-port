package com.caeport.cae.device;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.ItemInteractionResult;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.context.BlockPlaceContext;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.BaseEntityBlock;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Mirror;
import net.minecraft.world.level.block.RenderShape;
import net.minecraft.world.level.block.Rotation;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.entity.BlockEntityTicker;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.block.state.properties.BooleanProperty;
import net.minecraft.world.level.block.state.properties.DirectionProperty;
import net.minecraft.world.phys.BlockHitResult;
import net.neoforged.neoforge.fluids.FluidUtil;
import org.jetbrains.annotations.Nullable;

/**
 * The block of a Thermal device: the {@code active} state the screens and models switch on (the id of Thermal's
 * BlockStatePropertiesCoFH.ACTIVE), a block entity that ticks on the server, and the clicks Thermal's tile blocks handled:
 * an augment goes in, a fluid container fills or empties, sneaking opens the filter, otherwise the menu.
 *
 * <p>{@code facing} is the same property KubeJS' cardinal blocks had (the face with the front texture looks at the player
 * who placed it), so devices placed by the old scripts keep their direction.
 */
public class DeviceBlock extends BaseEntityBlock {
    public static final MapCodec<DeviceBlock> CODEC = simpleCodec(p -> {
        throw new UnsupportedOperationException("devices are not built from codecs");
    });
    public static final BooleanProperty ACTIVE = BooleanProperty.create("active");
    public static final DirectionProperty FACING = BlockStateProperties.HORIZONTAL_FACING;

    private final ResourceLocation typeId;
    private BlockEntityType<? extends DeviceBE> type;

    public DeviceBlock(Properties properties, ResourceLocation typeId) {
        super(properties);
        this.typeId = typeId;
        registerDefaultState(defaultBlockState().setValue(ACTIVE, false));
    }

    @Override
    protected MapCodec<? extends BaseEntityBlock> codec() {
        return CODEC;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        builder.add(ACTIVE);
    }

    @SuppressWarnings("unchecked")
    protected BlockEntityType<? extends DeviceBE> type() {
        if (type == null) {
            type = (BlockEntityType<? extends DeviceBE>) BuiltInRegistries.BLOCK_ENTITY_TYPE.get(typeId);
        }
        return type;
    }

    @Override
    public @Nullable BlockEntity newBlockEntity(BlockPos pos, BlockState state) {
        return type().create(pos, state);
    }

    @Override
    @SuppressWarnings("unchecked")
    public @Nullable <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> given) {
        if (level.isClientSide || given != type()) {
            return null;
        }
        return (BlockEntityTicker<T>) (BlockEntityTicker<DeviceBE>) (l, p, s, be) -> be.tickServer();
    }

    @Override
    protected RenderShape getRenderShape(BlockState state) {
        return RenderShape.MODEL;
    }

    @Override
    protected ItemInteractionResult useItemOn(ItemStack held, BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit) {
        if (!(level.getBlockEntity(pos) instanceof DeviceBE be)) {
            return ItemInteractionResult.PASS_TO_DEFAULT_BLOCK_INTERACTION;
        }
        if (level.isClientSide) {
            // an augment or something that holds fluid is used up by the device; the server decides
            boolean mine = held.getItem() instanceof AugmentItem || (!be.tanks().isEmpty() && FluidUtil.getFluidHandler(held).isPresent());
            return mine ? ItemInteractionResult.SUCCESS : ItemInteractionResult.PASS_TO_DEFAULT_BLOCK_INTERACTION;
        }
        if (player instanceof ServerPlayer sp && be.onItemUse(sp, hand, held)) {
            return ItemInteractionResult.SUCCESS;
        }
        return ItemInteractionResult.PASS_TO_DEFAULT_BLOCK_INTERACTION;
    }

    @Override
    protected InteractionResult useWithoutItem(BlockState state, Level level, BlockPos pos, Player player, BlockHitResult hit) {
        if (level.isClientSide) {
            return InteractionResult.SUCCESS;
        }
        if (level.getBlockEntity(pos) instanceof DeviceBE be && player instanceof ServerPlayer sp) {
            if (sp.isShiftKeyDown() && be.openFilterMenu(sp)) {
                return InteractionResult.SUCCESS;
            }
            if (be.canOpenGui()) {
                sp.openMenu(be, be::writeMenuTarget);
                return InteractionResult.SUCCESS;
            }
        }
        return InteractionResult.PASS;
    }

    @Override
    protected void neighborChanged(BlockState state, Level level, BlockPos pos, Block block, BlockPos from, boolean moving) {
        if (level.getBlockEntity(pos) instanceof DeviceBE be) {
            be.neighborChanged();
        }
        super.neighborChanged(state, level, pos, block, from, moving);
    }

    @Override
    public void setPlacedBy(Level level, BlockPos pos, BlockState state, @Nullable LivingEntity placer, ItemStack stack) {
        super.setPlacedBy(level, pos, state, placer, stack);
        if (level.getBlockEntity(pos) instanceof DeviceBE be) {
            be.onPlaced(placer);
        }
    }

    @Override
    protected void onRemove(BlockState state, Level level, BlockPos pos, BlockState newState, boolean moving) {
        if (!state.is(newState.getBlock()) && level.getBlockEntity(pos) instanceof DeviceBE be) {
            be.dropContents(level, pos);
        }
        super.onRemove(state, level, pos, newState, moving);
    }

    /** A device whose front looks at the player who placed it (Thermal's TileBlockActive4Way). */
    public static class Facing extends DeviceBlock {
        public Facing(Properties properties, ResourceLocation typeId) {
            super(properties, typeId);
            registerDefaultState(defaultBlockState().setValue(FACING, Direction.NORTH));
        }

        @Override
        protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
            builder.add(FACING, ACTIVE);
        }

        @Override
        public BlockState getStateForPlacement(BlockPlaceContext context) {
            return defaultBlockState().setValue(FACING, context.getPlayer() != null ? context.getPlayer().getDirection().getOpposite() : Direction.NORTH);
        }

        @Override
        protected BlockState rotate(BlockState state, Rotation rotation) {
            return state.setValue(FACING, rotation.rotate(state.getValue(FACING)));
        }

        @Override
        protected BlockState mirror(BlockState state, Mirror mirror) {
            return state.rotate(mirror.getRotation(state.getValue(FACING)));
        }
    }

    /** The Batch Composter: no facing, and the fill level of the compost inside (BlockStateProperties.LEVEL_COMPOSTER). */
    public static class Composter extends DeviceBlock {
        public static final net.minecraft.world.level.block.state.properties.IntegerProperty LEVEL = BlockStateProperties.LEVEL_COMPOSTER;

        public Composter(Properties properties, ResourceLocation typeId) {
            super(properties, typeId);
            registerDefaultState(defaultBlockState().setValue(LEVEL, 0));
        }

        @Override
        protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
            builder.add(ACTIVE, LEVEL);
        }
    }
}
