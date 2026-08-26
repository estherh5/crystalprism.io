#!/bin/sh
# Builds glimpse's demo media into `glimpse/web/public/demo/`.
#
# Four of the five clips in `glimpse/samples/`, trimmed to a loop-sized window
# and re-encoded small enough to serve from `public/`. The fifth is left out on
# purpose — see the header of seeds/glimpse.mjs.
#
# These stand in for what the app itself renders in the browser via WebCodecs.
# The demo does not need a real seamless loop: a recording never watches one
# long enough to reach the seam, and `web/public/demo` is gitignored so nothing
# here is committed.
#
# `-noautorotate` is NOT used. Two of the samples are stored 1920x1080 with a
# `rotation=-90` display matrix rather than natively portrait, and hand-rolling
# the transpose got it 180 degrees wrong the first time. Letting ffmpeg apply
# the source's own matrix is both correct and shorter.
set -e

S="$HOME/Developer/glimpse/samples"
D="$HOME/Developer/glimpse/web/public/demo"
mkdir -p "$D"

mk() { # src slug start dur scale
  ffmpeg -y -v error -ss "$3" -t "$4" -i "$S/$1" \
    -an -vf "scale=$5" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 21 \
    -movflags +faststart "$D/$2.mp4"
  ffmpeg -y -v error -i "$D/$2.mp4" -frames:v 1 -q:v 3 "$D/$2.jpg"
}

mk IMG_1238.MOV harbor 4   8 960:540
mk IMG_7120.MOV bridge 0.4 5 960:540
mk IMG_9112.MOV circle 5   8 960:540
mk IMG_5360.MOV pines  6   8 540:960

for f in "$D"/*.mp4; do
  printf '%s ' "$(basename "$f")"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration \
    -of csv=p=0 "$f"
done
