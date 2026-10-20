package com.caeport.cae.device;

import com.caeport.cae.Cae;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.material.Fluid;
import net.minecraft.world.level.material.Fluids;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Which trees the Arboreal Extractor taps and what they give: trunk block, leaf block, fluid and mB per cycle (the
 * {@code thermal:tree_extractor} recipes of Thermal Expansion 9.2.2 and Thermal Integration 9.2.1 and of the pack, kept in
 * {@code data/cae/device/tree_extractor.json}). For one trunk, a later row for the same leaves replaces an earlier one.
 */
public final class TreeTable {
    public record Row(Block leaves, Fluid fluid, int amount) {
    }

    private static Map<Block, Map<Block, Row>> byTrunk;

    private TreeTable() {
    }

    private static synchronized Map<Block, Map<Block, Row>> table() {
        if (byTrunk == null) {
            Map<Block, Map<Block, Row>> map = new HashMap<>();
            try (InputStream in = TreeTable.class.getResourceAsStream("/data/cae/device/tree_extractor.json")) {
                JsonObject root = JsonParser.parseReader(new InputStreamReader(in, StandardCharsets.UTF_8)).getAsJsonObject();
                JsonArray rows = root.getAsJsonArray("rows");
                for (JsonElement e : rows) {
                    JsonObject o = e.getAsJsonObject();
                    Block trunk = block(o.get("trunk").getAsString());
                    Block leaves = block(o.get("leaves").getAsString());
                    Fluid fluid = fluid(o.get("fluid").getAsString());
                    if (trunk == null || leaves == null || fluid == null) {
                        continue;
                    }
                    map.computeIfAbsent(trunk, k -> new LinkedHashMap<>()).put(leaves, new Row(leaves, fluid, o.get("amount").getAsInt()));
                }
            } catch (Exception ex) {
                throw new IllegalStateException("cannot read the Arboreal Extractor's tree table", ex);
            }
            byTrunk = map;
        }
        return byTrunk;
    }

    private static Block block(String id) {
        return BuiltInRegistries.BLOCK.getOptional(ResourceLocation.parse(id)).orElse(null);
    }

    private static Fluid fluid(String id) {
        Fluid f = BuiltInRegistries.FLUID.getOptional(ResourceLocation.parse(id)).orElse(null);
        return f == null || f == Fluids.EMPTY ? null : f;
    }

    public static boolean isTrunk(Block b) {
        return table().containsKey(b);
    }

    /** leaf block -> row, for one trunk block */
    public static Map<Block, Row> leavesOf(Block trunk) {
        return table().getOrDefault(trunk, Map.of());
    }

    static ResourceLocation id() {
        return Cae.asResource("device/tree_extractor.json");
    }
}
