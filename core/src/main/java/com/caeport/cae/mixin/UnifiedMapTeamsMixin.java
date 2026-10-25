package com.caeport.cae.mixin;

import com.caeport.cae.compat.TeamMaps;
import com.llamalad7.mixinextras.injector.ModifyExpressionValue;
import com.llamalad7.mixinextras.injector.wrapoperation.Operation;
import com.llamalad7.mixinextras.injector.wrapoperation.WrapOperation;
import com.llamalad7.mixinextras.sugar.Local;
import obscura.unified.config.ServerConfig;
import obscura.unified.protocol.S2CMessage;
import obscura.unified.protocol.SyncStatusS2CPayload;
import obscura.unified.server.MapIoWorker;
import obscura.unified.server.MapStore;
import obscura.unified.server.PlayerSyncState;
import obscura.unified.server.ServerBridge;
import obscura.unified.server.SharedMapManager;
import org.objectweb.asm.Opcodes;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.Unique;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.ModifyArg;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Unified Xaero Worldmap keeps one explored map for the whole server; the pack keeps one per FTB team (owner, 25 Oct
 * 2026: "people in the same FTB team actively share map data"). Players run the mod unchanged; only the server decides
 * whose map a player gets.
 *
 * Each team's map is a store of the mod's own kind under {@code <world>/unified_xaero_worldmap/teams/<team id>/}. An
 * upload merges into the uploader's team map, a catch-up reads the asker's team map, and live tiles go only to
 * teammates. The mod's own server-wide store stays empty. Every store use is on the mod's single map thread, which is
 * told the team either by the method's own player argument or by {@link TeamMaps#enter} at the start of the job.
 *
 * Pinned to Unified Xaero Worldmap 2.0.4: the two jobs below are its compiled lambdas, and a newer version that renames
 * them stops the game at startup (defaultRequire 1) rather than quietly sharing every map with everyone.
 */
@Mixin(value = SharedMapManager.class, remap = false)
public abstract class UnifiedMapTeamsMixin {
    @Unique private static final String CAE$STORE =
            "Lobscura/unified/server/SharedMapManager;store:Lobscura/unified/server/MapStore;";
    @Unique private static final int CAE$REFRESH_TICKS = 20;

    @Shadow @Final private ServerBridge server;
    @Shadow @Final private ServerConfig config;
    @Shadow @Final private MapIoWorker worker;
    @Shadow @Final private Map<UUID, PlayerSyncState> playerStates;

    @Unique private final Map<UUID, MapStore> cae$teamStores = new ConcurrentHashMap<>();
    @Unique private int cae$refreshCountdown;

    @Shadow
    abstract void send(ServerBridge.Player player, S2CMessage message);

    /** Map thread only. */
    @Unique
    private MapStore cae$teamStore(UUID team) {
        return cae$teamStores.computeIfAbsent(team, id -> {
            MapStore store = new MapStore(server.worldDir().resolve(SharedMapManager.STORE_DIR_NAME).resolve("teams")
                    .resolve(id.toString()), config);
            store.open();
            return store;
        });
    }

    @ModifyExpressionValue(method = "mergeUpload", at = @At(value = "FIELD", target = CAE$STORE, opcode = Opcodes.GETFIELD))
    private MapStore cae$uploaderTeamStore(MapStore shared, @Local(argsOnly = true) UUID senderId) {
        return cae$teamStore(TeamMaps.teamOf(senderId));
    }

    @ModifyExpressionValue(method = {"buildAnswer", "regionParts", "lambda$onReconcile$3"},
            at = @At(value = "FIELD", target = CAE$STORE, opcode = Opcodes.GETFIELD))
    private MapStore cae$askerTeamStore(MapStore shared) {
        UUID team = TeamMaps.current();
        return team == null ? shared : cae$teamStore(team);
    }

    // The catch-up job: compares the asker's map with their team's and lists the regions to send.
    @Inject(method = "lambda$onReconcile$3", at = @At("HEAD"))
    private void cae$enterReconcile(CallbackInfo ci, @Local(argsOnly = true) UUID playerId) {
        TeamMaps.enter(playerId);
    }

    // The download job: reads one region of the team map for the player.
    @Inject(method = "lambda$sendRegionToPlayer$6", at = @At("HEAD"))
    private void cae$enterSend(CallbackInfo ci, @Local(argsOnly = true) UUID playerId) {
        TeamMaps.enter(playerId);
    }

    @Inject(method = {"lambda$onReconcile$3", "lambda$sendRegionToPlayer$6"}, at = @At("RETURN"))
    private void cae$leave(CallbackInfo ci) {
        TeamMaps.leave();
    }

    @WrapOperation(method = "broadcastTiles", at = @At(value = "INVOKE", target = "Ljava/util/Map;containsKey(Ljava/lang/Object;)Z"))
    private boolean cae$onlyTeammates(Map<?, ?> states, Object playerId, Operation<Boolean> original,
                                      @Local(argsOnly = true) UUID senderId) {
        return original.call(states, playerId) && TeamMaps.sameTeam(senderId, (UUID) playerId);
    }

    // Teams are read on the server thread: before each message from a player, and every second for team changes.
    @Inject(method = "onFrame", at = @At("HEAD"))
    private void cae$refreshSender(UUID playerId, byte[] frame, CallbackInfo ci) {
        TeamMaps.refresh(playerId);
    }

    @Inject(method = "tick", at = @At("HEAD"))
    private void cae$refreshTeams(CallbackInfo ci) {
        if (--cae$refreshCountdown > 0) {
            return;
        }
        cae$refreshCountdown = CAE$REFRESH_TICKS;
        boolean changed = false;
        for (ServerBridge.Player player : server.players()) {
            changed |= TeamMaps.refresh(player.id());
        }
        if (changed) {
            cae$sendTeammateCounts();
        }
    }

    /** The count a client is told is its online teammates: with one, it saves its map every few seconds for them. */
    @Inject(method = "broadcastPeerCount", at = @At("HEAD"), cancellable = true)
    private void cae$teammateCounts(CallbackInfo ci) {
        ci.cancel();
        cae$sendTeammateCounts();
    }

    @Unique
    private void cae$sendTeammateCounts() {
        List<ServerBridge.Player> synced = new ArrayList<>();
        for (ServerBridge.Player player : server.players()) {
            if (playerStates.containsKey(player.id())) {
                synced.add(player);
            }
        }
        for (ServerBridge.Player player : synced) {
            int teammates = 0;
            for (ServerBridge.Player other : synced) {
                if (other != player && TeamMaps.sameTeam(player.id(), other.id())) {
                    teammates++;
                }
            }
            send(player, new SyncStatusS2CPayload(teammates));
        }
    }

    @Inject(method = "tick", at = @At(value = "INVOKE", target = "Lobscura/unified/server/MapIoWorker;submit(Ljava/lang/Runnable;)Z",
            shift = At.Shift.AFTER))
    private void cae$flushTeamStores(CallbackInfo ci) {
        for (MapStore store : cae$teamStores.values()) {
            worker.submit(store::flush);
        }
    }

    @ModifyArg(method = "shutdown", at = @At(value = "INVOKE",
            target = "Lobscura/unified/server/MapIoWorker;submitFinal(Ljava/lang/Runnable;)V"))
    private Runnable cae$closeTeamStoresToo(Runnable closeShared) {
        return () -> {
            for (MapStore store : cae$teamStores.values()) {
                store.close();
            }
            closeShared.run();
        };
    }
}
