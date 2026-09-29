// Test file to verify branch code generation logic
// Can be run in dev tools console or as a Node.js test

import {
  generateBranchCode,
  generateDoctorCode,
  generatePatientCode,
  formatBranchCode,
  parseBranchCode,
} from '../utils/branchCodeGenerator.js';

// Test 1: No existing branches
console.log('Test 1: No existing branches');
const code1 = generateBranchCode([]);
console.log('Generated code:', code1);
console.log('Expected pattern: HLR_MED_ddmmyyyy_BR0001');
console.log('Match:', /^HLR_MED_\d{8}_BR0001$/.test(code1));

// Test 2: Multiple branches from today
console.log('\nTest 2: Multiple branches from today');
const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
const dateStr = `${dd}${mm}${yyyy}`;

const existingBranches = [
  { code: `HLR_MED_${dateStr}_BR0001` },
  { code: `HLR_MED_${dateStr}_BR0002` },
  { code: `HLR_MED_${dateStr}_BR0003` },
];
const code2 = generateBranchCode(existingBranches);
console.log('Generated code:', code2);
console.log('Expected:', `HLR_MED_${dateStr}_BR0004`);
console.log('Match:', code2 === `HLR_MED_${dateStr}_BR0004`);

// Test 3: Mixed dates (shouldn't count yesterday's branches)
console.log('\nTest 3: Mixed dates (only today\'s should count)');
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const dyy = String(yesterday.getDate()).padStart(2, '0');
const mmy = String(yesterday.getMonth() + 1).padStart(2, '0');
const yyyyy = yesterday.getFullYear();
const yesterdayStr = `${dyy}${mmy}${yyyyy}`;

const mixedBranches = [
  { code: `HLR_MED_${yesterdayStr}_BR0010` },
  { code: `HLR_MED_${yesterdayStr}_BR0011` },
  { code: `HLR_MED_${dateStr}_BR0001` },
  { code: `HLR_MED_${dateStr}_BR0002` },
];
const code3 = generateBranchCode(mixedBranches);
console.log('Generated code:', code3);
console.log('Expected:', `HLR_MED_${dateStr}_BR0003`);
console.log('Match:', code3 === `HLR_MED_${dateStr}_BR0003`);

console.log('\nTest 4: Generate doctor code');
const doctorCode = generateDoctorCode([
  { doctor_code: `HLR_MED_${dateStr}_DT0001` },
  { doctor_code: `HLR_MED_${dateStr}_DT0002` },
]);
console.log('Generated doctor code:', doctorCode);
console.log('Expected:', `HLR_MED_${dateStr}_DT0003`);

console.log('\nTest 5: Generate patient code');
const patientCode = generatePatientCode([
  { patient_code: `HLR_MED_${dateStr}_PT0001` },
]);
console.log('Generated patient code:', patientCode);
console.log('Expected:', `HLR_MED_${dateStr}_PT0002`);

// Test 6: Format branch code for display
console.log('\nTest 6: Format branch code');
const testCode = `HLR_MED_31032026_BR0001`;
const formatted = formatBranchCode(testCode);
console.log('Original:', testCode);
console.log('Formatted:', formatted);
console.log('Expected: HLR_MED | 31/03/2026 | BR #1');

// Test 7: Parse branch code
console.log('\nTest 7: Parse branch code');
const parsed = parseBranchCode(testCode);
console.log('Parsed:', parsed);
console.log('Expected: { prefix: "HLR_MED", date: "31032026", dateFormatted: "31/03/2026", sequence: 1 }');

// Test 8: Invalid code (should return null)
console.log('\nTest 8: Parse invalid code');
const invalidParsed = parseBranchCode('INVALID_CODE');
console.log('Parsed:', invalidParsed);
console.log('Expected: null');
