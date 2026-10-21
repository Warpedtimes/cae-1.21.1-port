package com.caeport.cae.tiab;

import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.context.UseOnContext;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.AABB;

import java.util.List;

/**
 * Time in a Bottle (the 1.18 mod by haoict has no 1.21.1 build), with the pack's 1.18 config: carried, it stores a
 * second per second, up to 622,080,000 ticks; used on a block entity or a randomly ticking block it makes it run at 2x
 * for 30 s for 30 s of stored time, and each further use doubles it (up to 256x) for (speed/4) x 30 s.
 * The stored ticks live in the {@code tiab:stored_time} data component.
 */
public class TimeInABottle extends Item {
    static final int EACH_USE = 30 * 20;
    static final int MAX_RATE = 1 << 8;
    static final int MAX_STORED = 622_080_000;
    static final int RANDOM_TICK_ODDS = 1365;

    public TimeInABottle(Properties properties) {
        super(properties);
    }

    public static int stored(ItemStack stack) {
        return stack.getOrDefault(Tiab.STORED_TIME.get(), 0);
    }

    public static void setStored(ItemStack stack, int ticks) {
        stack.set(Tiab.STORED_TIME.get(), Math.max(0, Math.min(ticks, MAX_STORED)));
    }

    static int cost(int rate) {
        return rate <= 1 ? EACH_USE : rate / 2 * EACH_USE;
    }

    @Override
    public void inventoryTick(ItemStack stack, Level level, Entity holder, int slot, boolean selected) {
        if (level.isClientSide) {
            return;
        }
        // Only one bottle per player fills, the first one in slot order (main inventory, offhand, armour); the others
        // keep their time. TIAB emptied the smaller one every 10 s instead, which let bottles with equal time all fill.
        if (holder instanceof Player player && firstBottle(player) != stack) {
            return;
        }
        if (level.getGameTime() % 20 == 0 && stored(stack) < MAX_STORED) {
            setStored(stack, stored(stack) + 20);
        }
    }

    private ItemStack firstBottle(Player player) {
        Inventory inv = player.getInventory();
        for (List<ItemStack> part : List.of(inv.items, inv.offhand, inv.armor)) {
            for (ItemStack s : part) {
                if (s.getItem() == this) {
                    return s;
                }
            }
        }
        return ItemStack.EMPTY;
    }

    @Override
    public InteractionResult useOn(UseOnContext context) {
        Level level = context.getLevel();
        if (level.isClientSide) {
            return InteractionResult.PASS;
        }
        BlockPos pos = context.getClickedPos();
        BlockState state = level.getBlockState(pos);
        // only something the accelerator can tick (a chest or sign would take the time and do nothing)
        BlockEntity target = level.getBlockEntity(pos);
        if ((target == null || state.getTicker(level, target.getType()) == null) && !state.isRandomlyTicking()) {
            return InteractionResult.FAIL;
        }
        ItemStack stack = context.getItemInHand();
        Player player = context.getPlayer();
        boolean creative = player != null && player.isCreative();
        TimeAccelerator existing = level.getEntitiesOfClass(TimeAccelerator.class, new AABB(pos)).stream().findFirst().orElse(null);
        int rate = 1;
        int cost = cost(rate);
        if (existing != null) {
            if (existing.rate() >= MAX_RATE / 2) {
                return InteractionResult.SUCCESS;
            }
            rate = existing.rate() * 2;
            cost = cost(rate);
            if (!creative && stored(stack) < cost) {
                return InteractionResult.SUCCESS;
            }
            int usedUp = EACH_USE - existing.remaining();
            existing.setRate(rate);
            existing.setRemaining(existing.remaining() + usedUp / 2);
        } else {
            if (!creative && stored(stack) < cost) {
                return InteractionResult.SUCCESS;
            }
            TimeAccelerator accelerator = new TimeAccelerator(level, pos);
            accelerator.setRemaining(EACH_USE);
            level.addFreshEntity(accelerator);
            rate = accelerator.rate();
        }
        if (!creative) {
            setStored(stack, stored(stack) - cost);
        }
        int step = Integer.numberOfTrailingZeros(Math.max(rate, 1));
        level.playSound(null, pos, SoundEvents.NOTE_BLOCK_HARP.value(), SoundSource.BLOCKS, 0.5F,
                (float) Math.pow(2.0, (step * 2 - 12) / 12.0));
        return InteractionResult.SUCCESS;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        int seconds = stored(stack) / 20;
        tooltip.add(Component.translatable("item.tiab.time_in_a_bottle.tooltip.stored_time",
                String.format("%02d", seconds / 3600), String.format("%02d", seconds % 3600 / 60),
                String.format("%02d", seconds % 60)).withStyle(ChatFormatting.GREEN));
    }

    @Override
    public boolean shouldCauseReequipAnimation(ItemStack oldStack, ItemStack newStack, boolean slotChanged) {
        return !ItemStack.isSameItem(oldStack, newStack);
    }
}
