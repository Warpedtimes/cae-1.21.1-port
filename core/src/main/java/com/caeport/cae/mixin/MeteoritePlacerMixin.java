package com.caeport.cae.mixin;

import appeng.worldgen.meteorite.MeteoritePlacer;
import com.caeport.cae.CaeBlocks;
import net.minecraft.world.level.block.state.BlockState;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyArg;

/** AE2 meteorites hold a skystone catalyst where the mysterious cube (with the inscriber presses) would be. */
@Mixin(value = MeteoritePlacer.class, remap = false)
public abstract class MeteoritePlacerMixin {
    @ModifyArg(method = "placeChest", index = 2, at = @At(value = "INVOKE",
            target = "Lappeng/worldgen/meteorite/MeteoriteBlockPutter;put(Lnet/minecraft/world/level/LevelAccessor;Lnet/minecraft/core/BlockPos;Lnet/minecraft/world/level/block/state/BlockState;)Z"))
    private BlockState cae$catalystInsteadOfCube(BlockState cube) {
        return CaeBlocks.SKYSTONE_CATALYST.get().defaultBlockState();
    }
}
