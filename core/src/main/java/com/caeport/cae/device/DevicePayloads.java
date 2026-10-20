package com.caeport.cae.device;

import com.caeport.cae.Cae;
import com.caeport.cae.device.client.DeviceClientHandlers;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.network.event.RegisterPayloadHandlersEvent;

/** Registers the one packet the device menus use. */
@EventBusSubscriber(modid = Cae.ID)
public final class DevicePayloads {
    private DevicePayloads() {
    }

    @SubscribeEvent
    public static void register(RegisterPayloadHandlersEvent event) {
        event.registrar("1").playToClient(GuiStatePayload.TYPE, GuiStatePayload.CODEC, DeviceClientHandlers::handleGuiState);
    }
}
