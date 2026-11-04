import sqlite3
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SQLITE_PATH = r"f:\discord-clone-main\kaggle\dataset\Enterprise_HRM_Threads_AI_Dataset_V3_REPAIRED\sqlite\enterprise_hr_threads_ai_v3.sqlite"
OUTPUT_DIR = r"f:\discord-clone-main\scratch\seed_data"

os.makedirs(OUTPUT_DIR, exist_ok=True)

conn = sqlite3.connect(SQLITE_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

def dump_table(table_name, limit=None, custom_sql=None):
    sql = custom_sql if custom_sql else f"SELECT * FROM {table_name}"
    if limit:
        sql += f" LIMIT {limit}"
    c.execute(sql)
    rows = [dict(r) for r in c.fetchall()]
    out_file = os.path.join(OUTPUT_DIR, f"{table_name}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False)
    print(f"Exported {table_name}: {len(rows)} records -> {out_file}")
    return len(rows)

print("--- STARTING SQLITE EXPORT TO JSON ---")
dump_table('org_units')
dump_table('users')
dump_table('employee_profiles')
dump_table('org_unit_members')
dump_table('post_categories')
dump_table('posts')
dump_table('meetings')
dump_table('transcript_segments')
dump_table('tasks')
dump_table('attendance_records')
dump_table('leave_policies')
dump_table('leave_requests')
dump_table('social_topics')
dump_table('social_posts', limit=1500)
print("--- ALL EXPORTS COMPLETED SUCCESSFULLY ---")

