package com.caeport.cae.compat;

import com.mojang.logging.LogUtils;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * FTB Backups 2 (1.0.28, the last 1.21.1 build) lists the server and world folders with {@link Files#walk} while the
 * save it has just asked for is still being written. NeoForge 1.21.1 writes saved data through a temporary file that is
 * then moved over the real one ({@code <name>.dat<random>.neoforge-tmp}), as vanilla does for level.dat
 * ({@code level<random>.dat}) and player data ({@code <uuid>-<random>.dat}); when one of those disappears mid-walk the
 * stream throws and the whole backup fails (5 of 19 backups on the live server on 18 Oct 2026). These versions skip
 * the temporary files and anything that vanishes while being listed or copied.
 */
public final class SafeWalk {
    private static final Pattern TEMP = Pattern.compile(".*\\.neoforge-tmp|level-?\\d+\\.dat|[0-9a-f-]{36}-\\d+\\.dat");
    private static boolean announced;

    private SafeWalk() {
    }

    /** {@link Files#walk(Path, java.nio.file.FileVisitOption...)} without temporary files and without failing on vanished entries. */
    public static Stream<Path> walk(Path start) throws IOException {
        if (!announced) {
            announced = true;
            LogUtils.getLogger().info("FTB Backups: listing files with temporary save files skipped (cae SafeWalk)");
        }
        List<Path> paths = new ArrayList<>();
        Files.walkFileTree(start, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
                paths.add(dir);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (!TEMP.matcher(file.getFileName().toString()).matches()) {
                    paths.add(file);
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException e) {
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException e) {
                return FileVisitResult.CONTINUE;
            }
        });
        return paths.stream();
    }

    /** {@link Files#copy(Path, OutputStream)} that writes nothing for a file deleted after it was listed. */
    public static long copy(Path source, OutputStream out) throws IOException {
        try {
            return Files.copy(source, out);
        } catch (NoSuchFileException e) {
            return 0L;
        }
    }
}
