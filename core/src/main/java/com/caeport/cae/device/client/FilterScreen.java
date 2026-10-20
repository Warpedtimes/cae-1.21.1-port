package com.caeport.cae.device.client;

import com.caeport.cae.Cae;
import com.caeport.cae.device.DeviceFilter;
import com.caeport.cae.device.FilterMenu;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;
import net.minecraft.client.resources.sounds.SimpleSoundInstance;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.entity.player.Inventory;

import java.util.ArrayList;
import java.util.List;

/** CoFH's item / fluid filter screen: 15 ghost slots, the deny / allow and ignore / match NBT buttons, and the back arrow in the tab above. */
public class FilterScreen extends AbstractContainerScreen<FilterMenu> {
    private static final ResourceLocation TEXTURE = Cae.asResource("textures/gui/container/filter.png");

    public FilterScreen(FilterMenu menu, Inventory inv, Component title) {
        super(menu, inv, title);
        this.imageWidth = 176;
        this.imageHeight = 166;
        this.inventoryLabelY = 166 - 96 + 3;
    }

    private static ResourceLocation tex(String p) {
        return Cae.asResource("textures/gui/" + p + ".png");
    }

    @Override
    protected void renderBg(GuiGraphics g, float partial, int mx, int my) {
        g.blit(TEXTURE, leftPos, topPos, 0, 0, 176, 166, 256, 256);
        for (int i = 0; i < DeviceFilter.SIZE; i++) {
            g.blit(tex("elements/slot"), leftPos + 17 + i % 5 * 18 - 1, topPos + 17 + i / 5 * 18 - 1, 0, 0, 18, 18, 32, 32);
        }
        button(g, 132, 22, menu.filter.allowList ? "filters/filter_allow_list" : "filters/filter_deny_list", mx, my);
        button(g, 132, 44, menu.filter.checkComponents ? "filters/filter_use_nbt" : "filters/filter_ignore_nbt", mx, my);
        g.blit(tex("elements/tab_top"), leftPos + 4, topPos - 21, 24, 0, 24, 21, 48, 32);
        g.blit(tex("elements/nav_back"), leftPos + 8, topPos - 17, 0, 0, 16, 16, 16, 16);
    }

    private void button(GuiGraphics g, int x, int y, String texture, int mx, int my) {
        boolean hover = mx >= leftPos + x && mx < leftPos + x + 20 && my >= topPos + y && my < topPos + y + 20;
        g.blit(tex(texture), leftPos + x, topPos + y, hover ? 20 : 0, 0, 20, 20, 40, 20);
    }

    @Override
    protected void renderLabels(GuiGraphics g, int mx, int my) {
        String t = title.getString();
        g.drawString(font, t, (176 - font.width(t)) / 2, 6, 0x404040, false);
        g.drawString(font, playerInventoryTitle, 8, inventoryLabelY, 0x404040, false);
    }

    @Override
    public void render(GuiGraphics g, int mx, int my, float partial) {
        super.render(g, mx, my, partial);
        renderTooltip(g, mx, my);
        int rx = mx - leftPos;
        int ry = my - topPos;
        List<Component> tip = new ArrayList<>();
        if (rx >= 132 && rx < 152 && ry >= 22 && ry < 42) {
            tip.add(Component.translatable(menu.filter.allowList ? "info.cofh.filter.allowlist.1" : "info.cofh.filter.allowlist.0"));
        } else if (rx >= 132 && rx < 152 && ry >= 44 && ry < 64) {
            tip.add(Component.translatable(menu.filter.checkComponents ? "info.cofh.filter.checkNBT.1" : "info.cofh.filter.checkNBT.0"));
        } else if (rx >= 8 && rx < 24 && ry >= -17 && ry < -1) {
            tip.add(be() == null ? Component.empty() : be().getDisplayName());
        }
        if (!tip.isEmpty()) {
            g.renderComponentTooltip(font, tip, mx, my);
        }
    }

    private com.caeport.cae.device.DeviceBE be() {
        return menu.be;
    }

    private void press(int id, float pitch) {
        if (minecraft != null && minecraft.gameMode != null) {
            minecraft.gameMode.handleInventoryButtonClick(menu.containerId, id);
            Minecraft.getInstance().getSoundManager().play(SimpleSoundInstance.forUI(SoundEvents.UI_BUTTON_CLICK, pitch));
        }
    }

    @Override
    public boolean mouseClicked(double mxd, double myd, int button) {
        int rx = (int) mxd - leftPos;
        int ry = (int) myd - topPos;
        if (rx >= 132 && rx < 152 && ry >= 22 && ry < 42) {
            press(FilterMenu.BTN_ALLOW, 0.7F);
            return true;
        }
        if (rx >= 132 && rx < 152 && ry >= 44 && ry < 64) {
            press(FilterMenu.BTN_COMPONENTS, 0.7F);
            return true;
        }
        if (rx >= 8 && rx < 24 && ry >= -17 && ry < -1) {
            press(FilterMenu.BTN_BACK, 1.0F);
            return true;
        }
        return super.mouseClicked(mxd, myd, button);
    }

    @Override
    protected boolean hasClickedOutside(double mx, double my, int left, int top, int button) {
        int rx = (int) mx - left;
        int ry = (int) my - top;
        if (rx >= 4 && rx < 28 && ry >= -21 && ry < 0) {
            return false;
        }
        return super.hasClickedOutside(mx, my, left, top, button);
    }
}
