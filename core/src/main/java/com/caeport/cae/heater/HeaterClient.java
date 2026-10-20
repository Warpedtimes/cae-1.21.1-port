package com.caeport.cae.heater;

import me.desht.pneumaticcraft.common.heat.HeatUtil;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.client.event.RegisterColorHandlersEvent;

/** The heater's plates glow in PneumaticCraft's heat colour for its temperature (tint index 0, as in the original). */
@EventBusSubscriber(modid = com.caeport.cae.Cae.ID, value = Dist.CLIENT)
public final class HeaterClient {
    private HeaterClient() {
    }

    @SubscribeEvent
    public static void onBlockColors(RegisterColorHandlersEvent.Block event) {
        event.register((state, level, pos, tintIndex) -> {
            int temp = 300;
            if (tintIndex == 0 && level != null && pos != null) {
                BlockEntity be = level.getBlockEntity(pos);
                if (be instanceof HeaterBlockEntity heater) {
                    temp = heater.getTemperature();
                }
            }
            return HeatUtil.getColourForTemperature(temp).getARGB() & 0xFFFFFF;
        }, HeaterRegistry.HEATER.get());
    }
}
