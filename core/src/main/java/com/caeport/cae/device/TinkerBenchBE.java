package com.caeport.cae.device;

import com.simibubi.create.content.fluids.potion.PotionFluidHandler;
import net.minecraft.core.BlockPos;
import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.block.state.BlockState;
import net.neoforged.neoforge.capabilities.Capabilities;
import net.neoforged.neoforge.energy.IEnergyStorage;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;
import net.neoforged.neoforge.fluids.capability.IFluidHandlerItem;
import org.jetbrains.annotations.Nullable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The Tinker's Workbench (Thermal Foundation 9.2.2.58's TinkerBenchBlockEntity): "used to augment, charge, and fill items". In one
 * mode, the augment slots of the item in the bench open up and augments can be installed in it (the augmentable items of this pack are
 * the Thermal devices; the augments stay on the device when it is picked up and placed). In the other mode the bench charges the item
 * with the Forge Energy it holds, and fills it with the fluid in its tank, 1000 mB / 1000 FE per tick. It takes energy from a chargeable
 * item in its charge slot and fluid from a container in its tank slot, and has augment slots of its own (tier, RF coils, tank).
 */
public class TinkerBenchBE extends DeviceBE {
    public static final int BASE_CAPACITY = 500000;
    public static final int BASE_XFER = 1000;
    public static final int BTN_MODE = 101;
    protected static final byte REPLENISH = 0;
    protected static final byte AUGMENT = 1;

    protected final int slotTinker;
    protected final int slotCharge;
    protected final int slotTank;
    protected final DeviceTank tank;
    protected byte mode;
    protected boolean pause;
    protected int playersUsing;

    public TinkerBenchBE(BlockPos pos, BlockState state) {
        super(CaeDevices.TINKER_BENCH_BE.get(), pos, state);
        energy = new DeviceEnergy(BASE_CAPACITY, BASE_XFER, this::setChanged);
        slotTinker = inv.getSlots();
        // one item, like Thermal's: augments, energy and fluid are written onto the whole stack in this slot
        inv.add(DeviceInventory.Group.INTERNAL, s -> TinkerBenchBE.isAugmentable(s) || hasEnergy(s) || hasFluid(s)).limit = 1;
        slotCharge = inv.getSlots();
        inv.add(DeviceInventory.Group.INTERNAL, TinkerBenchBE::hasEnergy);
        slotTank = inv.getSlots();
        inv.add(DeviceInventory.Group.INTERNAL, s -> hasFluid(s) || s.is(Items.POTION));
        tank = addTank(8000, DeviceTank.Group.INPUT);
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "RF", "Fluid");
    }

    @Override
    public String guiTexture() {
        return "tinker_bench";
    }

    @Override
    public GuiLayout layout() {
        return new GuiLayout().slot(slotTinker, 44, 26).slot(slotCharge, 8, 53).slot(slotTank, 152, 53).energy(8, 8).tank(0, 151, 8);
    }

    public int slotTinker() {
        return slotTinker;
    }

    public byte mode() {
        return mode;
    }

    public boolean allowAugmentation() {
        return mode == AUGMENT;
    }

    public void setPause(boolean p) {
        pause = p;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // what the bench takes
    // ---------------------------------------------------------------------------------------------------------------

    private static final Map<net.minecraft.world.level.block.Block, Set<String>> AUGMENT_TYPES = new HashMap<>();

    /** The item augments of a device item: only devices carry them. */
    public static boolean isAugmentable(ItemStack stack) {
        return stack.getItem() instanceof BlockItem bi && bi.getBlock() instanceof DeviceBlock && augmentTypes(bi.getBlock()) != null && !augmentTypes(bi.getBlock()).isEmpty();
    }

    /** the augment types the device of this block takes: asked of a block entity made for the purpose */
    public static @Nullable Set<String> augmentTypes(net.minecraft.world.level.block.Block block) {
        synchronized (AUGMENT_TYPES) {
            Set<String> types = AUGMENT_TYPES.get(block);
            if (types == null && block instanceof DeviceBlock db && db.newBlockEntity(BlockPos.ZERO, block.defaultBlockState()) instanceof DeviceBE dummy
                    && !(dummy instanceof TinkerBenchBE)) {
                types = dummy.allowedAugments();
                AUGMENT_TYPES.put(block, types);
            }
            return types;
        }
    }

    public static boolean validAugmentFor(ItemStack device, ItemStack augment, List<ItemStack> installed) {
        if (!(device.getItem() instanceof BlockItem bi) || !(augment.getItem() instanceof AugmentItem a)) {
            return false;
        }
        Set<String> types = augmentTypes(bi.getBlock());
        return types != null && a.fits(types, installed);
    }

    private static boolean hasEnergy(ItemStack s) {
        return !s.isEmpty() && s.getCapability(Capabilities.EnergyStorage.ITEM) != null;
    }

    private static boolean hasFluid(ItemStack s) {
        return !s.isEmpty() && s.getCapability(Capabilities.FluidHandler.ITEM) != null;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // working
    // ---------------------------------------------------------------------------------------------------------------

    @Override
    public void tickServer() {
        if (rs.state()) {
            chargeEnergy();
            fillFluid();
        }
    }

    protected void chargeEnergy() {
        ItemStack charge = inv.getStackInSlot(slotCharge);
        if (!charge.isEmpty()) {
            IEnergyStorage from = charge.getCapability(Capabilities.EnergyStorage.ITEM);
            if (from != null) {
                energy.receiveEnergy(from.extractEnergy(Math.min(energy.maxReceive(), energy.space()), false), false);
            }
        }
        ItemStack tinker = inv.getStackInSlot(slotTinker);
        if (!tinker.isEmpty() && mode == REPLENISH && !pause) {
            IEnergyStorage to = tinker.getCapability(Capabilities.EnergyStorage.ITEM);
            if (to != null) {
                int max = Math.min(energy.maxReceive(), energy.getEnergyStored());
                energy.extractEnergy(to.receiveEnergy(max, false), false);
            }
        }
    }

    protected void fillFluid() {
        ItemStack st = inv.getStackInSlot(slotTank);
        if (!st.isEmpty()) {
            if (st.is(Items.POTION)) {
                FluidStack potion = PotionFluidHandler.getFluidFromPotionItem(st).copyWithAmount(250);
                if (tank.fill(potion, IFluidHandler.FluidAction.SIMULATE) == 250) {
                    tank.fill(potion, IFluidHandler.FluidAction.EXECUTE);
                    inv.setStackInSlot(slotTank, new ItemStack(Items.GLASS_BOTTLE));
                }
            } else {
                ItemStack single = st.copyWithCount(1);
                IFluidHandlerItem h = single.getCapability(Capabilities.FluidHandler.ITEM);
                if (h != null && st.getCount() == 1) {
                    int toFill = tank.fill(h.getFluidInTank(0).copyWithAmount(1000), IFluidHandler.FluidAction.SIMULATE);
                    if (toFill > 0) {
                        FluidStack drained = h.drain(toFill, IFluidHandler.FluidAction.EXECUTE);
                        tank.fill(drained, IFluidHandler.FluidAction.EXECUTE);
                        inv.setStackInSlot(slotTank, h.getContainer());
                    }
                }
            }
        }
        ItemStack tinker = inv.getStackInSlot(slotTinker);
        if (!tinker.isEmpty() && mode == REPLENISH && !pause && !tank.isEmpty() && tinker.getCount() == 1) {
            IFluidHandlerItem h = tinker.getCapability(Capabilities.FluidHandler.ITEM);
            if (h != null) {
                int filled = h.fill(tank.getFluid().copyWithAmount(Math.min(tank.getFluidAmount(), 1000)), IFluidHandler.FluidAction.EXECUTE);
                if (filled > 0) {
                    tank.modify(tank.getFluid(), -filled);
                    inv.setStackInSlot(slotTinker, h.getContainer());
                }
            }
        }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // menu
    // ---------------------------------------------------------------------------------------------------------------

    @Override
    public @Nullable AbstractContainerMenu createMenu(int id, Inventory playerInv, Player player) {
        return new TinkerMenu(id, playerInv, this);
    }

    @Override
    public boolean canOpenGui() {
        return playersUsing <= 0;
    }

    public void addPlayerUsing() {
        playersUsing++;
    }

    public void removePlayerUsing() {
        playersUsing = Math.max(0, playersUsing - 1);
    }

    @Override
    public boolean openFilterMenu(ServerPlayer player) {
        return false;
    }

    @Override
    public boolean menuButton(Player player, int id) {
        if (id == BTN_MODE) {
            mode = (byte) ((mode + 1) % 2);
            setChanged();
            return true;
        }
        return false;
    }

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putByte("Mode", mode);
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        mode = tag.getByte("Mode");
    }

    @Override
    protected void writeKept(HolderLookup.Provider registries, CompoundTag settings) {
        settings.putInt("Energy", energy.getEnergyStored());
    }

    @Override
    protected void readKept(HolderLookup.Provider registries, CompoundTag settings) {
        energy.set(settings.getInt("Energy"));
    }

    @Override
    public void writeGui(RegistryFriendlyByteBuf buf) {
        super.writeGui(buf);
        buf.writeByte(mode);
    }

    @Override
    public void readGui(RegistryFriendlyByteBuf buf) {
        super.readGui(buf);
        mode = buf.readByte();
    }
}
