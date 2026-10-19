// 1211: AE2's crystal seeds (ae2:certus_crystal_seed / ae2:fluix_crystal_seed, AE2 11.7.6 on 1.18.2) are gone in AE2 1.21, so
// the pack carries its own under cae:. Textures are AE2 1.18's (stage 1: crystal_seed_certus / crystal_seed_fluix).
// The growth logic (24000 ticks in water, Crystal Growth Accelerators) is in server_scripts/aeSeeds.js.
// 1211 substitute: AE2 1.18 swapped the model to a bigger crystal at 1/3 and 2/3 growth through an item model predicate
// ("ae2:growth"); 1.21 has no such predicate for custom data, so the seed keeps its first texture. The progress shows in the
// tooltip of the original; here it can be read with /data or the sweep (stack custom_data {p: ticks}).
StartupEvents.registry('item', event => {
    event.create('cae:certus_crystal_seed')
        .displayName('Certus Quartz Seed')
        .texture('cae:item/crystal_seed_certus')
        .tooltip('Grows into a Certus Quartz Crystal in water (20 minutes, faster next to powered Crystal Growth Accelerators).')
    event.create('cae:fluix_crystal_seed')
        .displayName('Fluix Seed')
        .texture('cae:item/crystal_seed_fluix')
        .tooltip('Grows into a Fluix Crystal in water (20 minutes, faster next to powered Crystal Growth Accelerators).')
})
