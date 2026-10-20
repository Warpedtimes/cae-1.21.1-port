package com.caeport.cae.device;

import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.network.chat.MutableComponent;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;

import java.text.DecimalFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Thermal's augment items: an optional type (Upgrade, Area, Potion, Fluid, Filter, RF), numeric attributes by Thermal's
 * names (BaseMod, Radius, PotionAmp, ...) and a few switches (XpStr, FilterType). What a device does with them is in
 * {@link DeviceBE}. The tooltip is the one Thermal built for them.
 */
public class AugmentItem extends Item {
    // ThermalAugmentRules
    private static final Set<String> ADD = Set.of("Depth", "Radius", "Reach", "DynamoPower", "MachinePower", "MachinePri", "MachineSec", "MachineSpeed", "PotionAmp", "PotionDur");
    private static final Set<String> MULT = Set.of("BaseMod", "RFMax", "RFXfer", "FluidMax", "DynamoEnergy", "MachineCat", "MachineEnergy", "MachineXp");
    private static final Set<String> MAX = Set.of("BaseMod", "RFMax", "RFXfer", "FluidMax", "MachineMin");
    private static final Set<String> INVERSE = Set.of("MachineCat", "MachineEnergy");
    private static final Set<String> INTEGER = Set.of("Depth", "Radius", "Reach", "PotionAmp");
    private static final Set<String> TYPE_EXCLUSIVE = Set.of("Filter", "Fluid", "RF");
    /** The attributes that have a line in the tooltip (info.thermal.augment.attr.*). */
    private static final Set<String> SHOWN = Set.of("Depth", "Radius", "Reach", "BaseMod", "DynamoEnergy", "DynamoPower", "FluidMax", "MachineCat", "MachineEnergy",
            "MachinePri", "MachinePower", "MachineSec", "MachineSpeed", "MachineXp", "PotionAmp", "PotionDur", "RFMax", "RFXfer");
    private static final DecimalFormat DF0 = new DecimalFormat("#");
    private static final DecimalFormat DF2 = new DecimalFormat("#.##");

    public final String type;
    public final Map<String, Float> mods = new LinkedHashMap<>();
    /** "item" or "fluid" for the filter augments, otherwise empty. */
    public final String filterType;
    /** The same augment cannot be installed twice (Thermal's flagUniqueAugment). */
    public final boolean unique;
    private final boolean hasDescription;

    public AugmentItem(Properties properties, String type, Map<String, Float> mods, String filterType, boolean unique, boolean hasDescription) {
        super(properties);
        this.type = type;
        this.mods.putAll(mods);
        this.filterType = filterType;
        this.unique = unique;
        this.hasDescription = hasDescription;
    }

    public float mod(String key, float def) {
        return mods.getOrDefault(key, def);
    }

    /** Whether a device that allows the given augment types and holds the given augments takes this one (AugmentableBlockEntity's validator). */
    public boolean fits(Set<String> allowedTypes, List<ItemStack> installed) {
        if (!type.isEmpty() && !allowedTypes.contains(type)) {
            return false;
        }
        for (ItemStack other : installed) {
            if (other.getItem() instanceof AugmentItem o) {
                if (!type.isEmpty() && TYPE_EXCLUSIVE.contains(type) && type.equals(o.type)) {
                    return false;
                }
                if (unique && o == this) {
                    return false;
                }
            }
        }
        return true;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, tooltip, flag);
        if (hasDescription) {
            tooltip.add(Component.translatable(getDescriptionId() + ".desc").withStyle(ChatFormatting.GOLD));
        }
        if (!type.isEmpty()) {
            tooltip.add(Component.translatable("info.cofh.type").withStyle(ChatFormatting.YELLOW).append(": ")
                    .append(Component.translatable("info.thermal.augment.type." + type).withStyle(ChatFormatting.WHITE)));
        }
        for (Map.Entry<String, Float> e : mods.entrySet()) {
            String mod = e.getKey();
            if (!SHOWN.contains(mod)) {
                continue;
            }
            float value = e.getValue();
            boolean add = ADD.contains(mod);
            boolean bad = (add && value < 0) || (add && value > 0 && INVERSE.contains(mod))
                    || (MULT.contains(mod) && (INVERSE.contains(mod) ? value > 1.0 : value < 1.0));
            String text = (add && value > 0 ? "+" : "") + (INTEGER.contains(mod) ? DF0.format(value)
                    : MULT.contains(mod) ? DF2.format(value) + "x" : DF0.format(value * 100.0F) + "%");
            MutableComponent mc = Component.literal(text).withStyle(bad ? ChatFormatting.RED : ChatFormatting.GREEN);
            if (MAX.contains(mod)) {
                mc.withStyle(ChatFormatting.UNDERLINE);
            }
            tooltip.add(Component.translatable("info.thermal.augment.attr." + mod).append(": ").withStyle(ChatFormatting.GRAY).append(mc));
        }
    }
}
