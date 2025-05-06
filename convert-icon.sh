#!/bin/bash

# 检查是否提供了源文件
if [ -z "$1" ]; then
    echo "请提供源图片文件路径"
    echo "使用方法: ./convert-icon.sh <源图片路径>"
    exit 1
fi

SOURCE_IMAGE="$1"

# 创建临时目录
mkdir -p icon.iconset

# 生成不同尺寸的图标
sips -z 16 16     "$SOURCE_IMAGE" --out icon.iconset/icon_16x16.png
sips -z 32 32     "$SOURCE_IMAGE" --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     "$SOURCE_IMAGE" --out icon.iconset/icon_32x32.png
sips -z 64 64     "$SOURCE_IMAGE" --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   "$SOURCE_IMAGE" --out icon.iconset/icon_128x128.png
sips -z 256 256   "$SOURCE_IMAGE" --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   "$SOURCE_IMAGE" --out icon.iconset/icon_256x256.png
sips -z 512 512   "$SOURCE_IMAGE" --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   "$SOURCE_IMAGE" --out icon.iconset/icon_512x512.png
sips -z 1024 1024 "$SOURCE_IMAGE" --out icon.iconset/icon_512x512@2x.png

# 转换为 icns 文件
iconutil -c icns icon.iconset -o resources/icon.icns

# 清理临时文件
rm -rf icon.iconset

echo "转换完成！图标已保存到 resources/icon.icns" 