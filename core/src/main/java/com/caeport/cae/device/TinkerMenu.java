package com.caeport.cae.device;

import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.world.SimpleContainer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.Slot;
import net.minecraft.world.item.ItemStack;

import java.util.ArrayList;
import java.util.List;

/**
 * The Tinker's Workbench menu (Thermal's TinkerBenchContainer): the device's slots (the item, the charge slot, the tank slot), the bench's own
 * augment slots, and three more slots that show the augments of the item in the bench while the bench is in augment mode. What is put in
 * and taken out of those is written to the item at once.
 */
public class TinkerMenu extends DeviceMenu {
    /** Thermal's ElementAugmentSlots layout for three slots, at the grid origin (80, 17) */
    public static final int[][] TINKER_POS = {{89, 26}, {107, 26}, {98, 44}};

    public final TinkerBenchBE bench;
    private final SimpleContainer augmentsOfItem;
    private final List<Slot> itemAugmentSlots = new ArrayList<>();
    private boolean loading;
    private ItemStack lastTinker = ItemStack.EMPTY;

    public TinkerMenu(int id, Inventory inv, FriendlyByteBuf buf) {
        this(id, inv, tinker(inv, DeviceBE.readMenuTarget(inv.player.level(), buf)));
    }

    public TinkerMenu(int id, Inventory inv, TinkerBenchBE be) {
        super(CaeDevices.TINKER_MENU.get(), id, inv, be);
        this.bench = be;
        this.augmentsOfItem = new SimpleContainer(TINKER_POS.length) {
            @Override
            public void setChanged() {
                super.setChanged();
                writeAugments();
            }
        };
        for (int i = 0; i < TINKER_POS.length; i++) {
            Slot s = new Slot(augmentsOfItem, i, TINKER_POS[i][0], TINKER_POS[i][1]) {
                @Override
                public boolean isActive() {
                    return itemAugmentable() && bench.allowAugmentation();
                }

                @Override
                public boolean mayPlace(ItemStack stack) {
                    return itemAugmentable() && bench.allowAugmentation() && TinkerBenchBE.validAugmentFor(tinkerSlot().getItem(), stack, currentAugments());
                }

                @Override
                public boolean mayPickup(Player player) {
                    return bench.allowAugmentation();
                }

                @Override
                public int getMaxStackSize() {
                    return 1;
                }
            };
            itemAugmentSlots.add(s);
            addSlot(s);
        }
        if (be.getLevel() != null && !be.getLevel().isClientSide) {
            be.addPlayerUsing();
            loadAugments();
        }
    }

    private static TinkerBenchBE tinker(Inventory inv, DeviceBE be) {
        if (be instanceof TinkerBenchBE t) {
            return t;
        }
        TinkerBenchBE t = new TinkerBenchBE(be.getBlockPos(), CaeDevices.TINKER_BENCH_BE.get().getValidBlocks().iterator().next().defaultBlockState());
        t.setLevel(inv.player.level());
        return t;
    }

    private Slot tinkerSlot() {
        return deviceSlots.get(0);
    }

    private boolean itemAugmentable() {
        return TinkerBenchBE.isAugmentable(tinkerSlot().getItem());
    }

    private List<ItemStack> currentAugments() {
        List<ItemStack> list = new ArrayList<>();
        for (int i = 0; i < augmentsOfItem.getContainerSize(); i++) {
            list.add(augmentsOfItem.getItem(i));
        }
        return list;
    }

    /** the augments of the item in the bench into the three slots */
    private void loadAugments() {
        loading = true;
        ItemStack t = tinkerSlot().getItem();
        Augments comp = t.isEmpty() ? null : t.get(CaeDevices.AUGMENTS.get());
        List<ItemStack> list = comp == null ? null : comp.stacks();
        for (int i = 0; i < augmentsOfItem.getContainerSize(); i++) {
            augmentsOfItem.setItem(i, list != null && i < list.size() ? list.get(i).copy() : ItemStack.EMPTY);
        }
        loading = false;
        lastTinker = t.copy();
    }

    /** the three slots into the item in the bench */
    private void writeAugments() {
        if (loading) {
            return;
        }
        ItemStack t = tinkerSlot().getItem();
        if (t.isEmpty() || !TinkerBenchBE.isAugmentable(t)) {
            return;
        }
        List<ItemStack> list = new ArrayList<>();
        for (ItemStack s : currentAugments()) {
            if (!s.isEmpty()) {
                list.add(s.copy());
            }
        }
        bench.setPause(true);
        if (list.isEmpty()) {
            t.remove(CaeDevices.AUGMENTS.get());
        } else {
            t.set(CaeDevices.AUGMENTS.get(), new Augments(list));
        }
        bench.setPause(false);
        lastTinker = t.copy();
        bench.setChanged();
    }

    @Override
    public void broadcastChanges() {
        if (bench.getLevel() != null && !bench.getLevel().isClientSide && !ItemStack.matches(tinkerSlot().getItem(), lastTinker)) {
            loadAugments();
        }
        super.broadcastChanges();
    }

    @Override
    public void removed(Player player) {
        if (bench.getLevel() != null && !bench.getLevel().isClientSide) {
            bench.removePlayerUsing();
        }
        super.removed(player);
    }

    @Override
    public boolean clickMenuButton(Player player, int id) {
        // changing the mode first puts the augments back into the item
        if (id == TinkerBenchBE.BTN_MODE) {
            writeAugments();
        }
        return super.clickMenuButton(player, id);
    }

    @Override
    public ItemStack quickMoveStack(Player player, int index) {
        Slot slot = slots.get(index);
        if (slot == null || !slot.hasItem()) {
            return ItemStack.EMPTY;
        }
        ItemStack stack = slot.getItem();
        ItemStack copy = stack.copy();
        int nDev = deviceSlots.size();
        int playerStart = nDev + augmentSlots.size();
        int playerEnd = playerStart + 36;
        if (index < playerStart || index >= playerEnd) {
            if (!moveItemStackTo(stack, playerStart, playerEnd, true)) {
                return ItemStack.EMPTY;
            }
        } else {
            boolean moved = moveItemStackTo(stack, 0, nDev, false);
            if (!moved && bench.allowAugmentation() && itemAugmentable()) {
                moved = moveItemStackTo(stack, playerEnd, playerEnd + itemAugmentSlots.size(), false);
            }
            if (!moved && augmentsVisible) {
                moved = moveItemStackTo(stack, nDev, playerStart, false);
            }
            if (!moved) {
                return ItemStack.EMPTY;
            }
        }
        if (stack.isEmpty()) {
            slot.setByPlayer(ItemStack.EMPTY);
        } else {
            slot.setChanged();
        }
        return copy;
    }
}
