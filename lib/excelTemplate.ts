import * as XLSX from 'xlsx';

// Download native Microsoft Excel (.xlsx) candidate template
export function downloadCandidateExcelTemplate() {
  const worksheetData = [
    ['Nama Lengkap', 'Email', 'No WhatsApp', 'Posisi Dilamar'],
    ['Budi Santoso', 'budi.santoso@example.com', '081234567890', 'Software Engineer'],
    ['Siti Rahma', 'siti.rahma@example.com', '082198765432', 'HR Specialist'],
    ['Andi Pratama', 'andi.pratama@example.com', '085711223344', 'Marketing Executive'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for clean Excel layout
  worksheet['!cols'] = [
    { wch: 25 }, // Nama Lengkap
    { wch: 30 }, // Email
    { wch: 18 }, // No WhatsApp
    { wch: 22 }, // Posisi Dilamar
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kandidat');
  XLSX.writeFile(workbook, 'Template_Kandidat_PsikoTest.xlsx');
}

// Parse native Microsoft Excel (.xlsx / .xls) and CSV file uploads
export function parseCandidateExcelFile(arrayBuffer: ArrayBuffer): Array<{
  full_name: string;
  email: string;
  phone_number: string;
  position: string;
}> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length <= 1) return [];

    const candidates: Array<{
      full_name: string;
      email: string;
      phone_number: string;
      position: string;
    }> = [];

    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      const fullName = row[0] ? String(row[0]).trim() : '';
      const email = row[1] ? String(row[1]).trim() : '';
      const phone = row[2] ? String(row[2]).trim() : '';
      const position = row[3] ? String(row[3]).trim() : '';

      if (fullName && email) {
        candidates.push({
          full_name: fullName,
          email: email,
          phone_number: phone,
          position: position,
        });
      }
    }

    return candidates;
  } catch (err) {
    console.error('Error parsing Excel file:', err);
    return [];
  }
}
