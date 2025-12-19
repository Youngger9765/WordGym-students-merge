import csv
import json
import sys

def parse_array_field(value, delimiter=';'):
    """
    Parse a field that might be a comma or semicolon-separated array
    Returns an empty list if the field is empty
    """
    if not value or value.strip() == '':
        return []

    # Split and strip each item, remove empty items
    return [item.strip() for item in value.split(delimiter) if item.strip()]

def parse_textbook_index(value):
    """
    Parse textbook index into a structured array
    Expected format: "龍騰-B1-U4" or "version-vol-lesson" or empty
    """
    if not value or value.strip() == '':
        return []

    # Split by dash (actual format: 龍騰-B1-U4)
    parts = value.split('-')
    if len(parts) >= 3:
        return [{"version": parts[0].strip(), "vol": parts[1].strip(), "lesson": parts[2].strip()}]
    return []

def parse_theme_index(value):
    """
    Parse theme index into a structured array
    Expected format: "range;theme" or empty
    """
    if not value or value.strip() == '':
        return []

    parts = value.split(';')
    if len(parts) == 2:
        return [{"range": parts[0], "theme": parts[1]}]
    return []

def parse_pos_tags(pos_column):
    """
    Parse part of speech tags from the '詞性' column
    """
    if not pos_column or pos_column.strip() == '':
        return []

    # Add logic to parse different POS tags
    pos_mapping = {
        'n.': 'noun',
        'v.': 'verb',
        'adj.': 'adjective',
        'adv.': 'adverb',
        'prep.': 'preposition',
        # Add more mappings as needed
    }

    # Check for any known POS markers
    return [pos_mapping.get(tag.strip(), tag.strip()) for tag in pos_mapping.keys() if tag in pos_column]

def csv_to_json(csv_path, json_path):
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        data = []

        for row in reader:
            # Create a new row for processing
            processed_row = {}

            # Go through each key-value pair
            for key, value in row.items():
                # Skip completely empty values
                if value is None or value.strip() == '':
                    continue

                # Special parsing for specific fields
                if key == 'textbook_index':
                    processed_row[key] = parse_textbook_index(value)
                elif key == 'exam_tags':
                    processed_row[key] = parse_array_field(value)
                elif key == 'theme_index':
                    processed_row[key] = parse_theme_index(value)
                elif key == '詞性':
                    processed_row['posTags'] = parse_pos_tags(value)
                elif key == 'videoUrl':
                    processed_row[key] = value or ''
                else:
                    # For other fields, preserve the original value
                    processed_row[key] = value

            # Only add non-empty rows
            if processed_row:
                data.append(processed_row)

    # Write processed data to JSON
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python csv_to_json.py input.csv output.json")
        sys.exit(1)

    csv_to_json(sys.argv[1], sys.argv[2])