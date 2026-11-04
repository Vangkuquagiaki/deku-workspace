import zipfile
import xml.etree.ElementTree as ET
import glob
import os

output_file = r'f:\discord-clone-main\scratch\docx_content.txt'

with open(output_file, 'w', encoding='utf-8') as out:
    for path in glob.glob(r'f:\discord-clone-main\kaggle\*.docx'):
        out.write(f"\n==========================================\n")
        out.write(f"FILE: {os.path.basename(path)}\n")
        out.write(f"==========================================\n")
        try:
            with zipfile.ZipFile(path) as z:
                xml_content = z.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                    texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                    if texts:
                        paragraphs.append(''.join(texts))
                out.write('\n'.join(paragraphs))
        except Exception as e:
            out.write(f"Error reading {path}: {e}\n")

print("Done extracting docx content")
