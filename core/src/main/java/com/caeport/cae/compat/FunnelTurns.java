package com.caeport.cae.compat;

import net.minecraft.world.item.ItemStack;

/**
 * Added to Create's funnel block entity by {@code mixin.FunnelTurnsMixin}, so funnels pulling from the same block can
 * see each other's turn state.
 */
public interface FunnelTurns {
    /** Game time of this funnel's last successful pull (0 = not since it loaded). */
    long cae$lastServed();

    /** What this funnel would pull out of its block if it ticked right now (a simulation), or empty. */
    ItemStack cae$wouldPull();
}
