package com.caeport.cae.feather;

import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.item.Item;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.config.ModConfig;
import net.neoforged.neoforge.common.NeoForge;
import net.neoforged.neoforge.event.tick.PlayerTickEvent;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

/** Registered under the old mod's namespace, {@code magicfeather}, so the pack's quests and recipes keep its ID. */
public final class MagicFeather {
    public static final String NAMESPACE = "magicfeather";
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(BuiltInRegistries.ITEM, NAMESPACE);

    public static final DeferredHolder<Item, MagicFeatherItem> ITEM = ITEMS.register("magicfeather",
            () -> new MagicFeatherItem(new Item.Properties().stacksTo(1)));

    private MagicFeather() {
    }

    public static void register(IEventBus modBus, ModContainer container) {
        ITEMS.register(modBus);
        container.registerConfig(ModConfig.Type.COMMON, MagicFeatherConfig.SPEC, "magicfeather-common.toml");
        NeoForge.EVENT_BUS.addListener(PlayerTickEvent.Post.class, MagicFeatherItem::onPlayerTick);
    }
}
