package com.caeport.cae.device.client;

import com.caeport.cae.Cae;
import com.caeport.cae.device.DeviceBE;
import com.caeport.cae.device.DeviceBlock;
import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.renderer.LevelRenderer;
import net.minecraft.client.renderer.LightTexture;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.blockentity.BlockEntityRenderer;
import net.minecraft.client.renderer.blockentity.BlockEntityRendererProvider;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.client.renderer.texture.TextureAtlasSprite;
import net.minecraft.core.Direction;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.inventory.InventoryMenu;
import net.neoforged.neoforge.client.extensions.common.IClientFluidTypeExtensions;
import net.neoforged.neoforge.fluids.FluidStack;
import org.joml.Matrix4f;

/**
 * Thermal's "underlay": what shows through the little windows of an active device. Its models drew the device's fluid (the tree's
 * sap, lava for the extruder, the potion in the diffuser) on a cube just inside the faces; this draws that cube, with the fluid's
 * own texture and colour, so the windows show the real fluid and change the moment the block entity's fluid does. The Vacuumulator
 * has a fixed texture instead of a fluid.
 */
public class UnderlayRenderer implements BlockEntityRenderer<DeviceBE> {
    private static final float E = 0.003F;
    private static final ResourceLocation COLLECTOR_UNDERLAY = Cae.asResource("block/device_collector_underlay");

    private final boolean constant;

    public UnderlayRenderer(BlockEntityRendererProvider.Context context, boolean constant) {
        this.constant = constant;
    }

    @Override
    public void render(DeviceBE be, float partial, PoseStack pose, MultiBufferSource buffers, int light, int overlay) {
        if (be.getLevel() == null || !be.getBlockState().hasProperty(DeviceBlock.ACTIVE) || !be.getBlockState().getValue(DeviceBlock.ACTIVE)) {
            return;
        }
        TextureAtlasSprite sprite;
        float r = 1;
        float g = 1;
        float b = 1;
        float a = 1;
        int emit = 0;
        if (constant) {
            sprite = Minecraft.getInstance().getTextureAtlas(InventoryMenu.BLOCK_ATLAS).apply(COLLECTOR_UNDERLAY);
        } else {
            FluidStack fs = be.renderFluid();
            if (fs.isEmpty()) {
                return;
            }
            IClientFluidTypeExtensions ext = IClientFluidTypeExtensions.of(fs.getFluid());
            sprite = Minecraft.getInstance().getTextureAtlas(InventoryMenu.BLOCK_ATLAS).apply(ext.getStillTexture(fs));
            int tint = ext.getTintColor(fs);
            r = (tint >> 16 & 255) / 255.0F;
            g = (tint >> 8 & 255) / 255.0F;
            b = (tint & 255) / 255.0F;
            emit = fs.getFluid().getFluidType().getLightLevel(fs);
        }
        VertexConsumer vc = buffers.getBuffer(RenderType.entityCutoutNoCull(InventoryMenu.BLOCK_ATLAS));
        Matrix4f m = pose.last().pose();
        for (Direction d : Direction.values()) {
            int l = LevelRenderer.getLightColor(be.getLevel(), be.getBlockPos().relative(d));
            if (emit > 0) {
                l = LightTexture.pack(Math.max(emit, LightTexture.block(l)), LightTexture.sky(l));
            }
            face(vc, pose, m, d, sprite, r, g, b, a, l);
        }
    }

    private static void face(VertexConsumer vc, PoseStack pose, Matrix4f m, Direction d, TextureAtlasSprite s, float r, float g, float b, float a, int light) {
        float lo = E;
        float hi = 1.0F - E;
        float[][] v;
        switch (d) {
            case DOWN -> v = new float[][]{{lo, lo, hi}, {lo, lo, lo}, {hi, lo, lo}, {hi, lo, hi}};
            case UP -> v = new float[][]{{lo, hi, lo}, {lo, hi, hi}, {hi, hi, hi}, {hi, hi, lo}};
            case NORTH -> v = new float[][]{{hi, hi, lo}, {hi, lo, lo}, {lo, lo, lo}, {lo, hi, lo}};
            case SOUTH -> v = new float[][]{{lo, hi, hi}, {lo, lo, hi}, {hi, lo, hi}, {hi, hi, hi}};
            case WEST -> v = new float[][]{{lo, hi, lo}, {lo, lo, lo}, {lo, lo, hi}, {lo, hi, hi}};
            default -> v = new float[][]{{hi, hi, hi}, {hi, lo, hi}, {hi, lo, lo}, {hi, hi, lo}};
        }
        float[][] uv = {{0, 0}, {0, 1}, {1, 1}, {1, 0}};
        for (int i = 0; i < 4; i++) {
            vc.addVertex(m, v[i][0], v[i][1], v[i][2]).setColor(r, g, b, a).setUv(s.getU(uv[i][0]), s.getV(uv[i][1]))
                    .setOverlay(OverlayTexture.NO_OVERLAY).setLight(light).setNormal(pose.last(), d.getStepX(), d.getStepY(), d.getStepZ());
        }
    }
}
