package com.caeport.cae.mixin;

import dev.ftb.mods.ftbquests.events.QuestProgressEventData;
import dev.ftb.mods.ftbquests.quest.Quest;
import dev.ftb.mods.ftbquests.quest.QuestObject;
import dev.ftb.mods.ftbquests.quest.TeamData;
import java.util.ArrayList;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * A quest with no task at all (a marker that only joins other quests) is complete as soon as its dependencies are: that
 * is what FTB Quests 1.18 (1802.3.15) meant by it. It checked this when a player logged in; FTB Quests 2101 does the same,
 * but nothing re-checks when a dependency completes during play, so the marker stayed open until the next login and
 * everything behind it stayed locked. This checks the marker quests behind a quest the moment that quest completes; a
 * marker behind a marker completes in the same pass.
 */
@Mixin(value = Quest.class, remap = false)
public abstract class FtbQuestsTasklessMixin {
    @Inject(method = "onCompleted", at = @At("TAIL"))
    private void cae$completeTasklessDependants(QuestProgressEventData<?> data, CallbackInfo ci) {
        Quest self = (Quest) (Object) this;
        TeamData team = data.getTeamData();
        if (!team.isCompleted(self)) {
            return;
        }
        for (QuestObject dependant : new ArrayList<>(self.getDependants())) {
            if (dependant instanceof Quest quest && quest.getTasks().isEmpty()
                    && !team.isCompleted(quest) && team.areDependenciesComplete(quest) && quest.isCompletedRaw(team)) {
                quest.onCompleted(data.withObject(quest));
            }
        }
    }
}
