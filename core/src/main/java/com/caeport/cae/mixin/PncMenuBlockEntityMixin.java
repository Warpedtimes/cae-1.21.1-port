package com.caeport.cae.mixin;

import me.desht.pneumaticcraft.common.inventory.AbstractPneumaticCraftMenu;
import net.minecraft.core.BlockPos;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.chunk.LevelChunk;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

/**
 * PneumaticCraft's menus look their block entity up in the client level when the screen opens. When the client has none
 * at that spot yet, {@code menu.blockEntity} stays null and screens that expect it (the Creative Compressed Iron Block's
 * read {@code te.targetTemperature} every frame) crash the client with a NullPointerException (client crash of 19 Oct
 * 2026). Here the client creates the block entity from the block when it is missing; the server then fills its fields
 * through PneumaticCraft's own GUI sync, as for any other machine.
 */
@Mixin(value = AbstractPneumaticCraftMenu.class, remap = false)
public abstract class PncMenuBlockEntityMixin {
    @Redirect(method = "<init>(Lnet/minecraft/world/inventory/MenuType;ILnet/minecraft/world/entity/player/Inventory;Lnet/minecraft/core/BlockPos;)V",
            at = @At(value = "INVOKE", target = "Lnet/minecraft/world/level/Level;getBlockEntity(Lnet/minecraft/core/BlockPos;)Lnet/minecraft/world/level/block/entity/BlockEntity;", remap = true))
    private BlockEntity cae$createMissingClientBlockEntity(Level level, BlockPos pos) {
        BlockEntity be = level.getBlockEntity(pos);
        if (be == null && level.isClientSide) {
            be = level.getChunkAt(pos).getBlockEntity(pos, LevelChunk.EntityCreationType.IMMEDIATE);
        }
        return be;
    }
}
