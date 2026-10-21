ServerEvents.recipes(event =>{
   // 1211: Create Encased 1.9 ships plain crafting recipes for casing variants of every Create machine the pack gates
   // behind the machine tiers (compatRecipes.js machine_smithing/multicut with remove_old). Each variant is now
   // "the base Create machine + that casing", so it costs what the pack's own machine costs. The casing swap
   // (casingBlockSwappable, left on) only trades a variant for the same machine type, so it can't undercut that.
   let kineticCasings = {
       brass: "create:brass_casing",
       copper: "create:copper_casing",
       railway: "create:railway_casing",
       industrial_iron: "create:industrial_iron_block",
       weathered_iron: "create:weathered_iron_block",
       refined_radiance: "create:refined_radiance_casing",
       shadow_steel: "create:shadow_steel_casing",
       creative: "createcasing:creative_casing"
   }
   let fluidCasings = {
       andesite: "create:andesite_casing",
       brass: "create:brass_casing",
       zinc: "createcasing:zinc_casing"
   }
   // [variant name after the casing set, base Create machine]
   let kineticMachines = [
       ["mixer", "create:mechanical_mixer"],
       ["press", "create:mechanical_press"],
       ["mechanical_saw", "create:mechanical_saw"],
       ["mechanical_drill", "create:mechanical_drill"],
       ["encased_fan", "create:encased_fan"],
       ["deployer", "create:deployer"],
       ["portable_storage_interface", "create:portable_storage_interface"],
       ["mechanical_harvester", "create:mechanical_harvester"],
       ["mechanical_plough", "create:mechanical_plough"]
   ]
   let fluidMachines = [
       ["spout", "create:spout"],
       ["item_drain", "create:item_drain"],
       ["hose_pulley", "create:hose_pulley"],
       ["portable_fluid_interface", "create:portable_fluid_interface"],
       ["steam_engine", "create:steam_engine"],
       ["smart_fluid_pipe", "create:smart_fluid_pipe"]
   ]
   let gated = []
   Object.keys(kineticCasings).forEach(set => {
       kineticMachines.forEach(m => gated.push([`createcasing:${set}_${m[0]}`, m[1], kineticCasings[set]]))
   })
   Object.keys(fluidCasings).forEach(set => {
       fluidMachines.forEach(m => gated.push([`createcasing:${set}_${m[0]}`, m[1], fluidCasings[set]]))
   })
   gated.forEach(g => event.remove({output: g[0]}))
   gated.forEach(g => {
       event.shapeless(g[0], [g[1], g[2]]).id(`kubejs:encased_gated/${g[0].split(':')[1]}`)
   })

   let removalObj = {
        Shafts: ["birch","oak","spruce","jungle","acacia","dark_oak","crimson","warped","glass","brass"]
   }

        removalObj.Shafts.forEach(mixer => {

            event.remove({output:`createcasing:${mixer}_shaft`})

    })
    let cool = {

        Depots: ["brass","copper","railway"]
    }
    cool.Depots.forEach(Depot => {
        event.shapeless(`createcasing:${Depot}_depot`,["create:andesite_alloy",`create:${Depot}_casing`])

    })
    event.shapeless(`createcasing:industrial_iron_depot`,["create:andesite_alloy",`create:industrial_iron_block`])
})
