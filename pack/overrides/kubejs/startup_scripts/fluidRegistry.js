// 1211: KubeJS 7 fluid builders. The 1.20 helpers were:
//   .thickTexture(rgb) / .thinTexture(rgb)  ->  event.create(id, 'thick') / event.create(id, 'thin') + .tint(rgb)
//   .bucketColor(rgb)                       ->  gone; the bucket's fluid layer is generated from the tinted still texture
//   .luminosity(n)                          ->  .type(t => t.lightLevel(n))
// Number colours are still opaque RGB (SimpleColor ORs in alpha 0xFF).
StartupEvents.registry('fluid', event => {
    event.create('sky_solution', 'thick')
    .tint(0x000033)
    .displayName('Volatile Sky Solution')

    event.create('superheated_anthracene', 'thick')
    .tint(0xFFFFF)
    .displayName('Superheated Anthracene')
    .noBucket()
    .noBlock()
    .stillTexture('kubejs:block/fluid/molten/still') // 1211: tinkers
    .flowingTexture('kubejs:block/fluid/molten/flowing') // 1211: tinkers


    event.create('refined_oil', 'thin') //for pneumaticraft fuels
    .tint(0x090909)
    .displayName('Refined Oil')

    event.create('dichromic_acid', 'thin')
    .tint(0x800020)
    .displayName('Dichromic Acid')

    event.create('chromatic_waste', 'thin')
    .tint(0x3A4100)
    .displayName('Chromatic Waste')

    event.create('sulfuric_acid', 'thin')
    .tint(0x0AFFFFFF)
    .displayName('Sulfuric Acid')

    event.create('invar_slurry', 'thick')
    .tint(0x333300)
    .displayName('Invar Slurry')

    event.create('liquid_anthraquinone', 'thin')
    .tint(0x9F2B68)
    .displayName('Anthraquinone')

    event.create('green_anthraquinone', 'thin')
    .tint(0x03732F)
    .displayName('Liquid Green Dye')

    event.create('portal_actuation_fluid', 'thin')
    .tint(0x03732F)
    .displayName('Portal Actuation Fluid')

    event.create('god_actuation_fluid', 'thin')
    .tint(0x0AFFFFFF)
    .displayName('God Actuation Fluid')

    event.create('aureal_essence', 'thin')
    .tint(0xFFFFFF)
    .displayName('Aureal Essence')

    event.create('liquid_egg', 'thin')
    .tint(0xF0E5C2)
    event.create('liquid_omlett', 'thin')
    .tint(0xDAD37F)



    function SourceFluids(Name,id,bucket) {
        event.create(id)
        .displayName(Name)
        .stillTexture('kubejs:block/'+ id + "_still")
        .flowingTexture('kubejs:block/'+ id +'_flow')
    }

    const Source = [
        ['Sourceberry Juice','sourceberry_juice'],
        ['Magebloom Juice','magebloom_juice'],
        ['Magebloom Sourceberry Smoothie','magebloom_sourceberry_smoothie'],
        ['Impure Source','impure_source'],
        ['Source','source']

    ]
    Source.forEach(element => {
        SourceFluids(element[0],element[1])

    });

    function Essence(Name,id,color) {
        event.create(id + "_essence", 'thin')
        .displayName(Name+ " Essence")
        .tint(color)
        .stillTexture('kubejs:block/fluid/molten/still') // 1211: tinkers
        .flowingTexture('kubejs:block/fluid/molten/flowing') // 1211: tinkers
        .type(type => type.lightLevel(8))
    }
    Essence("Source","source",0x9F2B68)
    Essence("Soul","soul",0x000099)
    Essence("Nature","nature",0x009933)
    Essence("Dry","dry",0xffcc00)
    Essence("Ice","ice",0x00ccff)


    function juice(id,color) {
        event.create(id + "_juice", 'thin')
        .tint(color)
        .stillTexture('kubejs:block/fluid/molten/still') // 1211: tinkers
        .flowingTexture('kubejs:block/fluid/molten/flowing') // 1211: tinkers
        .type(type => type.lightLevel(8))
    }

    juice("vexing",0x9F2B68)
    juice("cascading",0x000099)
    juice("flourishing",0x009933)
    juice("blazing",0x800020)
    juice("flashing",0xFFBF00)

    event.create('inertia_essence', 'thin')
    .tint(0x009933)


    event.create("cae:lst")
    .displayName("Liquid Space Time")
    .stillTexture('cae:block/lst_still')
    .flowingTexture('cae:block/lst_flow')

    event.create('liquid_resent')
    .stillTexture('kubejs:block/liquid_resent')
    .displayName('Liquidified Resent')




});
