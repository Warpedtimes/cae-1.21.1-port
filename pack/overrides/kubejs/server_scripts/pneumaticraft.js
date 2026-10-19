// 1211: PneumaticCraft: Repressurized 8.2.23 JSON (MC 1.21.1). Format changes from 1.20.1, taken from the mod's recipe codecs
// and data (src/generated/resources/data/pneumaticcraft/recipe/*):
//  - fluid inputs are flat sized fluid ingredients {"fluid"|"tag", "amount"} (the "type": "pneumaticcraft:fluid" is gone);
//  - fluid and item results are stacks {"id", "amount"|"count"} ("fluid"/"item" -> "id");
//  - refinery: "results" -> "outputs" (2 to 4 fluid stacks); "temperature": {"min": 373} defaults to that when omitted;
//  - thermo_plant: "fluid_input"/"item_input" -> "inputs": {"fluid", "item"}, "fluid_output"/"item_output" -> "outputs": {"fluid_output",
//    "item_output"}, "temperature": {"min_temp"/"max_temp"} -> {"min"/"max"}; pressure, speed, air_use_multiplier, exothermic as before;
//  - fluid_mixer: both "fluid_output" and "item_output" are required keys ({} when empty);
//  - assembly_drill / assembly_laser: "result" is {"id", "count"}, "input" is {"item", "count"}, "program" as before;
//  - fluid tags: forge:crude_oil / forge:plantoil -> c:crude_oil / c:plantoil (PNC 8.2 defines those under data/c/tags/fluid).
// Thermal / Tinkers ids are left as they were and guarded (// 1211: thermal, // 1211: tinkers); without Thermal there is no
// refinery recipe for crude oil -> refined_oil (it needs two outputs and one is a Thermal fluid), see the notes.
ServerEvents.recipes(event => {
    if (CAE_THERMAL) { // 1211: thermal (cae:heavy_oil, cae:light_oil)
    event.custom({
        "type": "pneumaticcraft:refinery",
        "input": {
          "tag": "c:crude_oil",
          "amount": 125
        },
        "outputs": [
          {
            "id": "cae:heavy_oil", //base is 8%
            "amount": 10
          },
          {
            "id": "cae:light_oil", // base is 12%
            "amount": 15
          },
          {
            "id": "kubejs:refined_oil", //base is 80%
            "amount": 100
          }
        ]
      })
    }
      event.custom({
        "type": "pneumaticcraft:refinery",
        "input": {
          "fluid": "kubejs:refined_oil",
          "amount": 10
        },
        "outputs": [
          {
            "id": "pneumaticcraft:diesel",
            "amount": 4
          },
          {
            "id": "pneumaticcraft:kerosene",
            "amount": 3
          },
          {
            "id": "pneumaticcraft:gasoline",
            "amount": 3
          },
          {
            "id": "pneumaticcraft:lpg",
            "amount": 2
          }
        ]
      })
      event.custom({
        "type": "pneumaticcraft:refinery",
        "input": {
          "fluid": "kubejs:refined_oil",
          "amount": 10
        },
        "outputs": [
          {
            "id": "pneumaticcraft:diesel",
            "amount": 4
          },
          {
            "id": "pneumaticcraft:kerosene",
            "amount": 3
          },
          {
            "id": "pneumaticcraft:lpg",
            "amount": 2
          }
        ]
      })
      event.custom({
        "type": "pneumaticcraft:refinery",
        "input": {
          "fluid": "kubejs:refined_oil",
          "amount": 10
        },
        "outputs": [
          {
            "id": "pneumaticcraft:diesel",
            "amount": 4
          },
          {
            "id": "pneumaticcraft:lpg",
            "amount": 2
          }
        ]
      })
      if (CAE_THERMAL) { // 1211: thermal (heavy_oil, refined_fuel, tar)
      event.custom({
        "type": "pneumaticcraft:thermo_plant",
        "inputs": {
          "fluid": {
            "fluid": "cae:heavy_oil",
            "amount": 100
          }
        },
        "temperature": {
          "min": 373
        },
        "outputs": {
          "fluid_output": {
            "id": "cae:refined_fuel",
            "amount": 50
          },
          "item_output": {
            "id": "cae:tar"
          }
        },
        "pressure": 3

      })
      event.custom({
        "type": "pneumaticcraft:thermo_plant",
        "inputs": {
          "item": {
            "item": "minecraft:coal"
          }
        },
        "outputs": {
          "fluid_output": {
            "id": "cae:creosote",
            "amount": 200
          },
          "item_output": {
            "id": "createmetallurgy:coke"
          }
        },
        "temperature": {
          "min": 573
        },
        "pressure": 4.0,
        "speed": 0.25,
        "air_use_multiplier": 5.0,
        "exothermic": false
      })
      event.custom({
        "type": "pneumaticcraft:thermo_plant",
        "inputs": {
          "fluid": {
            "fluid": "cae:light_oil",
            "amount": 100
          }
        },
        "temperature": {
          "min": 373
        },
        "outputs": {
          "fluid_output": {
            "id": "cae:refined_fuel",
            "amount": 75
          },
          "item_output": {
            "id": "mekanism:dust_sulfur"
          }
        },
        "pressure": 3

      })
      }
      if (CAE_TCONSTRUCT) { // 1211: tinkers (molten_iron, molten_nickel)
      event.custom({
        "type": "pneumaticcraft:fluid_mixer",
        "input1": {
          "fluid": "createmetallurgy:molten_iron",
          "amount": 650
        },
        "input2": {
          "fluid": "createmetallurgy:molten_nickel",
          "amount": 288
        },
        "fluid_output": {
          "id": "kubejs:invar_slurry",
          "amount": 576
        },
        "item_output": {},
        "pressure": 3.0,
        "time": 300
      })
      }
      if (CAE_THERMAL) { // 1211: thermal (cae:invar_ingot)
      event.custom({
        "type": "pneumaticcraft:thermo_plant",
        "inputs": {
          "fluid": {
            "fluid": "kubejs:invar_slurry",
            "amount": 144
          }
        },
        "temperature": {
          "max": 273
        },
        "outputs": {
          "item_output": {
            "id": "cae:invar_ingot"
          }
        },
        "pressure": 4

      })
      }

      event.custom({
        "type": "pneumaticcraft:assembly_drill",
        "input": {
          "item": "kubejs:untested_pcb"
        },
        "result": {
          "id": "kubejs:electricaly_tested",
          "count": 1
        },
        "program": "drill"
      })
      event.custom({
        "type": "pneumaticcraft:assembly_laser",
        "input": {
          "item": "kubejs:electricaly_tested"
        },
        "result": {
          "id": "kubejs:mystery_pcb",
          "count": 1
        },
        "program": "laser"
      })
      if (CAE_THERMAL) { // 1211: thermal (sap, syrup, resin, tree_oil, rosin)
      event.custom({
        "type": "pneumaticcraft:thermo_plant",
        "inputs": {
          "fluid": {
            "fluid": "cae:sap",
            "amount": 1000
          }
        },
        "temperature": {
          "min": 373
        },
        "outputs": {
          "fluid_output": {
            "id": "cae:syrup",
            "amount": 220
          }
        },
        "pressure": 3

      })
      event.custom({
        "type": "pneumaticcraft:thermo_plant",
        "inputs": {
          "fluid": {
            "fluid": "cae:resin",
            "amount": 200
          }
        },
        "temperature": {
          "min": 373
        },
        "outputs": {
          "fluid_output": {
            "id": "cae:tree_oil",
            "amount": 80
          },
          "item_output": {
            "id": "cae:rosin"
          }
        },
        "pressure": 3

      })
      }
    event.custom({
      "type": "pneumaticcraft:fluid_mixer",
      "fluid_output": {
        "amount": 50,
        "id": "pneumaticcraft:biodiesel"
      },
      "input1": {
        "amount": 25,
        "tag": "c:plantoil"
      },
      "input2": {
        "amount": 25,
        "fluid": "createaddition:bioethanol"
      },
      "item_output": {
        "id": "pneumaticcraft:glycerol",
        "count": 1
      },
      "pressure": 2.0,
      "time": 300
    })


});
