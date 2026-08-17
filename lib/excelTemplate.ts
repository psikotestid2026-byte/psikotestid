// Helper utility for generating downloadable candidate CSV template and parsing CSV uploads

export function downloadCandidateCSVTemplate() {
  const headers = ['nama_lengkap', 'email', 'no_whatsapp', 'posisi_dilamar'];
  const sampleRows = [
    ['Budi Santoso', 'budi.santoso@example.com', '081234567890', 'Software Engineer'],
    ['Siti Rahma', 'siti.rahma@example.com', '082198765432', 'HR Specialist'],
    ['Andi Pratama', 'andi.pratama@example.com', '085711223344', 'Marketing Executive'],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Kandidat_PsikoTest.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCandidateCSV(csvText: string): Array<{
  full_name: string;
  email: string;
  phone_number: string;
  position: string;
}> {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const candidates: Array<{
    full_name: string;
    email: string;
    phone_number: string;
    position: string;
  }> = [];

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const rowStr = lines[i];
    // Simple CSV parser handling quotes
    const matches = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowStr.split(',');
    const cleanCells = matches.map((cell) => cell.replace(/^"|"$/g, '').trim());

    const fullName = cleanCells[0] || '';
    const email = cleanCells[1] || '';
    const phone = cleanCells[2] || '';
    const position = cleanCells[3] || '';

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
}
