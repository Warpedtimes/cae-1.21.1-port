// 1211: client side of the gaps2 content (20 Oct 2026).
//   - AE2 crystal seeds: AE2 11.7.6's CrystalSeedItem.appendHoverText showed two lines under the name: "This item won't de-spawn."
//     (gray) and the growth progress as a percentage (Tooltips.ofPercent: the format is {0,number,#.##%} of ticks / 24000,
//     coloured by Tooltips.colorFromRatio(ratio, oneIsGreen): red = 255 * clamp(2 - 2p), green = 255 * clamp(2p), blue 0).
//     The progress is the "p" tick counter in the stack's custom data (server_scripts/aeSeeds.js).
//   - Thermal's explosives showed a gray description line (lang key "<block|item>.thermal.<id>.desc").
ItemEvents.modifyTooltips(event => {
    event.modify('cae:certus_crystal_seed', tt => tt.dynamic('cae_seed_progress'))
    event.modify('cae:fluix_crystal_seed', tt => tt.dynamic('cae_seed_progress'))

    let desc = (id, key) => {
        if (!Item.exists(id)) return
        event.modify(id, tt => tt.insert(1, [Text.translate(key).gray()]))
    }
    desc('cae:ice_tnt', 'tooltip.cae.ice_tnt')
    desc('cae:fire_tnt', 'tooltip.cae.fire_tnt')
    desc('cae:glowstone_tnt', 'tooltip.cae.glowstone_tnt')
    desc('cae:ender_tnt', 'tooltip.cae.ender_tnt')
    desc('cae:nuke_tnt', 'tooltip.cae.nuke_tnt')
    desc('cae:explosive_grenade', 'tooltip.cae.explosive_grenade')
    desc('cae:glowstone_grenade', 'tooltip.cae.glowstone_grenade')
    desc('cae:nuke_grenade', 'tooltip.cae.nuke_grenade')
    ;['earth', 'lightning', 'phyto', 'redstone', 'slime'].forEach(k => desc('cae:' + k + '_tnt', 'tooltip.cae.' + k + '_tnt'))
    ;['earth', 'ender', 'fire', 'ice', 'lightning', 'phyto', 'redstone', 'slime'].forEach(k => desc('cae:' + k + '_grenade', 'tooltip.cae.' + k + '_grenade'))
})

ItemEvents.dynamicTooltips('cae_seed_progress', event => {
    let ticks = 0
    try {
        let data = event.item.customData
        ticks = data.getInt('p')
    } catch (err) {
        ticks = 0
    }
    let ratio = Math.max(0, Math.min(1, ticks / 24000))
    let r = Math.floor(255 * Math.max(0, Math.min(2 - 2 * ratio, 1)))
    let g = Math.floor(255 * Math.max(0, Math.min(2 * ratio, 1)))
    let hex = '#' + (r < 16 ? '0' : '') + r.toString(16) + (g < 16 ? '0' : '') + g.toString(16) + '00'
    event.lines.add(1, Text.of("This item won't de-spawn.").gray())
    event.lines.add(2, Text.of((Math.round(ratio * 10000) / 100) + '%').color(hex))
})
