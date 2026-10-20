package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.ComposterBlock;
import net.minecraft.world.level.block.state.BlockState;

import java.util.Set;

/**
 * The Batch Composter (Thermal Foundation 9.2.2.58's DeviceComposterTile): nine input slots for anything compostable and one
 * output of compost. Every 120 ticks it takes one item out of each input slot, adds up their compost chances, and turns every 7 into
 * a compost (and a point of XP, with the XP augment). The compost shows in the block as it piles up.
 */
public class ComposterBE extends DeviceBE {
    /** ThermalDeviceConfig "Composter" */
    public static int timeConstant = 120;
    public static boolean particles = true;
    protected static final float COMPOST_LEVEL_MAX = 7.0F;

    protected final int slotIn;
    protected final int slotOut;
    protected boolean hasInputsCache;
    protected float compostLevel;
    protected int processMax = timeConstant;
    protected int process = processMax;

    public ComposterBE(BlockPos pos, BlockState state) {
        super(CaeDevices.COMPOSTER_BE.get(), pos, state);
        slotIn = inv.getSlots();
        for (int i = 0; i < 9; i++) {
            inv.add(DeviceInventory.Group.INPUT, s -> filter.valid(s) && ComposterBlock.getValue(s) > 0);
        }
        slotOut = inv.getSlots();
        inv.add(DeviceInventory.Group.OUTPUT);
        xpCapable = true;
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "Filter");
    }

    @Override
    public String guiTexture() {
        return "composter";
    }

    @Override
    public GuiLayout layout() {
        GuiLayout l = new GuiLayout();
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                l.slot(slotIn + i * 3 + j, 26 + j * 18, 17 + i * 18);
            }
        }
        return l.outSlot(slotOut, 125, 35).progress("progress_arrow_right", 87, 35);
    }

    @Override
    protected boolean automationExtractsInputs() {
        return false;
    }

    private boolean hasInputs() {
        for (int i = 0; i < 9; i++) {
            if (!inv.isEmpty(slotIn + i)) {
                return true;
            }
        }
        return false;
    }

    private boolean outputFull() {
        return inv.isFull(slotOut);
    }

    @Override
    protected boolean isValid() {
        return hasInputsCache;
    }

    @Override
    protected void onInventoryChanged(int slot) {
        if (level != null && !level.isClientSide && slot >= slotIn && slot < slotIn + 9) {
            hasInputsCache = hasInputs();
            if (!hasInputsCache) {
                processMax = timeConstant / Math.max(1, (int) baseMod);
                process = processMax;
            }
        }
        super.onInventoryChanged(slot);
    }

    @Override
    public void onLoad() {
        super.onLoad();
        hasInputsCache = hasInputs();
    }

    @Override
    public void tickServer() {
        updateActiveState();
        if (level.getGameTime() % 16 == 0) {
            updateTrackers();
        }
        if (isActive) {
            process--;
            if (process <= 0) {
                processMax = timeConstant / Math.max(1, (int) baseMod);
                process = processMax;
                if (!outputFull()) {
                    for (int i = 0; i < 9; i++) {
                        ItemStack st = inv.getStackInSlot(slotIn + i);
                        float chance = st.isEmpty() ? 0 : ComposterBlock.getValue(st);
                        if (chance > 0) {
                            compostLevel += chance;
                            inv.consume(slotIn + i, 1);
                        }
                    }
                    hasInputsCache = hasInputs();
                }
                ItemStack compost = new ItemStack(CaeDevices.item("compost"));
                while (compostLevel >= COMPOST_LEVEL_MAX && !outputFull()) {
                    compostLevel -= COMPOST_LEVEL_MAX;
                    inv.modify(slotOut, compost, 1);
                    if (xpFeature) {
                        receiveXp(1);
                    }
                    if (particles) {
                        ((ServerLevel) level).sendParticles(ParticleTypes.COMPOSTER, worldPosition.getX() + 0.5, worldPosition.getY() + 1.5,
                                worldPosition.getZ() + 0.5, 4, 0.1, 0.0, 0.1, 0.02);
                    }
                }
            }
        }
    }

    /** the compost inside rises with the output slot: LEVEL = 8 * count / capacity */
    protected void updateTrackers() {
        int cap = Math.max(1, inv.getStackInSlot(slotOut).isEmpty() ? 64 : inv.getStackInSlot(slotOut).getMaxStackSize());
        int scaled = Math.max(0, Math.min(8, 8 * inv.getStackInSlot(slotOut).getCount() / cap));
        BlockState st = getBlockState();
        if (st.hasProperty(DeviceBlock.Composter.LEVEL) && st.getValue(DeviceBlock.Composter.LEVEL) != scaled) {
            level.setBlock(worldPosition, st.setValue(DeviceBlock.Composter.LEVEL, scaled), 3);
        }
    }

    @Override
    public int getScaledProgress(int scale) {
        return isActive && processMax > 0 && !outputFull() && hasInputsCache ? scale * (processMax - process) / processMax : 0;
    }

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putInt("Proc", process);
        tag.putInt("ProcMax", processMax);
        tag.putFloat("Compost", compostLevel);
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        process = tag.getInt("Proc");
        processMax = Math.max(1, tag.getInt("ProcMax"));
        compostLevel = tag.getFloat("Compost");
        hasInputsCache = hasInputs();
    }

    @Override
    protected void loadLegacyAttachments(HolderLookup.Provider registries, CompoundTag attachments) {
        inv.loadLegacy(registries, attachments.get("in"), slotIn, 9);
        inv.loadLegacy(registries, attachments.get("out"), slotOut, 1);
    }

    @Override
    protected void loadLegacyData(CompoundTag data) {
        process = data.contains("process") ? data.getInt("process") : timeConstant;
        processMax = timeConstant;
        compostLevel = data.getFloat("compost");
        hasInputsCache = hasInputs();
    }

    @Override
    public void writeGui(RegistryFriendlyByteBuf buf) {
        super.writeGui(buf);
        buf.writeInt(process);
        buf.writeInt(processMax);
        buf.writeBoolean(hasInputsCache);
    }

    @Override
    public void readGui(RegistryFriendlyByteBuf buf) {
        super.readGui(buf);
        process = buf.readInt();
        processMax = Math.max(1, buf.readInt());
        hasInputsCache = buf.readBoolean();
    }

    // for scripts and tests
    public void setProcess(int p) {
        process = p;
    }

    public int process() {
        return process;
    }
}
