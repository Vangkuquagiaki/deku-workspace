const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const addresses = [
  "Số 45/12 Đường D2, P. 25, Q. Bình Thạnh, TP. Hồ Chí Minh",
  "Căn hộ 12.04, Tòa Landmark Plus, Vinhomes Central Park, Q. Bình Thạnh, TP. HCM",
  "Số 88 Trần Não, P. An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh",
  "Căn B15, Khu đô thị Sala, TP. Thủ Đức, TP. Hồ Chí Minh",
  "Số 234 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
  "Tòa Park 6, Vinhomes Grand Park, Long Thạnh Mỹ, TP. Thủ Đức",
  "Số 15 Lê Duẩn, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  "Số 102 Hoàng Hoa Thám, P. 7, Q. Bình Thạnh, TP. Hồ Chí Minh",
  "Số 42 Đặng Thai Mai, P. Quảng An, Q. Tây Hồ, Hà Nội",
  "Tòa S2.03, Vinhomes Ocean Park, Gia Lâm, Hà Nội",
  "Số 68 Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy, Hà Nội",
  "Số 19 Huỳnh Thúc Kháng, P. Láng Hạ, Q. Đống Đa, Hà Nội",
  "Căn hộ Eco Green, Nguyễn Văn Linh, P. Tân Thuận Tây, Quận 7, TP. HCM",
  "Số 56 Đường số 9, KDC Him Lam, P. Tân Hưng, Quận 7, TP. HCM",
  "Số 77 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh",
];

const banks = [
  { name: "Vietcombank (VCB)", prefix: "101" },
  { name: "Techcombank (TCB)", prefix: "190" },
  { name: "MB Bank (Quân Đội)", prefix: "088" },
  { name: "ACB (Á Châu)", prefix: "246" },
  { name: "VPBank", prefix: "159" },
];

async function main() {
  console.log("🚀 Updating Employee Profiles with full personal & compensation base data...");

  const employees = await db.employeeProfile.findMany({
    include: {
      profile: {
        include: {
          orgUnitMembers: {
            include: { orgUnit: true },
          },
        },
      },
    },
  });

  console.log(`Found ${employees.length} employees to update.`);

  let index = 0;
  for (const emp of employees) {
    index++;
    const role = emp.profile?.orgUnitMembers?.[0]?.role || "MEMBER";
    const isHr = emp.isHr;

    // Calculate base salary and allowance based on role
    let baseSalary = 18000000;
    let allowance = 2500000;
    let bonus = 3000000;

    if (isHr || emp.jobTitle?.toLowerCase().includes("hr lead")) {
      baseSalary = 32000000;
      allowance = 4500000;
      bonus = 5000000;
    } else if (role === "HEAD" || emp.jobTitle?.toLowerCase().includes("trưởng phòng") || emp.jobTitle?.toLowerCase().includes("head")) {
      baseSalary = 58000000;
      allowance = 8000000;
      bonus = 15000000;
    } else if (role === "LEAD" || emp.jobTitle?.toLowerCase().includes("tổ trưởng") || emp.jobTitle?.toLowerCase().includes("lead")) {
      baseSalary = 36000000;
      allowance = 5000000;
      bonus = 7000000;
    } else {
      // Member variations
      baseSalary = 16000000 + (index % 5) * 2000000;
      allowance = 2000000 + (index % 3) * 500000;
      bonus = 2000000 + (index % 4) * 1000000;
    }

    const birthYear = 1990 + (index % 12);
    const birthMonth = String((index % 12) + 1).padStart(2, "0");
    const birthDay = String((index % 27) + 1).padStart(2, "0");
    const dob = new Date(`${birthYear}-${birthMonth}-${birthDay}T00:00:00.000Z`);

    const address = addresses[index % addresses.length];
    const phoneNumber = `09${(index % 9) + 1}${String(1000000 + index * 3721).slice(1)}`;
    const idCardNumber = `079${birthYear}${String(100000 + index * 987).slice(1)}`;

    const bankChoice = banks[index % banks.length];
    const bankAccount = `${bankChoice.prefix}${String(100000000 + index * 123456).slice(1)}`;
    const bankName = bankChoice.name;

    await db.employeeProfile.update({
      where: { id: emp.id },
      data: {
        dob,
        address,
        phoneNumber,
        idCardNumber,
        bankAccount,
        bankName,
        baseSalary,
        allowance,
        bonus,
        insuranceSalary: Math.min(baseSalary, 36000000), // Mức trần đóng BHXH
      },
    });

    console.log(`Updated [${emp.employeeCode}] ${emp.profile?.name} - Role: ${role} - Luong: ${baseSalary.toLocaleString("vi-VN")} đ - Noi o: ${address}`);
  }

  // Also check if any profile does not have an employeeProfile yet
  const profilesWithoutEmp = await db.profile.findMany({
    where: { employeeProfile: null },
  });

  for (const prof of profilesWithoutEmp) {
    const code = `EMP${String(100 + Math.floor(Math.random() * 800))}`;
    await db.employeeProfile.create({
      data: {
        profileId: prof.id,
        employeeCode: code,
        jobTitle: "Chuyên viên Quản trị & Vận hành",
        hiredOn: new Date("2022-01-10"),
        employmentStatus: "ACTIVE",
        isHr: false,
        dob: new Date("1996-08-15"),
        address: "Căn hộ 15.02, Tòa Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh",
        phoneNumber: "0918 234 567",
        idCardNumber: "079196012345",
        bankAccount: "1019888999",
        bankName: "Vietcombank (VCB)",
        baseSalary: 28000000,
        allowance: 4000000,
        bonus: 5000000,
        insuranceSalary: 28000000,
      },
    });
    console.log(`Created new EmployeeProfile for ${prof.name} (${code})`);
  }

  console.log("✅ Finished updating all personal base & compensation data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

