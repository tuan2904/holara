const formatDateCode = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}${mm}${yyyy}`;
};

const generateEntityCode = (items = [], fieldName, suffix, width = 4) => {
  const dateStr = formatDateCode();
  const prefix = `HLR_MED_${dateStr}_${suffix}`;
  const nextSequence = items
    .filter((item) => item && item[fieldName] && item[fieldName].startsWith(prefix))
    .map((item) => {
      const match = item[fieldName].match(new RegExp(`${suffix}(\\d{${width}})$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => b - a)[0] || 0;

  return `${prefix}${String(nextSequence + 1).padStart(width, "0")}`;
};

export const generateBranchCode = (existingBranches = []) =>
  generateEntityCode(existingBranches, "code", "BR", 4);

export const generateDoctorCode = (existingDoctors = []) =>
  generateEntityCode(existingDoctors, "doctor_code", "DT", 4);

export const generatePatientCode = (existingPatients = []) =>
  generateEntityCode(existingPatients, "patient_code", "PT", 4);

/**
 * Format a branch code for display with better readability
 * HLR_MED_31032026_BR0001 -> HLR_MED | 31/03/2026 | BR #1
 * 
 * @param {string} code - The branch code
 * @returns {string} Formatted code
 */
export const formatBranchCode = (code) => {
  if (!code || !/^HLR_MED_\d{8}_BR\d{4}$/.test(code)) {
    return code;
  }

  const parts = code.split('_');
  const dateStr = parts[2];
  const sequenceStr = parts[3].replace("BR", "");

  const dd = dateStr.substring(0, 2);
  const mm = dateStr.substring(2, 4);
  const yyyy = dateStr.substring(4, 8);
  const sequence = parseInt(sequenceStr, 10);

  return `HLR_MED | ${dd}/${mm}/${yyyy} | BR #${sequence}`;
};

/**
 * Parse a branch code to extract components
 * 
 * @param {string} code - The branch code
 * @returns {Object|null} Object with { prefix, date, dateFormatted, sequence } or null if invalid
 */
export const parseBranchCode = (code) => {
  const match = code.match(/^HLR_MED_(\d{2})(\d{2})(\d{4})_BR(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, dd, mm, yyyy, sequence] = match;
  return {
    prefix: 'HLR_MED',
    date: `${dd}${mm}${yyyy}`,
    dateFormatted: `${dd}/${mm}/${yyyy}`,
    sequence: parseInt(sequence, 10),
  };
};
