package com.caeport.cae;

import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.sounds.SoundEvent;
import net.neoforged.neoforge.registries.DeferredRegister;

/** Sounds the pack's scripts play by name ({@code cae:forge_start} and so on); nothing in the mod uses them itself. */
public final class CaeSounds {
    public static final DeferredRegister<SoundEvent> SOUNDS = DeferredRegister.create(BuiltInRegistries.SOUND_EVENT, Cae.ID);

    static {
        for (String name : new String[]{"arcane_obelisk_creation", "wraith_soulconvert", "obelisk_place", "obelisk_break",
                "developer", "forge_start", "forge_create", "skeleton_convert"}) {
            SOUNDS.register(name, () -> SoundEvent.createVariableRangeEvent(Cae.asResource(name)));
        }
    }

    private CaeSounds() {
    }
}
