// priority: 0

// 1211: LootJS 3.7 - addBlockLootModifier(filter) is addBlockModifier(filter) now (LootModificationEvent in the LootJS repo);
// addLoot / removeLoot are unchanged (LootActionContainer). Block filters go through KubeJS' BlockStatePredicate, which takes
// ids, #tags and regexes.
LootJS.modifiers((event) => {
    event
        .addBlockModifier(/waystones\:.*waystone/)
        .removeLoot(/waystones\:.*waystone/)
    event
        .addBlockModifier('cae:sky_stone')
        .addLoot('ae2:sky_stone_block')

    event
    .addBlockModifier(/waystones\:.*waystone/)
    .addLoot(Item.of("kubejs:warp_fragments",2))
})
