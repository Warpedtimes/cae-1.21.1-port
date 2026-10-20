package com.caeport.cae.device;

import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.ListTag;
import net.minecraft.nbt.Tag;
import net.minecraft.world.item.ItemStack;
import net.neoforged.neoforge.items.IItemHandler;
import net.neoforged.neoforge.items.IItemHandlerModifiable;

import java.util.ArrayList;
import java.util.List;
import java.util.function.BooleanSupplier;
import java.util.function.IntConsumer;
import java.util.function.Predicate;

/**
 * The item slots of a device: inputs, outputs, internal slots (the augments, the nullifier's bin) in one list, like
 * Thermal's managed inventory. The object itself is the full-access view the menu and the device use; {@link #view}
 * makes the restricted view hoppers and pipes get.
 */
public class DeviceInventory implements IItemHandlerModifiable {
    /** INPUT: automation may insert. OUTPUT: only the device inserts, automation extracts. ACCESSIBLE: both ways. INTERNAL: no automation. */
    public enum Group { INPUT, OUTPUT, ACCESSIBLE, INTERNAL }

    public static final class Slot {
        public ItemStack stack = ItemStack.EMPTY;
        public final Group group;
        public Predicate<ItemStack> valid = s -> true;
        public int limit = 64;
        /** A slot that is switched off (the rock generator's output while it is idle) takes and gives nothing to automation. */
        public BooleanSupplier enabled = () -> true;

        Slot(Group group) {
            this.group = group;
        }
    }

    private final List<Slot> slots = new ArrayList<>();
    private final IntConsumer changed;

    public DeviceInventory(IntConsumer changed) {
        this.changed = changed;
    }

    public Slot add(Group group) {
        Slot s = new Slot(group);
        if (group == Group.OUTPUT) {
            s.valid = x -> false;
        }
        slots.add(s);
        return s;
    }

    public Slot add(Group group, Predicate<ItemStack> valid) {
        Slot s = add(group);
        if (group != Group.OUTPUT) {
            s.valid = valid;
        }
        return s;
    }

    public Slot slot(int i) {
        return slots.get(i);
    }

    public boolean isEmpty(int i) {
        return slots.get(i).stack.isEmpty();
    }

    public boolean isFull(int i) {
        Slot s = slots.get(i);
        return !s.stack.isEmpty() && s.stack.getCount() >= Math.min(s.limit, s.stack.getMaxStackSize());
    }

    // ---- IItemHandlerModifiable: the full view (menu, device) ----

    @Override
    public int getSlots() {
        return slots.size();
    }

    @Override
    public ItemStack getStackInSlot(int slot) {
        return slots.get(slot).stack;
    }

    @Override
    public void setStackInSlot(int slot, ItemStack stack) {
        slots.get(slot).stack = stack;
        changed.accept(slot);
    }

    @Override
    public int getSlotLimit(int slot) {
        return slots.get(slot).limit;
    }

    @Override
    public boolean isItemValid(int slot, ItemStack stack) {
        return slots.get(slot).valid.test(stack);
    }

    @Override
    public ItemStack insertItem(int slot, ItemStack stack, boolean simulate) {
        if (stack.isEmpty() || !isItemValid(slot, stack)) {
            return stack;
        }
        return put(slot, stack, simulate);
    }

    /** Insert ignoring the slot's filter: how a device fills its own output slots. Returns what did not fit. */
    public ItemStack put(int slot, ItemStack stack, boolean simulate) {
        if (stack.isEmpty()) {
            return ItemStack.EMPTY;
        }
        Slot s = slots.get(slot);
        int limit = Math.min(s.limit, stack.getMaxStackSize());
        if (!s.stack.isEmpty()) {
            if (!ItemStack.isSameItemSameComponents(s.stack, stack)) {
                return stack;
            }
            limit -= s.stack.getCount();
        }
        if (limit <= 0) {
            return stack;
        }
        int moved = Math.min(limit, stack.getCount());
        if (!simulate) {
            if (s.stack.isEmpty()) {
                s.stack = stack.copyWithCount(moved);
            } else {
                s.stack.grow(moved);
            }
            changed.accept(slot);
        }
        return moved == stack.getCount() ? ItemStack.EMPTY : stack.copyWithCount(stack.getCount() - moved);
    }

    /** Put a stack into any of the slots of the given group(s) (the first that takes it), ignoring filters. */
    public ItemStack putInto(ItemStack stack, Group group, boolean simulate) {
        ItemStack rest = stack;
        for (int i = 0; i < slots.size() && !rest.isEmpty(); i++) {
            if (slots.get(i).group == group) {
                rest = put(i, rest, simulate);
            }
        }
        return rest;
    }

    @Override
    public ItemStack extractItem(int slot, int amount, boolean simulate) {
        Slot s = slots.get(slot);
        if (amount <= 0 || s.stack.isEmpty()) {
            return ItemStack.EMPTY;
        }
        int n = Math.min(amount, s.stack.getCount());
        ItemStack out = s.stack.copyWithCount(n);
        if (!simulate) {
            s.stack.shrink(n);
            if (s.stack.isEmpty()) {
                s.stack = ItemStack.EMPTY;
            }
            changed.accept(slot);
        }
        return out;
    }

    /** Add (or remove, with a negative amount) items of the type the slot already holds; used when the slot is empty to set a type. */
    public void modify(int slot, ItemStack template, int amount) {
        Slot s = slots.get(slot);
        if (s.stack.isEmpty()) {
            if (amount > 0) {
                s.stack = template.copyWithCount(Math.min(amount, Math.min(s.limit, template.getMaxStackSize())));
            }
        } else {
            int n = Math.max(0, Math.min(Math.min(s.limit, s.stack.getMaxStackSize()), s.stack.getCount() + amount));
            s.stack.setCount(n);
            if (n == 0) {
                s.stack = ItemStack.EMPTY;
            }
        }
        changed.accept(slot);
    }

    public void consume(int slot, int amount) {
        Slot s = slots.get(slot);
        s.stack.shrink(amount);
        if (s.stack.isEmpty()) {
            s.stack = ItemStack.EMPTY;
        }
        changed.accept(slot);
    }

    public void clear(int slot) {
        slots.get(slot).stack = ItemStack.EMPTY;
        changed.accept(slot);
    }

    // ---- automation view ----

    /**
     * What hoppers, pipes and funnels see. Internal slots are left out. Inserts go to INPUT and ACCESSIBLE slots; extraction
     * takes from OUTPUT and ACCESSIBLE slots, and also from INPUT slots when {@code extractInputs} (Thermal's default; its
     * Aquatic Entangler and Batch Composter only let the outputs out).
     */
    public IItemHandler view(boolean extractInputs) {
        List<Integer> map = new ArrayList<>();
        for (int i = 0; i < slots.size(); i++) {
            if (slots.get(i).group != Group.INTERNAL) {
                map.add(i);
            }
        }
        return new IItemHandler() {
            @Override
            public int getSlots() {
                return map.size();
            }

            @Override
            public ItemStack getStackInSlot(int slot) {
                Slot s = slots.get(map.get(slot));
                return s.enabled.getAsBoolean() ? s.stack : ItemStack.EMPTY;
            }

            @Override
            public ItemStack insertItem(int slot, ItemStack stack, boolean simulate) {
                int i = map.get(slot);
                Slot s = slots.get(i);
                if (!s.enabled.getAsBoolean() || (s.group != Group.INPUT && s.group != Group.ACCESSIBLE)) {
                    return stack;
                }
                return DeviceInventory.this.insertItem(i, stack, simulate);
            }

            @Override
            public ItemStack extractItem(int slot, int amount, boolean simulate) {
                int i = map.get(slot);
                Slot s = slots.get(i);
                if (!s.enabled.getAsBoolean()) {
                    return ItemStack.EMPTY;
                }
                if (s.group == Group.INPUT && !extractInputs) {
                    return ItemStack.EMPTY;
                }
                return DeviceInventory.this.extractItem(i, amount, simulate);
            }

            @Override
            public int getSlotLimit(int slot) {
                return slots.get(map.get(slot)).limit;
            }

            @Override
            public boolean isItemValid(int slot, ItemStack stack) {
                int i = map.get(slot);
                Slot s = slots.get(i);
                return s.enabled.getAsBoolean() && (s.group == Group.INPUT || s.group == Group.ACCESSIBLE) && s.valid.test(stack);
            }
        };
    }

    // ---- saving ----

    /** Slots {@code from} up to (not including) {@code to} as a list of stacks with a "Slot" byte. */
    public ListTag save(HolderLookup.Provider registries, int from, int to) {
        ListTag list = new ListTag();
        for (int i = from; i < to && i < slots.size(); i++) {
            ItemStack st = slots.get(i).stack;
            if (!st.isEmpty()) {
                CompoundTag t = (CompoundTag) st.save(registries, new CompoundTag());
                t.putByte("Slot", (byte) i);
                list.add(t);
            }
        }
        return list;
    }

    public void load(HolderLookup.Provider registries, ListTag list, int from, int to) {
        for (int i = from; i < to && i < slots.size(); i++) {
            slots.get(i).stack = ItemStack.EMPTY;
        }
        for (Tag raw : list) {
            if (raw instanceof CompoundTag t) {
                int slot = t.getByte("Slot");
                if (slot >= from && slot < to && slot < slots.size()) {
                    slots.get(slot).stack = ItemStack.parse(registries, t).orElse(ItemStack.EMPTY);
                }
            }
        }
    }

    /** KubeJS 7's inventory attachment format: a list of stacks with a "slot" byte (from 0 within that inventory). */
    public void loadLegacy(HolderLookup.Provider registries, Tag tag, int firstSlot, int count) {
        for (int i = 0; i < count && firstSlot + i < slots.size(); i++) {
            slots.get(firstSlot + i).stack = ItemStack.EMPTY;
        }
        if (tag instanceof ListTag list) {
            for (Tag raw : list) {
                if (raw instanceof CompoundTag t) {
                    int slot = t.getByte("slot");
                    if (slot >= 0 && slot < count && firstSlot + slot < slots.size()) {
                        slots.get(firstSlot + slot).stack = ItemStack.parse(registries, t).orElse(ItemStack.EMPTY);
                    }
                }
            }
        }
    }
}
