package com.caeport.cae;

import com.caeport.cae.block.CatalystBlock;
import com.caeport.cae.block.SingularityCoreBlock;
import com.caeport.cae.block.SingularityCoreBlockEntity;
import com.caeport.cae.block.SingularityVeinBlock;
import com.caeport.cae.block.TimeCrystalBlock;
import com.caeport.cae.block.TimeCrystalBlockEntity;
import com.caeport.cae.entity.CaeEntities;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraft.world.level.block.state.BlockBehaviour.Properties;
import net.minecraft.world.level.material.MapColor;
import net.minecraft.world.level.material.PushReaction;
import net.neoforged.neoforge.common.DeferredSpawnEggItem;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

import java.util.function.Supplier;

/** The blocks that aren't Create kinetics (those are in {@link com.caeport.cae.kinetics.CaeKinetics}). */
public final class CaeBlocks {
    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(BuiltInRegistries.BLOCK, Cae.ID);
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(BuiltInRegistries.ITEM, Cae.ID);
    public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
            DeferredRegister.create(BuiltInRegistries.BLOCK_ENTITY_TYPE, Cae.ID);

    // Placed by the skystone catalyst; scripts give it AE2 sky stone's loot and #cae:skystone.
    public static final DeferredHolder<Block, Block> SKY_STONE = withItem("sky_stone", () -> new Block(
            Properties.of().mapColor(MapColor.STONE).strength(1.0F).sound(SoundType.STONE)));

    // Scripted portals: the blocks themselves do nothing, structure.js and friends react to them.
    public static final DeferredHolder<Block, Block> VOID_PORTAL = withItem("void_portal", CaeBlocks::portal);
    public static final DeferredHolder<Block, Block> ARCANE_PORTAL = withItem("arcane_portal", CaeBlocks::portal);
    public static final DeferredHolder<Block, Block> START_PORTAL = withItem("start_portal", CaeBlocks::portal);
    public static final DeferredHolder<Block, Block> END_PORTAL = withItem("end_portal", CaeBlocks::portal);

    // Right-click with redstone: the stone they stand for appears in the air around them.
    public static final DeferredHolder<Block, Block> SKYSTONE_CATALYST = withItem("skystone_catalyst", () -> new CatalystBlock(
            Properties.ofFullCopy(Blocks.BEDROCK).lightLevel(s -> 15), Cae.asResource("sky_stone")));
    public static final DeferredHolder<Block, Block> VERIDIUM_CATALYST = catalyst("veridium");
    public static final DeferredHolder<Block, Block> OCHRUM_CATALYST = catalyst("ochrum");
    public static final DeferredHolder<Block, Block> ASURINE_CATALYST = catalyst("asurine");
    public static final DeferredHolder<Block, Block> CRIMSITE_CATALYST = catalyst("crimsite");

    public static final DeferredHolder<Block, Block> SOURCE_TIME_CRYSTAL = withItem("source_time_crystal",
            () -> new TimeCrystalBlock(Properties.ofFullCopy(Blocks.BUDDING_AMETHYST).noOcclusion()));
    public static final DeferredHolder<Block, Block> SINGULARITY_CORE = withItem("singularity_core",
            () -> new SingularityCoreBlock(Properties.ofFullCopy(Blocks.BEDROCK).noOcclusion()));
    public static final DeferredHolder<Block, Block> SINGULARITY_VEIN = withItem("singularity_vein",
            () -> new SingularityVeinBlock(Properties.ofFullCopy(Blocks.BEDROCK).noOcclusion()));

    // The 1.18.2 IDs, so saved block entities (and anything that names them) still match.
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<TimeCrystalBlockEntity>> TIME_CRYSTAL_BE =
            BLOCK_ENTITIES.register("source_time_crystal_entity", () -> BlockEntityType.Builder
                    .of(TimeCrystalBlockEntity::new, SOURCE_TIME_CRYSTAL.get()).build(null));
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<SingularityCoreBlockEntity>> SINGULARITY_BE =
            BLOCK_ENTITIES.register("singularity_e", () -> BlockEntityType.Builder
                    .of(SingularityCoreBlockEntity::new, SINGULARITY_CORE.get()).build(null));

    public static final DeferredHolder<Item, DeferredSpawnEggItem> ORB_SPAWN_EGG = ITEMS.register("orb_spawn_egg",
            () -> new DeferredSpawnEggItem(CaeEntities.ESSENTIAL_ORB, 9735821, 3880501, new Item.Properties()));

    private CaeBlocks() {
    }

    private static Block portal() {
        return new Block(Properties.of().mapColor(MapColor.COLOR_PURPLE).noCollission().noOcclusion().strength(-1.0F)
                .sound(SoundType.GLASS).lightLevel(s -> 6).pushReaction(PushReaction.BLOCK).noLootTable());
    }

    private static DeferredHolder<Block, Block> catalyst(String stone) {
        return withItem(stone + "_catalyst", () -> new CatalystBlock(
                Properties.ofFullCopy(Blocks.OBSIDIAN).lightLevel(s -> 15),
                ResourceLocation.fromNamespaceAndPath("create", stone)));
    }

    private static DeferredHolder<Block, Block> withItem(String name, Supplier<? extends Block> block) {
        DeferredHolder<Block, Block> entry = BLOCKS.register(name, block);
        ITEMS.register(name, () -> new BlockItem(entry.get(), new Item.Properties()));
        return entry;
    }
}
