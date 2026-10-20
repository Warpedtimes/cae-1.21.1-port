package com.caeport.cae.mixin;

import me.desht.pneumaticcraft.client.gui.CreativeCompressedIronBlockScreen;
import net.minecraft.network.chat.Component;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/** If the screen still has no block entity (see PncMenuBlockEntityMixin), draw a dash instead of crashing the client. */
@Mixin(value = CreativeCompressedIronBlockScreen.class, remap = false)
public abstract class PncCreativeIronScreenMixin {
    @Inject(method = "formatStringDesc", at = @At("HEAD"), cancellable = true)
    private void cae$noBlockEntity(CallbackInfoReturnable<Component> cir) {
        if (((CreativeCompressedIronBlockScreen) (Object) this).te == null) {
            cir.setReturnValue(Component.literal("-"));
        }
    }
}
