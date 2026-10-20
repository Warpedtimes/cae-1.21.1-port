package com.caeport.cae.client;

import com.caeport.cae.Cae;
import net.minecraft.client.color.block.BlockColor;
import net.minecraft.client.renderer.BiomeColors;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.level.GrassColor;
import net.minecraft.world.level.block.Block;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.client.event.RegisterColorHandlersEvent;

import java.util.List;

/**
 * Immersive Weathering 1.18.2 shipped a resource pack ("biome tinted mossy blocks") that drew the moss of the mossy
 * cobblestone, mossy stone bricks and its own mossy stone as a second, biome-tinted layer (tintindex 0), and tinted it with
 * the biome's grass colour in code. The pack restores those models (kubejs/assets, tools/restore_looks.py); this gives the
 * layer its colour again. A block that is not there is skipped.
 */
@EventBusSubscriber(modid = Cae.ID, value = Dist.CLIENT)
public final class MossyTint {
    private static final List<String> BLOCKS = List.of(
            "minecraft:mossy_cobblestone", "minecraft:mossy_cobblestone_slab", "minecraft:mossy_cobblestone_stairs",
            "minecraft:mossy_cobblestone_wall", "minecraft:mossy_stone_bricks", "minecraft:mossy_stone_brick_slab",
            "minecraft:mossy_stone_brick_stairs", "minecraft:mossy_stone_brick_wall",
            "immersive_weathering:mossy_stone", "immersive_weathering:mossy_stone_slab",
            "immersive_weathering:mossy_stone_stairs", "immersive_weathering:mossy_stone_wall",
            "immersive_weathering:mossy_bricks", "immersive_weathering:mossy_brick_slab",
            "immersive_weathering:mossy_brick_stairs", "immersive_weathering:mossy_brick_wall");

    private MossyTint() {
    }

    @SubscribeEvent
    public static void colors(RegisterColorHandlersEvent.Block event) {
        BlockColor grass = (state, level, pos, tintIndex) ->
                level != null && pos != null ? BiomeColors.getAverageGrassColor(level, pos) : GrassColor.getDefaultColor();
        for (String id : BLOCKS) {
            ResourceLocation rl = ResourceLocation.parse(id);
            if (BuiltInRegistries.BLOCK.containsKey(rl)) {
                Block b = BuiltInRegistries.BLOCK.get(rl);
                event.register(grass, b);
            }
        }
    }

    @SubscribeEvent
    public static void itemColors(RegisterColorHandlersEvent.Item event) {
        for (String id : BLOCKS) {
            ResourceLocation rl = ResourceLocation.parse(id);
            if (BuiltInRegistries.ITEM.containsKey(rl)) {
                event.register((stack, tintIndex) -> GrassColor.getDefaultColor(), BuiltInRegistries.ITEM.get(rl));
            }
        }
    }
}
