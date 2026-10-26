package com.caeport.cae.compat;

import com.caeport.cae.Cae;
import dev.ftb.mods.ftbteams.api.FTBTeamsAPI;
import dev.ftb.mods.ftbteams.api.Team;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.server.ServerStoppedEvent;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Which FTB team each player's shared Xaero map belongs to (see {@code UnifiedMapTeamsMixin}).
 *
 * Teams are looked up on the server thread and read from Unified Xaero Worldmap's map thread, which must not call into
 * FTB Teams itself. A player whose team isn't known yet gets a map of their own, so nothing leaks to other teams.
 */
@EventBusSubscriber(modid = Cae.ID)
public final class TeamMaps {
    private static final Map<UUID, UUID> TEAM_OF = new ConcurrentHashMap<>();

    /** A singleplayer game can open another world in the same JVM: start it with no teams from the last one. */
    @SubscribeEvent
    public static void onServerStopped(ServerStoppedEvent event) {
        TEAM_OF.clear();
    }
    /** The team whose map the map thread is working on, for the methods that aren't told which player asked. */
    private static final ThreadLocal<UUID> CURRENT = new ThreadLocal<>();

    private TeamMaps() {
    }

    /** Server thread only. True when the player's team changed. */
    public static boolean refresh(UUID player) {
        UUID team = player;
        FTBTeamsAPI.API api = FTBTeamsAPI.api();
        if (api.isManagerLoaded()) {
            team = api.getManager().getTeamForPlayerID(player).map(Team::getId).orElse(player);
        }
        return !team.equals(TEAM_OF.put(player, team));
    }

    public static UUID teamOf(UUID player) {
        return TEAM_OF.getOrDefault(player, player);
    }

    public static boolean sameTeam(UUID a, UUID b) {
        return teamOf(a).equals(teamOf(b));
    }

    public static void enter(UUID player) {
        CURRENT.set(teamOf(player));
    }

    public static void leave() {
        CURRENT.remove();
    }

    public static UUID current() {
        return CURRENT.get();
    }
}
