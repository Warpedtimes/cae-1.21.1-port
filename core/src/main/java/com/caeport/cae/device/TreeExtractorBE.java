package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BlockTags;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.LeavesBlock;
import net.minecraft.world.level.block.RotatedPillarBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.neoforged.neoforge.common.Tags;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * The Arboreal Extractor (Thermal Foundation 9.2.2.58's DeviceTreeExtractorTile). It stands beside the foot of a tree
 * (three trunk blocks of a tree in the table, on ground), three leaf blocks of that tree in the 3x3 columns above it,
 * and every 500 ticks (more with other extractors on the same trunk) it adds the tree's fluid to its 8000 mB tank.
 * Bone meal, compost and Phytogro in its slot boost the output for a number of cycles.
 *
 * <p>Changes: the tree is also re-checked every second, so the window follows a cut or grown tree at once; trees that lean
 * (Biomes We've Gone's palms) and Integrated Dynamics' root logs work, as in the port before; the ground under the
 * trunk is judged by block tags (1.21 has no materials).
 */
public class TreeExtractorBE extends DeviceBE {
    protected static final int NUM_LEAVES = 3;
    /** ThermalDeviceConfig "Arboreal Extractor" time constant */
    public static int timeConstant = 500;
    /** Thermal's leaf mappings are non-persistent leaves only: leaves a player placed do not count */
    public static final boolean NATURAL_LEAVES_ONLY = true;

    /** item -> {output multiplier, cycles}: the tree_extractor_boost recipes (thermal:compost and thermal:phytogro are cae: items here) */
    private static Map<Item, float[]> boosts;

    private static synchronized Map<Item, float[]> boosts() {
        if (boosts == null) {
            Map<Item, float[]> m = new HashMap<>();
            m.put(Items.BONE_MEAL, new float[]{1.5F, 8});
            m.put(CaeDevices.item("compost"), new float[]{1.5F, 8});
            m.put(CaeDevices.item("phytogro"), new float[]{2.0F, 16});
            m.remove(Items.AIR);
            boosts = m;
        }
        return boosts;
    }

    public static boolean validBoost(ItemStack stack) {
        return boosts().containsKey(stack.getItem());
    }

    protected final int slotBoost;
    protected final DeviceTank tank;
    protected boolean valid;
    protected BlockPos trunkPos;
    protected int process = timeConstant / 2;
    protected int boostCycles;
    protected int boostMax = 8;
    protected float boostMult;
    private int recheck;

    public TreeExtractorBE(BlockPos pos, BlockState state) {
        super(CaeDevices.TREE_EXTRACTOR_BE.get(), pos, state);
        slotBoost = inv.getSlots();
        inv.add(DeviceInventory.Group.INPUT, s -> filter.valid(s) && validBoost(s));
        tank = addTank(8000, DeviceTank.Group.OUTPUT);
        addAugmentSlots();
        trunkPos = pos;
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "Fluid", "Filter");
    }

    @Override
    public String guiTexture() {
        return "tree_extractor";
    }

    @Override
    public GuiLayout layout() {
        return new GuiLayout().slot(slotBoost, 44, 35).tank(0, 116, 22).duration("scale_flame_green", 80, 35);
    }

    // ---------------------------------------------------------------------------------------------------------------
    // finding the tree
    // ---------------------------------------------------------------------------------------------------------------

    private record Found(BlockPos trunk, TreeTable.Row pick) {
    }

    private static boolean ground(BlockState s) {
        return s.is(BlockTags.DIRT) || s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(BlockTags.BASE_STONE_NETHER) || s.is(BlockTags.NYLIUM)
                || s.is(Tags.Blocks.STONES) || s.is(Tags.Blocks.COBBLESTONES) || s.is(Tags.Blocks.NETHERRACKS) || s.is(Tags.Blocks.END_STONES)
                || s.is(BlockTags.SAND) || s.is(Tags.Blocks.SANDS);
    }

    /** a block of the tree search; a position in a chunk that is not loaded is air (the climb of a leaning trunk can leave the chunk) */
    private BlockState st(BlockPos p) {
        return level.isLoaded(p) ? level.getBlockState(p) : net.minecraft.world.level.block.Blocks.AIR.defaultBlockState();
    }

    /** a trunk block of the table, standing upright (the mapping is for the log's default state) */
    private boolean trunkBlock(BlockPos p) {
        BlockState s = st(p);
        return TreeTable.isTrunk(s.getBlock()) && (!s.hasProperty(RotatedPillarBlock.AXIS) || s.getValue(RotatedPillarBlock.AXIS) == net.minecraft.core.Direction.Axis.Y);
    }

    private boolean trunkBase(BlockPos p) {
        return ground(st(p.below())) && trunkBlock(p) && trunkBlock(p.above()) && trunkBlock(p.above(2));
    }

    /** the trunk base this extractor works on: the block itself, or, when it is a one-block root log on the ground, the trunk base beside it */
    private BlockPos trunkFor(BlockPos p) {
        if (trunkBase(p)) {
            return p;
        }
        if (!trunkBlock(p) || !ground(st(p.below()))) {
            return null;
        }
        for (net.minecraft.core.Direction d : net.minecraft.core.Direction.Plane.HORIZONTAL) {
            BlockPos n = p.relative(d);
            if (trunkBase(n)) {
                return n;
            }
        }
        return null;
    }

    private boolean leafOk(BlockState s) {
        return !NATURAL_LEAVES_ONLY || !s.hasProperty(LeavesBlock.PERSISTENT) || !s.getValue(LeavesBlock.PERSISTENT);
    }

    private boolean isExtractor(BlockState s) {
        return s.getBlock() == getBlockState().getBlock();
    }

    private static final net.minecraft.core.Direction[] SIDES = {net.minecraft.core.Direction.WEST, net.minecraft.core.Direction.EAST,
            net.minecraft.core.Direction.NORTH, net.minecraft.core.Direction.SOUTH};

    private Found findStraight() {
        BlockPos trunk = null;
        for (net.minecraft.core.Direction d : SIDES) {
            BlockPos t = trunkFor(worldPosition.relative(d));
            if (t != null) {
                trunk = t;
                break;
            }
        }
        if (trunk == null) {
            return new Found(worldPosition, null);
        }
        Map<Block, TreeTable.Row> leaves = TreeTable.leavesOf(st(trunk).getBlock());
        int top = Math.min(level.getMaxBuildHeight() - worldPosition.getY(), 40);
        BlockPos[] hits = new BlockPos[NUM_LEAVES];
        int n = 0;
        // BlockPos iteration order: x fastest, then y, then z
        for (int dz = -1; dz <= 1 && n < NUM_LEAVES; dz++) {
            for (int dy = 0; dy <= top && n < NUM_LEAVES; dy++) {
                for (int dx = -1; dx <= 1 && n < NUM_LEAVES; dx++) {
                    BlockPos lp = worldPosition.offset(dx, dy, dz);
                    BlockState ls = st(lp);
                    if (leaves.containsKey(ls.getBlock()) && leafOk(ls)) {
                        hits[n++] = lp;
                    }
                }
            }
        }
        if (n < NUM_LEAVES) {
            return new Found(trunk, null);
        }
        int ly = hits[0].getY() - worldPosition.getY();
        // nothing that looks like ground inside the trunk column up to the first leaf
        for (int k = Math.min(0, ly); k <= Math.max(0, ly); k++) {
            if (ground(st(trunk.above(k)))) {
                return new Found(trunk, null);
            }
        }
        // and no other extractor above this one in its column
        for (int k = Math.min(1, ly); k <= Math.max(1, ly); k++) {
            if (isExtractor(st(worldPosition.above(k)))) {
                return new Found(trunk, null);
            }
        }
        return new Found(trunk, leaves.get(st(hits[0]).getBlock()));
    }

    /**
     * Leaning trunks: some trees (the palms of Biomes We've Gone) climb two blocks straight and then step sideways, so no column
     * holds three logs. This follows the trunk up from a log on the ground beside the extractor and, if it climbs at least three
     * logs, looks for the leaves around the top of the climb.
     */
    private Found findLeaning() {
        for (net.minecraft.core.Direction d : SIDES) {
            BlockPos base = worldPosition.relative(d);
            if (!trunkBlock(base) || !ground(st(base.below()))) {
                continue;
            }
            BlockPos cur = base;
            int length = 1;
            while (length < 40) {
                BlockPos next = null;
                if (trunkBlock(cur.above())) {
                    next = cur.above();
                } else {
                    for (int dx = -1; dx <= 1 && next == null; dx++) {
                        for (int dz = -1; dz <= 1 && next == null; dz++) {
                            if ((dx != 0 || dz != 0) && trunkBlock(cur.offset(dx, 1, dz))) {
                                next = cur.offset(dx, 1, dz);
                            }
                        }
                    }
                }
                if (next == null) {
                    break;
                }
                cur = next;
                length++;
            }
            if (length < 3) {
                continue;
            }
            Map<Block, TreeTable.Row> leaves = TreeTable.leavesOf(st(base).getBlock());
            BlockPos first = null;
            int n = 0;
            for (int dy = -3; dy <= 4 && n < NUM_LEAVES; dy++) {
                for (int dx = -2; dx <= 2 && n < NUM_LEAVES; dx++) {
                    for (int dz = -2; dz <= 2 && n < NUM_LEAVES; dz++) {
                        BlockPos lp = cur.offset(dx, dy, dz);
                        BlockState ls = st(lp);
                        if (leaves.containsKey(ls.getBlock()) && leafOk(ls)) {
                            if (first == null) {
                                first = lp;
                            }
                            n++;
                        }
                    }
                }
            }
            if (n >= NUM_LEAVES) {
                return new Found(base, leaves.get(st(first).getBlock()));
            }
        }
        return null;
    }

    private Found find() {
        Found f = findStraight();
        if (f.pick() == null) {
            Found lean = findLeaning();
            if (lean != null) {
                return lean;
            }
        }
        return f;
    }

    @Override
    protected void updateValidity() {
        if (level == null || level.isClientSide || !level.isAreaLoaded(worldPosition, 1)) {
            return;
        }
        Found f = find();
        valid = f.pick() != null;
        trunkPos = f.trunk() != null ? f.trunk() : worldPosition;
        if (valid) {
            FluidStack now = new FluidStack(f.pick().fluid(), f.pick().amount());
            if (!FluidStack.matches(now, renderFluid)) {
                renderFluid = now;
                syncClient();
            }
        }
        cached = true;
    }

    @Override
    protected boolean isValid() {
        return valid;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // working
    // ---------------------------------------------------------------------------------------------------------------

    protected int getTimeConstant() {
        int constant = timeConstant / 2;
        for (int dx = -1; dx <= 1; dx++) {
            for (int dz = -1; dz <= 1; dz++) {
                if (isExtractor(st(trunkPos.offset(dx, 0, dz)))) {
                    constant += timeConstant / 2;
                }
            }
        }
        return Math.max(timeConstant, Math.min(2 * timeConstant, constant));
    }

    @Override
    public void tickServer() {
        // the tree is looked at again every second (Thermal only did on a neighbour change and at the end of a cycle)
        if (++recheck >= 20) {
            recheck = 0;
            updateValidity();
        }
        updateActiveState();
        process--;
        if (process <= 0) {
            updateValidity();
            process = getTimeConstant();
            if (isActive && valid) {
                if (boostCycles > 0) {
                    boostCycles--;
                } else if (!inv.isEmpty(slotBoost) && boosts().get(inv.getStackInSlot(slotBoost).getItem()) != null) { // 1211: null guard (legacy loads, /item)
                    float[] b = boosts().get(inv.getStackInSlot(slotBoost).getItem());
                    boostCycles = (int) b[1];
                    boostMax = boostCycles;
                    boostMult = b[0];
                    inv.consume(slotBoost, 1);
                } else {
                    boostCycles = 0;
                    boostMult = 1.0F;
                }
                tank.fill(renderFluid.copyWithAmount((int) (renderFluid.getAmount() * baseMod * boostMult)), IFluidHandler.FluidAction.EXECUTE);
            }
        }
    }

    @Override
    public int getScaledDuration(int scale) {
        return isActive && boostCycles > 0 && boostMax > 0 ? scale * boostCycles / boostMax : 0;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // saving
    // ---------------------------------------------------------------------------------------------------------------

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putInt("Proc", process);
        tag.putInt("BoostCycles", boostCycles);
        tag.putInt("BoostMax", boostMax);
        tag.putFloat("BoostMult", boostMult);
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        process = tag.getInt("Proc");
        boostCycles = tag.getInt("BoostCycles");
        boostMax = tag.getInt("BoostMax");
        boostMult = tag.getFloat("BoostMult");
    }

    @Override
    protected void loadLegacyAttachments(HolderLookup.Provider registries, CompoundTag attachments) {
        inv.loadLegacy(registries, attachments.get("boost"), slotBoost, 1);
        legacyTank(registries, attachments, "tank", tank);
    }

    @Override
    protected void loadLegacyData(CompoundTag data) {
        process = data.contains("process") ? data.getInt("process") : timeConstant / 2;
        boostCycles = data.getInt("boostCycles");
        boostMax = 8;
        boostMult = data.contains("boostMult") ? data.getFloat("boostMult") : 1.0F;
        // the first KubeJS version kept bone meal as a count, not an item
        int stock = data.getInt("boostStock");
        if (stock > 0 && inv.isEmpty(slotBoost)) {
            inv.slot(slotBoost).stack = new ItemStack(Items.BONE_MEAL, Math.min(stock, 64));
        }
    }

    @Override
    public void writeGui(RegistryFriendlyByteBuf buf) {
        super.writeGui(buf);
        buf.writeInt(boostCycles);
        buf.writeInt(boostMax);
    }

    @Override
    public void readGui(RegistryFriendlyByteBuf buf) {
        super.readGui(buf);
        boostCycles = buf.readInt();
        boostMax = buf.readInt();
    }

    public static ResourceLocation idOf(Item i) {
        return BuiltInRegistries.ITEM.getKey(i);
    }

    // for scripts and tests
    public int process() {
        return process;
    }

    public void setProcess(int p) {
        process = p;
    }

    public boolean valid() {
        return valid;
    }

    public int boostCycles() {
        return boostCycles;
    }
}
