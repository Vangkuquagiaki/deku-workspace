import os
import zipfile
import xml.etree.ElementTree as ET

kaggle_dir = r"F:\discord-clone-main\kaggle"
out_dir = r"F:\discord-clone-main\scratch\docx_contents"
os.makedirs(out_dir, exist_ok=True)

docx_files = [f for f in os.listdir(kaggle_dir) if f.endswith(".docx") and not f.startswith("~$")]

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            # namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            return "\n".join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {e}"

summary_list = []
for idx, fname in enumerate(docx_files):
    full_path = os.path.join(kaggle_dir, fname)
    text = extract_text_from_docx(full_path)
    out_name = f"doc_{idx+1}.txt"
    with open(os.path.join(out_dir, out_name), "w", encoding="utf-8") as f:
        f.write(f"FILENAME: {fname}\n\n")
        f.write(text)
    summary_list.append((fname, out_name, len(text), text[:300]))

with open(os.path.join(out_dir, "index.txt"), "w", encoding="utf-8") as f:
    for fname, out_name, length, preview in summary_list:
        f.write(f"=== {out_name} | {fname} (Length: {length} chars) ===\n")
        f.write(preview.replace("\n", " ") + "\n\n")

print(f"Extracted {len(docx_files)} files successfully.")

