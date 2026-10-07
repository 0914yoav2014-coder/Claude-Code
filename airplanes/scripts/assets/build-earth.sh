#!/usr/bin/env sh
# Rebuilds public/textures/earth/*.webp (Content-owned; CONTRACTS §11).
#
#   sh scripts/assets/build-earth.sh [--preview <dir>] [--only day,night,normal,water,clouds]
#
# Downloads three-globe@2.45.3 (MIT; its example images are NASA Blue Marble / Black Marble
# derived) into a fresh temporary folder outside the repo, treats it as data only (no package
# scripts run; Python runs isolated with -I), and writes the WebP textures. Needs npm, tar,
# Python 3 with Pillow (WebP) and numpy.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
app=$(cd "$here/../.." && pwd)
tmp=$(mktemp -d "${TMPDIR:-/tmp}/tg-src.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
(cd "$tmp" && npm pack three-globe@2.45.3 --ignore-scripts --silent >/dev/null && tar xzf three-globe-2.45.3.tgz)
echo "three-globe-2.45.3.tgz sha256: $(sha256sum "$tmp/three-globe-2.45.3.tgz" | cut -d' ' -f1)"
python3 -I "$here/earth_textures.py" --src "$tmp/package/example/img" --out "$app/public/textures/earth" "$@"
