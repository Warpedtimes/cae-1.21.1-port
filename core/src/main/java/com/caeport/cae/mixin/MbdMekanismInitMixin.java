package com.caeport.cae.mixin;

import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Startup deadlock fix. Mods are constructed in parallel: Mekanism's constructor initialises {@code MekanismAPI}, whose
 * static init needs {@code Chemical}, while LDLib2 (constructing at the same time) runs MBD2's plugin, which touches
 * {@code ChemicalStack} → {@code Chemical}, whose static init needs {@code MekanismAPI}. Each thread then waits on the
 * other's class-initialisation lock forever (about 1 boot in 5). Initialising {@code MekanismAPI} first on MBD2's side
 * makes both threads take the locks in the same order.
 */
@Pseudo
@Mixin(targets = "com.lowdragmc.mbd2.integration.ldlib.MBDSyncedFieldAccessors", remap = false)
public abstract class MbdMekanismInitMixin {
    @Inject(method = "init", at = @At("HEAD"), remap = false, require = 0)
    private static void cae$initMekanismApiFirst(CallbackInfo ci) {
        try {
            Class.forName("mekanism.api.MekanismAPI");
        } catch (ClassNotFoundException ignored) {
            // no Mekanism, no deadlock
        }
    }
}
