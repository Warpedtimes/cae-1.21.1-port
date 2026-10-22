package com.caeport.cae.device;

import com.caeport.cae.Cae;
import com.caeport.cae.CaeSounds;
import net.minecraft.core.component.DataComponentType;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.codec.ByteBufCodecs;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.world.inventory.MenuType;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.Fluid;
import net.minecraft.world.level.material.MapColor;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.capabilities.Capabilities;
import net.neoforged.neoforge.capabilities.RegisterCapabilitiesEvent;
import net.neoforged.neoforge.common.extensions.IMenuTypeExtension;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The Thermal devices of this pack as real blocks (they were KubeJS blocks before; the ids are the same), the augments they take,
 * the fertilisers and baits, and what goes with them. Thermal Foundation 9.2.2.58 is what they follow.
 */
@EventBusSubscriber(modid = Cae.ID)
public final class CaeDevices {
    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(BuiltInRegistries.BLOCK, Cae.ID);
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(BuiltInRegistries.ITEM, Cae.ID);
    public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES = DeferredRegister.create(BuiltInRegistries.BLOCK_ENTITY_TYPE, Cae.ID);
    public static final DeferredRegister<MenuType<?>> MENUS = DeferredRegister.create(BuiltInRegistries.MENU, Cae.ID);
    public static final DeferredRegister.DataComponents COMPONENTS = DeferredRegister.createDataComponents(Registries.DATA_COMPONENT_TYPE, Cae.ID);

    /** the augments installed in a device, kept on the dropped device (Thermal: Blocks Retain Augments) */
    public static final DeferredHolder<DataComponentType<?>, DataComponentType<Augments>> AUGMENTS = COMPONENTS.registerComponentType("augments",
            b -> b.persistent(Augments.CODEC).networkSynchronized(Augments.STREAM_CODEC)); // 1211: Augments has value equality, same format as the list
    /** the redstone mode, the filter and the energy a dropped device keeps */
    public static final DeferredHolder<DataComponentType<?>, DataComponentType<CompoundTag>> SETTINGS = COMPONENTS.registerComponentType("device_settings",
            b -> b.persistent(CompoundTag.CODEC).networkSynchronized(ByteBufCodecs.COMPOUND_TAG));

    public static final DeferredHolder<SoundEvent, SoundEvent> TINKER_SOUND = CaeSounds.TINKER;

    public static final DeferredHolder<MenuType<?>, MenuType<DeviceMenu>> DEVICE_MENU = MENUS.register("device",
            () -> IMenuTypeExtension.create((id, inv, buf) -> new DeviceMenu(id, inv, buf)));
    public static final DeferredHolder<MenuType<?>, MenuType<FilterMenu>> FILTER_MENU = MENUS.register("device_filter",
            () -> IMenuTypeExtension.create((id, inv, buf) -> new FilterMenu(id, inv, buf)));
    public static final DeferredHolder<MenuType<?>, MenuType<TinkerMenu>> TINKER_MENU = MENUS.register("tinker_bench",
            () -> IMenuTypeExtension.create((id, inv, buf) -> new TinkerMenu(id, inv, buf)));

    // ---- the devices (the block ids are Thermal's, under cae:) ----

    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<TreeExtractorBE>> TREE_EXTRACTOR_BE =
            device("device_tree_extractor", true, true, 0, TreeExtractorBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<RockGenBE>> ROCK_GEN_BE =
            device("device_rock_gen", true, false, 14, RockGenBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<FisherBE>> FISHER_BE =
            device("device_fisher", true, true, 0, FisherBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<HiveBE>> HIVE_BE =
            device("device_hive_extractor", true, true, 0, HiveBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<ComposterBE>> COMPOSTER_BE =
            device("device_composter", false, true, 0, ComposterBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<DiffuserBE>> DIFFUSER_BE =
            device("device_potion_diffuser", true, false, 0, DiffuserBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<NullifierBE>> NULLIFIER_BE =
            device("device_nullifier", true, false, 7, NullifierBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<CollectorBE>> COLLECTOR_BE =
            device("device_collector", true, false, 0, CollectorBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<SoilInfuserBE>> SOIL_INFUSER_BE =
            device("device_soil_infuser", true, true, 10, SoilInfuserBE::new);
    public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<TinkerBenchBE>> TINKER_BENCH_BE = tinkerBench();

    // ---- phyto-soil, the dirt Phytogro makes ----

    public static final DeferredHolder<Block, PhytoSoilBlock> PHYTOSOIL = BLOCKS.register("phytosoil", () -> new PhytoSoilBlock(soilProps(), false,
            () -> BuiltInRegistries.BLOCK.get(Cae.asResource("phytosoil_tilled"))));
    public static final DeferredHolder<Block, PhytoSoilBlock> PHYTOSOIL_TILLED = BLOCKS.register("phytosoil_tilled", () -> new PhytoSoilBlock(soilProps(),
            true, () -> BuiltInRegistries.BLOCK.get(Cae.asResource("phytosoil"))));

    static {
        ITEMS.register("phytosoil", () -> new BlockItem(PHYTOSOIL.get(), new Item.Properties()));
        ITEMS.register("phytosoil_tilled", () -> new BlockItem(PHYTOSOIL_TILLED.get(), new Item.Properties()));
    }

    private static BlockBehaviour.Properties soilProps() {
        return BlockBehaviour.Properties.of().mapColor(MapColor.DIRT).randomTicks().strength(0.8F).sound(SoundType.GRAVEL)
                .lightLevel(s -> s.getValue(PhytoSoilBlock.CHARGED) > 0 ? 7 : 0);
    }

    // ---- items: fertilisers, bait, the Tinker's Workbench is above ----

    public static final DeferredHolder<Item, FertilizerItem> PHYTOGRO = ITEMS.register("phytogro", () -> new FertilizerItem(new Item.Properties(), 4, true));
    public static final DeferredHolder<Item, FertilizerItem> COMPOST = ITEMS.register("compost", () -> new FertilizerItem(new Item.Properties(), 2, true));
    public static final DeferredHolder<Item, DescItem> AQUACHOW = ITEMS.register("aquachow", () -> new DescItem(new Item.Properties()));
    public static final DeferredHolder<Item, DescItem> DEEP_AQUACHOW = ITEMS.register("deep_aquachow", () -> new DescItem(new Item.Properties()));
    public static final DeferredHolder<Item, DescItem> JUNK_NET = ITEMS.register("junk_net", () -> new DescItem(new Item.Properties()));

    // ---- augments (Thermal's names, types and numbers) ----

    public static final Map<String, DeferredHolder<Item, AugmentItem>> AUGMENTS_BY_NAME = new LinkedHashMap<>();

    static {
        float[] upgrade = {1.0F, 2.0F, 3.0F, 4.0F};
        for (int i = 1; i <= 3; i++) {
            augment("upgrade_augment_" + i, "Upgrade", "", true, true, "BaseMod", upgrade[i]);
        }
        augment("xp_storage_augment", "", "", true, true, "XpStr", 1.0F);
        augment("rf_coil_augment", "RF", "", true, false, "RFMax", 4.0F, "RFXfer", 4.0F);
        augment("rf_coil_storage_augment", "RF", "", true, false, "RFMax", 6.0F, "RFXfer", 2.0F);
        augment("rf_coil_xfer_augment", "RF", "", true, false, "RFMax", 2.0F, "RFXfer", 6.0F);
        augment("fluid_tank_augment", "Fluid", "", true, false, "FluidMax", 4.0F);
        augment("item_filter_augment", "Filter", "item", true, true);
        augment("fluid_filter_augment", "Filter", "fluid", true, true);
        augment("area_radius_augment", "Area", "", false, false, "Radius", 1.0F);
        augment("potion_amplifier_augment", "Potion", "", false, true, "PotionAmp", 1.0F, "PotionDur", -0.25F);
        augment("potion_duration_augment", "Potion", "", false, true, "PotionDur", 1.0F);
    }

    private CaeDevices() {
    }

    public static void register(IEventBus modBus) {
        BLOCKS.register(modBus);
        ITEMS.register(modBus);
        BLOCK_ENTITIES.register(modBus);
        MENUS.register(modBus);
        COMPONENTS.register(modBus);
    }

    private static void augment(String name, String type, String filterType, boolean unique, boolean desc, Object... mods) {
        Map<String, Float> m = new LinkedHashMap<>();
        for (int i = 0; i < mods.length; i += 2) {
            m.put((String) mods[i], ((Number) mods[i + 1]).floatValue());
        }
        AUGMENTS_BY_NAME.put(name, ITEMS.register(name, () -> new AugmentItem(new Item.Properties(), type, m, filterType, unique, desc)));
    }

    /**
     * One device: its block (wood-like with strength 2.5 for the four organic ones, metal-like with strength 2 for the rest, as Thermal
     * had them), its item and its block entity type, all under the same id.
     */
    private static <T extends DeviceBE> DeferredHolder<BlockEntityType<?>, BlockEntityType<T>> device(String id, boolean facing, boolean wood, int light,
                                                                                                    BlockEntityType.BlockEntitySupplier<T> ctor) {
        ResourceLocation rl = Cae.asResource(id);
        boolean composter = id.equals("device_composter");
        DeferredHolder<Block, Block> block = BLOCKS.register(id, () -> {
            BlockBehaviour.Properties p = BlockBehaviour.Properties.of().mapColor(wood ? MapColor.WOOD : MapColor.METAL)
                    .sound(wood ? SoundType.WOOD : SoundType.METAL).strength(wood ? 2.5F : 2.0F);
            if (light > 0) {
                p = p.lightLevel(s -> s.getValue(DeviceBlock.ACTIVE) ? light : 0);
            }
            if (composter) {
                // Thermal's composter is an open box: light must reach the compost inside
                p = p.noOcclusion();
                return new DeviceBlock.Composter(p, rl);
            }
            return facing ? new DeviceBlock.Facing(p, rl) : new DeviceBlock(p, rl);
        });
        ITEMS.register(id, () -> new BlockItem(block.get(), new Item.Properties()));
        return BLOCK_ENTITIES.register(id, () -> BlockEntityType.Builder.of(ctor, block.get()).build(null));
    }

    private static DeferredHolder<BlockEntityType<?>, BlockEntityType<TinkerBenchBE>> tinkerBench() {
        ResourceLocation rl = Cae.asResource("tinker_bench");
        DeferredHolder<Block, Block> block = BLOCKS.register("tinker_bench", () -> new DeviceBlock(
                BlockBehaviour.Properties.of().mapColor(MapColor.WOOD).sound(SoundType.WOOD).strength(2.5F), rl));
        ITEMS.register("tinker_bench", () -> new DescBlockItem(block.get(), new Item.Properties()));
        return BLOCK_ENTITIES.register("tinker_bench", () -> BlockEntityType.Builder.of(TinkerBenchBE::new, block.get()).build(null));
    }

    // ---- lookups for the devices (items and fluids by id, once the registries are filled) ----

    public static Item item(String name) {
        return BuiltInRegistries.ITEM.get(Cae.asResource(name));
    }

    public static Fluid fluid(String id) {
        return BuiltInRegistries.FLUID.get(ResourceLocation.parse(id));
    }

    // ---- what hoppers, pipes and cables see ----

    @SubscribeEvent
    public static void capabilities(RegisterCapabilitiesEvent event) {
        caps(event, TREE_EXTRACTOR_BE.get());
        caps(event, ROCK_GEN_BE.get());
        caps(event, FISHER_BE.get());
        caps(event, HIVE_BE.get());
        caps(event, COMPOSTER_BE.get());
        caps(event, DIFFUSER_BE.get());
        caps(event, NULLIFIER_BE.get());
        caps(event, COLLECTOR_BE.get());
        caps(event, SOIL_INFUSER_BE.get());
        caps(event, TINKER_BENCH_BE.get());
    }

    private static <T extends DeviceBE> void caps(RegisterCapabilitiesEvent event, BlockEntityType<T> type) {
        event.registerBlockEntity(Capabilities.ItemHandler.BLOCK, type, (be, side) -> be.itemCapability(side));
        event.registerBlockEntity(Capabilities.FluidHandler.BLOCK, type, (be, side) -> be.fluidCapability(side));
        event.registerBlockEntity(Capabilities.EnergyStorage.BLOCK, type, (be, side) -> be.energyCapability(side));
    }
}
