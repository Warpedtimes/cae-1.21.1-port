package com.caeport.cae.device;

import io.netty.buffer.Unpooled;
import net.minecraft.core.BlockPos;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.inventory.MenuType;
import net.minecraft.world.inventory.Slot;
import net.minecraft.world.item.ItemStack;
import net.neoforged.neoforge.items.IItemHandler;
import net.neoforged.neoforge.items.SlotItemHandler;
import net.neoforged.neoforge.network.PacketDistributor;

import java.util.ArrayList;
import java.util.List;

/**
 * The menu of every device (Thermal's TileContainer): the slots of the device's {@link GuiLayout}, the three augment
 * slots (which sit in the augment tab, so they are only active while it is open), and the player inventory in Thermal's
 * place. The live numbers (progress, tanks, redstone, XP) reach the screen as Thermal's "gui packet": the whole state
 * of {@link DeviceBE#writeGui} whenever it changes.
 *
 * <p>Buttons ({@code clickMenuButton}): 0..2 set the redstone mode, 10 + n clears tank n, 20 claims the XP, 30 opens the
 * filter, anything from 100 up is the device's own.
 */
public class DeviceMenu extends AbstractContainerMenu {
    public static final int BTN_RS = 0;
    public static final int BTN_CLEAR_TANK = 10;
    public static final int BTN_CLAIM_XP = 20;
    public static final int BTN_FILTER = 30;
    public static final int BTN_AUGMENTS_SHOWN = 40;
    public static final int BTN_AUGMENTS_HIDDEN = 41;

    /** where the three augment slots sit while the augment tab is open (Thermal's AugmentPanel at 176, 4 with its slot grid) */
    public static final int[][] AUGMENT_POS = {{209, 37}, {227, 37}, {218, 55}};

    public final DeviceBE be;
    public final Inventory playerInv;
    /** set by the screen: the augment slots only exist while their tab is open */
    public boolean augmentsVisible;
    protected final List<Slot> deviceSlots = new ArrayList<>();
    protected final List<Slot> augmentSlots = new ArrayList<>();
    private byte[] lastGui;

    /** client constructor: the device is looked up by position */
    public DeviceMenu(int id, Inventory inv, net.minecraft.network.FriendlyByteBuf buf) {
        this(id, inv, DeviceBE.readMenuTarget(inv.player.level(), buf));
    }

    public DeviceMenu(int id, Inventory inv, DeviceBE be) {
        this(CaeDevices.DEVICE_MENU.get(), id, inv, be);
    }

    protected DeviceMenu(MenuType<?> type, int id, Inventory inv, DeviceBE be) {
        super(type, id);
        this.be = be;
        this.playerInv = inv;
        bindDeviceSlots();
        bindAugmentSlots();
        bindPlayerInventory(inv, 8, 84);
    }

    protected void bindDeviceSlots() {
        for (GuiLayout.SlotDef d : be.layout().slots) {
            Slot s = new DeviceSlot(be.items(), d.index(), d.x(), d.y(), d.output(), be);
            deviceSlots.add(s);
            addSlot(s);
        }
    }

    protected void bindAugmentSlots() {
        for (int i = 0; i < be.augmentSlots(); i++) {
            Slot s = new SlotItemHandler(be.items(), be.augmentStart() + i, AUGMENT_POS[i][0], AUGMENT_POS[i][1]) {
                @Override
                public boolean isActive() {
                    return augmentsVisible;
                }
            };
            augmentSlots.add(s);
            addSlot(s);
        }
    }

    protected void bindPlayerInventory(Inventory inv, int x, int y) {
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 9; j++) {
                addSlot(new Slot(inv, j + i * 9 + 9, x + j * 18, y + i * 18));
            }
        }
        for (int i = 0; i < 9; i++) {
            addSlot(new Slot(inv, i, x + i * 18, y + 58));
        }
    }

    /** a device slot: output slots only let things out */
    public static class DeviceSlot extends SlotItemHandler {
        private final boolean output;
        private final DeviceBE be;

        public DeviceSlot(IItemHandler handler, int index, int x, int y, boolean output, DeviceBE be) {
            super(handler, index, x, y);
            this.output = output;
            this.be = be;
        }

        @Override
        public boolean mayPlace(ItemStack stack) {
            return !output && super.mayPlace(stack);
        }
    }

    @Override
    public boolean stillValid(Player player) {
        return be != null && be.stillValid(player);
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
        int nAug = augmentSlots.size();
        int playerStart = nDev + nAug;
        int playerEnd = slots.size();
        if (index < playerStart) {
            if (!moveItemStackTo(stack, playerStart, playerEnd, true)) {
                return ItemStack.EMPTY;
            }
        } else {
            boolean moved = nDev > 0 && moveItemStackTo(stack, 0, nDev, false);
            if (!moved && nAug > 0 && augmentsVisible) {
                moved = moveItemStackTo(stack, nDev, playerStart, false);
            }
            if (!moved) {
                if (index < playerStart + 27) {
                    if (!moveItemStackTo(stack, playerStart + 27, playerEnd, false)) {
                        return ItemStack.EMPTY;
                    }
                } else if (!moveItemStackTo(stack, playerStart, playerStart + 27, false)) {
                    return ItemStack.EMPTY;
                }
            }
        }
        if (stack.isEmpty()) {
            slot.setByPlayer(ItemStack.EMPTY);
        } else {
            slot.setChanged();
        }
        return copy;
    }

    @Override
    public boolean clickMenuButton(Player player, int id) {
        if (id >= BTN_RS && id < BTN_RS + RedstoneControl.Mode.VALUES.length) {
            be.setRsMode(RedstoneControl.Mode.VALUES[id - BTN_RS]);
            return true;
        }
        if (id >= BTN_CLEAR_TANK && id < BTN_CLEAR_TANK + 5) {
            int t = id - BTN_CLEAR_TANK;
            if (t < be.tanks().size()) {
                be.tank(t).clearFluid();
            }
            return true;
        }
        if (id == BTN_CLAIM_XP) {
            be.claimXp(player);
            return true;
        }
        if (id == BTN_FILTER && player instanceof ServerPlayer sp) {
            be.openFilterMenu(sp);
            return false;
        }
        if (id == BTN_AUGMENTS_SHOWN || id == BTN_AUGMENTS_HIDDEN) {
            augmentsVisible = id == BTN_AUGMENTS_SHOWN;
            return false;
        }
        if (id >= 100) {
            return be.menuButton(player, id);
        }
        return false;
    }

    @Override
    public void broadcastChanges() {
        super.broadcastChanges();
        if (playerInv.player instanceof ServerPlayer sp && be != null && be.getLevel() != null) {
            RegistryFriendlyByteBuf buf = new RegistryFriendlyByteBuf(Unpooled.buffer(), be.getLevel().registryAccess());
            be.writeGui(buf);
            byte[] now = new byte[buf.readableBytes()];
            buf.getBytes(buf.readerIndex(), now);
            buf.release();
            if (!java.util.Arrays.equals(now, lastGui)) {
                lastGui = now;
                PacketDistributor.sendToPlayer(sp, new GuiStatePayload(containerId, now));
            }
        }
    }

    /** the first sync after the menu opens must always go out */
    public void forceSync() {
        lastGui = null;
    }

    public BlockPos pos() {
        return be.getBlockPos();
    }

    public List<Slot> augmentSlotList() {
        return augmentSlots;
    }
}
