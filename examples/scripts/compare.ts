import { buildDocument, samplePayslip } from '../src/exampless/hr/payslip';
import { generate as generateClasses } from '../src/exampless/hr/payslip-classes';
import { generate as generateOptions } from '../src/exampless/hr/payslip';

// Generate both docs
const doc1 = generateOptions();
const doc2 = generateClasses();

// Deep stringify to JSON to find the mismatch
const s1 = JSON.stringify(doc1, null, 2);
const s2 = JSON.stringify(doc2, null, 2);

if (s1 === s2) {
  console.log('JSONs are identical! The difference is in the PDF generation process (e.g. random IDs)');
} else {
  // Find first difference
  const lines1 = s1.split('\n');
  const lines2 = s2.split('\n');
  for (let i = 0; i < lines1.length; i++) {
    if (lines1[i] !== lines2[i]) {
      console.log(`Mismatch at line ${i + 1}:`);
      console.log(`payslip:         ${lines1[i]}`);
      console.log(`payslip-classes: ${lines2[i]}`);
      console.log(`\nContext:\n${lines1.slice(Math.max(0, i - 5), i).join('\n')}`);
      break;
    }
  }
}
