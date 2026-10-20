package com.caeport.cae.heater;

import com.simibubi.create.api.boiler.BoilerHeater;
import com.simibubi.create.foundation.data.SharedProperties;
import me.desht.pneumaticcraft.api.PNCCapabilities;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.fml.config.ModConfig;
import net.neoforged.fml.event.lifecycle.FMLCommonSetupEvent;
import net.neoforged.neoforge.capabilities.RegisterCapabilitiesEvent;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

/**
 * Registered under the old mod's namespace, {@code compressedcreativity}, so the pack's quests and recipes keep the
 * heater's ID. Only the heater: the rest of Compressed Creativity has no 1.21.1 build.
 */
public final class HeaterRegistry {
    public static final String NAMESPACE = "compressedcreativity";
    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(BuiltInRegistries.BLOCK, NAMESPACE);
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(BuiltInRegistries.ITEM, NAMESPACE);
    public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
            DeferredRegister.create(BuiltInRegistries.BLOCK_ENTITY_TYPE, NAMESPACE);

    public static final DeferredHolder<Block, HeaterBlock> HEATER = BLOCKS.register("heater",
            () -> new HeaterBlock(net.minecraft.world.level.block.state.BlockBehaviour.Properties.ofFullCopy(SharedProperties.stone())));
    public static final DeferredHolder<Item, BlockItem> HEATER_ITEM = ITEMS.register("heater",
            () -> new BlockItem(HEATER.get(), new Item.Properties()));
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<HeaterBlockEntity>> HEATER_BE =
            BLOCK_ENTITIES.register("heater", () -> BlockEntityType.Builder.of(HeaterBlockEntity::new, HEATER.get()).build(null));

    private HeaterRegistry() {
    }

    public static void register(IEventBus modBus, ModContainer container) {
        BLOCKS.register(modBus);
        ITEMS.register(modBus);
        BLOCK_ENTITIES.register(modBus);
        container.registerConfig(ModConfig.Type.COMMON, HeaterConfig.SPEC, "compressedcreativity-common.toml");
        modBus.addListener(HeaterRegistry::onCommonSetup);
        modBus.addListener(HeaterRegistry::onCapabilities);
    }

    private static void onCommonSetup(FMLCommonSetupEvent event) {
        // Create's own mapping, as the original registered it: no heat, passive, kindled (1) and seething (2) from the
        // block's burner heat level.
        event.enqueueWork(() -> BoilerHeater.REGISTRY.register(HEATER.get(), BoilerHeater.BLAZE_BURNER));
    }

    private static void onCapabilities(RegisterCapabilitiesEvent event) {
        event.registerBlockEntity(PNCCapabilities.HEAT_EXCHANGER_BLOCK, HEATER_BE.get(),
                (be, side) -> be.getHeatExchanger(side));
    }
}
