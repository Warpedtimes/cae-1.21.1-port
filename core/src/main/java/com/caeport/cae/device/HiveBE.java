package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.material.Fluid;
import net.minecraft.world.level.material.Fluids;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;

import java.util.Set;

/**
 * The Hive Hopper (Thermal Foundation 9.2.2.58's DeviceHiveExtractorTile): put under a beehive or bee nest (any block with a
 * honey level) it empties the hive as soon as the honey level reaches 5, into its slot (2 honeycomb) and tank (250 mB honey).
 * Like Thermal's it does not wait for room: what does not fit is lost and the hive is emptied anyway. Reacts to the hive's
 * own block updates (and checks every second as well).
 */
public class HiveBE extends DeviceBE {
    /** HiveExtractorManager */
    public static final int COMB_AMOUNT = 2;
    public static final int HONEY_AMOUNT = 250;

    protected final int slotOut;
    protected final DeviceTank tank;

    public HiveBE(BlockPos pos, BlockState state) {
        super(CaeDevices.HIVE_BE.get(), pos, state);
        slotOut = inv.getSlots();
        inv.add(DeviceInventory.Group.OUTPUT);
        tank = addTank(8000, DeviceTank.Group.OUTPUT);
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "Fluid");
    }

    @Override
    public String guiTexture() {
        return "hive_extractor";
    }

    @Override
    public GuiLayout layout() {
        return new GuiLayout().outSlot(slotOut, 44, 35).tank(0, 116, 22);
    }

    @Override
    protected boolean isValid() {
        return level != null && level.getBlockState(worldPosition.above()).hasProperty(BlockStateProperties.LEVEL_HONEY);
    }

    @Override
    protected void updateActiveState() {
        super.updateActiveState();
        if (isActive) {
            extractProducts(worldPosition.above());
        }
    }

    @Override
    public void tickServer() {
        // Thermal had no tick: the hive's block updates do it. This catches the updates a hive does not send.
        if (level.getGameTime() % 20 == 0) {
            updateActiveState();
        }
    }

    protected void extractProducts(BlockPos above) {
        BlockState hive = level.getBlockState(above);
        if (hive.hasProperty(BlockStateProperties.LEVEL_HONEY) && hive.getValue(BlockStateProperties.LEVEL_HONEY) >= 5) {
            inv.put(slotOut, new ItemStack(Items.HONEYCOMB, COMB_AMOUNT), false);
            Fluid honey = CaeDevices.fluid("create:honey");
            if (honey != Fluids.EMPTY) {
                tank.fill(new FluidStack(honey, HONEY_AMOUNT), IFluidHandler.FluidAction.EXECUTE);
            }
            level.setBlock(above, hive.setValue(BlockStateProperties.LEVEL_HONEY, 0), 3);
        }
    }

    @Override
    protected void loadLegacyAttachments(net.minecraft.core.HolderLookup.Provider registries, net.minecraft.nbt.CompoundTag attachments) {
        inv.loadLegacy(registries, attachments.get("out"), slotOut, 1);
        legacyTank(registries, attachments, "tank", tank);
    }
}
