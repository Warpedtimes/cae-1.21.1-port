package com.caeport.cae.block;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mojang.serialization.Codec;
import com.mojang.serialization.MapCodec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.world.item.context.BlockPlaceContext;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Mirror;
import net.minecraft.world.level.block.Rotation;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.material.MapColor;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.AttachFace;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.block.state.properties.DirectionProperty;
import net.minecraft.world.level.block.state.properties.EnumProperty;
import net.minecraft.world.phys.shapes.BooleanOp;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.Shapes;
import net.minecraft.world.phys.shapes.VoxelShape;

import java.util.HashMap;
import java.util.Map;

/**
 * The shape-carrying blocks of the 1.18.2 structure rooms that KubeJS's block builders can't express: Dave's Building
 * Extended helmets, vents and boilers (their outline turns with a 6-way facing, an attach face or an axis), Dustrial
 * Decor's hook and large chains. The pack's startup script (restoredBlocks.js) registers them with createCustom under
 * the old IDs, with a JSON spec of the boxes the 1.18.2 mod gave each block state:
 * {"props": {...}, "shapes": {"<state key>": {"add": [[x0,y0,z0,x1,y1,z1], ...], "sub": [[...], ...]}, "*": <fallback>}}.
 * Boxes are in pixels; the shape is the union of "add" minus the union of "sub". Keys: the facing name ("north", "up"),
 * the axis ("y"), "<face>:<facing>" ("floor:north") or "*". Collision and outline are the same shape, as in the mod;
 * "props" (see {@link #configure}) says whether the block has any.
 */
public abstract class RestoredShapeBlock extends Block {
    private final Map<String, VoxelShape> shapes = new HashMap<>();
    private final VoxelShape fallback;

    protected RestoredShapeBlock(Properties properties, String spec) {
        super(configure(properties, spec));
        JsonObject root = JsonParser.parseString(spec).getAsJsonObject().getAsJsonObject("shapes");
        VoxelShape any = Shapes.block();
        for (Map.Entry<String, JsonElement> e : root.entrySet()) {
            VoxelShape s = build(e.getValue().getAsJsonObject());
            if (e.getKey().equals("*")) {
                any = s;
            } else {
                shapes.put(e.getKey(), s);
            }
        }
        this.fallback = any;
    }

    /**
     * The "props" part of the spec: {"hardness": 3, "resistance": 6, "light": 0, "nocol": true, "tool": true,
     * "sound": "METAL" (a SoundType field), "map": "METAL" (a MapColor field), "occlude": false}.
     */
    private static Properties configure(Properties p, String spec) {
        JsonObject o = JsonParser.parseString(spec).getAsJsonObject();
        if (!o.has("props")) {
            return p;
        }
        JsonObject c = o.getAsJsonObject("props");
        if (c.has("map")) {
            p = p.mapColor(field(MapColor.class, c.get("map").getAsString(), MapColor.class));
        }
        if (c.has("sound")) {
            p = p.sound(field(SoundType.class, c.get("sound").getAsString(), SoundType.class));
        }
        if (c.has("hardness")) {
            p = p.strength((float) c.get("hardness").getAsDouble(),
                    (float) (c.has("resistance") ? c.get("resistance").getAsDouble() : c.get("hardness").getAsDouble()));
        }
        if (c.has("light") && c.get("light").getAsInt() > 0) {
            int light = c.get("light").getAsInt();
            p = p.lightLevel(s -> light);
        }
        if (c.has("nocol") && c.get("nocol").getAsBoolean()) {
            p = p.noCollission();
        }
        if (c.has("tool")) {
            if (c.get("tool").getAsBoolean()) {
                p = p.requiresCorrectToolForDrops();
            } else {
                // the base block's properties are copied; Properties has no way to take the requirement off again
                try {
                    java.lang.reflect.Field f = Properties.class.getDeclaredField("requiresCorrectToolForDrops");
                    f.setAccessible(true);
                    f.setBoolean(p, false);
                } catch (ReflectiveOperationException | RuntimeException e) {
                    // keeps the base block's requirement: a pickaxe is needed for the drop, nothing else changes
                }
            }
        }
        if (!c.has("occlude") || !c.get("occlude").getAsBoolean()) {
            p = p.noOcclusion();
        }
        return p;
    }

    private static <T> T field(Class<?> owner, String name, Class<T> type) {
        try {
            return type.cast(owner.getField(name).get(null));
        } catch (ReflectiveOperationException e) {
            throw new IllegalArgumentException("no " + owner.getSimpleName() + "." + name, e);
        }
    }

    private static VoxelShape build(JsonObject o) {
        VoxelShape add = union(o.getAsJsonArray("add"));
        VoxelShape sub = o.has("sub") ? union(o.getAsJsonArray("sub")) : Shapes.empty();
        return Shapes.join(add, sub, BooleanOp.ONLY_FIRST).optimize();
    }

    private static VoxelShape union(JsonArray boxes) {
        VoxelShape out = Shapes.empty();
        for (JsonElement b : boxes) {
            JsonArray a = b.getAsJsonArray();
            out = Shapes.or(out, Block.box(a.get(0).getAsDouble(), a.get(1).getAsDouble(), a.get(2).getAsDouble(),
                    a.get(3).getAsDouble(), a.get(4).getAsDouble(), a.get(5).getAsDouble()));
        }
        return out;
    }

    /** the key of a state in the spec */
    protected abstract String key(BlockState state);

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext context) {
        return shapes.getOrDefault(key(state), fallback);
    }

    @Override
    protected boolean propagatesSkylightDown(BlockState state, BlockGetter level, BlockPos pos) {
        return true;
    }

    protected static MapCodec<? extends Block> codecOf(java.util.function.BiFunction<Properties, String, Block> make) {
        return RecordCodecBuilder.mapCodec(i -> i.group(propertiesCodec(), Codec.STRING.fieldOf("spec").forGetter(b -> "{}"))
                .apply(i, make));
    }

    /** a horizontal facing (four values), placed facing the player */
    public static class Facing4 extends RestoredShapeBlock {
        public static final DirectionProperty FACING = BlockStateProperties.HORIZONTAL_FACING;
        public static final MapCodec<? extends Block> CODEC = codecOf(Facing4::new);

        public Facing4(Properties properties, String spec) {
            super(properties, spec);
            registerDefaultState(stateDefinition.any().setValue(FACING, Direction.NORTH));
        }

        @Override
        protected MapCodec<? extends Block> codec() {
            return CODEC;
        }

        @Override
        protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
            builder.add(FACING);
        }

        @Override
        public BlockState getStateForPlacement(BlockPlaceContext context) {
            return defaultBlockState().setValue(FACING, context.getHorizontalDirection().getOpposite());
        }

        @Override
        protected BlockState rotate(BlockState state, Rotation rot) {
            return state.setValue(FACING, rot.rotate(state.getValue(FACING)));
        }

        @Override
        protected BlockState mirror(BlockState state, Mirror mirror) {
            return state.rotate(mirror.getRotation(state.getValue(FACING)));
        }

        @Override
        protected String key(BlockState state) {
            return state.getValue(FACING).getSerializedName();
        }
    }

    /** a facing over all six directions (helmets, straight vents), placed against the clicked face */
    public static class Facing6 extends RestoredShapeBlock {
        public static final DirectionProperty FACING = BlockStateProperties.FACING;
        public static final MapCodec<? extends Block> CODEC = codecOf(Facing6::new);

        public Facing6(Properties properties, String spec) {
            super(properties, spec);
            registerDefaultState(stateDefinition.any().setValue(FACING, Direction.NORTH));
        }

        @Override
        protected MapCodec<? extends Block> codec() {
            return CODEC;
        }

        @Override
        protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
            builder.add(FACING);
        }

        @Override
        public BlockState getStateForPlacement(BlockPlaceContext context) {
            return defaultBlockState().setValue(FACING, context.getClickedFace());
        }

        @Override
        protected BlockState rotate(BlockState state, Rotation rot) {
            return state.setValue(FACING, rot.rotate(state.getValue(FACING)));
        }

        @Override
        protected BlockState mirror(BlockState state, Mirror mirror) {
            return state.rotate(mirror.getRotation(state.getValue(FACING)));
        }

        @Override
        protected String key(BlockState state) {
            return state.getValue(FACING).getSerializedName();
        }
    }

    /** an axis (boilers, large chains) */
    public static class AxisBlock extends RestoredShapeBlock {
        public static final EnumProperty<Direction.Axis> AXIS = BlockStateProperties.AXIS;
        public static final MapCodec<? extends Block> CODEC = codecOf(AxisBlock::new);

        public AxisBlock(Properties properties, String spec) {
            super(properties, spec);
            registerDefaultState(stateDefinition.any().setValue(AXIS, Direction.Axis.Y));
        }

        @Override
        protected MapCodec<? extends Block> codec() {
            return CODEC;
        }

        @Override
        protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
            builder.add(AXIS);
        }

        @Override
        public BlockState getStateForPlacement(BlockPlaceContext context) {
            return defaultBlockState().setValue(AXIS, context.getClickedFace().getAxis());
        }

        @Override
        protected BlockState rotate(BlockState state, Rotation rot) {
            if (rot == Rotation.CLOCKWISE_90 || rot == Rotation.COUNTERCLOCKWISE_90) {
                switch (state.getValue(AXIS)) {
                    case X:
                        return state.setValue(AXIS, Direction.Axis.Z);
                    case Z:
                        return state.setValue(AXIS, Direction.Axis.X);
                    default:
                        return state;
                }
            }
            return state;
        }

        @Override
        protected String key(BlockState state) {
            return state.getValue(AXIS).getSerializedName();
        }
    }

    /** an attach face and a horizontal facing (the vent with an upward branch) */
    public static class FaceFacing extends RestoredShapeBlock {
        public static final EnumProperty<AttachFace> FACE = BlockStateProperties.ATTACH_FACE;
        public static final DirectionProperty FACING = BlockStateProperties.HORIZONTAL_FACING;
        public static final MapCodec<? extends Block> CODEC = codecOf(FaceFacing::new);

        public FaceFacing(Properties properties, String spec) {
            super(properties, spec);
            registerDefaultState(stateDefinition.any().setValue(FACE, AttachFace.WALL).setValue(FACING, Direction.NORTH));
        }

        @Override
        protected MapCodec<? extends Block> codec() {
            return CODEC;
        }

        @Override
        protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
            builder.add(FACE, FACING);
        }

        @Override
        public BlockState getStateForPlacement(BlockPlaceContext context) {
            Direction look = context.getNearestLookingDirection();
            AttachFace face = look == Direction.UP ? AttachFace.CEILING : look == Direction.DOWN ? AttachFace.FLOOR : AttachFace.WALL;
            return defaultBlockState().setValue(FACE, face).setValue(FACING, context.getHorizontalDirection().getOpposite());
        }

        @Override
        protected BlockState rotate(BlockState state, Rotation rot) {
            return state.setValue(FACING, rot.rotate(state.getValue(FACING)));
        }

        @Override
        protected BlockState mirror(BlockState state, Mirror mirror) {
            return state.rotate(mirror.getRotation(state.getValue(FACING)));
        }

        @Override
        protected String key(BlockState state) {
            return state.getValue(FACE).getSerializedName() + ":" + state.getValue(FACING).getSerializedName();
        }
    }

    /** no state at all (the hook): it needs a solid block, or a large chain, above it */
    public static class Plain extends RestoredShapeBlock {
        public static final MapCodec<? extends Block> CODEC = codecOf(Plain::new);

        public Plain(Properties properties, String spec) {
            super(properties, spec);
        }

        @Override
        protected MapCodec<? extends Block> codec() {
            return CODEC;
        }

        @Override
        protected boolean canSurvive(BlockState state, LevelReader level, BlockPos pos) {
            BlockState above = level.getBlockState(pos.above());
            return above.isFaceSturdy(level, pos.above(), Direction.DOWN) || above.getBlock() instanceof AxisBlock;
        }

        @Override
        protected BlockState updateShape(BlockState state, Direction direction, BlockState neighbor,
                                         net.minecraft.world.level.LevelAccessor level, BlockPos pos, BlockPos neighborPos) {
            return canSurvive(state, level, pos) ? state : net.minecraft.world.level.block.Blocks.AIR.defaultBlockState();
        }

        @Override
        protected String key(BlockState state) {
            return "*";
        }
    }
}
