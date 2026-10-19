package com.caeport.cae.kinetics;

import com.simibubi.create.content.kinetics.simpleRelays.SimpleKineticBlockEntity;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedCogwheelBlock;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.entity.BlockEntityType;

import java.util.function.Supplier;

/** Create's encased cogwheel, pointed at our block entity types (Create's only accept its own blocks). */
public class CaeEncasedCogwheelBlock extends EncasedCogwheelBlock {
    public CaeEncasedCogwheelBlock(Properties properties, boolean large, Supplier<Block> casing) {
        super(properties, large, casing);
    }

    @Override
    public BlockEntityType<? extends SimpleKineticBlockEntity> getBlockEntityType() {
        return isLargeCog() ? CaeKinetics.ENCASED_LARGE_COGWHEEL.get() : CaeKinetics.ENCASED_COGWHEEL.get();
    }
}
