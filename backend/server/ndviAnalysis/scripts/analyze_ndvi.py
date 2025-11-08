# Compare July 2024 and July 2025 NDVI rasters to flag vegetation change.

import rasterio
from rasterio.warp import reproject, Resampling
from rasterio.features import shapes
import numpy as np
import geopandas as gpd
import json
from shapely.geometry import shape
import os
from math import cos, radians

# Folder setup
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # ndviAnalysis/
INPUT_DIR = os.path.join(BASE_DIR, "data", "inputs")
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "outputs")

# Paths for the July imagery
JULY_2024_PATH = os.path.join(INPUT_DIR, "July_2024_Sentinel-2_L2A_NDVI.tiff")
JULY_2025_PATH = os.path.join(INPUT_DIR, "July_2025_Sentinel-2_L2A_NDVI.tiff")

# Tree restoration assumptions
RECOVERY_FRACTION = 0.5     # replant half of what we lose
CROWN_M2_PER_TREE = 40.0    # one mature tree ≈ 40 m² canopy

# NDVI change thresholds
DECREASE_LARGE = -0.3
DECREASE_MOD   = -0.15
INCREASE_MOD   = 0.15
INCREASE_LARGE = 0.3


def read_and_align(reference_path, comparison_path):
    """Load both rasters and put the comparison data on the reference grid."""
    with rasterio.open(reference_path) as base:
        reference_ndvi = base.read(1).astype(np.float32)
        reference_meta = base.profile
    with rasterio.open(comparison_path) as new:
        comparison_ndvi = new.read(1).astype(np.float32)
        comparison_aligned = np.empty_like(reference_ndvi, dtype=np.float32)
        reproject(
            source=comparison_ndvi,
            destination=comparison_aligned,
            src_transform=new.transform,
            src_crs=new.crs,
            dst_transform=reference_meta["transform"],
            dst_crs=reference_meta["crs"],
            resampling=Resampling.bilinear
        )
    return reference_ndvi, comparison_aligned, reference_meta


def classify_change(july_2024, july_2025):
    """Measure NDVI change (July 2025 minus July 2024) and bucket it."""
    ndvi_change = july_2025 - july_2024
    ndvi_change[(ndvi_change < -1) | (ndvi_change > 1)] = np.nan  # drop obvious errors

    change_classes = np.zeros(ndvi_change.shape, np.uint8)
    change_classes[(ndvi_change <= DECREASE_LARGE)] = 5
    change_classes[(ndvi_change > DECREASE_LARGE) & (ndvi_change <= DECREASE_MOD)] = 4
    change_classes[(np.abs(ndvi_change) < 0.1)] = 3
    change_classes[(ndvi_change >= INCREASE_MOD) & (ndvi_change < INCREASE_LARGE)] = 2
    change_classes[(ndvi_change >= INCREASE_LARGE)] = 1
    return ndvi_change, change_classes


def pixel_area_m2(transform):
    """Rough pixel area in square metres for EPSG:4326 at Brampton's latitude."""
    mean_lat = 43.7
    m_per_deg_lat = 111132.92
    m_per_deg_lon = 111412.84 * cos(radians(mean_lat))
    pixel_width_m  = abs(transform.a) * m_per_deg_lon
    pixel_height_m = abs(transform.e) * m_per_deg_lat
    return pixel_width_m * pixel_height_m


def estimate_area_by_pixels(classes, transform):
    """Quick area totals by counting pixels per change class."""
    pixel_area = pixel_area_m2(transform)
    loss_pixels = np.isin(classes, [4, 5]).sum()
    gain_pixels = np.isin(classes, [1, 2]).sum()
    return loss_pixels * pixel_area, gain_pixels * pixel_area


def vectorize(classes, transform, crs, class_ids, out_geojson):
    """Convert selected classes into polygons for the map view."""
    polys = [shape(geom) for geom, val in shapes(classes, transform=transform) if val in class_ids]
    if not polys:
        print(f"No polygons found for {out_geojson}")
        return
    gdf = gpd.GeoDataFrame(geometry=polys, crs=crs)
    gdf.to_file(out_geojson, driver="GeoJSON")
    print(f"Saved {out_geojson}")


def main():
    july_2024_ndvi, july_2025_ndvi, profile = read_and_align(JULY_2024_PATH, JULY_2025_PATH)
    ndvi_change, change_classes = classify_change(july_2024_ndvi, july_2025_ndvi)

    # Write the change raster
    diff_path = os.path.join(OUTPUT_DIR, "delta_ndvi.tif")
    profile.update(dtype=rasterio.float32, count=1)
    with rasterio.open(diff_path, "w", **profile) as dst:
        dst.write(ndvi_change, 1)
    print(f"Saved delta NDVI raster: {diff_path}")

    # Pixel-based change totals
    total_loss_m2, total_gain_m2 = estimate_area_by_pixels(change_classes, profile["transform"])
    print(f"Loss area ≈ {total_loss_m2/1e6:.2f} km², Gain area ≈ {total_gain_m2/1e6:.2f} km²")

    # GeoJSON layers for the map
    dec_geo = os.path.join(OUTPUT_DIR, "decrease.geojson")
    inc_geo = os.path.join(OUTPUT_DIR, "increase.geojson")
    vectorize(change_classes, profile["transform"], profile["crs"], [4, 5], dec_geo)
    vectorize(change_classes, profile["transform"], profile["crs"], [1, 2], inc_geo)

    # Back-of-the-envelope tree count
    recover_area = total_loss_m2 * RECOVERY_FRACTION
    trees_needed = int(recover_area / CROWN_M2_PER_TREE) if CROWN_M2_PER_TREE else 0

    summary = {
        "note": "positive = vegetation increase, negative = decrease",
        "total_loss_m2": total_loss_m2,
        "total_gain_m2": total_gain_m2,
        "loss_km2": total_loss_m2 / 1e6,
        "gain_km2": total_gain_m2 / 1e6,
        "trees_needed": trees_needed,
        "recovery_fraction": RECOVERY_FRACTION,
        "crown_m2_per_tree": CROWN_M2_PER_TREE,
    }

    summ_path = os.path.join(OUTPUT_DIR, "summary.json")
    with open(summ_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved summary: {summ_path}")


if __name__ == "__main__":
    main()
