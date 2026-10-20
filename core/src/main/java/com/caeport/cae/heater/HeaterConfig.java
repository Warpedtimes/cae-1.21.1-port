package com.caeport.cae.heater;

import net.neoforged.neoforge.common.ModConfigSpec;

/** {@code [machines.heater]} of Compressed Creativity's {@code compressedcreativity-common.toml}: same keys and defaults. */
public final class HeaterConfig {
    public static final ModConfigSpec SPEC;
    public static final ModConfigSpec.IntValue STARTING_TEMPERATURE;
    public static final ModConfigSpec.DoubleValue TEMPERATURE_COEFFICIENT;
    public static final ModConfigSpec.IntValue TEMPERATURE_PASSIVE;
    public static final ModConfigSpec.IntValue TEMPERATURE_KINDLED;
    public static final ModConfigSpec.IntValue TEMPERATURE_SEETHING;
    public static final ModConfigSpec.DoubleValue THERMAL_CAPACITY;
    public static final ModConfigSpec.DoubleValue THERMAL_RESISTANCE;

    static {
        ModConfigSpec.Builder b = new ModConfigSpec.Builder();
        b.comment("Heater").push("machines").push("heater");
        STARTING_TEMPERATURE = b.comment("At what temperature the heater will start cooling down")
                .defineInRange("starting_temperature", 100, 0, Integer.MAX_VALUE);
        TEMPERATURE_COEFFICIENT = b.comment("Temperature coefficient increase, this much heat is consumed for each degree over starting temperature")
                .defineInRange("temperature_coefficient", 0.1, 0.0, 100.0);
        TEMPERATURE_PASSIVE = b.comment("At what temperature the heater will be considered as passive heat source for Steam Engine (like a campfire)")
                .defineInRange("temperature_passive", 100, 0, Integer.MAX_VALUE);
        TEMPERATURE_KINDLED = b.comment("At what temperature the heater will be considered as active heat source for Steam Engine and Basin recipes (like a fueled Blaze Burner)")
                .defineInRange("temperature_kindled", 200, 0, Integer.MAX_VALUE);
        TEMPERATURE_SEETHING = b.comment("At what temperature the heater will be considered as seething (like a Blaze Burner fed with Blaze Cake)")
                .defineInRange("temperature_seething", 300, 0, Integer.MAX_VALUE);
        THERMAL_CAPACITY = b.comment("Thermal capacity of a Heater")
                .defineInRange("thermal_capacity", 2.0, 0.0, 100.0);
        THERMAL_RESISTANCE = b.comment("Thermal resistance of a Heater")
                .defineInRange("thermal_resistance", 1.0, 0.0, 100.0);
        b.pop(2);
        SPEC = b.build();
    }

    private HeaterConfig() {
    }
}
