package com.caeport.cae.device;

import net.neoforged.neoforge.energy.IEnergyStorage;

/** The energy of a device that has some (Thermal's EnergyStorageCoFH, as Forge Energy): a base capacity and transfer, scaled by augments. */
public class DeviceEnergy implements IEnergyStorage {
    public final int baseCapacity;
    public final int baseTransfer;
    private int capacity;
    private int transfer;
    private int stored;
    private final Runnable changed;

    public DeviceEnergy(int capacity, int transfer, Runnable changed) {
        this.baseCapacity = capacity;
        this.baseTransfer = transfer;
        this.capacity = capacity;
        this.transfer = transfer;
        this.changed = changed;
    }

    public void applyModifiers(float capacityMod, float transferMod) {
        capacity = Math.max(0, Math.round(baseCapacity * capacityMod));
        transfer = Math.max(0, Math.round(baseTransfer * transferMod));
        stored = Math.min(stored, capacity);
    }

    public void set(int value) {
        stored = Math.max(0, Math.min(capacity, value));
    }

    /** add (positive) or take (negative) energy directly, ignoring the transfer limit */
    public void modify(int amount) {
        stored = Math.max(0, Math.min(capacity, stored + amount));
        changed.run();
    }

    public int space() {
        return capacity - stored;
    }

    public int maxReceive() {
        return transfer;
    }

    @Override
    public int receiveEnergy(int max, boolean simulate) {
        int n = Math.min(Math.min(capacity - stored, transfer), max);
        if (n > 0 && !simulate) {
            stored += n;
            changed.run();
        }
        return Math.max(0, n);
    }

    @Override
    public int extractEnergy(int max, boolean simulate) {
        int n = Math.min(Math.min(stored, transfer), max);
        if (n > 0 && !simulate) {
            stored -= n;
            changed.run();
        }
        return Math.max(0, n);
    }

    @Override
    public int getEnergyStored() {
        return stored;
    }

    @Override
    public int getMaxEnergyStored() {
        return capacity;
    }

    @Override
    public boolean canExtract() {
        return true;
    }

    @Override
    public boolean canReceive() {
        return true;
    }
}
