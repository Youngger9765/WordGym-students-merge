import csv
import json
import sys

def csv_to_json(csv_path, json_path):
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        data = list(reader)

        # Clean and normalize the data
        for row in data:
            # Remove empty keys
            row = {k: v for k, v in row.items() if v is not None and v.strip() != ''}

            # Add videoUrl as empty string if not present
            row['videoUrl'] = row.get('videoUrl', '')

    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python csv_to_json.py input.csv output.json")
        sys.exit(1)

    csv_to_json(sys.argv[1], sys.argv[2])