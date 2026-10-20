package com.caeport.cae.mixin;

import com.caeport.cae.compat.LavaLilySupport;
import com.hollingsworth.arsnouveau.common.block.tile.VolcanicSourcelinkTile;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Ars Nouveau 2.9.0's Volcanic Sourcelink grew a Lava Lily on its random tick (before the magma and stone work it still
 * does); Ars Nouveau 5 dropped the lily. This puts the growing back, with the pack's {@code cae:lava_lily}.
 */
@Mixin(value = VolcanicSourcelinkTile.class, remap = false)
public abstract class VolcanicSourcelinkLilyMixin {
    @Inject(method = "doRandomAction", at = @At("HEAD"))
    private void cae$growLavaLily(CallbackInfo ci) {
        VolcanicSourcelinkTile self = (VolcanicSourcelinkTile) (Object) this;
        if (self.getLevel() != null && !self.getLevel().isClientSide) {
            LavaLilySupport.growAround(self.getLevel(), self.getBlockPos());
        }
    }
}
