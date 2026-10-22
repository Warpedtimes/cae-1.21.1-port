package com.caeport.cae.tiab;

import net.minecraft.core.BlockPos;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.NbtUtils;
import net.minecraft.network.chat.Component;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.entity.BlockEntityTicker;
import net.minecraft.world.level.block.state.BlockState;

/** Sits in an accelerated block and gives it {@code rate} extra ticks per tick until its time runs out. */
public class TimeAccelerator extends Entity {
    private static final EntityDataAccessor<Integer> RATE = SynchedEntityData.defineId(TimeAccelerator.class, EntityDataSerializers.INT);

    private BlockPos target;
    private int remaining;

    public TimeAccelerator(EntityType<? extends TimeAccelerator> type, Level level) {
        super(type, level);
        noPhysics = true;
    }

    TimeAccelerator(Level level, BlockPos pos) {
        this(Tiab.TIME_ACCELERATOR.get(), level);
        target = pos;
        setPos(pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5);
        setRate(1);
    }

    int rate() {
        return entityData.get(RATE);
    }

    void setRate(int rate) {
        entityData.set(RATE, rate);
        setCustomName(Component.literal("x" + 2 * rate)); // the 1.18 mod labelled it twice the extra ticks
        setCustomNameVisible(true);
    }

    int remaining() {
        return remaining;
    }

    void setRemaining(int ticks) {
        remaining = ticks;
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        builder.define(RATE, 1);
    }

    @Override
    @SuppressWarnings("unchecked")
    public void tick() {
        super.tick();
        if (!(level() instanceof ServerLevel server)) {
            return;
        }
        if (target == null) {
            discard();
            return;
        }
        BlockState state = server.getBlockState(target);
        BlockEntity be = server.getBlockEntity(target);
        BlockEntityTicker<BlockEntity> ticker = be == null ? null
                : (BlockEntityTicker<BlockEntity>) state.getTicker(server, be.getType());
        if (ticker == null && !state.isRandomlyTicking()) {
            discard();
            return;
        }
        for (int i = 0; i < rate(); i++) {
            if (be != null && (be.isRemoved() || server.getBlockEntity(target) != be)) {
                break;
            }
            state = server.getBlockState(target); // 1211: a random tick can change the block (crop stages), so look again
            if (ticker != null) {
                ticker.tick(server, target, state, be);
            } else if (!state.isRandomlyTicking()) {
                break;
            } else if (random.nextInt(TimeInABottle.RANDOM_TICK_ODDS) == 0) {
                state.randomTick(server, target, random);
            }
        }
        if (--remaining <= 0) {
            discard();
        }
    }

    @Override
    protected void readAdditionalSaveData(CompoundTag tag) {
        setRate(Math.max(1, tag.getInt("timeRate")));
        remaining = tag.getInt("remainingTime");
        target = NbtUtils.readBlockPos(tag, "position").orElse(null);
    }

    @Override
    protected void addAdditionalSaveData(CompoundTag tag) {
        tag.putInt("timeRate", rate());
        tag.putInt("remainingTime", remaining);
        if (target != null) {
            tag.put("position", NbtUtils.writeBlockPos(target));
        }
    }

    @Override
    public boolean isPickable() {
        return false;
    }
}
