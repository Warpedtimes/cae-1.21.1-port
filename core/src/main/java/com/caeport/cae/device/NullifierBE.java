package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.state.BlockState;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;
import net.neoforged.neoforge.items.IItemHandler;
import org.jetbrains.annotations.Nullable;

import java.util.Set;

/**
 * The Nullifier (Thermal Foundation 9.2.2.58's DeviceNullifierTile): destroys anything put into it. What automation puts in
 * (hoppers, pipes, funnels; fluid up to 64000 mB at once) is gone at once; what a player puts in its nine bin slots stays until
 * the button destroys it. An item or fluid filter limits what it takes. Redstone control can switch it off, and then it takes
 * nothing.
 */
public class NullifierBE extends DeviceBE {
    public static final int BTN_EMPTY_BIN = 100;
    public static final int NULL_TANK = 64000;

    protected final int slotBin;
    private final IItemHandler nullItems = new IItemHandler() {
        @Override
        public int getSlots() {
            return 1;
        }

        @Override
        public ItemStack getStackInSlot(int slot) {
            return ItemStack.EMPTY;
        }

        @Override
        public ItemStack insertItem(int slot, ItemStack stack, boolean simulate) {
            return !stack.isEmpty() && isActive && filter.valid(stack) ? ItemStack.EMPTY : stack;
        }

        @Override
        public ItemStack extractItem(int slot, int amount, boolean simulate) {
            return ItemStack.EMPTY;
        }

        @Override
        public int getSlotLimit(int slot) {
            return 64;
        }

        @Override
        public boolean isItemValid(int slot, ItemStack stack) {
            return isActive && filter.valid(stack);
        }
    };
    private final IFluidHandler nullFluids = new IFluidHandler() {
        @Override
        public int getTanks() {
            return 1;
        }

        @Override
        public FluidStack getFluidInTank(int tank) {
            return FluidStack.EMPTY;
        }

        @Override
        public int getTankCapacity(int tank) {
            return NULL_TANK;
        }

        @Override
        public boolean isFluidValid(int tank, FluidStack stack) {
            return isActive && filter.valid(stack);
        }

        @Override
        public int fill(FluidStack resource, FluidAction action) {
            return !resource.isEmpty() && isActive && filter.valid(resource) ? Math.min(resource.getAmount(), NULL_TANK) : 0;
        }

        @Override
        public FluidStack drain(FluidStack resource, FluidAction action) {
            return FluidStack.EMPTY;
        }

        @Override
        public FluidStack drain(int maxDrain, FluidAction action) {
            return FluidStack.EMPTY;
        }
    };

    public NullifierBE(BlockPos pos, BlockState state) {
        super(CaeDevices.NULLIFIER_BE.get(), pos, state);
        slotBin = inv.getSlots();
        for (int i = 0; i < 9; i++) {
            inv.add(DeviceInventory.Group.INTERNAL, s -> filter.valid(s));
        }
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Filter");
    }

    @Override
    public String guiTexture() {
        return "nullifier";
    }

    @Override
    public GuiLayout layout() {
        GuiLayout l = new GuiLayout();
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                l.slot(slotBin + i * 3 + j, 44 + j * 18, 17 + i * 18);
            }
        }
        return l;
    }

    @Override
    public IItemHandler itemCapability(@Nullable Direction side) {
        return nullItems;
    }

    @Override
    public @Nullable IFluidHandler fluidCapability(@Nullable Direction side) {
        return nullFluids;
    }

    @Override
    public boolean onItemUse(net.minecraft.server.level.ServerPlayer player, net.minecraft.world.InteractionHand hand, ItemStack held) {
        if (validAugment(held)) {
            return super.onItemUse(player, hand, held);
        }
        return !held.isEmpty() && net.neoforged.neoforge.fluids.FluidUtil.interactWithFluidHandler(player, hand, nullFluids);
    }

    public boolean binHasItems() {
        for (int i = 0; i < 9; i++) {
            if (!inv.isEmpty(slotBin + i)) {
                return true;
            }
        }
        return false;
    }

    public void emptyBin() {
        for (int i = 0; i < 9; i++) {
            inv.clear(slotBin + i);
        }
    }

    @Override
    public boolean menuButton(Player player, int id) {
        if (id == BTN_EMPTY_BIN) {
            emptyBin();
            return true;
        }
        return false;
    }

    @Override
    protected void loadLegacyAttachments(net.minecraft.core.HolderLookup.Provider registries, net.minecraft.nbt.CompoundTag attachments) {
        // the KubeJS version emptied its buffer every tick, so there is nothing worth carrying over
    }
}
