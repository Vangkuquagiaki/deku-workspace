export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { csvContent, dryRun = false, type = "AUTO" } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return new NextResponse("csvContent string is required", { status: 400 });
    }

    const { headers, rows } = parseCsv(csvContent);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or missing data rows" },
        { status: 400 }
      );
    }

    // Auto-detect import type if not specified
    const isAttendance =
      type === "ATTENDANCE" ||
      headers.includes("worked_days") ||
      (headers.includes("month") && !headers.includes("job_title"));

    if (isAttendance) {
      // ATTENDANCE IMPORT WORKFLOW
      const codeIdx = headers.indexOf("employee_code");
      const monthIdx = headers.indexOf("month");
      const workedIdx = headers.indexOf("worked_days");

      if (codeIdx === -1 || monthIdx === -1 || workedIdx === -1) {
        return NextResponse.json(
          {
            error:
              "CSV chấm công yêu cầu các cột: employee_code, month, worked_days",
          },
          { status: 400 }
        );
      }

      const errors: { row: number; error: string }[] = [];
      const validRecords: {
        employeeCode: string;
        month: string;
        workedDays: number;
      }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const employeeCode = row[codeIdx]?.trim();
        let month = row[monthIdx]?.trim();
        const workedStr = row[workedIdx]?.trim();

        if (!employeeCode) {
          errors.push({ row: rowNum, error: "Thiếu employee_code" });
          continue;
        }

        if (!month) {
          errors.push({ row: rowNum, error: "Thiếu month" });
          continue;
        }

        // Normalize month format MM/YYYY -> YYYY-MM
        if (month.includes("/")) {
          const parts = month.split("/");
          if (parts.length === 2) {
            month = `${parts[1]}-${parts[0].padStart(2, "0")}`;
          }
        }

        const workedDays = parseFloat(workedStr);
        if (isNaN(workedDays) || workedDays < 0 || workedDays > 31) {
          errors.push({
            row: rowNum,
            error: `Số ngày làm việc không hợp lệ: "${workedStr}" (phải từ 0 đến 31)`,
          });
          continue;
        }

        validRecords.push({ employeeCode, month, workedDays });
      }

      if (dryRun) {
        return NextResponse.json({
          dryRun: true,
          importType: "ATTENDANCE",
          totalRows: rows.length,
          validCount: validRecords.length,
          invalidCount: errors.length,
          errors,
          preview: validRecords.slice(0, 10),
        });
      }

      // Execute upsert into DB
      let createdCount = 0;
      let updatedCount = 0;

      for (const rec of validRecords) {
        const emp = await db.employeeProfile.findUnique({
          where: { employeeCode: rec.employeeCode },
        });

        if (!emp) {
          errors.push({
            row: 0,
            error: `Mã nhân viên ${rec.employeeCode} không tồn tại trong hệ thống.`,
          });
          continue;
        }

        const monthDate = new Date(`${rec.month}-01T00:00:00.000Z`);

        const existing = await db.attendanceRecord.findUnique({
          where: {
            employeeProfileId_month: {
              employeeProfileId: emp.id,
              month: monthDate,
            },
          },
        });

        if (existing) {
          await db.attendanceRecord.update({
            where: { id: existing.id },
            data: { workedDays: rec.workedDays },
          });
          updatedCount++;
        } else {
          await db.attendanceRecord.create({
            data: {
              employeeProfileId: emp.id,
              month: monthDate,
              workedDays: rec.workedDays,
            },
          });
          createdCount++;
        }
      }


      await logAudit({
        actorId: profile.id,
        action: "HR_IMPORT_ATTENDANCE",
        targetType: "AttendanceRecord",
        targetId: `batch_${Date.now()}`,
        detail: {
          totalRows: rows.length,
          createdCount,
          updatedCount,
          errorsCount: errors.length,
        },
      });

      return NextResponse.json({
        success: true,
        importType: "ATTENDANCE",
        createdCount,
        updatedCount,
        errors,
      });
    } else {
      // EMPLOYEES IMPORT WORKFLOW
      const codeIdx = headers.indexOf("employee_code");
      const nameIdx = headers.indexOf("full_name");
      const emailIdx = headers.indexOf("email");
      const titleIdx = headers.indexOf("job_title");
      const deptIdx = headers.indexOf("department");
      const teamIdx = headers.indexOf("team");
      const hiredIdx = headers.indexOf("hired_on");

      if (codeIdx === -1 || nameIdx === -1 || emailIdx === -1) {
        return NextResponse.json(
          {
            error:
              "CSV nhân viên yêu cầu tối thiểu các cột: employee_code, full_name, email",
          },
          { status: 400 }
        );
      }

      const errors: { row: number; error: string }[] = [];
      const validRecords: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const employeeCode = row[codeIdx]?.trim();
        const fullName = row[nameIdx]?.trim();
        const email = row[emailIdx]?.trim();
        const jobTitle = titleIdx !== -1 ? row[titleIdx]?.trim() || "Nhân viên" : "Nhân viên";
        const department = deptIdx !== -1 ? row[deptIdx]?.trim() : "";
        const team = teamIdx !== -1 ? row[teamIdx]?.trim() : "";
        const hiredOnStr = hiredIdx !== -1 ? row[hiredIdx]?.trim() : "";

        if (!employeeCode) {
          errors.push({ row: rowNum, error: "Thiếu employee_code" });
          continue;
        }

        if (!fullName) {
          errors.push({ row: rowNum, error: "Thiếu full_name" });
          continue;
        }

        if (!email || !email.includes("@")) {
          errors.push({ row: rowNum, error: `Email không hợp lệ: "${email}"` });
          continue;
        }

        let hiredOn: Date = new Date();
        if (hiredOnStr) {
          const parsed = new Date(hiredOnStr);
          if (!isNaN(parsed.getTime())) {
            hiredOn = parsed;
          }
        }

        validRecords.push({
          employeeCode,
          fullName,
          email,
          jobTitle,
          department,
          team,
          hiredOn,
        });
      }

      if (dryRun) {
        return NextResponse.json({
          dryRun: true,
          importType: "EMPLOYEES",
          totalRows: rows.length,
          validCount: validRecords.length,
          invalidCount: errors.length,
          errors,
          preview: validRecords.slice(0, 10),
        });
      }

      // Execute upsert into DB
      let createdCount = 0;
      let updatedCount = 0;

      for (const rec of validRecords) {
        // Resolve or create user profile if needed
        let userProf = await db.profile.findFirst({
          where: { email: rec.email },
        });

        if (!userProf) {
          userProf = await db.profile.create({
            data: {
              userId: `imported_${rec.employeeCode.toLowerCase()}`,
              name: rec.fullName,
              imageUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${rec.employeeCode}`,
              email: rec.email,
            },
          });
        }

        // Upsert EmployeeProfile
        const existingEmp = await db.employeeProfile.findUnique({
          where: { employeeCode: rec.employeeCode },
        });

        let empRecord;
        if (existingEmp) {
          empRecord = await db.employeeProfile.update({
            where: { id: existingEmp.id },
            data: {
              jobTitle: rec.jobTitle,
              hiredOn: rec.hiredOn,
            },
          });
          updatedCount++;
        } else {
          empRecord = await db.employeeProfile.create({
            data: {
              profileId: userProf.id,
              employeeCode: rec.employeeCode,
              jobTitle: rec.jobTitle,
              hiredOn: rec.hiredOn,
            },
          });
          createdCount++;
        }

        // Link OrgUnit (Department / Team) if specified
        if (rec.department) {
          let deptOrg = await db.orgUnit.findFirst({
            where: { name: rec.department, type: "DEPARTMENT" },
          });

          if (!deptOrg) {
            deptOrg = await db.orgUnit.create({
              data: {
                name: rec.department,
                type: "DEPARTMENT",
              },
            });
          }

          let teamOrg = null;
          if (rec.team) {
            teamOrg = await db.orgUnit.findFirst({
              where: {
                name: rec.team,
                type: "TEAM",
                parentId: deptOrg.id,
              },
            });

            if (!teamOrg) {
              teamOrg = await db.orgUnit.create({
                data: {
                  name: rec.team,
                  type: "TEAM",
                  parentId: deptOrg.id,
                },
              });
            }
          }


          const targetUnit = teamOrg || deptOrg;
          const isMember = await db.orgUnitMember.findFirst({
            where: {
              orgUnitId: targetUnit.id,
              profileId: userProf.id,
            },
          });

          if (!isMember) {
            await db.orgUnitMember.create({
              data: {
                orgUnitId: targetUnit.id,
                profileId: userProf.id,
                role: "MEMBER",
              },
            });
          }
        }
      }

      await logAudit({
        actorId: profile.id,
        action: "HR_IMPORT_EMPLOYEES",
        targetType: "EmployeeProfile",
        targetId: `batch_${Date.now()}`,
        detail: {
          totalRows: rows.length,
          createdCount,
          updatedCount,
          errorsCount: errors.length,
        },
      });

      return NextResponse.json({
        success: true,
        importType: "EMPLOYEES",
        createdCount,
        updatedCount,
        errors,
      });
    }
  } catch (error) {
    console.error("[HR_IMPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
