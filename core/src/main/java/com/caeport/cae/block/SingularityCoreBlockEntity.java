package com.caeport.cae.block;

import com.caeport.cae.CaeBlocks;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;

/**
 * As in 1.18.2: the core sprouts a vein on every side, and every 10 ticks each vein thickens (stages 1 to 5) and then
 * reaches one block further. When a vein is long enough a new core forms at its tip and this one becomes air, so the
 * core travels, and, since all six veins finish together, multiplies. Veins overwrite whatever is in their way.
 * Nothing in the pack's quests or scripts uses it.
 */
public class SingularityCoreBlockEntity extends BlockEntity {
    private static final int MAX_AGE = 7;
    private static final int GROW_INTERVAL = 10;

    private boolean sprouted;
    private int cooldown;

    public SingularityCoreBlockEntity(BlockPos pos, BlockState state) {
        super(CaeBlocks.SINGULARITY_BE.get(), pos, state);
    }

    // audit 4 S-9: saved, or every chunk load sprouted the six veins again over whatever had been built next to it
    @Override
    protected void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.saveAdditional(tag, registries);
        tag.putBoolean("Sprouted", sprouted);
        tag.putInt("Cooldown", cooldown);
    }

    @Override
    protected void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.loadAdditional(tag, registries);
        sprouted = tag.getBoolean("Sprouted");
        cooldown = tag.getInt("Cooldown");
    }

    void tick(Level level, BlockPos pos) {
        if (!sprouted) {
            sprouted = true;
            setChanged();
            for (Direction d : Direction.values()) {
                level.setBlockAndUpdate(pos.relative(d), vein(d, 1));
            }
        }
        if (cooldown-- > 0) {
            return;
        }
        cooldown = GROW_INTERVAL;
        for (Direction d : Direction.values()) {
            grow(level, pos.relative(d), 0, pos);
        }
    }

    private void grow(Level level, BlockPos at, int age, BlockPos origin) {
        age++;
        BlockState here = level.getBlockState(at);
        if (age >= MAX_AGE) {
            level.setBlockAndUpdate(at.relative(facing(here)), CaeBlocks.SINGULARITY_CORE.get().defaultBlockState());
            level.setBlockAndUpdate(origin, Blocks.AIR.defaultBlockState());
        } else if (here.is(CaeBlocks.SINGULARITY_VEIN.get())) {
            Direction facing = here.getValue(SingularityVeinBlock.FACING);
            int stage = here.getValue(SingularityVeinBlock.STAGE);
            if (stage >= 5) {
                extend(level, at.relative(facing), facing, age, origin);
            } else {
                level.setBlockAndUpdate(at, vein(facing, stage + 1));
            }
        }
    }

    private void extend(Level level, BlockPos at, Direction direction, int age, BlockPos origin) {
        BlockState here = level.getBlockState(at);
        if (age >= MAX_AGE) {
            level.setBlockAndUpdate(at, CaeBlocks.SINGULARITY_CORE.get().defaultBlockState());
            level.setBlockAndUpdate(origin, Blocks.AIR.defaultBlockState());
        } else if (!here.is(CaeBlocks.SINGULARITY_VEIN.get())) {
            level.setBlockAndUpdate(at, vein(direction, 1));
        } else if (here.getValue(SingularityVeinBlock.FACING) == direction) {
            grow(level, at, age + 1, origin);
        }
    }

    private static Direction facing(BlockState state) {
        return state.hasProperty(SingularityVeinBlock.FACING) ? state.getValue(SingularityVeinBlock.FACING) : Direction.NORTH;
    }

    private static BlockState vein(Direction facing, int stage) {
        return ((SingularityVeinBlock) CaeBlocks.SINGULARITY_VEIN.get()).vein(facing, stage);
    }
}
