package com.caeport.cae.feather;

import net.neoforged.neoforge.common.ModConfigSpec;

/** The 1.18.2 Magic Feather's {@code magicfeather-common.toml}, same keys and defaults. */
public final class MagicFeatherConfig {
    public enum FallStyle { SLOW_FALL, NEGATE_FALL_DAMAGE }

    public enum VerticalRange {
        /** Vanilla Java: the beacon's range reaches 256 blocks above it, none below. */
        Java(0, 256),
        FullHeight(0, 0);

        public final int down;
        public final int up;

        VerticalRange(int down, int up) {
            this.down = down;
            this.up = up;
        }
    }

    public static final ModConfigSpec SPEC;
    public static final ModConfigSpec.EnumValue<FallStyle> FALL_STYLE;
    public static final ModConfigSpec.IntValue RANGE_STEP;
    public static final ModConfigSpec.IntValue BASE_RANGE;
    public static final ModConfigSpec.EnumValue<VerticalRange> VERTICAL_RANGE;
    public static final ModConfigSpec.BooleanValue REQUIRES_CURIOS;

    static {
        ModConfigSpec.Builder b = new ModConfigSpec.Builder();
        FALL_STYLE = b.comment("When losing the ability to fly, should the player receive a slow fall effect or simply negate the fall damage?",
                "Allowed Values: SLOW_FALL, NEGATE_FALL_DAMAGE")
                .defineEnum("too_close_to_the_sun_behavior", FallStyle.NEGATE_FALL_DAMAGE);
        b.push("range_computation");
        RANGE_STEP = b.comment("How many blocks are added to the range per level?")
                .defineInRange("range_step", 10, Integer.MIN_VALUE, Integer.MAX_VALUE);
        BASE_RANGE = b.comment("What is the beacon base range?")
                .defineInRange("base_range", 10, Integer.MIN_VALUE, Integer.MAX_VALUE);
        VERTICAL_RANGE = b.comment("How the beacon range is calculated vertically. Java = Vanilla Java Behavior. FullHeight = expand vertical range to maximum",
                "Allowed Values: Java, FullHeight")
                .defineEnum("vertical_range_type", VerticalRange.FullHeight);
        b.pop();
        b.push("item");
        REQUIRES_CURIOS = b.comment("If curios is installed, the magic feather will need to be installed in its charm slot to function.")
                .define("requires_curios", true);
        b.pop();
        SPEC = b.build();
    }

    private MagicFeatherConfig() {
    }
}
