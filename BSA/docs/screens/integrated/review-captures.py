from pathlib import Path
from PIL import Image, ImageDraw
import sys
import hashlib
import json

source = Path(sys.argv[1])
target = Path(__file__).parent / "visual-review"
target.mkdir(exist_ok=True)
tiles = []
inventory_path = target / "inventory.json"
previous = json.loads(inventory_path.read_text()) if inventory_path.exists() else {}
inventory = {}
for path in sorted(source.glob("*.png")):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    inventory[path.name] = digest
    if len(sys.argv) > 2 and sys.argv[2] == "incremental" and previous.get(path.name) == digest:
        continue
    if len(sys.argv) > 2 and sys.argv[2] == "new":
        refreshed = path.name.startswith(("claims-detail-", "roundtrip-", "operations-menu-", "reset-dialog-", "queue-today-"))
        if "-off-" in path.name and not refreshed:
            continue
    with Image.open(path) as image:
        for top in range(0, image.height, 1000):
            crop = image.crop((0, top, image.width, min(top + 1000, image.height)))
            crop.thumbnail((480, 334))
            tile = Image.new("RGB", (480, 362), "#d4d4d4")
            tile.paste(crop, (0, 28))
            ImageDraw.Draw(tile).text((6, 7), f"{path.stem} y={top}", fill="black")
            tiles.append(tile)
for index in range(0, len(tiles), 12):
    sheet = Image.new("RGB", (1440, 1448), "white")
    for offset, tile in enumerate(tiles[index:index + 12]):
        sheet.paste(tile, ((offset % 3) * 480, (offset // 3) * 362))
    sheet.save(target / f"sheet-{index // 12 + 1:02}.jpg", quality=90)
inventory_path.write_text(json.dumps(inventory, indent=2))
print(f"{len(tiles)} vertical slices across {(len(tiles) + 11) // 12} contact sheets")
