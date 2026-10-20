// 1211: AE2's crystal seeds (ae2:certus_crystal_seed / ae2:fluix_crystal_seed, AE2 11.7.6 on 1.18.2) are gone in AE2 1.21, so
// the pack carries its own under cae:. Textures are AE2 1.18's (crystal_seed_certus / _certus2 / _certus3, and fluix).
// The growth logic (24000 ticks in water, Crystal Growth Accelerators) is in server_scripts/aeSeeds.js.
// AE2 1.18 swapped the model to a bigger crystal at 1/3 and 2/3 growth through an item model predicate ("ae2:growth"); here
// the server script sets minecraft:custom_model_data 1 / 2 at those points and the item models in kubejs/assets/cae pick
// the bigger crystal with the vanilla custom_model_data predicate. The tooltip shows the progress as AE2 1.18's did
// ("This item won't de-spawn." and the growth percentage): client_scripts/gaps2Content.js reads the stack's custom_data {p: ticks}.
StartupEvents.registry('item', event => {
    event.create('cae:certus_crystal_seed')
        .displayName('Certus Quartz Seed')
        .texture('cae:item/crystal_seed_certus')
    event.create('cae:fluix_crystal_seed')
        .displayName('Fluix Seed')
        .texture('cae:item/crystal_seed_fluix')
})
