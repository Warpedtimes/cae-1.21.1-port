// 1211: replacements for ids that no longer exist in 1.21.1 (see the port's id-map notes).
// These are registered under the cae: namespace (KubeJS accepts a namespaced id; itemRegistry.js does the same with avaritia:zizz).
// Textures were copied from the 1.20.1 jars (Forbidden Arcanus 2.2.6, Tinkers' Construct 3.12) into
// assets/kubejs/textures/{item,block/fluid/molten}/ (copied from those mods).

StartupEvents.registry('item', event => {
    // Forbidden & Arcanus 2.6.1 removed these three. Recipes that make/use them are in chapterM3.js, chapter5.js, shaped.js,
    // backpackUpgrading.js and the loot tables; their old ids map to these (id_map_other.tsv).
    event.create('cae:orb_of_temporary_flight')
        .texture('kubejs:item/orb_of_temporary_flight')
        .displayName('Orb of Temporary Flight')
        .rarity('rare')
        .glow(true)
    event.create('cae:pixie')
        .texture('kubejs:item/pixie')
        .displayName('Pixie')
    event.create('cae:corrupted_pixie')
        .texture('kubejs:item/corrupted_pixie')
        .displayName('Corrupted Pixie')

    // Tinkers' Construct necrotic bone (tinkersReplacements.js crafts it by haunting a bone)
    event.create('cae:necrotic_bone')
        .texture('kubejs:item/necrotic_bone')
        .displayName('Necrotic Bone')
})

StartupEvents.registry('fluid', event => {
    // Create: Metallurgy has no molten diamond; the engineering circuit (assembly.js) needs it.
    event.create('cae:molten_diamond', 'thick')
        .tint(0x4EE2D9)
        .displayName('Molten Diamond')
        .stillTexture('kubejs:block/fluid/molten/still')
        .flowingTexture('kubejs:block/fluid/molten/flowing')
        .type(type => type.lightLevel(10))
})
