package com.caeport.cae.feather;

import java.util.List;
import java.util.WeakHashMap;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.player.Abilities;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.level.Level;
import net.neoforged.fml.ModList;
import net.neoforged.fml.loading.FMLEnvironment;
import net.neoforged.neoforge.event.tick.PlayerTickEvent;
import top.theillusivec4.curios.api.CuriosApi;

/**
 * {@code magicfeather:magicfeather}: while a player carries it (in the charm slot when Curios is installed) and stands
 * inside the range of an active beacon, they may fly. Leaving the range, they keep the flight until they land and take
 * no fall damage (or get slow falling, by config). Behaviour of Magic Feather 4.2.0 for 1.18.2.
 */
public class MagicFeatherItem extends Item {
    private static final WeakHashMap<Player, Data> DATA = new WeakHashMap<>();

    public MagicFeatherItem(Properties properties) {
        super(properties);
    }

    @Override
    public int getEntityLifespan(ItemStack stack, Level level) {
        return Integer.MAX_VALUE;
    }

    @Override
    public boolean hasCustomEntity(ItemStack stack) {
        return true;
    }

    @Override
    public Entity createEntity(Level level, Entity location, ItemStack stack) {
        location.setInvulnerable(true); // it cannot burn up or fall into the void's damage
        return null;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, tooltip, flag);
        if (FMLEnvironment.dist.isClient()) {
            Client.addTooltip(this, tooltip);
        }
    }

    private static boolean curiosInstalled() {
        return ModList.get().isLoaded("curios");
    }

    private static boolean requiresCurios() {
        return curiosInstalled() && MagicFeatherConfig.REQUIRES_CURIOS.get();
    }

    private static boolean curiosEquipped(Player player, Item item) {
        return CuriosApi.getCuriosInventory(player).map(h -> h.findFirstCurio(item).isPresent()).orElse(false);
    }

    private static boolean hasItem(Player player, Item item) {
        if (curiosInstalled()) {
            if (curiosEquipped(player, item)) {
                return true;
            }
            if (MagicFeatherConfig.REQUIRES_CURIOS.get()) {
                return false;
            }
        }
        for (int i = 0; i < player.getInventory().getContainerSize(); i++) {
            if (player.getInventory().getItem(i).is(item)) {
                return true;
            }
        }
        return false;
    }

    private static void setMayFly(Player player, boolean mayFly) {
        if (player.getAbilities().mayfly != mayFly) {
            player.getAbilities().mayfly = mayFly;
            player.onUpdateAbilities();
        }
    }

    public static void onPlayerTick(PlayerTickEvent.Post event) {
        Player player = event.getEntity();
        if (player.level().isClientSide) {
            return;
        }
        Data data = DATA.get(player);
        if (data == null) {
            data = new Data(player);
            DATA.put(player, data);
        }
        data.tick();
    }

    private static final class Data {
        private final Player player;
        private boolean softLanding;
        private boolean wasGrantedFlight;
        private boolean slowFalling;
        private int checkTick;
        private boolean beaconInRange;

        Data(Player player) {
            this.player = player;
            this.beaconInRange = player.getAbilities().mayfly;
        }

        void tick() {
            if (player.isSpectator()) {
                return;
            }
            Item feather = MagicFeather.ITEM.get();
            boolean mayFly = player.isCreative() || hasItem(player, feather) && beaconInRange();
            if (mayFly) {
                setMayFly(player, true);
                softLanding = false;
            } else if (wasGrantedFlight) {
                softLanding = true;
            }
            if (softLanding && softLand()) {
                softLanding = false;
            }
            wasGrantedFlight = mayFly;
        }

        private boolean beaconInRange() {
            if (checkTick++ % 20 != 0) {
                return beaconInRange;
            }
            beaconInRange = BeaconRange.isInRange(player);
            return beaconInRange;
        }

        private boolean softLand() {
            return MagicFeatherConfig.FALL_STYLE.get() == MagicFeatherConfig.FallStyle.SLOW_FALL ? slowFall() : negateFallDamage();
        }

        private boolean onGround() {
            return player.onGround() && player.fallDistance < 1.0F;
        }

        private boolean slowFall() {
            Abilities abilities = player.getAbilities();
            if (abilities.flying) {
                slowFalling = true;
                abilities.flying = false;
            }
            abilities.mayfly = false;
            player.onUpdateAbilities();
            boolean ground = onGround();
            if (ground) {
                slowFalling = false;
            } else if (slowFalling && checkTick++ % 5 != 0) {
                player.addEffect(new MobEffectInstance(MobEffects.SLOW_FALLING, 10, 0, false, false));
            }
            return ground;
        }

        // Vanilla skips fall damage while mayfly is set, so keeping it until the landing is what negates it.
        private boolean negateFallDamage() {
            if (onGround()) {
                setMayFly(player, false);
                return true;
            }
            if (player.getAbilities().flying) {
                player.getAbilities().flying = false;
                player.onUpdateAbilities();
            }
            return false;
        }
    }

    /** Kept apart so the dedicated server never loads client classes. */
    private static final class Client {
        static void addTooltip(MagicFeatherItem item, List<Component> tooltip) {
            Player player = net.minecraft.client.Minecraft.getInstance().player;
            if (player == null) {
                return;
            }
            if (requiresCurios() && !curiosEquipped(player, item)) {
                tooltip.add(Component.translatable("item.magicfeather.magicfeather.tooltip.requires_curios").withStyle(ChatFormatting.GRAY));
            }
            tooltip.add(Component.translatable("item.magicfeather.magicfeather.tooltip.description").withStyle(ChatFormatting.GRAY));
        }
    }
}
