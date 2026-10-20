package com.caeport.cae.device;

import com.caeport.cae.Cae;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.network.codec.ByteBufCodecs;
import net.minecraft.network.codec.StreamCodec;
import net.minecraft.network.protocol.common.custom.CustomPacketPayload;

/** Thermal's gui packet: the open device menu's live state ({@link DeviceBE#writeGui} and the device's own additions). */
public record GuiStatePayload(int containerId, byte[] data) implements CustomPacketPayload {
    public static final Type<GuiStatePayload> TYPE = new Type<>(Cae.asResource("device_gui"));
    public static final StreamCodec<RegistryFriendlyByteBuf, GuiStatePayload> CODEC = StreamCodec.composite(
            ByteBufCodecs.VAR_INT, GuiStatePayload::containerId,
            ByteBufCodecs.BYTE_ARRAY, GuiStatePayload::data,
            GuiStatePayload::new);

    @Override
    public Type<? extends CustomPacketPayload> type() {
        return TYPE;
    }
}
