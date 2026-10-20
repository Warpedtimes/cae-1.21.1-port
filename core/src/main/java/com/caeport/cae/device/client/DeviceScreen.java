package com.caeport.cae.device.client;

import com.caeport.cae.Cae;
import com.caeport.cae.device.DeviceBE;
import com.caeport.cae.device.DeviceMenu;
import com.caeport.cae.device.DeviceTank;
import com.caeport.cae.device.GuiLayout;
import com.caeport.cae.device.RedstoneControl;
import net.minecraft.ChatFormatting;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;
import net.minecraft.client.resources.sounds.SimpleSoundInstance;
import net.minecraft.client.renderer.texture.TextureAtlasSprite;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.util.FormattedCharSequence;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.inventory.InventoryMenu;
import net.neoforged.neoforge.client.extensions.common.IClientFluidTypeExtensions;
import net.neoforged.neoforge.fluids.FluidStack;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;

/**
 * The screen of a Thermal device, as Thermal's (CoFH's ContainerScreenCoFH + AugmentableScreen) drew it: the container
 * texture with the slots in it, fluid gauges, the flame / arrow bars, the XP bulb, and the tabs on the sides: an information
 * tab on the left; augments and redstone control on the right (one open at a time); the filter tab above, when the device has
 * a filter. Everything is drawn from the textures copied from CoFH Core 9.2.3 and Thermal Foundation 9.2.2.
 */
public class DeviceScreen extends AbstractContainerScreen<DeviceMenu> {
    protected static final int W = 176;
    protected static final int H = 166;
    private static final DecimalFormat NUMBER = new DecimalFormat("#,###");

    // the open tab of each side is remembered from screen to screen (CoFH's PanelTracker)
    private static String openLeft;
    private static String openRight;

    protected final DeviceBE be;
    protected final ResourceLocation texture;
    protected final GuiLayout layout;
    private final List<Panel> panels = new ArrayList<>();

    public DeviceScreen(DeviceMenu menu, Inventory inv, Component title) {
        super(menu, inv, title);
        this.be = menu.be;
        this.layout = be.layout();
        this.texture = Cae.asResource("textures/gui/container/" + be.guiTexture() + ".png");
        this.imageWidth = W;
        this.imageHeight = H;
        this.inventoryLabelY = H - 96 + 3;
    }

    protected static ResourceLocation tex(String path) {
        return Cae.asResource("textures/gui/" + path + ".png");
    }

    /** the lines of the information tab (info.thermal.<device>.0, .1, ...) joined by blank lines */
    protected String infoText() {
        String key = "info.thermal." + be.getBlockState().getBlock().builtInRegistryHolder().key().location().getPath();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; net.minecraft.client.resources.language.I18n.exists(key + "." + i); i++) {
            if (i > 0) {
                sb.append("\n\n");
            }
            sb.append(net.minecraft.client.resources.language.I18n.get(key + "." + i));
        }
        return sb.toString();
    }

    @Override
    protected void init() {
        super.init();
        panels.clear();
        String info = infoText();
        if (!info.isEmpty()) {
            panels.add(new InfoPanel(info));
        }
        if (be.augmentSlots() > 0) {
            panels.add(new AugmentPanel());
        }
        panels.add(new RsPanel());
        for (Panel p : panels) {
            if (p.left && p.id().equals(openLeft) || !p.left && p.id().equals(openRight)) {
                p.open = true;
                p.full = true;
                p.w = p.maxW;
                p.h = p.maxH;
            }
        }
        menu.augmentsVisible = panels.stream().anyMatch(p -> p instanceof AugmentPanel && p.full);
        menu.forceSync();
    }

    // ------------------------------------------------------------------------------------------------------------
    // drawing
    // ------------------------------------------------------------------------------------------------------------

    protected void blit(GuiGraphics g, ResourceLocation t, int x, int y, int u, int v, int w, int h, int tw, int th) {
        g.blit(t, x, y, u, v, w, h, tw, th);
    }

    protected void icon(GuiGraphics g, String name, int x, int y) {
        g.blit(tex("icons/" + name), x, y, 0, 0, 16, 16, 16, 16);
    }

    protected void tint(GuiGraphics g, int rgb, float mul) {
        g.setColor((rgb >> 16 & 255) / 255.0F * mul, (rgb >> 8 & 255) / 255.0F * mul, (rgb & 255) / 255.0F * mul, 1.0F);
    }

    @Override
    protected void renderBg(GuiGraphics g, float partial, int mx, int my) {
        g.blit(texture, leftPos, topPos, 0, 0, W, H, 256, 256);
        layoutPanels();
        for (Panel p : panels) {
            if (p.visible()) {
                p.drawBackground(g, leftPos + p.x, topPos + p.y, mx, my);
            }
        }
        for (GuiLayout.TankDef t : layout.tanks) {
            drawTank(g, be.tank(t.tank()), leftPos + t.x(), topPos + t.y());
        }
        for (int[] e : layout.energies) {
            drawEnergy(g, leftPos + e[0], topPos + e[1]);
        }
        for (GuiLayout.BarDef b : layout.bars) {
            drawBar(g, b, leftPos + b.x(), topPos + b.y());
        }
        drawXp(g);
        drawFilterTab(g, mx, my);
        renderDevice(g, mx, my);
        for (Panel p : panels) {
            if (p.visible()) {
                p.drawForeground(g, leftPos + p.x, topPos + p.y, mx, my);
            }
        }
    }

    /** a hook for what is special to a device (the rock generator's blocks, the nullifier's button) */
    protected void renderDevice(GuiGraphics g, int mx, int my) {
    }

    private void layoutPanels() {
        int yl = 4;
        int yr = 4;
        for (Panel p : panels) {
            p.update();
            if (!p.visible()) {
                continue;
            }
            if (p.left) {
                p.x = -p.w;
                p.y = yl;
                yl += p.h;
            } else {
                p.x = W;
                p.y = yr;
                yr += p.h;
            }
        }
        menu.augmentsVisible = panels.stream().anyMatch(p -> p instanceof AugmentPanel && p.full);
    }

    @Override
    protected void renderLabels(GuiGraphics g, int mx, int my) {
        String title = this.title.getString();
        g.drawString(font, title, (W - font.width(title)) / 2, 6, 0x404040, false);
        g.drawString(font, playerInventoryTitle, 8, inventoryLabelY, 0x404040, false);
    }

    private void drawTank(GuiGraphics g, DeviceTank tank, int x, int y) {
        g.blit(tex("elements/storage_fluid_medium"), x, y, 0, 0, 18, 42, 32, 64);
        FluidStack fs = tank.getFluid();
        if (!fs.isEmpty() && tank.getCapacity() > 0) {
            double frac = (double) fs.getAmount() * 40.0 / tank.getCapacity();
            int px = Math.max(1, Math.min(40, (int) Math.round(frac)));
            boolean invert = fs.getFluid().getFluidType().getDensity() < 0;
            drawFluid(g, fs, x + 1, y + 1 + (invert ? 0 : 40 - px), 16, px);
        }
        g.blit(tex("elements/overlay_fluid_medium"), x, y, 0, 0, 18, 42, 32, 64);
    }

    /** the fluid's still texture, tinted, tiled over the area (RenderHelper.drawFluid) */
    protected void drawFluid(GuiGraphics g, FluidStack fs, int x, int y, int w, int h) {
        if (fs.isEmpty() || w <= 0 || h <= 0) {
            return;
        }
        IClientFluidTypeExtensions ext = IClientFluidTypeExtensions.of(fs.getFluid());
        TextureAtlasSprite sprite = Minecraft.getInstance().getTextureAtlas(InventoryMenu.BLOCK_ATLAS).apply(ext.getStillTexture(fs));
        int tint = ext.getTintColor(fs);
        float a = (tint >> 24 & 255) / 255.0F;
        float r = (tint >> 16 & 255) / 255.0F;
        float gr = (tint >> 8 & 255) / 255.0F;
        float b = (tint & 255) / 255.0F;
        if (a == 0) {
            a = 1.0F;
        }
        g.enableScissor(x, y, x + w, y + h);
        for (int xx = 0; xx < w; xx += 16) {
            for (int yy = 0; yy < h; yy += 16) {
                g.blit(x + xx, y + yy, 0, 16, 16, sprite, r, gr, b, a);
            }
        }
        g.disableScissor();
    }

    private void drawBar(GuiGraphics g, GuiLayout.BarDef b, int x, int y) {
        ResourceLocation t = tex("elements/" + b.texture());
        switch (b.kind()) {
            case DURATION, SCALE_PROGRESS -> {
                int q = b.kind() == GuiLayout.BarKind.DURATION ? be.getScaledDuration(16) : be.getScaledProgress(16);
                g.blit(t, x, y, 0, 0, 16, 16, 32, 16);
                if (q > 0) {
                    g.blit(t, x, y + 16 - q, 16, 16 - q, 16, q, 32, 16);
                }
            }
            case PROGRESS -> {
                int q = be.getScaledProgress(24);
                g.blit(t, x, y, 0, 0, 24, 16, 64, 16);
                if (q > 0) {
                    g.blit(t, x, y, 24, 0, q, 16, 64, 16);
                }
            }
            case FLUID_PROGRESS -> {
                int q = be.getScaledProgress(24);
                g.blit(t, x, y, 0, 0, 24, 16, 64, 16);
                if (q > 0) {
                    drawFluid(g, be.renderFluid(), x, y, q, 16);
                    g.blit(t, x, y, 24, 0, q, 16, 64, 16);
                }
            }
        }
    }

    private void drawEnergy(GuiGraphics g, int x, int y) {
        ResourceLocation t = tex("elements/storage_energy");
        g.blit(t, x, y, 0, 0, 16, 42, 32, 64);
        int cap = be.energyCapacity();
        if (cap > 0 && be.energyStored() > 0) {
            int amount = Math.max(1, Math.min(40, (int) Math.round((double) be.energyStored() * 40 / cap)));
            g.blit(t, x, y + 1 + 40 - amount, 16, 1 + 40 - amount, 16, amount, 32, 64);
        }
    }

    private void drawXp(GuiGraphics g) {
        if (be.xpCapacity() <= 0) {
            return;
        }
        int stored = be.xpStored();
        int step = stored <= 0 ? 0 : Math.min((int) Math.round((double) stored * 4 / be.xpCapacity()) + 1, 4);
        g.blit(tex("elements/storage_xp"), leftPos + 152, topPos + 65, 0, step * 16, 16, 16, 16, 80);
    }

    private void drawFilterTab(GuiGraphics g, int mx, int my) {
        if (be.filterTabVisible()) {
            g.blit(tex("elements/tab_top"), leftPos + 4, topPos - 21, 24, 0, 24, 21, 48, 32);
            g.blit(tex("elements/nav_filter"), leftPos + 8, topPos - 17, 0, 0, 16, 16, 16, 16);
        }
    }

    // ------------------------------------------------------------------------------------------------------------
    // tooltips and clicks
    // ------------------------------------------------------------------------------------------------------------

    @Override
    public void render(GuiGraphics g, int mx, int my, float partial) {
        super.render(g, mx, my, partial);
        renderTooltip(g, mx, my);
        if (menu.getCarried().isEmpty()) {
            List<Component> tip = new ArrayList<>();
            int rx = mx - leftPos;
            int ry = my - topPos;
            for (Panel p : panels) {
                if (p.visible() && p.contains(rx, ry)) {
                    p.tooltip(tip, rx - p.x, ry - p.y);
                }
            }
            for (GuiLayout.TankDef t : layout.tanks) {
                if (rx >= t.x() && rx < t.x() + 18 && ry >= t.y() && ry < t.y() + 42) {
                    tankTooltip(tip, be.tank(t.tank()));
                }
            }
            for (int[] e : layout.energies) {
                if (rx >= e[0] && rx < e[0] + 16 && ry >= e[1] && ry < e[1] + 42) {
                    tip.add(Component.literal(NUMBER.format(be.energyStored()) + " / " + NUMBER.format(be.energyCapacity()) + " RF"));
                }
            }
            if (be.xpCapacity() > 0 && rx >= 152 && rx < 168 && ry >= 65 && ry < 81) {
                tip.add(Component.literal(NUMBER.format(be.xpStored()) + " / " + NUMBER.format(be.xpCapacity()) + " XP"));
                if (be.xpStored() > 0) {
                    tip.add(Component.translatable("info.cofh.click_to_claim").withStyle(ChatFormatting.GRAY));
                }
            }
            if (be.filterTabVisible() && rx >= 4 && rx < 28 && ry >= -21 && ry < 0) {
                tip.add(Component.translatable(filterTitleKey()));
            }
            tooltipDevice(tip, rx, ry);
            if (!tip.isEmpty()) {
                g.renderComponentTooltip(font, tip, mx, my);
            }
        }
    }

    protected String filterTitleKey() {
        return "info.cofh.item_filter";
    }

    protected void tooltipDevice(List<Component> tip, int rx, int ry) {
    }

    private void tankTooltip(List<Component> tip, DeviceTank tank) {
        FluidStack fs = tank.getFluid();
        if (!fs.isEmpty()) {
            tip.add(fs.getHoverName());
        }
        if (tank.creative.getAsBoolean() || be.clientCreative && !fs.isEmpty()) {
            tip.add(Component.translatable("info.cofh.infinite").withStyle(ChatFormatting.LIGHT_PURPLE, ChatFormatting.ITALIC));
        } else {
            tip.add(Component.literal(NUMBER.format(fs.getAmount()) + " / " + NUMBER.format(tank.getCapacity()) + " mB"));
        }
        if (!fs.isEmpty() && Screen.hasShiftDown() && Screen.hasAltDown()) {
            tip.add(Component.translatable("info.cofh.click_to_clear").withStyle(ChatFormatting.GRAY));
        }
    }

    protected void clickSound(float pitch) {
        Minecraft.getInstance().getSoundManager().play(SimpleSoundInstance.forUI(SoundEvents.UI_BUTTON_CLICK, pitch));
    }

    protected void button(int id) {
        if (minecraft != null && minecraft.gameMode != null) {
            minecraft.gameMode.handleInventoryButtonClick(menu.containerId, id);
        }
    }

    @Override
    public boolean mouseClicked(double mxd, double myd, int button) {
        int rx = (int) mxd - leftPos;
        int ry = (int) myd - topPos;
        for (GuiLayout.TankDef t : layout.tanks) {
            if (rx >= t.x() && rx < t.x() + 18 && ry >= t.y() && ry < t.y() + 42 && Screen.hasShiftDown() && Screen.hasAltDown()
                    && !be.tank(t.tank()).getFluid().isEmpty()) {
                button(DeviceMenu.BTN_CLEAR_TANK + t.tank());
                return true;
            }
        }
        if (be.xpCapacity() > 0 && be.xpStored() > 0 && rx >= 152 && rx < 168 && ry >= 65 && ry < 81) {
            button(DeviceMenu.BTN_CLAIM_XP);
            clickSound(1.0F);
            return true;
        }
        if (be.filterTabVisible() && rx >= 8 && rx < 24 && ry >= -17 && ry < -1) {
            button(DeviceMenu.BTN_FILTER);
            return true;
        }
        if (clickDevice(rx, ry, button)) {
            return true;
        }
        for (Panel p : panels) {
            if (p.visible() && p.contains(rx, ry)) {
                if (!p.click(rx - p.x, ry - p.y, button)) {
                    for (Panel o : panels) {
                        if (o != p && o.open && o.left == p.left) {
                            o.toggle();
                        }
                    }
                    p.toggle();
                    return true;
                }
                // a click on the open tab's own controls: the slots in the augment tab get it too (hasClickedOutside keeps it from being a click outside)
                return super.mouseClicked(mxd, myd, button);
            }
        }
        return super.mouseClicked(mxd, myd, button);
    }

    /** a hook for the buttons of a device; coordinates relative to the container */
    protected boolean clickDevice(int rx, int ry, int button) {
        return false;
    }

    @Override
    protected boolean hasClickedOutside(double mx, double my, int left, int top, int button) {
        int rx = (int) mx - left;
        int ry = (int) my - top;
        for (Panel p : panels) {
            if (p.visible() && p.contains(rx, ry)) {
                return false;
            }
        }
        return super.hasClickedOutside(mx, my, left, top, button);
    }

    @Override
    public boolean mouseScrolled(double mx, double my, double sx, double sy) {
        int rx = (int) mx - leftPos;
        int ry = (int) my - topPos;
        for (Panel p : panels) {
            if (p.visible() && p.full && p.contains(rx, ry) && p.scroll(sy)) {
                return true;
            }
        }
        return super.mouseScrolled(mx, my, sx, sy);
    }

    // ------------------------------------------------------------------------------------------------------------
    // the tabs (CoFH's PanelBase and its subclasses)
    // ------------------------------------------------------------------------------------------------------------

    protected abstract class Panel {
        final boolean left;
        final int maxW;
        final int maxH;
        final int color;
        int w = 22;
        int h = 22;
        int x;
        int y;
        boolean open;
        boolean full;

        Panel(boolean left, int maxW, int maxH, int color) {
            this.left = left;
            this.maxW = maxW;
            this.maxH = maxH;
            this.color = color;
        }

        abstract String id();

        boolean visible() {
            return true;
        }

        int sideOffset() {
            return left ? 4 : 2;
        }

        void update() {
            int speed = 16;
            if (open && w < maxW) {
                w = Math.min(maxW, w + speed);
            } else if (!open && w > 22) {
                w = Math.max(22, w - speed);
            }
            if (open && h < maxH) {
                h = Math.min(maxH, h + speed);
            } else if (!open && h > 22) {
                h = Math.max(22, h - speed);
            }
            if (!full && open && w == maxW && h == maxH) {
                full = true;
            }
        }

        void toggle() {
            if (open) {
                open = false;
                full = false;
                if (left) {
                    openLeft = null;
                } else {
                    openRight = null;
                }
            } else {
                open = true;
                if (left) {
                    openLeft = id();
                } else {
                    openRight = id();
                }
            }
        }

        boolean contains(int rx, int ry) {
            return rx >= x && rx < x + w && ry >= y && ry < y + h;
        }

        /** true if the click was inside the open tab's own controls (then the tab stays open) */
        boolean click(int px, int py, int button) {
            return false;
        }

        boolean scroll(double amount) {
            return false;
        }

        void tooltip(List<Component> tip, int px, int py) {
        }

        void drawBackground(GuiGraphics g, int ax, int ay, int mx, int my) {
            ResourceLocation t = tex(left ? "elements/panel_left" : "elements/panel_right");
            tint(g, color, 1.0F);
            g.blit(t, ax, ay + 4, 0, 256 - h + 4, 4, h - 4, 256, 256);
            g.blit(t, ax + 4, ay, 256 - w + 4, 0, w - 4, 4, 256, 256);
            g.blit(t, ax, ay, 0, 0, 4, 4, 256, 256);
            g.blit(t, ax + 4, ay + 4, 256 - w + 4, 256 - h + 4, w - 4, h - 4, 256, 256);
            g.setColor(1.0F, 1.0F, 1.0F, 1.0F);
        }

        abstract void drawForeground(GuiGraphics g, int ax, int ay, int mx, int my);
    }

    private final class InfoPanel extends Panel {
        private final List<FormattedCharSequence> lines;
        private final int numLines;
        private final int maxFirst;
        private int first;

        InfoPanel(String info) {
            super(true, 100, 92, 0x555555);
            lines = font.split(Component.literal(info), 100 - 16);
            numLines = Math.min(lines.size(), (92 - 24) / 9);
            maxFirst = lines.size() - numLines;
        }

        @Override
        String id() {
            return "info";
        }

        @Override
        void drawForeground(GuiGraphics g, int ax, int ay, int mx, int my) {
            icon(g, "icon_information", ax + sideOffset(), ay + 3);
            if (!full) {
                return;
            }
            if (maxFirst > 0) {
                icon(g, first > 0 ? "icon_arrow_up" : "icon_arrow_up_inactive", ax + sideOffset() + 100 - 20, ay + 16);
                icon(g, first < maxFirst ? "icon_arrow_down" : "icon_arrow_down_inactive", ax + sideOffset() + 100 - 20, ay + 76);
            }
            g.drawString(font, Component.translatable("info.cofh.information"), ax + sideOffset() + 18, ay + 6, 0xE1C92F, true);
            for (int i = first; i < first + numLines; i++) {
                g.drawString(font, lines.get(i), ax + sideOffset() + 2, ay + 20 + (i - first) * 9, 0xF0F0F0, false);
            }
        }

        @Override
        boolean click(int px, int py, int button) {
            if (!full) {
                return false;
            }
            if (maxFirst > 0 && py >= 16 && px >= 100 - 16) {
                if (py < 32) {
                    first = Math.max(0, first - 1);
                } else if (py > 92 - 16) {
                    first = Math.min(maxFirst, first + 1);
                }
                return true;
            }
            return false;
        }

        @Override
        boolean scroll(double amount) {
            if (amount > 0) {
                first = Math.max(0, first - 1);
            } else if (amount < 0) {
                first = Math.min(maxFirst, first + 1);
            }
            return true;
        }

        @Override
        void tooltip(List<Component> tip, int px, int py) {
            if (!full) {
                tip.add(Component.translatable("info.cofh.information"));
            }
        }
    }

    private final class AugmentPanel extends Panel {
        AugmentPanel() {
            super(false, 102, 92, 0x089E4C);
        }

        @Override
        String id() {
            return "augment";
        }

        @Override
        void drawBackground(GuiGraphics g, int ax, int ay, int mx, int my) {
            super.drawBackground(g, ax, ay, mx, my);
            if (full) {
                tint(g, color, 0.6F);
                g.blit(tex("elements/panel_right"), ax + sideOffset() + 18, ay + 20, 16, 20, 60, 60, 256, 256);
                g.setColor(1.0F, 1.0F, 1.0F, 1.0F);
                for (int[] pos : DeviceMenu.AUGMENT_POS) {
                    g.blit(tex("elements/slot"), leftPos + pos[0] - 1, topPos + pos[1] - 1, 0, 0, 18, 18, 32, 32);
                }
            }
        }

        @Override
        void drawForeground(GuiGraphics g, int ax, int ay, int mx, int my) {
            icon(g, "icon_augment", ax + sideOffset(), ay + 3);
            if (full) {
                g.drawString(font, Component.translatable("info.cofh.augmentation"), ax + sideOffset() + 18, ay + 6, 0xE1C92F, true);
            }
        }

        @Override
        boolean click(int px, int py, int button) {
            return full && px >= 18 + sideOffset() && px < 78 + sideOffset() && py >= 20 && py < 80;
        }

        @Override
        void tooltip(List<Component> tip, int px, int py) {
            if (!full) {
                tip.add(Component.translatable("info.cofh.augmentation"));
            }
        }
    }

    private final class RsPanel extends Panel {
        RsPanel() {
            super(false, 112, 92, 0xD0230A);
        }

        @Override
        String id() {
            return "rs";
        }

        @Override
        void drawBackground(GuiGraphics g, int ax, int ay, int mx, int my) {
            super.drawBackground(g, ax, ay, mx, my);
            if (full) {
                tint(g, color, 0.6F);
                g.blit(tex("elements/panel_right"), ax + 24, ay + 16, 16, 20, 64, 24, 256, 256);
                g.setColor(1.0F, 1.0F, 1.0F, 1.0F);
            }
        }

        @Override
        void drawForeground(GuiGraphics g, int ax, int ay, int mx, int my) {
            icon(g, "icon_redstone_on", ax + sideOffset(), ay + 3);
            if (!full) {
                return;
            }
            g.drawString(font, Component.translatable("info.cofh.redstone_control"), ax + sideOffset() + 18, ay + 6, 0xE1C92F, true);
            g.drawString(font, Component.translatable("info.cofh.control_status").append(":"), ax + sideOffset() + 6, ay + 42, 0xAAAFB8, true);
            g.drawString(font, Component.translatable("info.cofh.signal_required").append(":"), ax + sideOffset() + 6, ay + 66, 0xAAAFB8, true);
            icon(g, "icon_button", ax + 28, ay + 20);
            icon(g, "icon_button", ax + 48, ay + 20);
            icon(g, "icon_button", ax + 68, ay + 20);
            RedstoneControl.Mode mode = be.rsMode();
            switch (mode) {
                case DISABLED -> {
                    icon(g, "icon_button_highlight", ax + 28, ay + 20);
                    g.drawString(font, Component.translatable("info.cofh.disabled"), ax + sideOffset() + 14, ay + 54, 0x101010, false);
                    g.drawString(font, Component.translatable("info.cofh.ignored"), ax + sideOffset() + 14, ay + 78, 0x101010, false);
                }
                case LOW -> {
                    icon(g, "icon_button_highlight", ax + 48, ay + 20);
                    g.drawString(font, Component.translatable("info.cofh.enabled"), ax + sideOffset() + 14, ay + 54, 0x101010, false);
                    g.drawString(font, Component.translatable("info.cofh.low"), ax + sideOffset() + 14, ay + 78, 0x101010, false);
                }
                case HIGH -> {
                    icon(g, "icon_button_highlight", ax + 68, ay + 20);
                    g.drawString(font, Component.translatable("info.cofh.enabled"), ax + sideOffset() + 14, ay + 54, 0x101010, false);
                    g.drawString(font, Component.translatable("info.cofh.high"), ax + sideOffset() + 14, ay + 78, 0x101010, false);
                }
            }
            icon(g, "icon_redstone_off", ax + 28, ay + 20);
            icon(g, "icon_rs_torch_off", ax + 48, ay + 20);
            icon(g, "icon_rs_torch_on", ax + 68, ay + 20);
        }

        @Override
        boolean click(int px, int py, int button) {
            if (!full) {
                return false;
            }
            if (px >= 24 && px < 88 && py >= 16 && py < 40) {
                RedstoneControl.Mode want = null;
                if (px >= 28 && px < 44 && py >= 20 && py < 36) {
                    want = RedstoneControl.Mode.DISABLED;
                } else if (px >= 48 && px < 64 && py >= 20 && py < 36) {
                    want = RedstoneControl.Mode.LOW;
                } else if (px >= 68 && px < 84 && py >= 20 && py < 36) {
                    want = RedstoneControl.Mode.HIGH;
                }
                if (want != null && want != be.rsMode()) {
                    button(DeviceMenu.BTN_RS + want.ordinal());
                    clickSound(0.4F + 0.2F * want.ordinal());
                }
                return true;
            }
            return false;
        }

        @Override
        void tooltip(List<Component> tip, int px, int py) {
            if (!full) {
                tip.add(Component.translatable("info.cofh.redstone_control"));
                tip.add(Component.translatable(switch (be.rsMode()) {
                    case DISABLED -> "info.cofh.disabled";
                    case LOW -> "info.cofh.low";
                    case HIGH -> "info.cofh.high";
                }).withStyle(ChatFormatting.YELLOW));
                tip.add(Component.translatable("info.cofh.current_signal", be.rsPower())
                        .withStyle(be.rsMode() == RedstoneControl.Mode.DISABLED ? ChatFormatting.YELLOW : be.rsState() ? ChatFormatting.GREEN : ChatFormatting.RED));
            } else if (px >= 28 && px < 44 && py >= 20 && py < 36) {
                tip.add(Component.translatable("info.cofh.ignored"));
            } else if (px >= 48 && px < 64 && py >= 20 && py < 36) {
                tip.add(Component.translatable("info.cofh.low"));
            } else if (px >= 68 && px < 84 && py >= 20 && py < 36) {
                tip.add(Component.translatable("info.cofh.high"));
            }
        }
    }
}
