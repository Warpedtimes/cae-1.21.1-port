package com.caeport.cae.mixin;

import net.neoforged.neoforge.server.ServerLifecycleHooks;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Players were thrown off the server ("Network Protocol Error") seconds after joining. On the client Sable fires a chunk
 * load event for every chunk packet; Distant Horizons answers it with its Chunky hook
 * (ChunkyAccessor.bindOnGenerationProgressEvent -> ChunkyProvider.get()), and Chunky, which only starts with a server,
 * throws "Chunky is not loaded" inside the packet handler. Chunky is the server's pregeneration tool; on a machine with no
 * server running (a multiplayer client) the hook is skipped. Singleplayer and the dedicated server keep it.
 */
@Pseudo
@Mixin(targets = "com.seibel.distanthorizons.neoforge.wrappers.modAccessor.ChunkyAccessor", remap = false)
public abstract class DhChunkyAccessorMixin {
    @Inject(method = "bindOnGenerationProgressEvent", at = @At("HEAD"), cancellable = true, require = 0)
    private void cae$onlyWithAServer(CallbackInfo ci) {
        if (ServerLifecycleHooks.getCurrentServer() == null) {
            ci.cancel();
        }
    }
}
