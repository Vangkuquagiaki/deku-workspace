import glob
import json
import re

# find a text file in kaggle
txt_files = glob.glob(r'f:\discord-clone-main\kaggle\**\*.txt', recursive=True)
print(f"Total txt files found: {len(txt_files)}")

sample_messages = []
if txt_files:
    # take the first file
    sample_file = txt_files[0]
    print(f"Sampling from: {sample_file}")
    with open(sample_file, 'r', encoding='utf-8', errors='ignore') as f:
        for _ in range(200):
            line = f.readline()
            if not line:
                break
            parts = line.strip().split('\t')
            for part in parts:
                if ':' in part:
                    user, msg = part.split(':', 1)
                    user = user.strip()
                    msg = msg.strip()
                    # filter clean, reasonable length messages
                    if 5 <= len(msg) <= 120 and not any(bad in msg.lower() for bad in ['fuck', 'shit', 'bitch', 'porn', 'retard']):
                        sample_messages.append({"sender": user, "content": msg})
                        if len(sample_messages) >= 20:
                            break
            if len(sample_messages) >= 20:
                break

with open(r'f:\discord-clone-main\scratch\kaggle_sample.json', 'w', encoding='utf-8') as out:
    json.dump(sample_messages, out, ensure_ascii=False, indent=2)

print(f"Extracted {len(sample_messages)} sample messages.")
