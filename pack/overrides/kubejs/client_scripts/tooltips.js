// 1211: KubeJS 7 tooltips. ItemEvents.tooltip(tooltip => tooltip.addAdvanced(filter, (item, advanced, text) => ...)) is gone.
//   - static lines:  ItemEvents.modifyTooltips(event => event.modify(filter, tt => tt.insert(line, [component])))
//   - code per item: tt.dynamic('someId') + ItemEvents.dynamicTooltips('someId', event => ...)
//       event.item (ItemStack), event.lines (java List<Component>), event.shift / ctrl / alt / advanced / creative
// An empty or non-matching filter would turn into "every item" in modifyTooltips, so ids are checked with Item.exists first.
ItemEvents.modifyTooltips(event => {
    let darkPurple = (id, line) => {
        if (!Item.exists(id)) return
        event.modify(id, tt => {
            tt.insert(1, [Text.darkPurple(line)])
        })
    }

    darkPurple('ars_nouveau:source_gem', 'Made by Casting Source onto Runic Tablets. (the tooltip below is wrong)')
    darkPurple('ars_nouveau:magebloom_crop', 'Sighted on floating Islands, stashed by the Ancients. Can also be made by the following:')
    darkPurple('ars_nouveau:magebloom', 'Sighted on floating Islands, stashed by the Ancients.')

    let toltips =[
        ['cae:obsidian_glass', "Completely Indestructible by Withers."], // 1211: thermal
        ['forbidden_arcanus:soul', "Right-Click a Soul-Sand with a Soul Extractor to free the soul"],
        ['minecraft:soul_sand', 'Due to a weakening of the arcane bulk haunting sand only yields soulless sand, to reinfuse it with a soul have a Wraith stand on top of it'],
        ['cae:enderium_glass',"Completely Indestructible by Withers."], // 1211: thermal
        ['cae:lumium_glass',"Completely Indestructible by Withers."], // 1211: thermal
        ['cae:signalum_glass',"Completely Indestructible by Withers."], // 1211: thermal
        ['createaddition:straw',"Right-Click on a Blaze Burner, to allow it to take Liquid Fuels as an Input, for example oil,refined fuel etc."],
        ['kubejs:lootbag_create_andesite',"Rightclick to open. You can enchant it with Fortune for more Fortune"],
        ['kubejs:lootbag_arcane_1',"Rightclick to open. You can enchant it with Fortune for more Fortune"],
        ['kubejs:lootbag_arcane_2',"Rightclick to open. You can enchant it with Fortune for more Fortune"],
        ['kubejs:lootbag_arcane_3',"Rightclick to open. You can enchant it with Fortune for more Fortune"],
        ['kubejs:lootbag_poggers',"You've done it. Rightclick to open."],
        ['kubejs:lootbag_create_brass',"Rightclick to open. You can enchant it with Fortune for more Fortune"],
        ['minecraft:ancient_debris','Can be automated with the Source Time Catalyst'],
        ['forbidden_arcanus:arcane_crystal','Obtained by Simply Mining Arcane Crystal Ore. Or by Chapter M3'],
        ['kubejs:runic_tablet','Right-Click to Create Lightning'],
        // 1211: the pixies are plain items now (no Utrem Jar step; chapterM3.js), Glow Fire (Infernal Expansion) is gone, and Ars
        // Nouveau has no source bucket to craft this one into
        ['cae:corrupted_pixie','Made by Deploying Arcane Crystal Dust onto a Soul.'],
        ['cae:pixie','Wash a Corrupted Pixie with Bulk Washing. Empty it in a Basin for Aureal Essence.'],
        ['forbidden_arcanus:aureal_bottle','Made by Filling a Glass Vial with Aureal Essence'],
        ['minecraft:glowstone_dust','Drop Gunpowder into Soul Fire, or blow it through Soul Fire with an Encased Fan'],
        ['kubejs:dichromic_acid_bucket','Drop Chrome in Water'],
        ['kubejs:sulfuric_acid_bucket','Drop Sulfur Dust in Water'],
        ["kubejs:source_bucket","Liquid Source, for Create recipes (see JEI). Ars Nouveau has no Source bucket to turn it into."],
        ["cae:skystone_catalyst", "An alien Artifact found at the heart of a Meteorite. Right-Click it with redstone to make it create Skystone In a Cloud around it."],
        ["cae:veridium_catalyst", "This Block can be found below Sea Level in a Geode. Rightclick it with a piece of Redstone Dust, and it will spew out blocks of its relatives into the surrounding, allowing them to be farmed"],
        ["cae:ochrum_catalyst", "This Block can be found below Sea Level in a Geode. Rightclick it with a piece of Redstone Dust, and it will spew out blocks of its relatives into the surrounding, allowing them to be farmed"],
        ["cae:asurine_catalyst", "This Block can be found below Sea Level in a Geode. Rightclick it with a piece of Redstone Dust, and it will spew out blocks of its relatives into the surrounding, allowing them to be farmed"],
        ["cae:crimsite_catalyst", "This Block can be found below Sea Level in a Geode. Rightclick it with a piece of Redstone Dust, and it will spew out blocks of its relatives into the surrounding, allowing them to be farmed"],
        ["forbidden_arcanus:stellarite_piece","Throw Nether Stars above y320 to make them transform to stellarite"],
        ["kubejs:fragment_of_patience","§c *Important: The Saw processing will always set the Shard to Stage 1, so make sure the saw only gets used once!.* \n §5 7 Processing Steps are involved, with 7 machines, the order of processing steps are randomized on every world Load. The first step will always be cutting \nTheres a 1/1000 Chance for each cycle to bear success.\nThe key here is to make a factory thats super generalized."]
    ]
    toltips.forEach(i => {
        darkPurple(i[0], i[1])
    });

    // Sophisticated Backpacks upgrade progress, hidden while Shift is held (the dynamic handlers below check event.shift)
    // 1211: the counters (leather, string, pocket, obelisk, pcb) are read from minecraft:custom_data on the stack; the
    // server scripts that write them (backpackUpgrading.js) must store them there.
    event.modify(/sophisticatedbackpacks:.*backpack/, tt => tt.dynamic('cae_backpack_progress'))
    event.modify('sophisticatedbackpacks:backpack', tt => tt.dynamic('cae_backpack_base_backpack'))
    event.modify('sophisticatedbackpacks:iron_backpack', tt => tt.dynamic('cae_backpack_base_iron'))
    event.modify('sophisticatedbackpacks:gold_backpack', tt => tt.dynamic('cae_backpack_base_gold'))
    event.modify('sophisticatedbackpacks:diamond_backpack', tt => tt.dynamic('cae_backpack_base_diamond'))
    event.modify('sophisticatedbackpacks:netherite_backpack', tt => tt.dynamic('cae_backpack_base_netherite'))

    // Task items (the `quests:*task*` items registered in tradecardRegistry.js)
    event.modify(/quests:.*task/, tt => tt.dynamic('cae_task_roll'))
})

ItemEvents.dynamicTooltips('cae_backpack_progress', event => {
    if (event.shift) return
    let data = event.item.customData
    event.lines.add(1, Text.of("§7Leather:§r " + data.getInt("leather") + "§7/§r4§7   (§r+1§7 Slot)"))
    event.lines.add(2, Text.of("§7String:  §r " + data.getInt("string") + "§7/§r2§7   (§r+1§7 Slot)"))
    event.lines.add(3, Text.of("§7Pockets:§r " + data.getInt("pocket") + "§7/§r2§7   (§r+6§7 Slots)"))
    event.lines.add(4, Text.of("§7Obelisks:§r " + data.getInt("obelisk") + "§7/§r1§7   (§r+1§7 Upgrade Slot)"))
    event.lines.add(5, Text.of("§7Final PCBs:§r " + data.getInt("pcb") + "§7/§r2§7   (§r+1§7 Upgrade Slot)"))
})

let backpackBase = (id, line) => {
    ItemEvents.dynamicTooltips(id, event => {
        if (!event.shift) event.lines.add(1, Text.of(line))
    })
}
backpackBase('cae_backpack_base_backpack', "§7Base: §r9§7 Slots, §r1§7 Upgrade Slot")
backpackBase('cae_backpack_base_iron', "§7Base: §r45§7 Slots, §r1§7 Upgrade Slot")
backpackBase('cae_backpack_base_gold', "§7Base: §r27§7 Slots, §r0§7 Upgrade Slot")
backpackBase('cae_backpack_base_diamond', "§7Base: §r36§7 Slots, §r4§7 Upgrade Slots")
backpackBase('cae_backpack_base_netherite', "§7Base: §r63§7 Slots, §r2§7 Upgrade Slots")

ItemEvents.dynamicTooltips('cae_task_roll', event => {
    // original: item.id != "quests:task" && !item.nbt (a task that has not been rolled yet has no NBT)
    if (event.item.id != "quests:task" && event.item.customData.isEmpty()) {
        event.lines.add(1, Text.of("§7Rightclick to roll"))
    }
})
