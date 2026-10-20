package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BiomeTags;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.material.FluidState;
import net.minecraft.world.level.material.Fluids;
import net.neoforged.neoforge.fluids.FluidStack;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * The Igneous Extruder (Thermal Foundation 9.2.2.58's DeviceRockGenTile and RockGenManager): lava on one of its four sides
 * and a cooling block on another make stone in a one-slot output, one per 20 ticks (10 in the Nether). The block underneath can
 * change what comes out. Gives light 14 while it works.
 */
public class RockGenBE extends DeviceBE {
    /** RockGenManager's default time */
    public static int baseTime = 20;

    private record Rule(String below, String adjacent, String result) {
    }

    private static final List<Rule> RULES = new ArrayList<>();
    static {
        // data/thermal/recipes/devices/rock_gen/*.json
        add(null, "minecraft:water", "minecraft:cobblestone");
        add("minecraft:magma_block", "minecraft:water", "minecraft:stone");
        add(null, "minecraft:blue_ice", "minecraft:blackstone");
        add("minecraft:soul_soil", "minecraft:blue_ice", "minecraft:basalt");
        add(null, "minecraft:packed_ice", "minecraft:cobbled_deepslate");
        add("minecraft:magma_block", "minecraft:packed_ice", "minecraft:deepslate");
        // the pack's own (kubejs/server_scripts/thermal.js bedrock_cobblegen): water next to it and the result itself below it. byg: ids
        // are Biomes We've Gone's now; ether_stone, purpur_stone, soapstone and scoria_stone have no counterpart (create:scoria is in)
        for (String r : new String[]{"biomeswevegone:dacite_cobblestone", "biomeswevegone:red_rock", "minecraft:tuff", "minecraft:blackstone",
                "minecraft:andesite", "minecraft:diorite", "minecraft:granite", "biomeswevegone:black_sandstone", "biomeswevegone:blue_sandstone",
                "biomeswevegone:dacite", "biomeswevegone:purple_sandstone", "biomeswevegone:pink_sandstone", "biomeswevegone:white_sandstone",
                "minecraft:red_sandstone", "minecraft:sandstone", "quark:limestone", "quark:permafrost", "create:scoria", "create:limestone"}) {
            add(r, "minecraft:water", r);
        }
    }

    private static void add(String below, String adjacent, String result) {
        RULES.add(new Rule(below, adjacent, result));
    }

    private static Block blockOf(String id) {
        return BuiltInRegistries.BLOCK.getOptional(ResourceLocation.parse(id)).orElse(Blocks.AIR);
    }

    /** the result of the best rule: rules with a block below first (in the order of the neighbours), then those without */
    private static Rule lookup(Block below, Block[] adjacent) {
        for (Block adj : adjacent) {
            for (Rule r : RULES) {
                if (r.below() != null && blockOf(r.below()) == below && blockOf(r.adjacent()) == adj) {
                    return r;
                }
            }
        }
        for (Block adj : adjacent) {
            for (Rule r : RULES) {
                if (r.below() == null && blockOf(r.adjacent()) == adj) {
                    return r;
                }
            }
        }
        return null;
    }

    protected final int slotOut;
    protected Block below = Blocks.AIR;
    protected Block adjacent = Blocks.AIR;
    protected int adjLava;
    protected boolean valid;
    protected int process;
    protected int processMax = baseTime;
    protected int genAmount = 1;
    protected ItemStack resultItem = ItemStack.EMPTY;

    public RockGenBE(BlockPos pos, BlockState state) {
        super(CaeDevices.ROCK_GEN_BE.get(), pos, state);
        slotOut = inv.getSlots();
        inv.add(DeviceInventory.Group.OUTPUT).enabled = () -> isActive;
        addAugmentSlots();
        renderFluid = new FluidStack(Fluids.LAVA, 1000);
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade");
    }

    @Override
    public String guiTexture() {
        return "rock_gen";
    }

    @Override
    public GuiLayout layout() {
        return new GuiLayout().outSlot(slotOut, 125, 35).fluidProgress("progress_arrow_fluid_right", 84, 35);
    }

    public Block below() {
        return below;
    }

    public Block adjacent() {
        return adjacent;
    }

    public int adjLava() {
        return adjLava;
    }

    @Override
    protected void updateValidity() {
        if (level == null || level.isClientSide || !level.isAreaLoaded(worldPosition, 1)) {
            return;
        }
        adjLava = 0;
        valid = false;
        Block[] adj = new Block[4];
        Direction[] order = {Direction.NORTH, Direction.SOUTH, Direction.WEST, Direction.EAST};
        for (int i = 0; i < 4; i++) {
            BlockPos p = worldPosition.relative(order[i]);
            FluidState fs = level.getFluidState(p);
            if (fs.getType() == Fluids.LAVA) {
                adjLava++;
            }
            // a flowing fluid counts as air
            adj[i] = !fs.isEmpty() && !fs.isSource() ? Blocks.AIR : level.getBlockState(p).getBlock();
        }
        if (adjLava > 0) {
            Block under = level.getBlockState(worldPosition.below()).getBlock();
            Rule rule = lookup(under, adj);
            Item result = rule == null ? null : BuiltInRegistries.ITEM.getOptional(ResourceLocation.parse(rule.result())).orElse(null);
            if (result != null && result != net.minecraft.world.item.Items.AIR) {
                resultItem = new ItemStack(result);
                ItemStack held = inv.getStackInSlot(slotOut);
                if (!held.isEmpty() && !ItemStack.isSameItemSameComponents(held, resultItem)) {
                    inv.clear(slotOut);
                }
                Block prevBelow = below;
                Block prevAdj = adjacent;
                below = rule.below() == null ? Blocks.AIR : blockOf(rule.below());
                adjacent = blockOf(rule.adjacent());
                if (below != prevBelow || adjacent != prevAdj) {
                    syncClient();
                }
                processMax = baseTime;
                genAmount = 1;
                if (level.getBiome(worldPosition).is(BiomeTags.IS_NETHER)) {
                    processMax = Math.max(1, processMax / 2);
                }
                process = processMax;
                valid = true;
            }
        }
        cached = true;
    }

    @Override
    protected boolean isValid() {
        return valid;
    }

    @Override
    public void tickServer() {
        updateActiveState();
        if (isActive) {
            process--;
            if (process <= 0) {
                process = processMax;
                inv.modify(slotOut, resultItem, (int) (genAmount * baseMod));
            }
        }
    }

    @Override
    public int getScaledProgress(int scale) {
        return isActive && processMax > 0 && !inv.isFull(slotOut) ? scale * (processMax - process) / processMax : 0;
    }

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putInt("Proc", process);
        tag.putInt("ProcMax", processMax);
        tag.putInt("Lava", adjLava);
        tag.putString("Below", BuiltInRegistries.BLOCK.getKey(below).toString());
        tag.putString("Adjacent", BuiltInRegistries.BLOCK.getKey(adjacent).toString());
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        process = tag.getInt("Proc");
        processMax = Math.max(1, tag.getInt("ProcMax"));
        adjLava = tag.getInt("Lava");
        below = blockOf(tag.getString("Below").isEmpty() ? "minecraft:air" : tag.getString("Below"));
        adjacent = blockOf(tag.getString("Adjacent").isEmpty() ? "minecraft:air" : tag.getString("Adjacent"));
    }

    @Override
    protected void saveSync(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putString("Below", BuiltInRegistries.BLOCK.getKey(below).toString());
        tag.putString("Adjacent", BuiltInRegistries.BLOCK.getKey(adjacent).toString());
        tag.putInt("Lava", adjLava);
    }

    @Override
    protected void loadSync(CompoundTag tag, HolderLookup.Provider registries) {
        below = blockOf(tag.getString("Below").isEmpty() ? "minecraft:air" : tag.getString("Below"));
        adjacent = blockOf(tag.getString("Adjacent").isEmpty() ? "minecraft:air" : tag.getString("Adjacent"));
        adjLava = tag.getInt("Lava");
    }

    @Override
    protected void loadLegacyAttachments(HolderLookup.Provider registries, CompoundTag attachments) {
        inv.loadLegacy(registries, attachments.get("out"), slotOut, 1);
        resultItem = inv.getStackInSlot(slotOut).copyWithCount(1);
    }

    @Override
    public void writeGui(RegistryFriendlyByteBuf buf) {
        super.writeGui(buf);
        buf.writeInt(process);
        buf.writeInt(processMax);
        buf.writeInt(adjLava);
        buf.writeUtf(BuiltInRegistries.BLOCK.getKey(below).toString());
        buf.writeUtf(BuiltInRegistries.BLOCK.getKey(adjacent).toString());
    }

    @Override
    public void readGui(RegistryFriendlyByteBuf buf) {
        super.readGui(buf);
        process = buf.readInt();
        processMax = Math.max(1, buf.readInt());
        adjLava = buf.readInt();
        below = blockOf(buf.readUtf());
        adjacent = blockOf(buf.readUtf());
    }

    // for scripts and tests
    public void setProcess(int p) {
        process = p;
    }

    public int process() {
        return process;
    }

    public int processMax() {
        return processMax;
    }
}
