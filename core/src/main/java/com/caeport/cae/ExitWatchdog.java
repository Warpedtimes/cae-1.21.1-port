package com.caeport.cae;

import com.mojang.logging.LogUtils;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.server.ServerStoppedEvent;
import org.slf4j.Logger;

/**
 * Makes sure a stopped dedicated server's JVM exits. After a crash the test server once stayed alive with every world
 * saved (something left a non-daemon thread running); a hung process keeps a service manager's "restart on failure"
 * from ever restarting it. Once the server has stopped, a daemon thread waits; if the JVM is still alive after that, it
 * halts it with exit code 1 (a forced exit is a failure, so the service manager restarts the server).
 * A normal stop exits within seconds and never reaches the halt (the thread is a daemon, it doesn't keep the JVM up).
 */
@EventBusSubscriber(modid = Cae.ID)
public final class ExitWatchdog {
    private static final Logger LOGGER = LogUtils.getLogger();
    private static final long GRACE_MS = 60_000L;

    private ExitWatchdog() {
    }

    @SubscribeEvent
    public static void onServerStopped(ServerStoppedEvent event) {
        // only a dedicated server: the integrated one stops whenever a player leaves a singleplayer world
        if (!event.getServer().isDedicatedServer()) {
            return;
        }
        Thread watchdog = new Thread(() -> {
            try {
                Thread.sleep(GRACE_MS);
            } catch (InterruptedException e) {
                return;
            }
            LOGGER.error("[cae] the server stopped {} s ago but the JVM is still running; halting it", GRACE_MS / 1000);
            Runtime.getRuntime().halt(1);
        }, "cae-exit-watchdog");
        watchdog.setDaemon(true);
        watchdog.start();
    }
}
