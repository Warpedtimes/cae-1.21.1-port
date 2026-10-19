ServerEvents.recipes(event => {
    event.recipes.create.mechanical_crafting('kubejs:radiant_coil', [
        'C'
      ], {
        C: 'kubejs:radiant_sheet',
      })

      event.recipes.create.mechanical_crafting('4x kubejs:radiant_coil', [
        'CS'
      ], {
        C: 'kubejs:radiant_sheet',
        S: 'create:shadow_steel'
      })

      event.recipes.create.mechanical_crafting('4x kubejs:radiant_coil', [
        'C',
        'S'
      ], {
        S: 'kubejs:radiant_sheet',
        C: 'create:shadow_steel'
      })
      event.remove({ id: "create:mechanical_crafting/crushing_wheel" })
      event.recipes.create.mechanical_crafting(Item.of('create:crushing_wheel', 2), [
        ' AAA ',
        'AABAA',
        'ABBBA',
        'AABAA',
        ' AAA '
      ], {
        A: '#c:cobblestones',
        B: 'minecraft:stick'
      })
})
