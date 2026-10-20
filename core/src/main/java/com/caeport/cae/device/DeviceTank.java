package com.caeport.cae.device;

import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.ListTag;
import net.minecraft.nbt.Tag;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;
import net.neoforged.neoforge.fluids.capability.templates.FluidTank;

import java.util.ArrayList;
import java.util.List;
import java.util.function.BooleanSupplier;
import java.util.function.Predicate;

/** A fluid tank of a device: its group says what automation may do with it, its capacity follows the augments. */
public class DeviceTank extends FluidTank {
    public enum Group { INPUT, OUTPUT, ACCESSIBLE, INTERNAL }

    public final Group group;
    public final int baseCapacity;
    public BooleanSupplier creative = () -> false;
    public BooleanSupplier enabled = () -> true;
    private final Runnable changed;

    public DeviceTank(int capacity, Group group, Predicate<FluidStack> validator, Runnable changed) {
        super(capacity, validator);
        this.group = group;
        this.baseCapacity = capacity;
        this.changed = changed;
    }

    public DeviceTank(int capacity, Group group, Runnable changed) {
        this(capacity, group, fs -> true, changed);
    }

    @Override
    protected void onContentsChanged() {
        changed.run();
    }

    public void applyModifier(float mod) {
        setCapacity(Math.max(0, Math.round(baseCapacity * mod)));
        if (fluid.getAmount() > capacity) {
            fluid.setAmount(capacity);
        }
    }

    @Override
    public int fill(FluidStack resource, FluidAction action) {
        if (creative.getAsBoolean() && !fluid.isEmpty()) {
            return FluidStack.isSameFluidSameComponents(fluid, resource) ? resource.getAmount() : 0;
        }
        int filled = super.fill(resource, action);
        if (creative.getAsBoolean() && action.execute() && !fluid.isEmpty()) {
            fluid.setAmount(capacity);
        }
        return filled;
    }

    @Override
    public FluidStack drain(int maxDrain, FluidAction action) {
        if (creative.getAsBoolean() && !fluid.isEmpty()) {
            return fluid.copyWithAmount(Math.min(maxDrain, fluid.getAmount()));
        }
        return super.drain(maxDrain, action);
    }

    @Override
    public FluidStack drain(FluidStack resource, FluidAction action) {
        if (creative.getAsBoolean() && !fluid.isEmpty()) {
            return FluidStack.isSameFluidSameComponents(fluid, resource) ? resource.copyWithAmount(Math.min(resource.getAmount(), fluid.getAmount())) : FluidStack.EMPTY;
        }
        return super.drain(resource, action);
    }

    /** Add (positive) or remove (negative) fluid directly, ignoring the filter; returns the amount moved. */
    public int modify(FluidStack stack, int amount) {
        if (amount > 0) {
            return super.fill(stack.copyWithAmount(amount), IFluidHandler.FluidAction.EXECUTE);
        }
        int n = Math.min(-amount, fluid.getAmount());
        fluid.shrink(n);
        if (fluid.isEmpty()) {
            fluid = FluidStack.EMPTY;
        }
        onContentsChanged();
        return n;
    }

    public void clearFluid() {
        fluid = FluidStack.EMPTY;
        onContentsChanged();
    }

    public boolean isFull() {
        return fluid.getAmount() >= capacity;
    }

    /** What hoppers and pipes see of all the tanks: fills go to INPUT / ACCESSIBLE tanks, drains come from OUTPUT / ACCESSIBLE ones. */
    public static IFluidHandler view(List<DeviceTank> all) {
        List<DeviceTank> tanks = new ArrayList<>();
        for (DeviceTank t : all) {
            if (t.group != Group.INTERNAL) {
                tanks.add(t);
            }
        }
        return new IFluidHandler() {
            @Override
            public int getTanks() {
                return tanks.size();
            }

            @Override
            public FluidStack getFluidInTank(int tank) {
                DeviceTank t = tanks.get(tank);
                return t.enabled.getAsBoolean() ? t.getFluid() : FluidStack.EMPTY;
            }

            @Override
            public int getTankCapacity(int tank) {
                return tanks.get(tank).getCapacity();
            }

            @Override
            public boolean isFluidValid(int tank, FluidStack stack) {
                DeviceTank t = tanks.get(tank);
                return t.enabled.getAsBoolean() && (t.group == Group.INPUT || t.group == Group.ACCESSIBLE) && t.isFluidValid(stack);
            }

            @Override
            public int fill(FluidStack resource, FluidAction action) {
                for (DeviceTank t : tanks) {
                    if (t.enabled.getAsBoolean() && (t.group == Group.INPUT || t.group == Group.ACCESSIBLE)) {
                        int n = t.fill(resource, action);
                        if (n > 0) {
                            return n;
                        }
                    }
                }
                return 0;
            }

            @Override
            public FluidStack drain(FluidStack resource, FluidAction action) {
                for (DeviceTank t : tanks) {
                    if (t.enabled.getAsBoolean() && (t.group == Group.OUTPUT || t.group == Group.ACCESSIBLE)) {
                        FluidStack out = t.drain(resource, action);
                        if (!out.isEmpty()) {
                            return out;
                        }
                    }
                }
                return FluidStack.EMPTY;
            }

            @Override
            public FluidStack drain(int maxDrain, FluidAction action) {
                for (DeviceTank t : tanks) {
                    if (t.enabled.getAsBoolean() && (t.group == Group.OUTPUT || t.group == Group.ACCESSIBLE)) {
                        FluidStack out = t.drain(maxDrain, action);
                        if (!out.isEmpty()) {
                            return out;
                        }
                    }
                }
                return FluidStack.EMPTY;
            }
        };
    }

    public static ListTag save(HolderLookup.Provider registries, List<DeviceTank> tanks) {
        ListTag list = new ListTag();
        for (int i = 0; i < tanks.size(); i++) {
            FluidStack fs = tanks.get(i).getFluid();
            if (!fs.isEmpty()) {
                CompoundTag t = (CompoundTag) fs.save(registries);
                t.putByte("Tank", (byte) i);
                list.add(t);
            }
        }
        return list;
    }

    public static void load(HolderLookup.Provider registries, List<DeviceTank> tanks, ListTag list) {
        for (DeviceTank t : tanks) {
            t.setFluid(FluidStack.EMPTY);
        }
        for (Tag raw : list) {
            if (raw instanceof CompoundTag t) {
                int i = t.getByte("Tank");
                if (i >= 0 && i < tanks.size()) {
                    tanks.get(i).setFluid(FluidStack.parse(registries, t).orElse(FluidStack.EMPTY));
                }
            }
        }
    }
}
