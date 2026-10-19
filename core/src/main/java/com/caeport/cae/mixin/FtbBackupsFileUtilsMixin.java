package com.caeport.cae.mixin;

import com.caeport.cae.compat.SafeWalk;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.FileVisitOption;
import java.nio.file.Path;
import java.util.stream.Stream;

/** FTB Backups' zipping and folder walks, tolerant of save files that vanish mid-backup: see {@link SafeWalk}. */
@Pseudo
@Mixin(targets = "net.creeperhost.ftbbackups.utils.FileUtils", remap = false)
public abstract class FtbBackupsFileUtilsMixin {
    @Redirect(method = {"zip", "copy", "getDirectorySha1", "getFolderSize"}, remap = false, require = 0,
            at = @At(value = "INVOKE", target = "Ljava/nio/file/Files;walk(Ljava/nio/file/Path;[Ljava/nio/file/FileVisitOption;)Ljava/util/stream/Stream;"))
    private static Stream<Path> cae$safeWalk(Path start, FileVisitOption[] options) throws IOException {
        return SafeWalk.walk(start);
    }

    @Redirect(method = "packIntoZip", remap = false, require = 0,
            at = @At(value = "INVOKE", target = "Ljava/nio/file/Files;copy(Ljava/nio/file/Path;Ljava/io/OutputStream;)J"))
    private static long cae$safeCopy(Path source, OutputStream out) throws IOException {
        return SafeWalk.copy(source, out);
    }
}
