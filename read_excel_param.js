const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'In-House_Analytics_na_Validation_Sheet.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log("Sheet Name:", sheetName);
console.log("First 5 rows:", JSON.stringify(data.slice(0, 5), null, 2));
console.log("Total rows:", data.length);
