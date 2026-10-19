package com.caeport.cae.mixin;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mojang.logging.LogUtils;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.ServerAdvancementManager;
import net.minecraft.server.packs.resources.ResourceManager;
import net.minecraft.util.profiling.ProfilerFiller;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import java.util.Map;

/**
 * Quark's Automatic Recipe Unlock gives every player every recipe at login, so the ~11,600 recipe advancements (which
 * only unlock recipe book entries) end up "done" in every player's advancement file: 2 MB per player, parsed on the
 * main thread at each join (a 3-4 s freeze on the live server) and rewritten at each save. Its "Filter Recipe
 * Advancements" option is meant to drop them, and logs that it did, but in Quark 4.1-487 they still load (the log's
 * next line counts all 13,017 advancements). Drop them before they're parsed, with Quark's own test: an advancement
 * under {@code recipes/} with a {@code has_the_recipe} criterion. Old entries in player files are skipped at load and
 * gone after the next save.
 */
@Mixin(ServerAdvancementManager.class)
public abstract class RecipeAdvancementFilterMixin {
    @Inject(method = "apply(Ljava/util/Map;Lnet/minecraft/server/packs/resources/ResourceManager;Lnet/minecraft/util/profiling/ProfilerFiller;)V",
            at = @At("HEAD"))
    private void cae$dropRecipeAdvancements(Map<ResourceLocation, JsonElement> advancements, ResourceManager resources,
                                            ProfilerFiller profiler, CallbackInfo ci) {
        int before = advancements.size();
        try {
            advancements.entrySet().removeIf(entry -> cae$isRecipeAdvancement(entry.getKey(), entry.getValue()));
        } catch (UnsupportedOperationException e) {
            LogUtils.getLogger().warn("Recipe advancements not filtered: the advancement map is read-only");
            return;
        }
        LogUtils.getLogger().info("Dropped {} recipe advancements ({} left)", before - advancements.size(), advancements.size());
    }

    private static boolean cae$isRecipeAdvancement(ResourceLocation id, JsonElement json) {
        if (!id.getPath().startsWith("recipes/") || !json.isJsonObject()) {
            return false;
        }
        JsonObject root = json.getAsJsonObject();
        if (!root.has("criteria") || !root.get("criteria").isJsonObject() || !root.getAsJsonObject("criteria").has("has_the_recipe")) {
            return false;
        }
        // keep any that show a toast or give more than recipes (items, experience, a function)
        if (root.has("display")) {
            return false;
        }
        if (root.has("rewards") && root.get("rewards").isJsonObject()) {
            for (String reward : root.getAsJsonObject("rewards").keySet()) {
                if (!reward.equals("recipes")) {
                    return false;
                }
            }
        }
        return true;
    }
}
