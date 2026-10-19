// port: java('..') is Java.loadClass('..'). Create's JEI classes only exist where JEI does, so this only runs on the client
// (singleplayer's integrated server); a dedicated server skips it instead of crashing on the missing JEI classes.
if (Platform.isClientEnvironment()) {
    let MysteriousItemConversionCategory = Java.loadClass('com.simibubi.create.compat.jei.category.MysteriousItemConversionCategory')
    let ConversionRecipe = Java.loadClass('com.simibubi.create.compat.jei.ConversionRecipe')

    MysteriousItemConversionCategory.RECIPES.add(ConversionRecipe.create(Item.of('minecraft:soul_sand'), Item.of('forbidden_arcanus:soulless_sand')))
}
ServerEvents.recipes(event => {

})
