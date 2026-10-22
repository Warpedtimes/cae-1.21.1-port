package com.caeport.cae.device;

import com.mojang.serialization.Codec;
import java.util.List;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.network.codec.StreamCodec;
import net.minecraft.world.item.ItemStack;

/**
 * The value of the {@code cae:augments} component. A bare {@code List<ItemStack>} has no value equality, so two devices with
 * the same augments never stacked; this wrapper compares the stacks. The codecs read and write exactly what the plain list
 * did (a list of optional item stacks), so saved items and 1.2.4 clients are unaffected.
 */
public record Augments(List<ItemStack> stacks) {
    public static final Codec<Augments> CODEC = ItemStack.OPTIONAL_CODEC.listOf().xmap(Augments::new, Augments::stacks);
    public static final StreamCodec<RegistryFriendlyByteBuf, Augments> STREAM_CODEC =
            ItemStack.OPTIONAL_LIST_STREAM_CODEC.map(Augments::new, Augments::stacks);

    @Override
    public boolean equals(Object o) {
        return o instanceof Augments other && ItemStack.listMatches(stacks, other.stacks);
    }

    @Override
    public int hashCode() {
        return ItemStack.hashStackList(stacks);
    }
}
