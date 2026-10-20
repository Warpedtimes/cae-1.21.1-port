package com.caeport.cae.device;

import java.util.ArrayList;
import java.util.List;

/** Where the slots, tanks and bars of a device's screen are, in Thermal's coordinates (the 176 x 166 container texture). */
public final class GuiLayout {
    /** a slot of the device's inventory; output slots take nothing by hand */
    public record SlotDef(int index, int x, int y, boolean output) {
    }

    /** a medium fluid gauge (18 x 42) for tank {@code tank} */
    public record TankDef(int tank, int x, int y) {
    }

    public enum BarKind {
        /** 16 x 16, fills from the bottom: boost cycles left (Thermal's createDefaultDuration) */
        DURATION,
        /** the same 16 x 16 bar, filled by the progress instead (the soil infuser's flame) */
        SCALE_PROGRESS,
        /** 24 x 16 arrow filling to the right (createDefaultProgress) */
        PROGRESS,
        /** the same arrow, coloured with the device's render fluid (createDefaultFluidProgress) */
        FLUID_PROGRESS
    }

    public record BarDef(BarKind kind, String texture, int x, int y) {
    }

    public final List<SlotDef> slots = new ArrayList<>();
    public final List<TankDef> tanks = new ArrayList<>();
    public final List<BarDef> bars = new ArrayList<>();
    /** energy gauges (16 x 42) at these positions */
    public final List<int[]> energies = new ArrayList<>();

    public GuiLayout energy(int x, int y) {
        energies.add(new int[]{x, y});
        return this;
    }

    public GuiLayout slot(int index, int x, int y) {
        slots.add(new SlotDef(index, x, y, false));
        return this;
    }

    public GuiLayout outSlot(int index, int x, int y) {
        slots.add(new SlotDef(index, x, y, true));
        return this;
    }

    public GuiLayout tank(int tank, int x, int y) {
        tanks.add(new TankDef(tank, x, y));
        return this;
    }

    public GuiLayout duration(String texture, int x, int y) {
        bars.add(new BarDef(BarKind.DURATION, texture, x, y));
        return this;
    }

    public GuiLayout scaleProgress(String texture, int x, int y) {
        bars.add(new BarDef(BarKind.SCALE_PROGRESS, texture, x, y));
        return this;
    }

    public GuiLayout progress(String texture, int x, int y) {
        bars.add(new BarDef(BarKind.PROGRESS, texture, x, y));
        return this;
    }

    public GuiLayout fluidProgress(String texture, int x, int y) {
        bars.add(new BarDef(BarKind.FLUID_PROGRESS, texture, x, y));
        return this;
    }
}
