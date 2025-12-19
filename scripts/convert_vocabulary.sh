#!/bin/bash
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Find the CSV file dynamically
CSV_PATH=$(find "$PROJECT_ROOT" -maxdepth 1 -type f -name "*國高中*工作表1.csv" | head -n 1)

if [ -z "$CSV_PATH" ]; then
    echo "Error: No matching CSV file found!"
    exit 1
fi

# Output path for JSON
JSON_PATH="$PROJECT_ROOT/src/data/vocabulary.json"

# Run the conversion
python3 "$SCRIPT_DIR/csv_to_json.py" "$CSV_PATH" "$JSON_PATH"

echo "Vocabulary CSV converted to JSON successfully!"
echo "Source: $CSV_PATH"
echo "Output: $JSON_PATH"