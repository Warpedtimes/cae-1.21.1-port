package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.Container;
import net.minecraft.world.MenuProvider;
import net.minecraft.world.SimpleContainer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.inventory.ClickType;
import net.minecraft.world.inventory.DataSlot;
import net.minecraft.world.inventory.Slot;
import net.minecraft.world.item.ItemStack;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.FluidUtil;
import org.jetbrains.annotations.Nullable;

/**
 * Thermal's filter menu (CoFH's ItemFilterContainer / FluidFilterContainer): 15 ghost slots in three rows, a deny / allow
 * list button and an "ignore / match NBT" button. Item filters hold the item put in a slot, fluid filters the fluid
 * of the container put in it. Buttons: 0 deny / allow, 1 ignore / match components, 2 back to the device.
 */
public class FilterMenu extends AbstractContainerMenu {
    public static final int BTN_ALLOW = 0;
    public static final int BTN_COMPONENTS = 1;
    public static final int BTN_BACK = 2;

    public final @Nullable DeviceBE be;
    public final BlockPos pos;
    public final DeviceFilter filter;
    private final SimpleContainer ghost = new SimpleContainer(DeviceFilter.SIZE);

    public FilterMenu(int id, Inventory inv, FriendlyByteBuf buf) {
        this(id, inv, DeviceBE.readMenuTarget(inv.player.level(), buf), DeviceFilter.create(buf.readUtf()));
    }

    public FilterMenu(int id, Inventory inv, DeviceBE be) {
        this(id, inv, be, be.filter());
    }

    private FilterMenu(int id, Inventory inv, @Nullable DeviceBE be, DeviceFilter filter) {
        super(CaeDevices.FILTER_MENU.get(), id);
        this.be = be;
        this.pos = be == null ? BlockPos.ZERO : be.getBlockPos();
        this.filter = filter;
        for (int i = 0; i < DeviceFilter.SIZE; i++) {
            ghost.setItem(i, iconAt(i));
            addSlot(new GhostSlot(ghost, i, 17 + i % 5 * 18, 17 + i / 5 * 18));
        }
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 9; j++) {
                addSlot(new Slot(inv, j + i * 9 + 9, 8 + j * 18, 84 + i * 18));
            }
        }
        for (int i = 0; i < 9; i++) {
            addSlot(new Slot(inv, i, 8 + i * 18, 142));
        }
        addDataSlot(new DataSlot() {
            @Override
            public int get() {
                return FilterMenu.this.filter.allowList ? 1 : 0;
            }

            @Override
            public void set(int value) {
                FilterMenu.this.filter.allowList = value != 0;
            }
        });
        addDataSlot(new DataSlot() {
            @Override
            public int get() {
                return FilterMenu.this.filter.checkComponents ? 1 : 0;
            }

            @Override
            public void set(int value) {
                FilterMenu.this.filter.checkComponents = value != 0;
            }
        });
    }

    private ItemStack iconAt(int i) {
        if (filter instanceof DeviceFilter.Items f) {
            return f.items.get(i).copy();
        }
        if (filter instanceof DeviceFilter.Fluids f) {
            return DeviceFilter.iconFor(f.fluids.get(i));
        }
        return ItemStack.EMPTY;
    }

    private static final class GhostSlot extends Slot {
        GhostSlot(Container c, int i, int x, int y) {
            super(c, i, x, y);
        }

        @Override
        public boolean mayPlace(ItemStack stack) {
            return false;
        }

        @Override
        public boolean mayPickup(Player player) {
            return false;
        }
    }

    @Override
    public void clicked(int slotId, int button, ClickType type, Player player) {
        if (slotId >= 0 && slotId < DeviceFilter.SIZE) {
            if (type == ClickType.PICKUP || type == ClickType.QUICK_MOVE || type == ClickType.SWAP) {
                setGhost(slotId, getCarried());
            }
            return;
        }
        if (type == ClickType.QUICK_MOVE) {
            return;
        }
        super.clicked(slotId, button, type, player);
    }

    private void setGhost(int i, ItemStack carried) {
        if (filter instanceof DeviceFilter.Items f) {
            ItemStack one = carried.isEmpty() ? ItemStack.EMPTY : carried.copyWithCount(1);
            f.items.set(i, one);
            ghost.setItem(i, one.copy());
        } else if (filter instanceof DeviceFilter.Fluids f) {
            FluidStack fs = carried.isEmpty() ? FluidStack.EMPTY : FluidUtil.getFluidContained(carried).orElse(FluidStack.EMPTY);
            if (!carried.isEmpty() && fs.isEmpty()) {
                return;
            }
            f.fluids.set(i, fs.isEmpty() ? FluidStack.EMPTY : fs.copyWithAmount(1000));
            ghost.setItem(i, DeviceFilter.iconFor(fs));
        }
        if (be != null && !be.getLevel().isClientSide) {
            be.onFilterChanged();
        }
    }

    @Override
    public ItemStack quickMoveStack(Player player, int index) {
        return ItemStack.EMPTY;
    }

    @Override
    public boolean stillValid(Player player) {
        return be != null && be.stillValid(player) && be.hasFilter();
    }

    @Override
    public boolean clickMenuButton(Player player, int id) {
        if (be == null) {
            return false;
        }
        switch (id) {
            case BTN_ALLOW -> {
                filter.allowList = !filter.allowList;
                be.onFilterChanged();
                return true;
            }
            case BTN_COMPONENTS -> {
                filter.checkComponents = !filter.checkComponents;
                be.onFilterChanged();
                return true;
            }
            case BTN_BACK -> {
                if (player instanceof ServerPlayer sp) {
                    sp.openMenu(be, be::writeMenuTarget);
                }
                return false;
            }
            default -> {
                return false;
            }
        }
    }

    public boolean isItemFilter() {
        return filter instanceof DeviceFilter.Items;
    }

    /** opens the filter of a device: the menu data are the position and the filter's type */
    public static MenuProvider provider(DeviceBE be) {
        return new FilterMenuProvider(be);
    }

    static Component title(DeviceFilter filter) {
        return Component.translatable(filter instanceof DeviceFilter.Fluids ? "info.cofh.fluid_filter" : "info.cofh.item_filter");
    }
}
