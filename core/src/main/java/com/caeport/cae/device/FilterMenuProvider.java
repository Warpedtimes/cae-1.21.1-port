package com.caeport.cae.device;

import net.minecraft.network.chat.Component;
import net.minecraft.world.MenuProvider;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import org.jetbrains.annotations.Nullable;

/** Opens the filter menu of a device. The extra data written with it (by DeviceBE) are the position; the filter type follows. */
public final class FilterMenuProvider implements MenuProvider {
    private final DeviceBE be;

    public FilterMenuProvider(DeviceBE be) {
        this.be = be;
    }

    @Override
    public Component getDisplayName() {
        return FilterMenu.title(be.filter());
    }

    @Override
    public @Nullable AbstractContainerMenu createMenu(int id, Inventory inv, Player player) {
        return new FilterMenu(id, inv, be);
    }
}
