package com.caeport.cae.device;

import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.BoneMealItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.context.UseOnContext;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.BambooStalkBlock;
import net.minecraft.world.level.block.BonemealableBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.neoforged.neoforge.event.EventHooks;

import java.util.List;

/**
 * Thermal's fertilisers (FertilizerItem): a stronger bone meal. Each use tries to grow the plant {@code strength} times, and only
 * uses the item up one time in {@code strength}. Phytogro is strength 4, compost strength 2. They also work as the Arboreal
 * Extractor's boost.
 */
public class FertilizerItem extends Item {
    protected final int strength;
    private final boolean description;

    public FertilizerItem(Properties properties, int strength, boolean description) {
        super(properties);
        this.strength = strength;
        this.description = description;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, tooltip, flag);
        if (description) {
            tooltip.add(Component.translatable(getDescriptionId() + ".desc").withStyle(ChatFormatting.GOLD));
        }
    }

    @Override
    public InteractionResult useOn(UseOnContext context) {
        Level level = context.getLevel();
        BlockPos pos = context.getClickedPos();
        ItemStack stack = context.getItemInHand();
        BlockState state = level.getBlockState(pos);
        Player player = context.getPlayer();
        boolean used;
        var event = EventHooks.fireBonemealEvent(player, level, pos, state, stack);
        if (event.isCanceled()) {
            used = event.isSuccessful();
        } else {
            used = growPlant(level, pos, state, strength);
            // vanilla's sea grass / coral growing; it uses the stack up itself, so it gets a copy
            used |= BoneMealItem.growWaterPlant(stack.copy(), level, pos, context.getClickedFace());
            if (!level.isClientSide && used && level.random.nextInt(strength) == 0) {
                stack.shrink(1);
            }
        }
        if (used) {
            if (!level.isClientSide) {
                level.levelEvent(2005, pos, 0);
            }
            return InteractionResult.sidedSuccess(level.isClientSide);
        }
        return InteractionResult.PASS;
    }

    protected static boolean growPlant(Level level, BlockPos pos, BlockState state, int strength) {
        if (!(state.getBlock() instanceof BonemealableBlock growable) || !growable.isValidBonemealTarget(level, pos, state)) {
            return false;
        }
        if (level instanceof ServerLevel sl) {
            boolean canUse = false;
            for (int i = 0; i < strength; i++) {
                canUse |= growable.isBonemealSuccess(level, level.random, pos, state);
            }
            if (canUse) {
                try {
                    growable.performBonemeal(sl, level.random, pos, state);
                } catch (RuntimeException e) {
                    if (!(state.getBlock() instanceof BambooStalkBlock)) {
                        throw e;
                    }
                }
            }
        }
        return true;
    }
}
