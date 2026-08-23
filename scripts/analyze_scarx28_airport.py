#!/usr/bin/env python3
import json, os, traceback
from pathlib import Path
import numpy as np

import amulet

SRC = Path('work/Regional Airport')
OUT = Path('airport-analysis')
OUT.mkdir(exist_ok=True)

NATURAL = {
    'minecraft:air','minecraft:cave_air','minecraft:void_air',
    'minecraft:bedrock','minecraft:stone','minecraft:granite','minecraft:diorite','minecraft:andesite',
    'minecraft:dirt','minecraft:coarse_dirt','minecraft:grass_block','minecraft:podzol','minecraft:mycelium',
    'minecraft:sand','minecraft:red_sand','minecraft:sandstone','minecraft:red_sandstone',
    'minecraft:gravel','minecraft:clay','minecraft:water','minecraft:lava',
    'minecraft:coal_ore','minecraft:iron_ore','minecraft:gold_ore','minecraft:redstone_ore',
    'minecraft:lapis_ore','minecraft:diamond_ore','minecraft:emerald_ore','minecraft:copper_ore',
    'minecraft:oak_log','minecraft:oak_leaves','minecraft:dead_bush','minecraft:cactus',
    'minecraft:snow','minecraft:snow_block','minecraft:ice','minecraft:packed_ice'
}
AIR = {'minecraft:air','minecraft:cave_air','minecraft:void_air'}

def block_name(block):
    ns = getattr(block, 'namespace', 'minecraft')
    bn = getattr(block, 'base_name', None)
    if bn is None:
        s = str(block)
        # Amulet Block repr often UniversalBlock(minecraft:stone)
        for token in s.replace('(', ' ').replace(')', ' ').replace(',', ' ').split():
            if ':' in token:
                return token.strip("'\"")
        return s
    return f'{ns}:{bn}'

def update_bbox(bbox, xs, ys, zs):
    if len(xs) == 0:
        return bbox
    vals = [int(xs.min()), int(ys.min()), int(zs.min()), int(xs.max()), int(ys.max()), int(zs.max())]
    if bbox is None:
        return vals
    return [min(bbox[0], vals[0]), min(bbox[1], vals[1]), min(bbox[2], vals[2]),
            max(bbox[3], vals[3]), max(bbox[4], vals[4]), max(bbox[5], vals[5])]

world = amulet.load_level(str(SRC))
try:
    dims = list(world.dimensions)
    report = {'dimensions': [str(d) for d in dims], 'source': str(SRC)}
    dim = 'minecraft:overworld' if 'minecraft:overworld' in dims else dims[0]
    report['dimension'] = str(dim)
    try:
        b = world.bounds(dim)
        report['world_bounds'] = {'min': list(map(int,b.min)), 'max': list(map(int,b.max))}
    except Exception as e:
        report['world_bounds_error'] = repr(e)

    chunk_coords = list(world.all_chunk_coords(dim))
    report['chunk_count'] = len(chunk_coords)
    report['chunk_bbox'] = [min(c[0] for c in chunk_coords), min(c[1] for c in chunk_coords),
                            max(c[0] for c in chunk_coords), max(c[1] for c in chunk_coords)] if chunk_coords else None

    built_bbox = None
    all_nonair_bbox = None
    palette_counts = {}
    chunk_built_counts = []
    errors=[]

    for n,(cx,cz) in enumerate(chunk_coords,1):
        try:
            chunk = world.get_chunk(cx,cz,dim)
            arr = np.asarray(chunk.blocks)
            # Expected shape X,Y,Z. Some versions may expose X,Z,Y, but Amulet 1.x is X,Y,Z.
            palette = list(chunk.block_palette)
            names = [block_name(b) for b in palette]
            # accumulate palette voxel counts
            counts = np.bincount(arr.reshape(-1), minlength=len(names))
            for i,count in enumerate(counts):
                if count:
                    palette_counts[names[i]] = palette_counts.get(names[i],0) + int(count)

            air_ids = [i for i,name in enumerate(names) if name in AIR]
            natural_ids = [i for i,name in enumerate(names) if name in NATURAL]
            nonair_mask = ~np.isin(arr, air_ids) if air_ids else np.ones_like(arr,dtype=bool)
            built_mask = ~np.isin(arr, natural_ids) if natural_ids else np.ones_like(arr,dtype=bool)
            # Avoid negative/world-basement junk when detecting the manmade complex.
            if built_mask.shape[1] > 0:
                y0 = int(getattr(chunk, 'min_y', 0) or 0)
            else:
                y0 = 0
            # Old Amulet Chunk arrays are indexed from y=0 for these 1.16/1.17 worlds.
            y_offset = 0

            inds = np.argwhere(nonair_mask)
            if inds.size:
                xs = inds[:,0] + cx*16
                ys = inds[:,1] + y_offset
                zs = inds[:,2] + cz*16
                all_nonair_bbox = update_bbox(all_nonair_bbox,xs,ys,zs)

            inds = np.argwhere(built_mask)
            if inds.size:
                xs = inds[:,0] + cx*16
                ys = inds[:,1] + y_offset
                zs = inds[:,2] + cz*16
                # Manmade structures here live at surface height; ignore deep cave/ore artifacts.
                keep = ys >= 45
                xs,ys,zs = xs[keep],ys[keep],zs[keep]
                if len(xs):
                    built_bbox = update_bbox(built_bbox,xs,ys,zs)
                    chunk_built_counts.append([int(cx),int(cz),int(len(xs))])
        except Exception as e:
            errors.append({'chunk':[cx,cz],'error':repr(e),'trace':traceback.format_exc()[-2000:]})

    report['all_nonair_bbox'] = all_nonair_bbox
    report['built_bbox_raw'] = built_bbox
    report['errors'] = errors
    report['built_chunks'] = sorted(chunk_built_counts, key=lambda x:x[2], reverse=True)
    report['top_blocks'] = sorted(palette_counts.items(), key=lambda kv:kv[1], reverse=True)[:200]

    # Find a dense connected-ish airport envelope by taking all chunks with >= 25 manmade blocks,
    # then add a generous 32-block margin so isolated lights/fences are retained.
    dense = [x for x in chunk_built_counts if x[2] >= 25]
    if dense:
        mincx=min(x[0] for x in dense); maxcx=max(x[0] for x in dense)
        mincz=min(x[1] for x in dense); maxcz=max(x[1] for x in dense)
        # Use raw built Y min/max, but clamp down to terrain base and add headroom.
        ymin = max(0, (built_bbox[1] if built_bbox else 45) - 4)
        ymax = min(320, (built_bbox[4] if built_bbox else 160) + 5)
        report['recommended_export_bbox'] = [mincx*16-32, ymin, mincz*16-32, (maxcx+1)*16+32, ymax, (maxcz+1)*16+32]

    (OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    (OUT/'report.txt').write_text('\n'.join([
        f"dimension={report.get('dimension')}",
        f"chunk_count={report.get('chunk_count')}",
        f"chunk_bbox={report.get('chunk_bbox')}",
        f"world_bounds={report.get('world_bounds')}",
        f"all_nonair_bbox={report.get('all_nonair_bbox')}",
        f"built_bbox_raw={report.get('built_bbox_raw')}",
        f"recommended_export_bbox={report.get('recommended_export_bbox')}",
        f"errors={len(errors)}",
        '', 'TOP BLOCKS:',
        *[f'{count:12d} {name}' for name,count in report['top_blocks'][:80]],
        '', 'TOP BUILT CHUNKS:',
        *[f'{cx:5d} {cz:5d} {count:8d}' for cx,cz,count in report['built_chunks'][:200]],
    ]),encoding='utf-8')
finally:
    world.close()
