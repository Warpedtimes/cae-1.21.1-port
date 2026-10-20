package com.caeport.cae.mixin;

import net.minecraft.world.level.block.entity.BeaconBlockEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Accessor;

/** The beacon's pyramid level, which the Magic Feather's flight range grows with. */
@Mixin(BeaconBlockEntity.class)
public interface BeaconBlockEntityAccessor {
    @Accessor("levels")
    int cae$getLevels();
}
