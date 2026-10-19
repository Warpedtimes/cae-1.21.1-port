// port (1.21.1): PneumaticCraft 8's heat_properties recipe calls the block-state filter "predicates" (was "statePredicate");
// the other keys (block, description, temperature, thermalResistance) are unchanged (HeatPropertiesRecipeImpl.Serializer).
ServerEvents.recipes(event => {
    event.custom({
        "type": "pneumaticcraft:heat_properties",
        "block": "createaddition:liquid_blaze_burner",
        "description": "pneumaticcraft.gui.jei.description.create_blaze_burner.smouldering",
        "predicates": {
          "blaze": "smouldering"
        },
        "temperature": 1700,
        "thermalResistance": 100000,
      })

      event.custom({
        "type": "pneumaticcraft:heat_properties",
        "block": "createaddition:liquid_blaze_burner",
        "description": "pneumaticcraft.gui.jei.description.create_blaze_burner.fading",
        "predicates": {
          "blaze": "fading"
        },
        "temperature": 1700,
        "thermalResistance": 1000,
      })

      event.custom({
        "type": "pneumaticcraft:heat_properties",
        "block": "createaddition:liquid_blaze_burner",
        "description": "pneumaticcraft.gui.jei.description.create_blaze_burner.kindled",
        "predicates": {
          "blaze": "kindled"
        },
        "temperature": 1700,
        "thermalResistance": 500,
      })

      event.custom({
        "type": "pneumaticcraft:heat_properties",
        "block": "createaddition:liquid_blaze_burner",
        "description": "pneumaticcraft.gui.jei.description.create_blaze_burner.seething",
        "predicates": {
          "blaze": "seething"
        },
        "temperature": 1700,
        "thermalResistance": 50,
      })
})
