package com.caeport.cae.mixin;

import com.caeport.cae.client.CTDataIndices;
import java.util.Arrays;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;

/**
 * Create's CTModel.CTData compares by its indices, so FramedBlocks can use it in quad cache keys (FramedCreateCT): two
 * framed blocks whose faces connect the same way share one set of quads instead of a new cache entry per rebuild.
 */
@Mixin(targets = "com.simibubi.create.foundation.block.connected.CTModel$CTData", remap = false)
public abstract class CreateCTDataMixin implements CTDataIndices {
    @Shadow
    @Final
    private int[] indices;

    @Override
    public int[] cae$indices() {
        return indices;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof CTDataIndices data && other.getClass() == getClass()
                && Arrays.equals(indices, data.cae$indices());
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(indices);
    }
}
