// 1211: Known Differences closed for items and materials (gaps2, 20 Oct 2026). Startup half: startup_scripts/gaps2Content.js.

// ---------------------------------------------------------------------------------------------------------------------
// Blood Slime Ball (tconstruct:blood_slime_ball). Tinkers' sources (Tinkers 3.x, 1.18.2, data/tconstruct/recipes):
//   smeltery/casting/slime/blood/slimeball: casting table, 250 mB of tconstruct:blood -> 1 ball (cooling time 50 ticks)
//   smeltery/melting/slime/blood/ball: a ball melts to 250 mB blood; melting/slime/blood/flesh: rotten flesh -> 50 mB blood
//   smeltery/entity_melting/zombie: zombie, husk, zombified piglin, zoglin, zombie horse -> 25 mB blood per hit (2 damage)
//   common/slime/blood/slimeball_from_block / _from_congealed: blood block -> 9 balls, congealed blood -> 4 (blocks of the
//   blood islands in the Nether, which are gone with Tinkers).
// 1211 substitute: tconstruct:blood is a pack fluid again; a heated Create basin melts rotten flesh (5 flesh -> 250 mB, the
// same 50 mB each) and balls (250 mB each); a press over a basin turns 250 mB of blood back into a ball (the casting
// table). The smeltery's zombie melting and the blood islands' blocks have no counterpart.
// ---------------------------------------------------------------------------------------------------------------------
ServerEvents.recipes(event => {
    event.recipes.create.mixing(Fluid.of('tconstruct:blood', 250),
        ['minecraft:rotten_flesh', 'minecraft:rotten_flesh', 'minecraft:rotten_flesh', 'minecraft:rotten_flesh', 'minecraft:rotten_flesh']
    ).heated().id('cae:blood_from_flesh')
    event.recipes.create.mixing(Fluid.of('tconstruct:blood', 250), ['tconstruct:blood_slime_ball']).heated().id('cae:blood_from_ball')
    event.recipes.create.compacting('tconstruct:blood_slime_ball', [Fluid.of('tconstruct:blood', 250)]).id('cae:blood_slime_ball')
})

ServerEvents.tags('fluid', event => {
    // Tinkers' fluid tag tconstruct:blood held the still and the flowing form
    event.add('tconstruct:blood', 'tconstruct:blood')
})

// ---------------------------------------------------------------------------------------------------------------------
// Blaze Fiber and End Fiber in the Ars Nouveau armour. Ars Nouveau 2.9.0 (1.18.2) crafted the Apprentice armour from Blaze
// Fiber and the Archmage armour from End Fiber, shaped like leather armour: boots 4, hood 5, leggings 7, robes 8 (a set is
// 24). Ars 5 has one set per style and raises its tier on an enchanting apparatus (ars_nouveau:armor_upgrade, recipes
// first_armor_upgrade = tier 1: two blaze rods, 2500 source; second_armor_upgrade = tier 2: two ender pearls and a chorus
// fruit, 5000 source), the same recipe for every piece.
// 1211 substitute: the upgrade recipes ask for 6 Blaze Fiber (tier 1) and 6 End Fiber (tier 2) instead of the rods, pearls
// and chorus fruit: a set (4 pieces) costs 24, as the 1.18.2 set did. The source cost stays Ars 5's.
// ---------------------------------------------------------------------------------------------------------------------
ServerEvents.recipes(event => {
    let fibers = (id, n) => {
        let list = []
        for (let i = 0; i < n; i++) list.push({ item: id })
        return list
    }
    event.remove({ id: 'ars_nouveau:first_armor_upgrade' })
    event.remove({ id: 'ars_nouveau:second_armor_upgrade' })
    event.custom({ type: 'ars_nouveau:armor_upgrade', pedestalItems: fibers('ars_nouveau:blaze_fiber', 6), sourceCost: 2500, tier: 1 })
        .id('cae:armor_upgrade_1')
    event.custom({ type: 'ars_nouveau:armor_upgrade', pedestalItems: fibers('ars_nouveau:end_fiber', 6), sourceCost: 5000, tier: 2 })
        .id('cae:armor_upgrade_2')
})

// ---------------------------------------------------------------------------------------------------------------------
// Permafrost (forbidden_arcanus:permafrost, data/forbidden_arcanus/enchantment/permafrost.json). Forbidden Arcanus 1.18.2 and
// 2.6.1 both burn an Edelwood Lava Bucket in an inventory (0.005 a tick, not in creative: the slot becomes charcoal and the lava
// spills); 1.18.2 skipped buckets with Permafrost. 2.6.1 has no Permafrost, so the core mod's FaPermafrostBucketMixin restores
// that check; nothing to do here.
// ---------------------------------------------------------------------------------------------------------------------
