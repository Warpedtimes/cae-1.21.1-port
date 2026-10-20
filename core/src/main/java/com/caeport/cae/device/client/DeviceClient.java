package com.caeport.cae.device.client;

import com.caeport.cae.Cae;
import com.caeport.cae.device.CaeDevices;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.client.event.EntityRenderersEvent;
import net.neoforged.neoforge.client.event.RegisterMenuScreensEvent;

/** The screens of the devices, and the fluid behind the windows of the ones that show one. */
@EventBusSubscriber(modid = Cae.ID, value = Dist.CLIENT)
public final class DeviceClient {
    private DeviceClient() {
    }

    @SubscribeEvent
    public static void screens(RegisterMenuScreensEvent event) {
        event.register(CaeDevices.DEVICE_MENU.get(), DeviceScreens::create);
        event.register(CaeDevices.TINKER_MENU.get(), DeviceScreens::create);
        event.register(CaeDevices.FILTER_MENU.get(), FilterScreen::new);
    }

    @SubscribeEvent
    public static void renderers(EntityRenderersEvent.RegisterRenderers event) {
        event.registerBlockEntityRenderer(CaeDevices.TREE_EXTRACTOR_BE.get(), ctx -> new UnderlayRenderer(ctx, false));
        event.registerBlockEntityRenderer(CaeDevices.ROCK_GEN_BE.get(), ctx -> new UnderlayRenderer(ctx, false));
        event.registerBlockEntityRenderer(CaeDevices.DIFFUSER_BE.get(), ctx -> new UnderlayRenderer(ctx, false));
        event.registerBlockEntityRenderer(CaeDevices.COLLECTOR_BE.get(), ctx -> new UnderlayRenderer(ctx, true));
    }
}
