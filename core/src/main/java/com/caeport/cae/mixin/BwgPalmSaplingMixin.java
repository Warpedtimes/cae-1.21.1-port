package com.caeport.cae.mixin;

import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.tags.BlockTags;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/**
 * The palm sapling stands on dirt again, as in 1.18.2: Oh The Biomes You'll Go let it on #minecraft:dirt and
 * #minecraft:sand (tag byg:may_place_on/palm_sapling), Oh The Biomes We've Gone 2.6 only on #minecraft:sand. The insanity
 * room plants its palm saplings on grass, and placing the template popped them.
 */
@Pseudo
@Mixin(targets = "net.potionstudios.biomeswevegone.world.level.block.plants.tree.sapling.BWGSaplingBlock", remap = false)
public abstract class BwgPalmSaplingMixin {
    @Inject(method = "mayPlaceOn", at = @At("HEAD"), cancellable = true, require = 0)
    private void cae$palmOnDirt(BlockState state, BlockGetter level, BlockPos pos, CallbackInfoReturnable<Boolean> cir) {
        if (state.is(BlockTags.DIRT)
                && "biomeswevegone:palm_sapling".equals(BuiltInRegistries.BLOCK.getKey((Block) (Object) this).toString())) {
            cir.setReturnValue(true);
        }
    }
}
