// 1211: Create Crafts & Additions 1.7.2 (Create 6 ProcessingRecipe JSON): "input" -> "ingredients" (list), "result" -> "results"
// (list of {"id", "count"}); see createaddition/recipe/rolling/*.json in the mod's data.
ServerEvents.recipes(event => {
  event.custom({
      type:"createaddition:rolling",
      ingredients: [
          { item: "minecraft:paper" }
      ],
      results: [
          { id: "createaddition:straw", count: 1 }
      ]
  })
  event.custom({
    type:"createaddition:rolling",
    ingredients: [
        { item: "pneumaticcraft:plastic" }
    ],
    results: [
        { id: "createaddition:straw", count: 16 }
    ]
  })
})
