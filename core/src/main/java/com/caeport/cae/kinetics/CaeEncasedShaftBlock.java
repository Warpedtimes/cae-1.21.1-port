package com.caeport.cae.kinetics;

import com.simibubi.create.content.kinetics.base.KineticBlockEntity;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedShaftBlock;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.entity.BlockEntityType;

import java.util.function.Supplier;

/** Create's encased shaft, pointed at our block entity type (Create's only accepts its own blocks). */
public class CaeEncasedShaftBlock extends EncasedShaftBlock {
    public CaeEncasedShaftBlock(Properties properties, Supplier<Block> casing) {
        super(properties, casing);
    }

    @Override
    public BlockEntityType<? extends KineticBlockEntity> getBlockEntityType() {
        return CaeKinetics.ENCASED_SHAFT.get();
    }
}
