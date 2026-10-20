package com.caeport.cae.feather;

import com.caeport.cae.mixin.BeaconBlockEntityAccessor;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.level.ChunkPos;
import net.minecraft.world.level.block.entity.BeaconBlockEntity;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.chunk.LevelChunk;
import net.minecraft.world.phys.Vec3;

/**
 * Is an entity inside the flight range of an active beacon? 1.18.2 asked the point-of-interest manager for beacons
 * within the range of a level 6 beacon (3D distance, base + 6 * step); this asks the loaded chunks around the entity for
 * beacon block entities instead, as 1.21 has no beacon point of interest.
 */
public final class BeaconRange {
    private BeaconRange() {
    }

    public static int rangeForLevel(int level) {
        return MagicFeatherConfig.BASE_RANGE.get() + level * MagicFeatherConfig.RANGE_STEP.get();
    }

    private static int beaconRange(BeaconBlockEntity beacon) {
        if (beacon.getBeamSections().isEmpty()) {
            return 0;
        }
        int level = ((BeaconBlockEntityAccessor) beacon).cae$getLevels();
        return level == 0 ? 0 : rangeForLevel(level);
    }

    public static boolean isInRange(Entity entity) {
        if (!(entity.level() instanceof ServerLevel level)) {
            return false;
        }
        Vec3 pos = entity.getEyePosition();
        BlockPos origin = entity.blockPosition();
        int maxRange = rangeForLevel(6);
        MagicFeatherConfig.VerticalRange vertical = MagicFeatherConfig.VERTICAL_RANGE.get();
        long maxSqr = (long) maxRange * maxRange;
        int chunkRadius = (maxRange >> 4) + 1;
        ChunkPos center = new ChunkPos(origin);
        for (int cx = center.x - chunkRadius; cx <= center.x + chunkRadius; cx++) {
            for (int cz = center.z - chunkRadius; cz <= center.z + chunkRadius; cz++) {
                LevelChunk chunk = level.getChunkSource().getChunkNow(cx, cz);
                if (chunk == null) {
                    continue;
                }
                for (BlockEntity be : chunk.getBlockEntities().values()) {
                    if (!(be instanceof BeaconBlockEntity beacon) || be.getBlockPos().distSqr(origin) > maxSqr) {
                        continue;
                    }
                    int radius = beaconRange(beacon);
                    if (radius == 0) {
                        continue;
                    }
                    BlockPos b = be.getBlockPos();
                    if (pos.x < b.getX() - radius || pos.x > b.getX() + radius
                            || pos.z < b.getZ() - radius || pos.z > b.getZ() + radius) {
                        continue;
                    }
                    if (vertical == MagicFeatherConfig.VerticalRange.FullHeight
                            || (pos.y >= b.getY() - radius - vertical.down && pos.y <= b.getY() + radius + vertical.up)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
