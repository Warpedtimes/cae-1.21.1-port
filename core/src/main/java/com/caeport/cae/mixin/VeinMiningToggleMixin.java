package com.caeport.cae.mixin;

import com.caeport.cae.client.VeinMiningToggle;
import com.illusivesoulworks.veinmining.client.VeinMiningClientEvents;
import net.minecraft.network.chat.MutableComponent;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/** Vein Mining's key toggles vein mining (see VeinMiningToggle), and enchanted tools' tooltips say so. */
@Mixin(value = VeinMiningClientEvents.class, remap = false)
public abstract class VeinMiningToggleMixin {
    @Inject(method = "tick", at = @At("HEAD"), cancellable = true)
    private static void cae$toggle(CallbackInfo ci) {
        VeinMiningToggle.tick();
        ci.cancel();
    }

    @Inject(method = "getTutorialMessage", at = @At("HEAD"), cancellable = true)
    private static void cae$toggleTutorial(CallbackInfoReturnable<MutableComponent> cir) {
        cir.setReturnValue(VeinMiningToggle.tutorial());
    }
}
