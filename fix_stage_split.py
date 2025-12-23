#!/usr/bin/env python3
"""
Fix Issue #13: Split words that appear in both junior and senior textbooks
into separate entries for each stage.

Words to split:
- please: Has 龍騰 (senior) + 康軒/翰林/南一 (junior)
- sign: Has 龍騰 (senior) + 康軒/翰林 (junior)
- use: Has 龍騰 (senior) + 康軒/翰林/南一 (junior)
"""

import json
import copy

# Load vocabulary.json
with open('src/data/vocabulary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Publishers that are junior-only
JUNIOR_PUBLISHERS = {'康軒', '翰林', '南一'}
# Publishers that are senior-only
SENIOR_PUBLISHERS = {'龍騰'}

# Words that need to be split
WORDS_TO_SPLIT = {'please', 'sign', 'use'}

new_data = []
split_count = 0

for entry in data:
    word = entry.get('english_word', '').lower()

    if word not in WORDS_TO_SPLIT:
        # Keep as-is
        new_data.append(entry)
        continue

    # This word needs to be split
    textbook_index = entry.get('textbook_index', [])

    # Separate textbook entries by stage
    junior_textbooks = [t for t in textbook_index if t.get('version') in JUNIOR_PUBLISHERS]
    senior_textbooks = [t for t in textbook_index if t.get('version') in SENIOR_PUBLISHERS]

    if not junior_textbooks and not senior_textbooks:
        # No textbooks, keep as-is
        new_data.append(entry)
        continue

    # Create junior entry if needed
    if junior_textbooks:
        junior_entry = copy.deepcopy(entry)
        junior_entry['stage'] = '國中'
        junior_entry['textbook_index'] = junior_textbooks
        new_data.append(junior_entry)
        split_count += 1
        print(f"✓ Created junior entry for '{word}' with {len(junior_textbooks)} textbook(s)")

    # Create senior entry if needed
    if senior_textbooks:
        senior_entry = copy.deepcopy(entry)
        senior_entry['stage'] = '高中'
        senior_entry['textbook_index'] = senior_textbooks
        new_data.append(senior_entry)
        split_count += 1
        print(f"✓ Created senior entry for '{word}' with {len(senior_textbooks)} textbook(s)")

print(f"\n📊 Summary:")
print(f"   Original entries: {len(data)}")
print(f"   New entries: {len(new_data)}")
print(f"   Split operations: {split_count}")

# Save the fixed data
with open('src/data/vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"\n✅ Fixed vocabulary.json saved!")
