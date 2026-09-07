#!/bin/sh
# bare-metal setup: prefer a distro ffmpeg that has hardware encoders
# (vaapi etc.) and link it into binaries/; otherwise fetch the latest
# static build, which ships WITHOUT any hardware encoders
set -e

echo Setup started

mkdir -p ./binaries

if command -v ffmpeg >/dev/null 2>&1 && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q h264_vaapi; then
    echo "Using distro $(ffmpeg -version | head -1) (hardware encoders available)"
    ln -sf "$(command -v ffmpeg)" ./binaries/ffmpeg
    ln -sf "$(command -v ffprobe)" ./binaries/ffprobe
else
    echo "No distro ffmpeg with hardware encoders; downloading latest static build"
    curl -fsSL -o ffmpeg-release-amd64-static.tar.xz \
        https://www.johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
    tar -xJf ffmpeg-release-amd64-static.tar.xz
    cp -rf ./ffmpeg-*-amd64-static/* ./binaries
    rm -rf ./ffmpeg-*-amd64-static ffmpeg-release-amd64-static.tar.xz
    echo "Note: static builds have no hardware encoders; transcoding falls back to libx264"
fi

echo Installing dependencies
npm i

echo DONE
