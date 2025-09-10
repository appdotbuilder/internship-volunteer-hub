import * as XLSX from 'xlsx';

export interface ExcelData {
  [key: string]: string | number | Date | null | undefined;
}

export const exportToExcel = (data: ExcelData[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    return false;
  }
};

// Helper function to format data for export
export const formatDateForExcel = (date: Date | null | undefined): string => {
  if (!date) return '';
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const formatBooleanForExcel = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
};