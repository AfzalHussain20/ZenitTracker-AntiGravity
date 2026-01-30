const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'In-House_Analytics_na_Validation_Sheet.xlsx');
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
    console.log(`--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("First 5 rows:", JSON.stringify(data.slice(0, 5), null, 2));
});
