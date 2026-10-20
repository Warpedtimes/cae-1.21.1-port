package com.caeport.cae.mixin;

import net.minecraft.core.Holder;
import net.minecraft.core.component.DataComponents;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.enchantment.Enchantment;
import net.minecraft.world.item.enchantment.ItemEnchantments;
import net.minecraft.world.level.Level;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Forbidden Arcanus 2.6.1 still burns an Edelwood Lava Bucket in an inventory (0.5 % a tick: the slot becomes charcoal
 * and the lava spills), as 1.18.2 did, but no longer has the Permafrost enchantment that protected it
 * ({@code EdelwoodBucketItem.shouldBurn}: Permafrost level 0 only). The pack brings Permafrost back as a data
 * enchantment, so a bucket that has it skips the burn again.
 */
@Pseudo
@Mixin(targets = "com.stal111.forbidden_arcanus.common.item.bucket.CapacityBucketItem", remap = false)
public abstract class FaPermafrostBucketMixin {
    private static final ResourceLocation PERMAFROST = ResourceLocation.fromNamespaceAndPath("forbidden_arcanus", "permafrost");

    @Inject(method = "inventoryTick", at = @At("HEAD"), cancellable = true, require = 0)
    private void cae$permafrostKeepsLava(ItemStack stack, Level level, Entity entity, int slot, boolean selected, CallbackInfo ci) {
        ItemEnchantments enchantments = stack.getOrDefault(DataComponents.ENCHANTMENTS, ItemEnchantments.EMPTY);
        for (Holder<Enchantment> holder : enchantments.keySet()) {
            if (holder.is(PERMAFROST)) {
                ci.cancel();
                return;
            }
        }
    }
}
