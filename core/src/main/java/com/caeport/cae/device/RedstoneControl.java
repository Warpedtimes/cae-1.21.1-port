package com.caeport.cae.device;

import net.minecraft.nbt.CompoundTag;

/**
 * Thermal's redstone control for devices: ignored (the default), enabled by a low signal, enabled by a high signal.
 * (Thermal's other modes, with thresholds, were for machines and are not in the device screen.)
 */
public final class RedstoneControl {
    public enum Mode {
        DISABLED, LOW, HIGH;

        public static final Mode[] VALUES = values();
    }

    public Mode mode = Mode.DISABLED;
    public int power;

    public boolean state() {
        return switch (mode) {
            case LOW -> power <= 0;
            case HIGH -> power > 0;
            default -> true;
        };
    }

    public void write(CompoundTag tag) {
        CompoundTag sub = new CompoundTag();
        sub.putByte("RSPower", (byte) power);
        sub.putByte("RSThreshold", (byte) 0);
        sub.putByte("RSMode", (byte) mode.ordinal());
        tag.put("RSControl", sub);
    }

    public void read(CompoundTag tag) {
        CompoundTag sub = tag.getCompound("RSControl");
        if (!sub.isEmpty()) {
            power = sub.getByte("RSPower");
            int m = sub.getByte("RSMode");
            mode = m >= 0 && m < Mode.VALUES.length ? Mode.VALUES[m] : Mode.DISABLED;
        }
    }

    /** What a dropped device keeps: the mode, not the signal. */
    public void writeSettings(CompoundTag tag) {
        CompoundTag sub = new CompoundTag();
        sub.putByte("RSThreshold", (byte) 0);
        sub.putByte("RSMode", (byte) mode.ordinal());
        tag.put("RSControl", sub);
    }

    public void readSettings(CompoundTag tag) {
        CompoundTag sub = tag.getCompound("RSControl");
        if (!sub.isEmpty()) {
            int m = sub.getByte("RSMode");
            mode = m >= 0 && m < Mode.VALUES.length ? Mode.VALUES[m] : Mode.DISABLED;
        }
    }
}
