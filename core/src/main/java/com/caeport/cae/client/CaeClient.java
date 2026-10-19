package com.caeport.cae.client;

import com.caeport.cae.Cae;
import com.caeport.cae.CaeBlocks;
import com.caeport.cae.block.TimeCrystalBlockEntity;
import com.caeport.cae.entity.CaeEntities;
import com.caeport.cae.entity.EssentialOrb;
import com.caeport.cae.tiab.Tiab;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.entity.NoopRenderer;
import net.minecraft.resources.ResourceLocation;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.client.event.EntityRenderersEvent;
import software.bernie.geckolib.model.GeoModel;
import software.bernie.geckolib.renderer.GeoBlockRenderer;
import software.bernie.geckolib.renderer.GeoEntityRenderer;

/** GeckoLib renderers for the Essential Orb and the Source Time Crystal, with the 1.18.2 models and animations. */
@EventBusSubscriber(modid = Cae.ID, value = Dist.CLIENT)
public final class CaeClient {
    private CaeClient() {
    }

    @SubscribeEvent
    public static void renderers(EntityRenderersEvent.RegisterRenderers event) {
        event.registerEntityRenderer(CaeEntities.ESSENTIAL_ORB.get(),
                ctx -> new GeoEntityRenderer<>(ctx, new OrbModel()).withScale(0.8F));
        event.registerBlockEntityRenderer(CaeBlocks.TIME_CRYSTAL_BE.get(), ctx -> new GeoBlockRenderer<>(new CrystalModel()));
        // Draws only the accelerator's "xN" name tag.
        event.registerEntityRenderer(Tiab.TIME_ACCELERATOR.get(), NoopRenderer::new);
    }

    static final class OrbModel extends GeoModel<EssentialOrb> {
        @Override
        public ResourceLocation getModelResource(EssentialOrb orb) {
            return Cae.asResource("geo/orb.geo.json");
        }

        @Override
        public ResourceLocation getTextureResource(EssentialOrb orb) {
            return Cae.asResource("textures/entity/orb/essentialorb.png");
        }

        @Override
        public ResourceLocation getAnimationResource(EssentialOrb orb) {
            return Cae.asResource("animations/orb.animation.json");
        }
    }

    static final class CrystalModel extends GeoModel<TimeCrystalBlockEntity> {
        @Override
        public ResourceLocation getModelResource(TimeCrystalBlockEntity crystal) {
            return Cae.asResource("geo/fuckyou.geo.json");
        }

        @Override
        public ResourceLocation getTextureResource(TimeCrystalBlockEntity crystal) {
            return Cae.asResource("textures/fuckyou.png");
        }

        @Override
        public ResourceLocation getAnimationResource(TimeCrystalBlockEntity crystal) {
            return Cae.asResource("animations/fuckyou.animation.json");
        }

        @Override
        public RenderType getRenderType(TimeCrystalBlockEntity crystal, ResourceLocation texture) {
            return RenderType.entityTranslucent(texture);
        }
    }
}
