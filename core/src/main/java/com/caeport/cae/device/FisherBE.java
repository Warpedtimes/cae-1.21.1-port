package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.tags.BiomeTags;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.material.Fluids;
import net.minecraft.world.level.storage.loot.LootParams;
import net.minecraft.world.level.storage.loot.LootTable;
import net.minecraft.world.level.storage.loot.parameters.LootContextParamSets;
import net.minecraft.world.level.storage.loot.parameters.LootContextParams;
import net.minecraft.world.phys.Vec3;
import net.neoforged.neoforge.items.IItemHandler;
import org.jetbrains.annotations.Nullable;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * The Aquatic Entangler (Thermal Foundation 9.2.2.58's DeviceFisherTile): it must face water (the block in front a water source
 * and at least 7 of the 3x3 blocks two in front), and every so often rolls the fishing loot table into its 15 output slots. Bait
 * in its slot changes the table and the yield. Hoppers fill the bait slot and empty the outputs.
 */
public class FisherBE extends DeviceBE {
    /** ThermalDeviceConfig "Fisher": Time Constant, Water Source Time Constant Reduction, Particles */
    public static int timeConstant = 4800;
    public static int timeReductionWater = 20;
    public static boolean particles = true;
    protected static final int BASE_RADIUS = 2;

    /** bait: loot table, output mod, use chance (thermal:fisher_boost) */
    private record Bait(ResourceLocation table, float outputMod, float useChance) {
    }

    private static Map<Item, Bait> baits;

    private static synchronized Map<Item, Bait> baits() {
        if (baits == null) {
            Map<Item, Bait> m = new HashMap<>();
            m.put(CaeDevices.item("aquachow"), new Bait(ResourceLocation.withDefaultNamespace("gameplay/fishing"), 1.5F, 0.5F));
            m.put(CaeDevices.item("deep_aquachow"), new Bait(ResourceLocation.fromNamespaceAndPath("cae", "gameplay/fishing/deep"), 1.75F, 0.4F));
            m.put(CaeDevices.item("junk_net"), new Bait(ResourceLocation.withDefaultNamespace("gameplay/fishing/junk"), 1.0F, 0.0F));
            m.remove(net.minecraft.world.item.Items.AIR);
            baits = m;
        }
        return baits;
    }

    public static boolean validBait(ItemStack stack) {
        return baits().containsKey(stack.getItem());
    }

    protected final int slotBait;
    protected final int slotOutFirst;
    protected boolean valid;
    protected int radius = BASE_RADIUS;
    protected int process = timeConstant / 2;

    public FisherBE(BlockPos pos, BlockState state) {
        super(CaeDevices.FISHER_BE.get(), pos, state);
        slotBait = inv.getSlots();
        inv.add(DeviceInventory.Group.INPUT, FisherBE::validBait);
        slotOutFirst = inv.getSlots();
        for (int i = 0; i < 15; i++) {
            inv.add(DeviceInventory.Group.OUTPUT);
        }
        xpCapable = true;
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "Area", "Filter");
    }

    @Override
    public String guiTexture() {
        return "fisher";
    }

    @Override
    public GuiLayout layout() {
        GuiLayout l = new GuiLayout().slot(slotBait, 26, 35);
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 5; j++) {
                l.outSlot(slotOutFirst + j + i * 5, 62 + j * 18, 17 + i * 18);
            }
        }
        return l;
    }

    @Override
    protected boolean automationExtractsInputs() {
        return false;
    }

    @Override
    protected void resetAttributes() {
        super.resetAttributes();
    }

    @Override
    protected void finalizeAttributes() {
        super.finalizeAttributes();
        radius = BASE_RADIUS + radiusBonus;
    }

    private Direction facing() {
        BlockState st = getBlockState();
        return st.hasProperty(DeviceBlock.FACING) ? st.getValue(DeviceBlock.FACING) : Direction.NORTH;
    }

    private boolean waterSource(BlockPos p) {
        return level.getFluidState(p).getType() == Fluids.WATER;
    }

    @Override
    protected void updateValidity() {
        if (level == null || level.isClientSide || !level.isAreaLoaded(worldPosition, 1 + radius)) {
            return;
        }
        valid = false;
        Direction f = facing();
        if (waterSource(worldPosition.relative(f))) {
            BlockPos area = worldPosition.relative(f, 2);
            int water = 0;
            for (int dx = -1; dx <= 1; dx++) {
                for (int dz = -1; dz <= 1; dz++) {
                    if (waterSource(area.offset(dx, 0, dz))) {
                        water++;
                    }
                }
            }
            valid = water >= 7;
        }
        cached = true;
    }

    @Override
    protected void updateActiveState() {
        if (!cached) {
            boolean was = valid;
            updateValidity();
            if (!was && valid) {
                process = Math.max(minTime(), level.random.nextInt(getTimeConstant()));
            }
        }
        super.updateActiveState();
    }

    @Override
    protected boolean isValid() {
        return valid;
    }

    private static int minTime() {
        return timeConstant / 20;
    }

    protected int getTimeConstant() {
        if (level == null) {
            return timeConstant / 2;
        }
        int constant = timeConstant;
        BlockPos area = worldPosition.relative(facing(), radius);
        for (BlockPos p : BlockPos.betweenClosed(area.offset(-radius, 1 - radius, -radius), area.offset(radius, radius - 1, radius))) {
            if (waterSource(p)) {
                constant -= timeReductionWater;
            }
        }
        if (level.getBiome(worldPosition).is(BiomeTags.IS_OCEAN)) {
            constant /= 3;
        }
        if (level.getBiome(worldPosition).is(BiomeTags.IS_RIVER)) {
            constant /= 2;
        }
        if (level.isRainingAt(worldPosition)) {
            constant /= 2;
        }
        if (inv.isEmpty(slotBait)) {
            constant *= 2;
        }
        return Math.max(timeConstant / 20, Math.min(timeConstant, constant));
    }

    @Override
    public void tickServer() {
        updateActiveState();
        process--;
        if (process <= 0) {
            updateValidity();
            process = Math.max(minTime(), level.random.nextInt(getTimeConstant()));
            if (isActive && valid) {
                fish();
            }
        }
    }

    private void fish() {
        ServerLevel sl = (ServerLevel) level;
        ItemStack bait = inv.getStackInSlot(slotBait);
        Bait b = bait.isEmpty() ? null : baits().get(bait.getItem());
        ResourceLocation tableId = b == null ? ResourceLocation.withDefaultNamespace("gameplay/fishing") : b.table();
        float mod = b == null ? 1.0F : b.outputMod();
        LootTable table = sl.getServer().reloadableRegistries().getLootTable(ResourceKey.create(Registries.LOOT_TABLE, tableId));
        // the device rolls with its position only: no hook, no rod, no luck (and so no treasure, which needs open water around a hook)
        LootParams params = new LootParams.Builder(sl).withParameter(LootContextParams.ORIGIN, Vec3.atLowerCornerOf(worldPosition))
                .create(LootContextParamSets.EMPTY);
        float lootBase = baseMod * mod;
        float extra = lootBase - (int) lootBase;
        int count = (int) lootBase + (sl.random.nextFloat() < extra ? 1 : 0);
        int caught = 0;
        for (int i = 0; i < count; i++) {
            for (ItemStack stack : table.getRandomItems(params)) {
                if (filter.valid(stack) && inv.putInto(stack, DeviceInventory.Group.OUTPUT, false).isEmpty()) {
                    caught++;
                }
            }
        }
        if (caught > 0) {
            float use = b == null ? 1.0F : b.useChance();
            if (!bait.isEmpty() && sl.random.nextFloat() < use) {
                inv.consume(slotBait, 1);
            }
            if (xpFeature) {
                receiveXp(caught + sl.random.nextInt(2 * caught));
            }
            if (particles) {
                Vec3 splash = Vec3.upFromBottomCenterOf(worldPosition.relative(facing()), 1.0);
                sl.sendParticles(ParticleTypes.SPLASH, splash.x, splash.y, splash.z, 10, 0.1, 0.0, 0.1, 0.02);
            }
        }
    }

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putInt("Proc", process);
        tag.putBoolean("Valid", valid);
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        process = tag.getInt("Proc");
        valid = tag.getBoolean("Valid");
    }

    @Override
    protected void loadLegacyAttachments(HolderLookup.Provider registries, CompoundTag attachments) {
        inv.loadLegacy(registries, attachments.get("bait"), slotBait, 1);
        inv.loadLegacy(registries, attachments.get("out"), slotOutFirst, 15);
    }

    @Override
    protected void loadLegacyData(CompoundTag data) {
        process = data.contains("process") ? data.getInt("process") : timeConstant / 2;
        valid = data.getBoolean("valid");
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

    public int timeConstantNow() {
        return getTimeConstant();
    }

    public @Nullable IItemHandler outputs() {
        return itemCapability(null);
    }
}
