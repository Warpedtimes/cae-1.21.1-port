// port: was a server script (java('..') is Java.loadClass('..')). Create's JEI page "Mysterious Conversion" gets soul
// sand -> soulless sand. JEI only exists on the client, so as a server script it never reached players on a dedicated
// server and, in singleplayer, added the entry again at every world start and /reload.
// Client scripts load while the game is still starting, before Create's items exist, and loading the category class
// then fails (its list starts with Create items). So the entry is added when the player joins a world, which is before
// JEI reads the list; the check keeps it to one entry for the whole game.
ClientEvents.loggedIn(event => {
    let MysteriousItemConversionCategory = Java.loadClass('com.simibubi.create.compat.jei.category.MysteriousItemConversionCategory')
    let ConversionRecipe = Java.loadClass('com.simibubi.create.compat.jei.ConversionRecipe')

    let has = false
    MysteriousItemConversionCategory.RECIPES.forEach(holder => {
        holder.value().getRollableResultsAsItemStacks().forEach(stack => {
            if (String(stack.id) == 'forbidden_arcanus:soulless_sand') has = true
        })
    })
    if (!has) {
        MysteriousItemConversionCategory.RECIPES.add(ConversionRecipe.create(Item.of('minecraft:soul_sand'), Item.of('forbidden_arcanus:soulless_sand')))
    }
})
