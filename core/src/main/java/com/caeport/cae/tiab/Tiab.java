package com.caeport.cae.tiab;

import com.mojang.serialization.Codec;
import net.minecraft.core.component.DataComponentType;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.codec.ByteBufCodecs;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.item.Item;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

/** Registered under the old mod's namespace, {@code tiab}, so the pack's quests and scripts keep their IDs. */
public final class Tiab {
    public static final String NAMESPACE = "tiab";
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(BuiltInRegistries.ITEM, NAMESPACE);
    public static final DeferredRegister<EntityType<?>> ENTITIES = DeferredRegister.create(BuiltInRegistries.ENTITY_TYPE, NAMESPACE);
    public static final DeferredRegister<DataComponentType<?>> COMPONENTS =
            DeferredRegister.create(BuiltInRegistries.DATA_COMPONENT_TYPE, NAMESPACE);

    /** The ticks stored in a Time in a Bottle ({@code tiab:stored_time}); it was the {@code storedTime} item NBT tag in 1.18/1.20. */
    public static final DeferredHolder<DataComponentType<?>, DataComponentType<Integer>> STORED_TIME = COMPONENTS.register(
            "stored_time", () -> DataComponentType.<Integer>builder()
                    .persistent(Codec.intRange(0, Integer.MAX_VALUE))
                    .networkSynchronized(ByteBufCodecs.VAR_INT)
                    .build());

    public static final DeferredHolder<Item, TimeInABottle> TIME_IN_A_BOTTLE = ITEMS.register("time_in_a_bottle",
            () -> new TimeInABottle(new Item.Properties().stacksTo(1).component(STORED_TIME.get(), 0)));
    public static final DeferredHolder<EntityType<?>, EntityType<TimeAccelerator>> TIME_ACCELERATOR = ENTITIES.register("time_accelerator",
            () -> EntityType.Builder.<TimeAccelerator>of(TimeAccelerator::new, MobCategory.MISC)
                    .sized(0.1F, 0.1F).noSummon().fireImmune().clientTrackingRange(8)
                    .build(NAMESPACE + ":time_accelerator"));

    private Tiab() {
    }

    public static void register(IEventBus modBus) {
        COMPONENTS.register(modBus);
        ITEMS.register(modBus);
        ENTITIES.register(modBus);
    }
}
