package com.caeport.cae.device;

import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.ListTag;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.material.Fluid;
import net.neoforged.neoforge.fluids.FluidStack;

import java.util.ArrayList;
import java.util.List;

/**
 * The item or fluid filter an augment adds to a device: 15 ghost entries, a deny list by default, an option to compare
 * components (Thermal's "NBT"). The same settings and the same 15 slots as Thermal's filters.
 */
public abstract class DeviceFilter {
    public static final int SIZE = 15;
    public static final DeviceFilter NONE = new DeviceFilter() {
        @Override
        public String type() {
            return "";
        }

        @Override
        public boolean valid(ItemStack stack) {
            return true;
        }

        @Override
        public boolean valid(FluidStack stack) {
            return true;
        }

        @Override
        public void read(HolderLookup.Provider registries, CompoundTag tag) {
        }

        @Override
        public CompoundTag write(HolderLookup.Provider registries, CompoundTag tag) {
            return tag;
        }
    };

    public boolean allowList;
    public boolean checkComponents;

    public abstract String type();

    public abstract boolean valid(ItemStack stack);

    public abstract boolean valid(FluidStack stack);

    public abstract void read(HolderLookup.Provider registries, CompoundTag tag);

    public abstract CompoundTag write(HolderLookup.Provider registries, CompoundTag tag);

    public static DeviceFilter create(String type) {
        return switch (type) {
            case "item" -> new Items();
            case "fluid" -> new Fluids();
            default -> NONE;
        };
    }

    protected void readFlags(CompoundTag sub) {
        allowList = sub.getBoolean("AllowList");
        checkComponents = sub.getBoolean("CheckNBT");
    }

    protected void writeFlags(CompoundTag sub) {
        sub.putBoolean("AllowList", allowList);
        sub.putBoolean("CheckNBT", checkComponents);
    }

    public static final class Items extends DeviceFilter {
        public final List<ItemStack> items = new ArrayList<>();

        public Items() {
            for (int i = 0; i < SIZE; i++) {
                items.add(ItemStack.EMPTY);
            }
        }

        @Override
        public String type() {
            return "item";
        }

        @Override
        public boolean valid(ItemStack stack) {
            if (stack.isEmpty()) {
                return false;
            }
            for (ItemStack f : items) {
                if (!f.isEmpty() && (checkComponents ? ItemStack.isSameItemSameComponents(stack, f) : stack.getItem() == f.getItem())) {
                    return allowList;
                }
            }
            return !allowList;
        }

        @Override
        public boolean valid(FluidStack stack) {
            return true;
        }

        @Override
        public void read(HolderLookup.Provider registries, CompoundTag tag) {
            CompoundTag sub = tag.getCompound("Filter");
            for (int i = 0; i < SIZE; i++) {
                items.set(i, ItemStack.EMPTY);
            }
            for (int i = 0; i < sub.getList("ItemInv", 10).size(); i++) {
                CompoundTag t = sub.getList("ItemInv", 10).getCompound(i);
                int slot = t.getByte("Slot");
                if (slot >= 0 && slot < SIZE) {
                    items.set(slot, ItemStack.parse(registries, t).orElse(ItemStack.EMPTY));
                }
            }
            readFlags(sub);
        }

        @Override
        public CompoundTag write(HolderLookup.Provider registries, CompoundTag tag) {
            CompoundTag sub = new CompoundTag();
            ListTag list = new ListTag();
            for (int i = 0; i < SIZE; i++) {
                if (!items.get(i).isEmpty()) {
                    CompoundTag t = (CompoundTag) items.get(i).save(registries, new CompoundTag());
                    t.putByte("Slot", (byte) i);
                    list.add(t);
                }
            }
            sub.put("ItemInv", list);
            writeFlags(sub);
            tag.put("Filter", sub);
            return tag;
        }
    }

    public static final class Fluids extends DeviceFilter {
        public final List<FluidStack> fluids = new ArrayList<>();

        public Fluids() {
            for (int i = 0; i < SIZE; i++) {
                fluids.add(FluidStack.EMPTY);
            }
        }

        @Override
        public String type() {
            return "fluid";
        }

        @Override
        public boolean valid(ItemStack stack) {
            return true;
        }

        @Override
        public boolean valid(FluidStack stack) {
            if (stack.isEmpty()) {
                return false;
            }
            for (FluidStack f : fluids) {
                if (!f.isEmpty() && (checkComponents ? FluidStack.isSameFluidSameComponents(stack, f) : stack.getFluid() == f.getFluid())) {
                    return allowList;
                }
            }
            return !allowList;
        }

        @Override
        public void read(HolderLookup.Provider registries, CompoundTag tag) {
            CompoundTag sub = tag.getCompound("Filter");
            for (int i = 0; i < SIZE; i++) {
                fluids.set(i, FluidStack.EMPTY);
            }
            ListTag list = sub.getList("FluidInv", 10);
            for (int i = 0; i < list.size(); i++) {
                CompoundTag t = list.getCompound(i);
                int slot = t.getByte("Slot");
                if (slot >= 0 && slot < SIZE) {
                    fluids.set(slot, FluidStack.parse(registries, t).orElse(FluidStack.EMPTY));
                }
            }
            readFlags(sub);
        }

        @Override
        public CompoundTag write(HolderLookup.Provider registries, CompoundTag tag) {
            CompoundTag sub = new CompoundTag();
            ListTag list = new ListTag();
            for (int i = 0; i < SIZE; i++) {
                if (!fluids.get(i).isEmpty()) {
                    CompoundTag t = (CompoundTag) fluids.get(i).save(registries);
                    t.putByte("Slot", (byte) i);
                    list.add(t);
                }
            }
            sub.put("FluidInv", list);
            writeFlags(sub);
            tag.put("Filter", sub);
            return tag;
        }
    }

    /** The bucket (or any container) that stands for a fluid in a filter slot of the menu. */
    public static ItemStack iconFor(FluidStack fs) {
        if (fs.isEmpty()) {
            return ItemStack.EMPTY;
        }
        Item bucket = fs.getFluid().getBucket();
        return bucket == net.minecraft.world.item.Items.AIR ? new ItemStack(net.minecraft.world.item.Items.BUCKET) : new ItemStack(bucket);
    }

    public static ResourceLocation id(Fluid f) {
        return BuiltInRegistries.FLUID.getKey(f);
    }
}
