// 1211: PonderJS 2.4.0 on Ponder (Create 6) keeps Ponder.tags / Ponder.registry and the scene API; only the places marked 1211 changed.
// 1211: the Thermal items are replaced by cae: ones; existing() stays as a guard against any id that fails to register (an unknown id in an Ingredient/Item argument throws and would abort the whole callback).
let existing = (ids) => ids.filter(id => Item.exists(id))

Ponder.tags((event) => {



    /**
     * "kubejs:getting_started" -> the tag name
     * "minecraft:paper"        -> the icon
     * "Getting Started"        -> the title
     * "This is a description"  -> the description
     * [...items]               -> default items
     */
      event.createTag("kubejs:tree_extracting", Item.exists("cae:device_tree_extractor") ? "cae:device_tree_extractor" : "integrateddynamics:bucket_menril_resin", "The Arboreal Extractor", "Extracting Sap from tricky trees", existing([
        // some default items
        "cae:device_tree_extractor",
        "integrateddynamics:bucket_menril_resin",
        "integrateddynamics:menril_sapling"
    ]));
    event.createTag("kubejs:orb", "cae:orb_spawn_egg", "The Arcane Space Time Construct", "Automating orbs of Flight", [
        // some default items
        "cae:orb_of_temporary_flight",
        "cae:orb_spawn_egg",
        "forbidden_arcanus:corrupti_dust",
        "forbidden_arcanus:dark_matter"
    ]);

      event.createTag('kubejs:arcane_obelisk', 'forbidden_arcanus:arcane_crystal_obelisk', 'The Arcane Crystal Obelisk', 'Youre gate to infinite Arcane Dust' ,[
        'forbidden_arcanus:arcane_crystal_obelisk',
        'forbidden_arcanus:arcane_crystal_dust_speck'

    ]);
    event.createTag('kubejs:corrupted_pixie', 'cae:corrupted_pixie', 'The Pixie Cycle', 'A stepping stone for making Aureal Essence' ,[
        'forbidden_arcanus:aureal_bottle',
        'kubejs:aureal_essence_bucket',
        'cae:corrupted_pixie',
        'cae:corrupted_pixie',
        'cae:pixie',
        'cae:pixie'

    ]); 
    event.createTag('kubejs:time_crystal', 'kubejs:source_time_crystal', 'The Source Time Crystal', 'Renewable Netherite' ,[
        'cae:time_crystal',
        'cae:source_time_crystal',
        'minecraft:ancient_debris',
        'minecraft:netherite_ingot',
        'minecraft:netherite_block'

    ]); 
    event.createTag('kubejs:wraith', 'minecraft:soul_sand', 'Soulsand Rejuvination', 'Making Soulsand Renewable once again!' ,[
        'forbidden_arcanus:soulless_sand',
        'minecraft:soul_sand',
        'quark:wraith_spawn_egg',
        'forbidden_arcanus:soul',
        'quark:soul_bead'

    ]); 

});
Ponder.registry((event) => {
    event
        .create(existing(["integrateddynamics:bucket_menril_resin",'cae:device_tree_extractor']))
        .scene(
          "menril",
          "Extracting Menril from Menril trees",
          "kubejs:menriltree",
          (scene, util) => {
        /**
         * Shows the whole structure.
         * Alternatively, `scene.showBasePlate()` can be used to show the base plate.
         * Useful for animating different parts of the structure.
         */
            scene.showStructure()
            scene.idle(20);
            scene.text(60, "Replace all Enriched Menril Logs with normal Menril Logs", [2.0, 2.5, 2.5])
                .placeNearTarget()
                .attachKeyFrame();
            scene.idle(20);
            scene.world.modifyBlock([2, 2, 2], "integrateddynamics:menril_log", true);
            scene.idleSeconds(3)
            scene.text(60, "Finally place a Arboreal Extractor directly on the center trunk", [2.0, 1.5, 1]).placeNearTarget().attachKeyFrame();
            // 1211: the extractor is a real block entity now (core mod, cae.device): the active state shows the windows, and its
            // render fluid (what the windows show) is set through the block entity's NBT: "RenderFluid" is a saved FluidStack.
            scene.world.setBlock([2, 1, 1], "cae:device_tree_extractor[active=true]", true);
            try {
                scene.world.modifyBlockEntityNBT([2, 1, 1], (nbt) => {
                    nbt.putBoolean("Active", true);
                    nbt.put("RenderFluid", NBT.compoundTag({ id: "integrateddynamics:menril_resin", amount: 25 }));
                });
            } catch (err) {
                console.warn("ponder.js: the extractor's window fluid was not set (" + err + ")");
            }
    });
});
Ponder.registry((event) => {
    event
        .create(['forbidden_arcanus:arcane_crystal_dust_speck','forbidden_arcanus:arcane_crystal_obelisk'])
        .scene(
            "obelisk",
            "Farming Arcane Crystals from Arcane Crystal Obilisks",
            "kubejs:arcane_crystal_obelisk_scene",
            (scene, util) => {
			scene.world.showSection([0,0,0,  4,0,4], Direction.up);
            scene.idle(20);
			scene.world.showSection([2,1,2], Direction.down);
			scene.idle(5);
		    scene.text(35, "First, place an Arcane Polished Darkstone Block.", [2, 1.5, 2.5])
				.placeNearTarget()
				.attachKeyFrame();
		    scene.idle(35);
			scene.world.showSection([2,2,2,  2,3,2], Direction.down);
			scene.idle(5);
			scene.text(40, "Then, place two Arcane Crystal Blocks above it.", [2, 3, 2.5])
				.placeNearTarget();
			scene.idle(45);
            scene.text(50, "This is the Arcane Crystal Obelisk Multiblock ", [2, 2.5, 2.5])
         		.placeNearTarget()
            	.attachKeyFrame();
            scene.idle(60);
			scene.text(70, "Rightclick it with a Mundabitur Dust to assemble it (This can also be done with deployers)", [2.0, 2.5, 2.5])
				.attachKeyFrame();
			scene.idle(10);
            scene.showControls(30, [2.5, 3, 1], PonderPointing.RIGHT)
            	.rightClick()
            	.withItem("forbidden_arcanus:mundabitur_dust");
            scene.idle(20);
            scene.world.modifyBlock([2, 1, 2], () => Block.id("forbidden_arcanus:arcane_crystal_obelisk").with("part", "lower"), true);
            scene.world.modifyBlock([2, 2, 2], () => Block.id("forbidden_arcanus:arcane_crystal_obelisk").with("part", "middle"), true);
            scene.world.modifyBlock([2, 3, 2], () => Block.id("forbidden_arcanus:arcane_crystal_obelisk").with("part", "upper"), true);
            scene.idle(60);
            scene.text(30, "You can now mine it for the obelisk item! ", [2.5, 2.5, 2.5])
				.placeNearTarget()
				.attachKeyFrame();
			scene.idle(40);
			scene.showControls(20, [2.5, 3, 1], PonderPointing.RIGHT)
				.leftClick()
				.withItem("iron_pickaxe");
			scene.idle(10);
			scene.world.modifyBlocks([2,1,2,  2,3,2], () => Block.id("minecraft:air"), true);
			scene.idle(5);
			scene.world.createItemEntity([2.5, 2.5, 2.5], [0, 0, 0], "forbidden_arcanus:arcane_crystal_obelisk");
        });
      event
        .create(['forbidden_arcanus:aureal_bottle',
        'kubejs:aureal_essence_bucket',
        'cae:corrupted_pixie',
        'cae:corrupted_pixie',
        'cae:pixie',
        'cae:pixie'])
        .scene(
            "corrupted_pixie",
            "Making Pixies and Aureal Essence",
            "corrupted_pixie",
            (scene, util) => {
           // audit 5 Q-1: the 1.18.2 scene put a Corrupted Pixie into a Utrem Jar. The port has no jar step: the pixies are
           // plain items (chapterM3.js: deploying, splashing, emptying), so the scene shows that chain on an Item Drain.
           scene.world.modifyBlock([2, 1, 2], () => Block.id("create:item_drain"), false);
           scene.showStructure()
           scene.idle(30);
           scene.text(90, "Deploy Arcane Crystal Dust onto a Soul to make a Corrupted Pixie", [2.5, 1.5, 2.5])
              .placeNearTarget()
              .attachKeyFrame();
            scene.idle(100);
            scene.text(90, "Wash the Corrupted Pixie with an Encased Fan blowing through water: it comes out as a Pixie", [2.5, 1.5, 2.5]).attachKeyFrame();
            scene.idle(100);
            scene.text(110, "Empty the Pixie in an Item Drain for 723 mB of Aureal Essence. A Spout fills 333 mB into an Empty Vial for an Aureal Bottle", [2.5, 1.5, 2.5]).attachKeyFrame();
            scene.idle(120);
      });
      	// 1211: the original's single hephaestus_forge is tier_1 in FA 2.6.1 (the block the Mundabitur interaction places)
      	event.create("forbidden_arcanus:hephaestus_forge_tier_1")
		.scene(
			"hephaestus",
			"Constructing the Hephaestus Forge",
			"kubejs:hephaestus_forge_scene",
			(scene, util) =>{
				scene.showStructure();
				scene.idle(20)
				scene.text(35, "The §9Hephaestus Forge §ris a 9x9 Multiblock.", [0, 1.5, 5])
					.independent();
				scene.idle(45)
				scene.world.hideSection([0,1,0,  10,4,10], Direction.down)
				scene.idle(10)
				scene.text(35, "This is a tutorial on how you can build it.", [0, 1.5, 5])
					.independent()
					.attachKeyFrame();
				scene.idle(25);
				scene.world.setBlock([5,0,5], "supplementaries:blackstone_lamp", false);
				scene.idle(3);
				scene.world.setBlock([5,0,2], "supplementaries:blackstone_lamp", false);
				scene.idle(2);
				scene.world.setBlock([3,0,3], "supplementaries:blackstone_lamp", false);
				scene.idle(2);
				scene.world.setBlock([2,0,5], "supplementaries:blackstone_lamp", false);
				scene.idle(2);
				scene.world.setBlock([3,0,7], "supplementaries:blackstone_lamp", false);
				scene.idle(2);
				scene.world.setBlock([5,0,8], "supplementaries:blackstone_lamp", false);
				scene.idle(2);
				scene.world.setBlock([7,0,7], "supplementaries:blackstone_lamp", false);
				scene.idle(1);
				scene.world.setBlock([8,0,5], "supplementaries:blackstone_lamp", false);
				scene.idle(1);
				scene.world.setBlock([7,0,3], "supplementaries:blackstone_lamp", false);
				scene.idle(5);
				scene.text(45, "Start by placing blocks of §9Arcane §9Chiseled Polished Darkstone §ron the highlighted spots", [5, 1.5, 5])
					.placeNearTarget();
				scene.idle(15)
				scene.world.showSection([5,1,5], Direction.down);
				scene.world.showSection([5,1,2], Direction.down);
				scene.world.showSection([3,1,3], Direction.down);
				scene.world.showSection([2,1,5], Direction.down);
				scene.world.showSection([3,1,7], Direction.down);
				scene.world.showSection([5,1,8], Direction.down);
				scene.world.showSection([7,1,7], Direction.down);
				scene.world.showSection([8,1,5], Direction.down);
				scene.world.showSection([7,1,3], Direction.down);
				scene.idle(40);
				scene.text(35, "Then, surround the center block with §9Chiseled Arcane Polished §9Darkstone", [4, 1.5, 5])
					.placeNearTarget();
				scene.idle(5)
				scene.world.showSection([4,1,5,  6,1,5], Direction.up);
				scene.world.showSection([5,1,4,  5,1,6], Direction.up);
				scene.idle(45);
				scene.text(35, "To finish the first layer, surround all blocks with §9Polished Darkstone", [0, 1.5, 5])
					.independent();
				scene.idle(5)
				scene.world.showSection([0,1,0,  10,1,10], Direction.up);
				scene.idle(45);
				scene.text(30, "Finally, place a §9Smithing Table §rin the middle...", [0, 1.5, 5])
					.independent()
					.attachKeyFrame();
				scene.world.setBlock([5,2,5], "minecraft:smithing_table", false);
				scene.idle(5);
				scene.world.showSection([5,2,5], Direction.down);
				scene.idle(35)
				scene.text(30, "...and right-click it with §4Mundabitur Dust", [0, 1.5, 5])
					.independent();
				scene.idle(5);
				scene.showControls(30, [5, 3.5, 4], PonderPointing.RIGHT)
					.rightClick()
					.withItem("forbidden_arcanus:mundabitur_dust");
				scene.idle(20)
				scene.world.createEntity("forbidden_arcanus:crimson_lightning_bolt", [5, 3, 5]);
				scene.idle(5);
				scene.world.setBlock([5,2,5], "forbidden_arcanus:hephaestus_forge_tier_1", true);
				scene.idle(10);
				scene.text(30, "And your §9Hephaestus Forge §rhas been Created!", [0, 1.5, 5])
					.independent()
					.attachKeyFrame();
				scene.idle(30);
	});
      event
      .create(['cae:time_crystal',
      'cae:source_time_crystal',
      'minecraft:ancient_debris',
      'minecraft:netherite_ingot',
      'minecraft:netherite_block'])
      .scene(
        'our_third_scene',
        "Taming the Source Time Crystal.",
        "kubejs:time_crystal",
        (scene, util) => {
            let sx = 2.5
            let sy = 1.5
            let sz = 2.5
            scene.showStructure()
            scene.idle(45)
            scene.text(50, "This is the Source Time Crystal! ", [2.5, 3.5, 2.5])
              .placeNearTarget()
              .attachKeyFrame();
            scene.idle(50)
            scene.text(50, "Now ensues a Text Driven Explanation on how to do it (cause animating it is seriously too hard)!", [2.5, 3.5, 2.5])
            scene.idle(60)
            scene.text(140, "What does the Source Time Crystal automate? Well, im glad you asked! Depending on Dimension it produces different items. Diamonds in the Overworld, Ancient Debris in the Nether, and Fireworks in the End.", [2.5, 3.5, 2.5])
            scene.idle(160)
            scene.world.setBlock([sx+1, sy, sz], "ars_nouveau:creative_source_jar", true);
            scene.text(40, "But before that. These are Spell Turrets, they will be used to automate the Time Crystal.", [sx, sy, sz]).attachKeyFrame()
            scene.idle(50)
            scene.showControls(45, [sx, sy, sz], PonderPointing.DOWN)
            .rightClick()
            .withItem("ars_nouveau:spell_parchment");
            scene.idle(34)
            scene.text(40, "Rightclicking with a spell scroll inscribed at a Scribe's table will set the Spell for the turret.", [sx, sy, sz]).attachKeyFrame()
            scene.idle(50)
            scene.text(40, "A redstone pulse will activate the turret, and fire the specified Spell. I'm too lazy to animate it", [sx, sy, sz]).attachKeyFrame()
            scene.idle(50)
            scene.text(130, "To get back to the original Point though, heres how the Time Crystal works. First Ill explain it simply, and then afterwards with Code for the nerds.",[sx, sy+2, sz])
            .attachKeyFrame()
            scene.idle(140)
            scene.text(45, "The Time Crystal Spawns with a set of Spells it Desires",[sx, sy+2, sz])
            scene.idle(60)
            scene.text(130, `These Spells can only be in the range of these spells: "hex","light","gravity","ignite","cold_snap", "intangible","freeze","crush","grow","firework"  `,[sx, sy+2, sz]).attachKeyFrame()
            scene.idle(140)
            scene.text(90, `You can actually figure out the exact spells the Source Crystal wants, by using NBT Reading from Integrated Dynamics"`,[sx, sy+2, sz]).attachKeyFrame()
            scene.idle(100)
            scene.text(90, "Now,before you start firing spells like a madman. Let me tell you. Theres rules to the game.",[sx, sy+2, sz])
            scene.idle(100)
            scene.text(130, "Everytime You Shoot a Spell the Time Crystal, it checks if The Spell Contains one of the Desired Spells, and then Ticks that off its internal list. Are all spells completed, it will convert to ancient debris!",[sx, sy+2, sz])
            scene.idle(140)
            
            scene.text(130, "If the Fired Spell contains more than 1 effect, it wont consider the Spell and Increase its internal Cooldown. If the Fired Spell doesnt contain a Spell of Interest to the Block, then the countdown shall also be increased",[sx, sy+2, sz])
            scene.idle(140)
            
            scene.text(130, "Realistically, you need 10 Spell Turrets with all of the different Possible Spells. If you dont want to bother with NBT reading, you can just fire the 10 Turrets in 8ish second intervals",[sx, sy+2, sz]).attachKeyFrame()
            scene.idle(140)
            scene.text(200, 'Now for the Nerdier Explanation: The Time Crystal takes 5 random entries out of this array: "hex","light","gravity","ignite","cold_snap", "intangible","freeze","crush","grow","firework". The 5 Spells are Defined by the following. It oversimplified does a 50/50 Split on the Possible Spell array, and then makes that its internal Spell Goal array. Each spell, no matter the correct matching internal spells will only increment the Time Crystals Stage by 1. Thats basically it. Dont overstress it, just fire spells at it :) ',[sx, sy+2, sz]).attachKeyFrame()
        }
      )
      event
      .create(["cae:orb_of_temporary_flight",
      "cae:orb_spawn_egg",
      "forbidden_arcanus:corrupti_dust",
      "forbidden_arcanus:dark_matter",
    "ae2:singularity"])
      .scene(
        'our_amogus_scene',
        "The Arcane Space Time Construct.",
        "kubejs:orb",
        (scene, util) => {
            let sx = 2.5
            let sy = 1.5
            let sz = 2.5
            scene.showStructure()
            scene.world.setBlock([sx, sy, sz], "cae:skystone_catalyst", true);
            const entity = scene.world.createEntity("cae:essentialorb", [sx, sy+1, sz] );
            scene.idle(65)

            scene.text(80, "This is the Arcane Space Time Construct (ASTC) ", [sx, sy+1, sz])
              .placeNearTarget()
              .attachKeyFrame();
            scene.idle(80)
            scene.text(55, "It needs a bunch of inworld processes to get converted to a Flying Orb!", [sx, sy+1, sz])
            scene.idle(75)
            scene.text(55, "Firstly, lets Strike it by lightning!", [sx, sy+1, sz]).attachKeyFrame()
            scene.idle(70)

           
            
            scene.text(80, "Lightning will set the ASTC 1 Phase ahead. Keep in mind, does the clock on the ASTC run out it will destroy itself.", [sx, sy, sz]).attachKeyFrame()
            scene.idle(90)
            scene.showControls(25, [sx, sy, sz], PonderPointing.DOWN)
            .rightClick()
            .withItem("kubejs:runic_tablet");
            scene.idle(48)
            scene.world.createEntity("forbidden_arcanus:crimson_lightning_bolt", [sx, sy, sz]);
				scene.idle(5);
            scene.idle(70)
            scene.text(60, "Next we shall Light a Disruptive TNT next to it.", [sx, sy+1, sz]).attachKeyFrame()
            scene.idle(70)
            scene.world.createEntity("minecraft:tnt", [sx-1, sy, sz-1]);
                scene.idle(30);
            scene.text(70, "Congrats, youre now at stage 3!",[sx, sy+1, sz])
            .attachKeyFrame()
            scene.idle(90)
            scene.text(65, "Now you need to place the ASTC on a Black Hole made by throwing Dark Matter and Corrupti Dust together on the ground.",[sx, sy+2, sz])
            scene.idle(80)
            scene.world.setBlock([sx, sy, sz], "forbidden_arcanus:black_hole", true);
            scene.text(65, `Now Immerse the ASTC with Liquid Space Time!  `,[sx, sy+1, sz]).attachKeyFrame()
            scene.idle(80)
            scene.world.setBlock([sx, sy+1, sz], "cae:lst", true);
            scene.idle(50)
            scene.world.setBlock([sx, sy+1, sz], "air", true);
            scene.world.setBlock([sx, sy, sz], "minecraft:shroomlight", true);
            scene.text(45, "Now were at stage 4! It's Cashout time!",[sx, sy+1, sz])
            scene.idle(80)
            scene.text(60, "To finish, you need to throw 6 Singularities from AE2 onto it. And if that is met, it will transform into a Orb of flight",[sx, sy, sz]).attachKeyFrame()
            scene.idle(80)
            // 1211: modifyEntity(link, e => e.discard()) is scene.world.removeEntity(link) in PonderJS 2.4.0 (WorldInstructionExtension)
            scene.world.removeEntity(entity);
            scene.world.createItemEntity([sx, sy, sz], [0, 0.4, 0], "cae:orb_of_temporary_flight");
        }
      )
  });

