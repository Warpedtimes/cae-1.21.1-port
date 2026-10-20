package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.state.BlockState;
import net.neoforged.neoforge.capabilities.Capabilities;
import net.neoforged.neoforge.energy.IEnergyStorage;

import java.util.Set;

/**
 * The Phyto-Soil Infuser (Thermal Foundation 9.2.2.58's DeviceSoilInfuserTile): spends Forge Energy to charge the Phyto-Soil
 * around it (the area is 5 x 3 x 5 blocks; the area augment widens it). Every 12000 energy of work (4000 x (1 + radius)) it adds one
 * charge to every phyto-soil block in the area; a charged block gives the crop above it extra growth ticks and uses the charge up.
 * It takes power from cables or from a chargeable item in its slot.
 */
public class SoilInfuserBE extends DeviceBE {
    protected static final int BASE_PROCESS_MAX = 4000;
    protected static final int BASE_ENERGY = 50000;
    protected static final int BASE_PROCESS_TICK = 20;
    protected static final int BASE_RADIUS = 2;

    protected final int slotCharge;
    protected int radius = BASE_RADIUS;
    protected int process;
    protected int processMax = BASE_PROCESS_MAX * (1 + BASE_RADIUS);
    protected int processTick = BASE_PROCESS_TICK;

    public SoilInfuserBE(BlockPos pos, BlockState state) {
        super(CaeDevices.SOIL_INFUSER_BE.get(), pos, state);
        energy = new DeviceEnergy(BASE_ENERGY, BASE_PROCESS_TICK * 10, this::setChanged);
        slotCharge = inv.getSlots();
        inv.add(DeviceInventory.Group.INTERNAL, s -> s.getCapability(Capabilities.EnergyStorage.ITEM) != null);
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "RF", "Area");
    }

    @Override
    public String guiTexture() {
        return "soil_infuser";
    }

    @Override
    public GuiLayout layout() {
        return new GuiLayout().slot(slotCharge, 8, 53).energy(8, 8).scaleProgress("scale_flame_green", 44, 34);
    }

    @Override
    protected void finalizeAttributes() {
        super.finalizeAttributes();
        radius = BASE_RADIUS + radiusBonus;
        processMax = BASE_PROCESS_MAX * (1 + radius);
        processTick = Math.round(BASE_PROCESS_TICK * baseMod);
    }

    public int radius() {
        return radius;
    }

    @Override
    public void tickServer() {
        boolean cur = isActive;
        if (isActive) {
            if (energy.getEnergyStored() >= processTick) {
                process += processTick;
                energy.modify(-processTick);
                if (process >= processMax) {
                    process -= processMax;
                    for (BlockPos p : BlockPos.betweenClosed(worldPosition.offset(-radius, -1, -radius), worldPosition.offset(radius, 1, radius))) {
                        if (!level.isLoaded(p)) {
                            continue;
                        }
                        BlockState st = level.getBlockState(p);
                        if (st.getBlock() instanceof PhytoSoilBlock) {
                            PhytoSoilBlock.charge(st, level, p.immutable());
                        }
                    }
                }
            } else {
                isActive = false;
            }
        } else if (rs.state() && energy.getEnergyStored() >= processTick) {
            isActive = true;
        }
        updateActiveState(cur);
        chargeEnergy();
    }

    protected void chargeEnergy() {
        ItemStack st = inv.getStackInSlot(slotCharge);
        if (!st.isEmpty()) {
            IEnergyStorage from = st.getCapability(Capabilities.EnergyStorage.ITEM);
            if (from != null) {
                energy.receiveEnergy(from.extractEnergy(Math.min(energy.maxReceive(), energy.space()), false), false);
            }
        }
    }

    @Override
    public int getScaledProgress(int scale) {
        return isActive && processMax > 0 && process > 0 ? scale * Math.min(process, processMax) / processMax : 0;
    }

    public int processTick() {
        return processTick;
    }

    // for scripts and tests
    public void setProcess(int p) {
        process = p;
    }

    public int process() {
        return process;
    }

    public int processMax() {
        return processMax;
    }

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putInt("Proc", process);
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        process = tag.getInt("Proc");
    }

    @Override
    protected void writeKept(HolderLookup.Provider registries, CompoundTag settings) {
        // Thermal: Blocks Retain Energy = true
        settings.putInt("Energy", energy.getEnergyStored());
    }

    @Override
    protected void readKept(HolderLookup.Provider registries, CompoundTag settings) {
        energy.set(settings.getInt("Energy"));
    }

    @Override
    public void writeGui(RegistryFriendlyByteBuf buf) {
        super.writeGui(buf);
        buf.writeInt(process);
        buf.writeInt(processMax);
        buf.writeInt(processTick);
        buf.writeInt(radius);
    }

    @Override
    public void readGui(RegistryFriendlyByteBuf buf) {
        super.readGui(buf);
        process = buf.readInt();
        processMax = Math.max(1, buf.readInt());
        processTick = buf.readInt();
        radius = buf.readInt();
    }
}
