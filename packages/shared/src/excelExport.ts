import * as XLSX from 'xlsx';

/**
 * Export data to Excel format
 * @param data Array of objects to export
 * @param sheetName Name of the worksheet (default: 'Sheet1')
 * @param fileName Name of the file to save (default: 'export.xlsx')
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  sheetName: string = 'Sheet1',
  fileName: string = 'export.xlsx'
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate buffer and trigger download
  const wbBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  // Create blob and download
  const blob = new Blob([wbBuf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Export check-in data to Excel with proper formatting
 * @param checkins Array of check-in records
 * @param fileName Name of the file to save
 */
export function exportCheckinsToExcel(
  checkins: Array<{
    id: string;
    user_id: string;
    org_id: string;
    energy: number;
    stress: number;
    workload: number;
    sentiment_score: number | null;
    burnout_risk_score: number | null;
    source: string;
    checked_in_at: string;
  }>,
  fileName: string = 'checkins_export.xlsx'
): void {
  // Format data for export (remove internal IDs, format dates)
  const exportData = checkins.map(checkin => ({
    'Check-in ID': checkin.id,
    'Energy (1-5)': checkin.energy,
    'Stress (1-5)': checkin.stress,
    'Workload (1-5)': checkin.workload,
    'Sentiment Score': checkin.sentiment_score ?? '',
    'Burnout Risk Score': checkin.burnout_risk_score ?? '',
    'Source': checkin.source,
    'Checked In At': new Date(checkin.checked_in_at).toLocaleString()
  }));
  
  exportToExcel(exportData, 'Check-ins', fileName);
}

/**
 * Export user data to Excel with proper formatting
 * @param users Array of user records
 * @param fileName Name of the file to save
 */
export function exportUsersToExcel(
  users: Array<{
    id: string;
    org_id: string;
    role: string;
    department: string | null;
    is_active: boolean;
    created_at: string;
  }>,
  fileName: string = 'users_export.xlsx'
): void {
  // Format data for export
  const exportData = users.map(user => ({
    'User ID': user.id,
    'Role': user.role,
    'Department': user.department ?? '',
    'Active': user.is_active ? 'Yes' : 'No',
    'Created At': new Date(user.created_at).toLocaleString()
  }));
  
  exportToExcel(exportData, 'Users', fileName);
}

/**
 * Export risk events data to Excel with proper formatting
 * @param riskEvents Array of risk event records
 * @param fileName Name of the file to save
 */
export function exportRiskEventsToExcel(
  riskEvents: Array<{
    id: string;
    user_id: string;
    org_id: string;
    risk_level: string;
    predicted_burnout_date: string | null;
    contributing_factors: Record<string, any> | null;
    acknowledged_by: string | null;
    created_at: string;
  }>,
  fileName: string = 'risk_events_export.xlsx'
): void {
  // Format data for export
  const exportData = riskEvents.map(event => ({
    'Event ID': event.id,
    'Risk Level': event.risk_level,
    'Predicted Burnout Date': event.predicted_burnout_date 
      ? new Date(event.predicted_burnout_date).toLocaleDateString() 
      : '',
    'Contributing Factors': event.contributing_factors 
      ? JSON.stringify(event.contributing_factors) 
      : '',
    'Acknowledged By': event.acknowledged_by ?? '',
    'Created At': new Date(event.created_at).toLocaleString()
  }));
  
  exportToExcel(exportData, 'Risk Events', fileName);
}