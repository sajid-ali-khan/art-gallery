#!/usr/bin/env python3
"""
Generate data.json from the images/ directory structure.
Treats every subfolder as a category and scans for image files.
Preserves existing name and story fields for already-catalogued images.
"""

import os
import json
from pathlib import Path


def get_image_files(directory):
    """Return all image files in a directory."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    files = []
    if os.path.isdir(directory):
        for filename in sorted(os.listdir(directory)):
            if Path(filename).suffix.lower() in image_extensions:
                files.append(filename)
    return files


def load_existing_data(data_file):
    """Load existing data.json if it exists."""
    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {'categories': []}
    return {'categories': []}


def save_data(data, data_file):
    """Save data to data.json."""
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_data():
    """Scan images/ directory and generate data.json."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(script_dir, 'images')
    data_file = os.path.join(script_dir, 'data.json')

    if not os.path.isdir(images_dir):
        print(f"❌ Images directory not found: {images_dir}")
        return

    # Load existing data to preserve name and story fields
    existing_data = load_existing_data(data_file)
    existing_map = {}

    for category in existing_data.get('categories', []):
        cat_name = category.get('name')
        if cat_name:
            existing_map[cat_name] = {
                piece['file']: piece for piece in category.get('pieces', [])
            }

    # Scan directories and build new structure
    new_data = {'categories': []}
    categories = sorted([
        d for d in os.listdir(images_dir)
        if os.path.isdir(os.path.join(images_dir, d)) and not d.startswith('.')
    ])

    for category_name in categories:
        category_path = os.path.join(images_dir, category_name)
        image_files = get_image_files(category_path)

        if not image_files:
            continue

        pieces = []
        for image_file in image_files:
            file_path = f"images/{category_name}/{image_file}"

            # Check if this piece already exists in existing data
            piece_data = {
                'file': file_path,
            }

            if category_name in existing_map and file_path in existing_map[category_name]:
                existing_piece = existing_map[category_name][file_path]
                # Preserve name and story if they exist
                if 'name' in existing_piece:
                    piece_data['name'] = existing_piece['name']
                if 'story' in existing_piece:
                    piece_data['story'] = existing_piece['story']

            pieces.append(piece_data)

        category = {
            'name': category_name,
            'pieces': pieces
        }
        new_data['categories'].append(category)

    save_data(new_data, data_file)
    print(f"✓ Generated data.json with {len(new_data['categories'])} categories")
    for cat in new_data['categories']:
        print(f"  • {cat['name']}: {len(cat['pieces'])} pieces")


if __name__ == '__main__':
    generate_data()
