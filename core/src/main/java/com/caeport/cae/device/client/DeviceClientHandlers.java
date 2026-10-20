package com.caeport.cae.device.client;

import com.caeport.cae.Cae;
import com.caeport.cae.device.DeviceMenu;
import com.caeport.cae.device.GuiStatePayload;
import com.mojang.logging.LogUtils;
import io.netty.buffer.Unpooled;
import net.minecraft.client.Minecraft;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.neoforged.neoforge.network.handling.IPayloadContext;
import org.slf4j.Logger;

/** Client side of the device packet. Kept apart from the common code so a dedicated server never loads it. */
public final class DeviceClientHandlers {
    private static final Logger LOG = LogUtils.getLogger();
    private static boolean warned;

    private DeviceClientHandlers() {
    }

    public static void handleGuiState(GuiStatePayload payload, IPayloadContext context) {
        context.enqueueWork(() -> {
            Minecraft mc = Minecraft.getInstance();
            if (mc.player != null && mc.player.containerMenu instanceof DeviceMenu menu && menu.containerId == payload.containerId()) {
                RegistryFriendlyByteBuf buf = new RegistryFriendlyByteBuf(Unpooled.wrappedBuffer(payload.data()), mc.player.level().registryAccess());
                // a state the screen can't read only costs the numbers on the screen; it must never drop the connection
                try {
                    menu.be.readGui(buf);
                } catch (RuntimeException e) {
                    if (!warned) {
                        warned = true;
                        LOG.warn("[{}] device screen state not readable for {}", Cae.ID, menu.be.getType(), e);
                    }
                }
            }
        });
    }
}
