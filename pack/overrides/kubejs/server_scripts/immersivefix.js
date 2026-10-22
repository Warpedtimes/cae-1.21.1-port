// 1211: `global` is read-only outside startup scripts in KubeJS 7 (GlobalUnmodifiableMap), so the counter is a plain
// top-level variable of this script.
var caeBlortnite = 0;
LevelEvents.tick(event => {

        if (caeBlortnite != 0){caeBlortnite--}
    else{
        caeBlortnite = 500;
        let omgatnite = 0;
        // port: level.getEntities('@e[type=...]') selectors are gone; filter the entity list by type instead
        // 1211: entity.type is the entity type id string (EntityKJS.kjs$getType). Unsure the 1.21.1 build of Immersive Weathering
        // (Renewed) still has immersive_weathering:falling_layer; if not the list is just empty.
        // audit 5 H-3: a typed lookup (orbitMagic.js entitiesOfType; empty if the type doesn't exist)
        let layers = entitiesOfType(event.level, 'immersive_weathering:falling_layer')
        layers.forEach(Orb => {
            omgatnite++
        })
        if (omgatnite >= 10
){ layers.forEach(Orb => {
                Orb.discard()
            })
        }


}
})
