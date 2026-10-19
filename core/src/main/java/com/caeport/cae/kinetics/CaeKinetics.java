package com.caeport.cae.kinetics;

import com.caeport.cae.Cae;
import com.simibubi.create.AllBlocks;
import com.simibubi.create.content.decoration.encasing.CasingBlock;
import com.simibubi.create.content.decoration.encasing.EncasedCTBehaviour;
import com.simibubi.create.content.decoration.encasing.EncasingRegistry;
import com.simibubi.create.content.kinetics.base.KineticBlockEntity;
import com.simibubi.create.content.kinetics.base.RotatedPillarKineticBlock;
import com.simibubi.create.content.kinetics.base.ShaftRenderer;
import com.simibubi.create.content.kinetics.base.SingleAxisRotatingVisual;
import com.simibubi.create.content.kinetics.simpleRelays.SimpleKineticBlockEntity;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedCogCTBehaviour;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedCogRenderer;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedCogVisual;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedCogwheelBlock;
import com.simibubi.create.content.kinetics.simpleRelays.encased.EncasedShaftBlock;
import com.simibubi.create.foundation.block.connected.AllCTTypes;
import com.simibubi.create.foundation.block.connected.CTSpriteShiftEntry;
import com.simibubi.create.foundation.block.connected.CTSpriteShifter;
import com.simibubi.create.foundation.block.connected.CTType;
import com.simibubi.create.foundation.data.BuilderTransformers;
import com.simibubi.create.foundation.data.CreateRegistrate;
import com.simibubi.create.foundation.data.SharedProperties;
import com.simibubi.create.foundation.data.TagGen;
import com.tterrag.registrate.builders.BlockBuilder;
import com.tterrag.registrate.util.entry.BlockEntityEntry;
import com.tterrag.registrate.util.entry.BlockEntry;
import net.createmod.catnip.data.Couple;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.core.Direction.AxisDirection;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.MapColor;

import static com.caeport.cae.Cae.REGISTRATE;

/**
 * Casings in four materials, each with an encased shaft, encased cogwheel and encased large cogwheel, built the way
 * Create builds its andesite and brass ones. Blockstates, models, loot tables and tags ship as resources (taken from
 * the 1.18.2 jar), so none of the registrate datagen hooks are set here.
 */
public final class CaeKinetics {
    public static final Material GOLD = new Material("gold", MapColor.GOLD, SoundType.WOOD);
    public static final Material ZINC = new Material("zinc", MapColor.GLOW_LICHEN, SoundType.LANTERN);
    public static final Material ENDERIUM = new Material("enderium", MapColor.COLOR_CYAN, SoundType.LANTERN);
    public static final Material SUPERCRITICAL = new Material("supercritical", MapColor.COLOR_BLACK, SoundType.DEEPSLATE);
    public static final Material[] MATERIALS = {GOLD, ZINC, ENDERIUM, SUPERCRITICAL};

    public static final BlockEntityEntry<KineticBlockEntity> ENCASED_SHAFT = REGISTRATE
            .blockEntity("encased_shaft", KineticBlockEntity::new)
            .visual(() -> SingleAxisRotatingVisual::shaft, false)
            .validBlocks(GOLD.shaft, ZINC.shaft, ENDERIUM.shaft, SUPERCRITICAL.shaft)
            .renderer(() -> ShaftRenderer::new)
            .register();
    public static final BlockEntityEntry<SimpleKineticBlockEntity> ENCASED_COGWHEEL = REGISTRATE
            .blockEntity("encased_cogwheel", SimpleKineticBlockEntity::new)
            .visual(() -> EncasedCogVisual::small, false)
            .validBlocks(GOLD.cogwheel, ZINC.cogwheel, ENDERIUM.cogwheel, SUPERCRITICAL.cogwheel)
            .renderer(() -> EncasedCogRenderer::small)
            .register();
    public static final BlockEntityEntry<SimpleKineticBlockEntity> ENCASED_LARGE_COGWHEEL = REGISTRATE
            .blockEntity("encased_large_cogwheel", SimpleKineticBlockEntity::new)
            .visual(() -> EncasedCogVisual::large, false)
            .validBlocks(GOLD.largeCogwheel, ZINC.largeCogwheel, ENDERIUM.largeCogwheel, SUPERCRITICAL.largeCogwheel)
            .renderer(() -> EncasedCogRenderer::large)
            .register();

    private CaeKinetics() {
    }

    /** Loads this class, which registers everything above with the registrate. */
    public static void register() {
    }

    public static final class Material {
        public final CTSpriteShiftEntry casingShift, cogSideShift, cogOtherSideShift;
        public final BlockEntry<CasingBlock> casing;
        public final BlockEntry<CaeEncasedShaftBlock> shaft;
        public final BlockEntry<CaeEncasedCogwheelBlock> cogwheel, largeCogwheel;

        Material(String name, MapColor color, SoundType sound) {
            casingShift = ct(AllCTTypes.OMNIDIRECTIONAL, name + "_casing");
            cogSideShift = ct(AllCTTypes.VERTICAL, name + "_encased_cogwheel_side");
            cogOtherSideShift = ct(AllCTTypes.HORIZONTAL, name + "_encased_cogwheel_side");

            casing = REGISTRATE.block(name + "_casing", CasingBlock::new)
                    .transform(BuilderTransformers.casing(() -> casingShift))
                    .properties(p -> p.mapColor(color).sound(sound))
                    .register();

            shaft = REGISTRATE.block(name + "_encased_shaft", p -> new CaeEncasedShaftBlock(p, casing::get))
                    .properties(p -> p.mapColor(color))
                    .transform(b -> encased(b))
                    .onRegister(CreateRegistrate.connectedTextures(() -> new EncasedCTBehaviour(casingShift)))
                    .onRegister(CreateRegistrate.casingConnectivity((block, cc) -> cc.make(block, casingShift,
                            (s, f) -> f.getAxis() != s.getValue(EncasedShaftBlock.AXIS))))
                    .transform(EncasingRegistry.addVariantTo(AllBlocks.SHAFT))
                    .transform(TagGen.axeOrPickaxe())
                    .item().build()
                    .register();

            cogwheel = cogwheel(name + "_encased_cogwheel", color, false)
                    .transform(EncasingRegistry.addVariantTo(AllBlocks.COGWHEEL))
                    .onRegister(CreateRegistrate.connectedTextures(() -> new EncasedCogCTBehaviour(casingShift,
                            Couple.create(cogSideShift, cogOtherSideShift))))
                    .item().build()
                    .register();

            largeCogwheel = cogwheel(name + "_encased_large_cogwheel", color, true)
                    .transform(EncasingRegistry.addVariantTo(AllBlocks.LARGE_COGWHEEL))
                    .onRegister(CreateRegistrate.connectedTextures(() -> new EncasedCogCTBehaviour(casingShift)))
                    .item().build()
                    .register();
        }

        private BlockBuilder<CaeEncasedCogwheelBlock, CreateRegistrate> cogwheel(String id, MapColor color, boolean large) {
            return REGISTRATE.block(id, p -> new CaeEncasedCogwheelBlock(p, large, casing::get))
                    .properties(p -> p.mapColor(color))
                    .transform(b -> encased(b))
                    .addLayer(() -> RenderType::cutoutMipped)
                    .onRegister(CreateRegistrate.casingConnectivity((block, cc) -> cc.make(block, casingShift,
                            (s, f) -> f.getAxis() == s.getValue(EncasedCogwheelBlock.AXIS)
                                    && !s.getValue(f.getAxisDirection() == AxisDirection.POSITIVE
                                    ? EncasedCogwheelBlock.TOP_SHAFT : EncasedCogwheelBlock.BOTTOM_SHAFT))))
                    .transform(TagGen.axeOrPickaxe());
        }

        // Create's own encasedBase also sets a stress impact through CStress, which only accepts Create's blocks;
        // an unregistered block has no impact anyway.
        private static <B extends RotatedPillarKineticBlock, P> BlockBuilder<B, P> encased(BlockBuilder<B, P> b) {
            return b.initialProperties(SharedProperties::stone).properties(BlockBehaviour.Properties::noOcclusion);
        }

        private static CTSpriteShiftEntry ct(CTType type, String texture) {
            return CTSpriteShifter.getCT(type, Cae.asResource("block/" + texture),
                    Cae.asResource("block/" + texture + "_connected"));
        }
    }
}
