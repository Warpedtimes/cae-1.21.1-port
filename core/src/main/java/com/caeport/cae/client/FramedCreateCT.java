package com.caeport.cae.client;

import com.caeport.cae.Cae;
import com.mojang.logging.LogUtils;
import com.simibubi.create.foundation.block.connected.CTModel;
import java.lang.reflect.Field;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.ModList;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.fml.event.lifecycle.FMLClientSetupEvent;
import net.neoforged.neoforge.client.model.data.ModelProperty;
import org.slf4j.Logger;

/**
 * Create's connected textures on FramedBlocks camos: a framed block disguised as Brass Casing (or any Create casing)
 * joins up with its neighbours the way the casing does.
 *
 * <p>FramedBlocks 10.6.3 ships this hook switched off (its CreateCompat.REGISTER_CT_PROPERTY = false, "not comparable
 * and does not work correctly with the appearance API"). Both points are covered here: Create 6.0.10 looks neighbours
 * up through BlockState.getAppearance (ConnectedTextureBehaviour.testConnection, the path its Copycats use), and
 * CreateCTDataMixin gives CTModel.CTData the equals/hashCode that FramedBlocks' quad cache keys need. FramedBlocks
 * locks its list of connected texture properties on FMLLoadCompleteEvent, after this runs.
 */
@EventBusSubscriber(modid = Cae.ID, bus = EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public final class FramedCreateCT {
    private static final Logger LOGGER = LogUtils.getLogger();

    private FramedCreateCT() {
    }

    @SubscribeEvent
    public static void clientSetup(FMLClientSetupEvent event) {
        if (!ModList.get().isLoaded("framedblocks")) {
            return;
        }
        // on the main thread: FramedBlocks keeps the list in a plain HashMap and other mods add to it during setup
        event.enqueueWork(() -> {
            try {
                Field field = CTModel.class.getDeclaredField("CT_PROPERTY");
                field.setAccessible(true);
                ModelProperty<?> property = (ModelProperty<?>) field.get(null);
                Class.forName("xfacthd.framedblocks.client.data.ConTexDataHandler")
                        .getMethod("addConTexProperty", String.class, ModelProperty.class)
                        .invoke(null, "create", property);
                LOGGER.info("FramedBlocks camos now use Create's connected textures");
            } catch (Throwable e) {
                LOGGER.warn("Couldn't give FramedBlocks camos Create's connected textures", e);
            }
        });
    }
}
