package com.caeport.cae.mixin;

import net.minecraft.client.gui.screens.worldselection.CreateWorldScreen;
import net.minecraft.world.flag.FeatureFlagSet;
import net.minecraft.world.flag.FeatureFlags;
import net.minecraft.world.level.DataPackConfig;
import net.minecraft.world.level.WorldDataConfiguration;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyArg;

import java.util.ArrayList;
import java.util.List;

/**
 * New singleplayer worlds start with the vanilla "bundle" experiment ticked (owner, 25 Oct 2026: bundles on by default for
 * every world; the Leather Pocket and a task need them). Create World starts from WorldDataConfiguration.DEFAULT, so the
 * bundle pack and its feature flag are added there; the player can still untick it under Experiments. Servers get the
 * same from initial-enabled-packs in server.properties, and an existing world from tools/enable_bundle.py.
 */
@Mixin(CreateWorldScreen.class)
public abstract class CreateWorldBundleMixin {
    @ModifyArg(method = "openFresh", at = @At(value = "INVOKE", target = "Lnet/minecraft/client/gui/screens/worldselection/CreateWorldScreen;"
            + "createDefaultLoadConfig(Lnet/minecraft/server/packs/repository/PackRepository;Lnet/minecraft/world/level/WorldDataConfiguration;)"
            + "Lnet/minecraft/server/WorldLoader$InitConfig;"), index = 1)
    private static WorldDataConfiguration cae$bundleByDefault(WorldDataConfiguration config) {
        DataPackConfig packs = config.dataPacks();
        List<String> enabled = new ArrayList<>(packs.getEnabled());
        List<String> disabled = new ArrayList<>(packs.getDisabled());
        disabled.remove("bundle");
        if (!enabled.contains("bundle")) {
            enabled.add("bundle");
        }
        return new WorldDataConfiguration(new DataPackConfig(enabled, disabled),
                config.enabledFeatures().join(FeatureFlagSet.of(FeatureFlags.BUNDLE)));
    }
}
