// priority: 200
// 1211: every forge: tag is a c: tag now (same path unless the NeoForge name differs; see the port's tag map)
ServerEvents.tags('item', event => {
    let corundum = ["red", "orange", "yellow", "green", "blue", "indigo", "violet", "white", "black"]
    corundum.forEach(Color => {
        event.add('c:corundum_clusters', 'quark:'+ Color +'_corundum_cluster')
    });
    //event.add('c:oil', 'beyond_earth:oil_bucket')
    event.add('lychee:fire_immune', 'minecraft:gunpowder')
    event.add('lychee:fire_immune', 'minecraft:glowstone_dust')
    event.add('c:screwdrivers', 'framedblocks:framed_screwdriver')
    event.add('c:resonators', 'kubejs:resonator')
    let vial = ['anthracene', 'incomplete_anthraquinone','anthraquinone','empty_vial']
    vial.forEach(I => {
        event.add('create:upright_on_belt', 'kubejs:' + I)
    });
    event.add('create:upright_on_belt', 'cae:pixie')
    event.add('create:upright_on_belt', 'cae:corrupted_pixie')
    event.add('create:upright_on_belt', 'forbidden_arcanus:utrem_jar')
    event.add('create:upright_on_belt', 'forbidden_arcanus:soul')
    event.add('create:upright_on_belt', 'forbidden_arcanus:aureal_bottle')
    event.add('create:upright_on_belt', 'cae:corrupted_pixie')
    event.add('create:upright_on_belt', 'cae:pixie')
    event.add('create:upright_on_belt', 'tiab:time_in_a_bottle')
    // 1211: the 1.18 stem_cell had .meat() (wolves eat it); KubeJS 7 food has no meat flag, the #minecraft:meat tag does that in 1.21
    event.add('minecraft:meat', 'cae:stem_cell')
    // audit 5 E-2: Regions Unexplored tags its raw redstone block (crafted from 4 redstone) as a redstone ore, so ore
    // processing (Mekanism enriching, the Integrated Dynamics squeezers) turned 4 redstone into 8-13: a redstone loop
    ;['c:ores/redstone', 'c:ores', 'minecraft:redstone_ores'].forEach(t => event.remove(t, 'regions_unexplored:raw_redstone_block'))
    // audit 5 E-7: Create's mud mixing recipe uses this item tag, which only exists as a block tag in vanilla
    event.add('minecraft:convertable_to_mud', ['minecraft:dirt', 'minecraft:coarse_dirt', 'minecraft:rooted_dirt'])

    event.add('create:upright_on_belt', 'forbidden_arcanus:arcane_crystal_obelisk')
    event.add('create:funkynuggets','minecraft:iron_nugget')
    event.add('create:funkynuggets','create:zinc_nugget')
    event.add('create:kinetic_mechanisms','kubejs:makeshift_kinetic_mechanism')
    event.add('create:kinetic_mechanisms','kubejs:kinetic_mechanism')
    // 1211: Dave's Building Extended is gone; its six skeletons are restored blocks (startup_scripts/restoredBlocks.js)
    event.add('davebuildingmod:skeleton', /^davebuildingmod:skeleton_/)

    const wrenchpickupables =
    ["", "", "", "", "", "", "", "", "", "",]

    // 1211: Forbidden & Arcanus 2.6.1 left the reinforced deorum tools (loot in this pack) out of every tool tag but
    // minecraft:pickaxes, so enchantments and other mods did not see them as tools (core mod: compat/DeorumTools)
    event.add('minecraft:swords', 'forbidden_arcanus:reinforced_deorum_sword')
    event.add('minecraft:axes', 'forbidden_arcanus:reinforced_deorum_axe')
    event.add('minecraft:shovels', 'forbidden_arcanus:reinforced_deorum_shovel')
    event.add('minecraft:hoes', 'forbidden_arcanus:reinforced_deorum_hoe')

    event.add('cae:skystone', 'ae2:sky_stone_block')
    event.add('cae:skystone', 'cae:sky_stone')
    // 1211: Randomium 1.21 reads randomium:randomium_blacklist (1.18.2: randomium:blacklist)
    event.add("randomium:randomium_blacklist", [
        /dev/,
        /creative/,
        /test/,
        /command/,
        /infinite/,
        /portal/,
        /^createmetallurgy:.*bucket/,
        /^curios:/,
        /^itemfilters:/,
        /^cae/,
        /^waystones:/,
        "create:handheld_worldshaper",
        "kubejs:finalpcb",
        "randomium:randomium",
        "kubejs:god_actuation_fluid_bucket",
        "kubejs:portal_actuation_fluid_bucket"
    ])
})

// port: moved here from startup_scripts/worldgenAdd.js ('tags.worldgen.biome'); biome tags are data-driven in 1.20.1
// 1211: forge:is_* biome tags are c:is_* ('worldgen/biome' is still the registry path of the biome registry)
ServerEvents.tags('worldgen/biome', event => {
    event.add("c:is_jungle", ['minecraft:jungle','terralith:amethyst_canyon', 'terralith:amethyst_rainforest','terralith:jungle_mountains','terralith:rocky_jungle','terralith:tropical_jungle'])
    event.add("c:is_dry", ['terralith:ancient_sands', 'terralith:desert_canyon','terralith:desert_oasis','terralith:desert_spires','terralith:red_oasis','terralith:sandstone_valley'])
    event.add("c:is_desert", ['terralith:ancient_sands', 'terralith:desert_canyon','terralith:desert_oasis','terralith:desert_spires','terralith:red_oasis','terralith:sandstone_valley'])
    event.add("c:is_cold",["terralith:alpha_islands_winter","terralith:alpine_grove","terralith:frozen_cliffs","terralith:glacial_chasm","terralith:snowy_badlands","terralith:snowy_maple_forest","terralith:skylands_winter","terralith:scarlet_mountains","terralith:ice_marsh","terralith:rocky_shrubland","terralith:snowy_shield","terralith:wintry_forest","terralith:wintry_lowlands"])
    event.add("c:is_mountain", ['terralith:blooming_plateau','terralith:emerald_peaks','terralith:painted_mountains','terralith:rocky_mountains','terralith:scarlet_mountains','terralith:stony_spires','terralith:volcanic_crater','terralith:volcanic_peaks'])
    event.add("c:is_overworld",['#terralith:all_terralith_biomes'])
    event.add("minecraft:has_structure/igloo",["terralith:alpha_islands_winter","terralith:alpine_grove","terralith:frozen_cliffs","terralith:glacial_chasm","terralith:snowy_badlands","terralith:snowy_maple_forest","terralith:skylands_winter","terralith:scarlet_mountains","terralith:ice_marsh","terralith:rocky_shrubland","terralith:snowy_shield","terralith:wintry_forest","terralith:wintry_lowlands"])
})
