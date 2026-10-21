package com.caeport.cae.block;

import com.caeport.cae.Cae;
import com.mojang.serialization.MapCodec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.RandomSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.ItemInteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.BlockHitResult;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.tick.LevelTickEvent;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;

/**
 * Right-click with redstone (one is used up): within a random radius of 2 to 5, some of the air around the catalyst
 * turns into its stone a few seconds later. The nearer the radius, the denser the cloud.
 */
public class CatalystBlock extends Block {
    public static final MapCodec<CatalystBlock> CODEC = RecordCodecBuilder.mapCodec(i -> i.group(
            propertiesCodec(),
            ResourceLocation.CODEC.fieldOf("stone").forGetter(b -> b.stone)
    ).apply(i, CatalystBlock::new));

    private static final Map<ResourceKey<Level>, Map<BlockPos, Pending>> PENDING = new HashMap<>();

    /** In singleplayer the map outlives a world: stone queued in one world must not appear in the next one opened. */
    @net.neoforged.fml.common.EventBusSubscriber(modid = com.caeport.cae.Cae.ID)
    public static final class PendingReset {
        @net.neoforged.bus.api.SubscribeEvent
        public static void onServerStopped(net.neoforged.neoforge.event.server.ServerStoppedEvent event) {
            PENDING.clear();
        }
    }

    private final ResourceLocation stone;

    public CatalystBlock(Properties properties, ResourceLocation stone) {
        super(properties);
        this.stone = stone;
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    @Override
    protected ItemInteractionResult useItemOn(ItemStack held, BlockState state, Level level, BlockPos pos, Player player,
                                              InteractionHand hand, BlockHitResult hit) {
        if (!held.is(Items.REDSTONE)) {
            return ItemInteractionResult.PASS_TO_DEFAULT_BLOCK_INTERACTION;
        }
        if (level.isClientSide) {
            return ItemInteractionResult.SUCCESS;
        }
        if (!player.getAbilities().instabuild) {
            held.shrink(1);
        }
        Optional<Block> target = BuiltInRegistries.BLOCK.getOptional(stone);
        if (target.isEmpty()) {
            return ItemInteractionResult.SUCCESS;
        }
        RandomSource random = level.getRandom();
        int radius = random.nextInt(4) + 2;
        int chance = 60 / radius;
        Map<BlockPos, Pending> pending = PENDING.computeIfAbsent(level.dimension(), k -> new HashMap<>());
        for (BlockPos p : BlockPos.betweenClosed(pos.offset(-radius, -radius, -radius), pos.offset(radius, radius, radius))) {
            if (!p.equals(pos) && level.isEmptyBlock(p) && random.nextInt(100) <= chance) {
                pending.putIfAbsent(p.immutable(), new Pending(target.get().defaultBlockState(), 60 + random.nextInt(60)));
            }
        }
        return ItemInteractionResult.SUCCESS;
    }

    private static final class Pending {
        final BlockState state;
        int ticks;

        Pending(BlockState state, int ticks) {
            this.state = state;
            this.ticks = ticks;
        }
    }

    @EventBusSubscriber(modid = Cae.ID)
    public static final class Ticker {
        @SubscribeEvent
        public static void tick(LevelTickEvent.Post event) {
            if (!(event.getLevel() instanceof ServerLevel level)) {
                return;
            }
            Map<BlockPos, Pending> pending = PENDING.get(level.dimension());
            if (pending == null || pending.isEmpty()) {
                return;
            }
            for (Iterator<Map.Entry<BlockPos, Pending>> it = pending.entrySet().iterator(); it.hasNext(); ) {
                Map.Entry<BlockPos, Pending> e = it.next();
                if (--e.getValue().ticks > 0) {
                    continue;
                }
                it.remove();
                if (level.isLoaded(e.getKey()) && level.isEmptyBlock(e.getKey())) {
                    level.setBlock(e.getKey(), e.getValue().state, Block.UPDATE_ALL);
                }
            }
        }
    }
}
