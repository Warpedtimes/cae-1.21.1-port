package com.caeport.cae.mixin;

import com.caeport.cae.compat.FunnelTurns;
import com.simibubi.create.content.kinetics.belt.BeltBlockEntity;
import com.simibubi.create.content.kinetics.belt.BeltHelper;
import com.simibubi.create.content.kinetics.belt.behaviour.DirectBeltInputBehaviour;
import com.simibubi.create.content.logistics.box.PackageEntity;
import com.simibubi.create.content.logistics.funnel.AbstractFunnelBlock;
import com.simibubi.create.content.logistics.funnel.BeltFunnelBlock;
import com.simibubi.create.content.logistics.funnel.FunnelBlock;
import com.simibubi.create.content.logistics.funnel.FunnelBlockEntity;
import com.simibubi.create.foundation.blockEntity.behaviour.BlockEntityBehaviour;
import com.simibubi.create.foundation.blockEntity.behaviour.inventory.InvManipulationBehaviour;
import com.simibubi.create.foundation.blockEntity.behaviour.inventory.VersionedInventoryTrackerBehaviour;
import com.simibubi.create.foundation.item.ItemHelper.ExtractionCountMode;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.phys.AABB;
import net.neoforged.neoforge.items.IItemHandler;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.Unique;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/**
 * Funnels pulling from the same block take turns (owner's request, 24 Oct 2026). In Create every funnel on a block
 * checks it on the same tick in a fixed order, so when items come in one at a time the first funnel in that order gets
 * all of them and the others sit idle.
 *
 * Here, at the moment a funnel is about to pull (Create has already found an item for it and a clear way out), it
 * looks at the other funnels on the same block that could also pull right now and have gone longer without an item.
 * If the block holds enough of the item for all of them and this one too, they all pull together on this tick.
 * Otherwise this funnel skips the tick and lets them go first. Funnels that can't pull (busy machine, item still in
 * front, cooling down, redstone, filter doesn't match) are left out, like Round Robin on a Mechanical Arm. A funnel never
 * waits more than a second, in case something is missed. Idle funnels never reach this code.
 */
@Mixin(value = FunnelBlockEntity.class, remap = false)
public abstract class FunnelTurnsMixin implements FunnelTurns {
    @Unique private static final Direction[] CAE$DIRECTIONS = Direction.values();
    @Unique private static final int CAE$MAX_WAIT_TICKS = 20;

    @Shadow private InvManipulationBehaviour invManipulation;
    @Shadow private VersionedInventoryTrackerBehaviour invVersionTracker;
    @Shadow private int extractionCooldown;

    @Shadow
    private AABB getEntityOverflowScanningArea() {
        throw new AssertionError();
    }

    @Shadow public abstract int getAmountToExtract();

    @Shadow public abstract ExtractionCountMode getModeToExtract();

    @Unique private long cae$lastServed;
    @Unique private int cae$waitedTicks;

    /** Right before the real pull (ordinal 0 is Create's simulation). */
    @Inject(method = "activateExtractor", cancellable = true, at = @At(value = "INVOKE", ordinal = 1,
            target = "Lcom/simibubi/create/foundation/blockEntity/behaviour/inventory/InvManipulationBehaviour;extract(Lcom/simibubi/create/foundation/item/ItemHelper$ExtractionCountMode;I)Lnet/minecraft/world/item/ItemStack;"))
    private void cae$takeTurnsDropping(CallbackInfo ci) {
        if (cae$shouldWait()) ci.cancel();
    }

    @Inject(method = "activateExtractingBeltFunnel", cancellable = true, at = @At(value = "INVOKE",
            target = "Lcom/simibubi/create/foundation/blockEntity/behaviour/inventory/InvManipulationBehaviour;extract(Lcom/simibubi/create/foundation/item/ItemHelper$ExtractionCountMode;ILjava/util/function/Predicate;)Lnet/minecraft/world/item/ItemStack;"))
    private void cae$takeTurnsOnBelt(CallbackInfo ci) {
        if (cae$shouldWait()) ci.cancel();
    }

    /** Both pull paths start the cooldown right after a successful pull. */
    @Inject(method = "startCooldown", at = @At("HEAD"))
    private void cae$served(CallbackInfoReturnable<Integer> cir) {
        Level level = cae$self().getLevel();
        if (level != null) cae$lastServed = level.getGameTime();
        cae$waitedTicks = 0;
    }

    @Override
    public long cae$lastServed() {
        return cae$lastServed;
    }

    @Unique
    private FunnelBlockEntity cae$self() {
        return (FunnelBlockEntity) (Object) this;
    }

    @Unique
    private boolean cae$shouldWait() {
        FunnelBlockEntity self = cae$self();
        Level level = self.getLevel();
        if (level == null || level.isClientSide) return false;
        Direction facing = AbstractFunnelBlock.getFunnelFacing(self.getBlockState());
        if (facing == null) return false;
        BlockPos myPos = self.getBlockPos();
        BlockPos source = myPos.relative(facing.getOpposite());

        ItemStack mine = null;
        int aheadOfUs = 0; // items the funnels that go before us would pull, of the item we'd pull
        for (Direction dir : CAE$DIRECTIONS) {
            BlockPos at = source.relative(dir);
            if (at.equals(myPos) || !level.isLoaded(at) || !level.shouldTickBlocksAt(at)) continue;
            if (!(level.getBlockEntity(at) instanceof FunnelBlockEntity other) || other.isRemoved()) continue;
            if (AbstractFunnelBlock.getFunnelFacing(other.getBlockState()) != dir) continue; // not pulling from source
            FunnelTurns peer = (FunnelTurns) other;
            long theirs = peer.cae$lastServed();
            boolean theyGoFirst = theirs != cae$lastServed ? theirs < cae$lastServed : at.asLong() < myPos.asLong();
            if (!theyGoFirst) continue;
            ItemStack theyPull = peer.cae$wouldPull();
            if (theyPull.isEmpty()) continue;
            if (mine == null) {
                mine = cae$wouldPull();
                if (mine.isEmpty()) break; // nothing for us anyway: let Create carry on as usual
            }
            if (ItemStack.isSameItemSameComponents(theyPull, mine)) aheadOfUs += theyPull.getCount();
        }
        if (aheadOfUs == 0 || cae$countInSource(mine) >= aheadOfUs + mine.getCount()
                || ++cae$waitedTicks > CAE$MAX_WAIT_TICKS) {
            cae$waitedTicks = 0;
            return false;
        }
        return true;
    }

    @Unique
    private int cae$countInSource(ItemStack like) {
        if (!(invManipulation.getInventory() instanceof IItemHandler inv)) return 0;
        int count = 0;
        for (int slot = 0; slot < inv.getSlots(); slot++) {
            ItemStack stack = inv.getStackInSlot(slot);
            if (ItemStack.isSameItemSameComponents(stack, like)) count += stack.getCount();
        }
        return count;
    }

    /** Mirrors the checks in FunnelBlockEntity.tick, activateExtractor and activateExtractingBeltFunnel. */
    @Override
    public ItemStack cae$wouldPull() {
        FunnelBlockEntity self = cae$self();
        Level level = self.getLevel();
        if (level == null || level.isClientSide || self.isRemoved() || extractionCooldown > 0) return ItemStack.EMPTY;
        if (invManipulation == null || invVersionTracker == null) return ItemStack.EMPTY;
        BlockState state = self.getBlockState();
        if (!FunnelBlock.isFunnel(state) || state.getOptionalValue(BlockStateProperties.POWERED).orElse(false))
            return ItemStack.EMPTY;
        if (invVersionTracker.stillWaiting(invManipulation)) return ItemStack.EMPTY;
        BlockPos pos = self.getBlockPos();

        if (state.getBlock() instanceof BeltFunnelBlock) {
            Direction facing = state.getValue(BeltFunnelBlock.HORIZONTAL_FACING);
            BeltFunnelBlock.Shape shape = state.getValue(BeltFunnelBlock.SHAPE);
            boolean pushing;
            if (shape == BeltFunnelBlock.Shape.PUSHING) pushing = true;
            else if (shape == BeltFunnelBlock.Shape.PULLING) pushing = false;
            else {
                BeltBlockEntity belt = BeltHelper.getSegmentBE(level, pos.below());
                pushing = belt != null && belt.getMovementFacing() == facing;
            }
            if (!pushing) return ItemStack.EMPTY;
            DirectBeltInputBehaviour input = BlockEntityBehaviour.get(level, pos.below(), DirectBeltInputBehaviour.TYPE);
            if (input == null || !input.canInsertFromSide(facing) || input.isOccupied(facing)) return ItemStack.EMPTY;
            return invManipulation.simulate()
                    .extract(getModeToExtract(), getAmountToExtract(), s -> input.handleInsertion(s, facing, true).isEmpty());
        }

        if (!(state.getBlock() instanceof FunnelBlock) || !state.getValue(FunnelBlock.EXTRACTING)) return ItemStack.EMPTY;
        if (!level.getEntities((Entity) null, getEntityOverflowScanningArea(),
                e -> e instanceof ItemEntity || e instanceof PackageEntity).isEmpty()) return ItemStack.EMPTY;
        return invManipulation.simulate().extract(getModeToExtract(), getAmountToExtract());
    }
}
