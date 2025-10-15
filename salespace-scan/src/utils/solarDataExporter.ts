/**
 * Solar Inverter Data CSV Exporter
 * Exports solar inverter monitoring data to CSV format
 */

export interface SolarInverterData {
  deviceStatus: number;
  gridPower: number;
  todayImportEnergy: number | null;
  totalImportEnergy: number;
  todayExportEnergy: number | null;
  totalExportEnergy: number;
  gridPowerM2: number | null;
  todayImportEnergyM2: number | null;
  totalImportEnergyM2: number | null;
  todayExportEnergyM2: number | null;
  totalExportEnergyM2: number | null;
  dataTime: string;
  plantLocalTime: string;
  deviceSn: string;
  registerNo: string;
  acCurrent1: number;
  acVoltage1: number;
  acCurrent2: number;
  acCurrent3: number;
  acVoltage2: number;
  acVoltage3: number;
  acPower1: number;
  acPower2: number;
  acPower3: number;
  gridFrequency: number;
  totalPowerFactor: number;
  inverterTemperature: number;
  dailyACOutput: number;
  totalACOutput: number;
  dailyYield: number;
  totalYield: number;
  mpptMap: {
    mppt1Power: number;
    mppt1Voltage: number;
    mppt1Current: number;
    mppt2Power: number;
    mppt2Voltage: number;
    mppt2Current: number;
    mppt3Power: number;
    mppt3Voltage: number;
    mppt3Current: number;
    mppt4Power: number;
    mppt4Voltage: number;
    mppt4Current: number;
    mppt5Power: number;
    mppt5Voltage: number;
    mppt5Current: number;
    mppt6Power: number;
    mppt6Voltage: number;
    mppt6Current: number;
  };
  pvMap: {
    [key: string]: number;
  };
  EPSL1Voltage: number | null;
  EPSL1Current: number | null;
  EPSL1ActivePower: number | null;
  EPSL2Voltage: number | null;
  EPSL2Current: number | null;
  EPSL2ActivePower: number | null;
  EPSL3Voltage: number | null;
  EPSL3Current: number | null;
  EPSL3ActivePower: number | null;
  EPSL1ApparentPower: number | null;
  EPSL2ApparentPower: number | null;
  EPSL3ApparentPower: number | null;
  l2l3Voltage: number;
  l1l2Voltage: number;
  l1l3Voltage: number;
  totalReactivePower: number;
  totalActivePower: number;
  MPPTTotalInputPower: number | null;
}

export interface SolarDataResponse {
  code: number;
  result: SolarInverterData[];
}

/**
 * Converts solar inverter data to CSV format
 */
export class SolarDataExporter {
  private static formatValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      // Escape commas and quotes in strings
      return `"${value.replace(/"/g, '""')}"`;
    }
    return String(value);
  }

  /**
   * Export basic solar data (main metrics only)
   */
  static exportBasicData(data: SolarDataResponse): void {
    const headers = [
      'Data Time',
      'Plant Local Time',
      'Device SN',
      'Register No',
      'Device Status',
      'Grid Power (kW)',
      'Total Import Energy (kWh)',
      'Total Export Energy (kWh)',
      'Daily AC Output (kWh)',
      'Total AC Output (kWh)',
      'Daily Yield (kWh)',
      'Total Yield (kWh)',
      'AC Current 1 (A)',
      'AC Current 2 (A)',
      'AC Current 3 (A)',
      'AC Voltage 1 (V)',
      'AC Voltage 2 (V)',
      'AC Voltage 3 (V)',
      'AC Power 1 (kW)',
      'AC Power 2 (kW)',
      'AC Power 3 (kW)',
      'Grid Frequency (Hz)',
      'Power Factor',
      'Inverter Temperature (°C)',
      'Total Active Power (kW)',
      'Total Reactive Power (kVAr)'
    ];

    const rows = data.result.map(item => [
      item.dataTime,
      item.plantLocalTime,
      item.deviceSn,
      item.registerNo,
      item.deviceStatus,
      item.gridPower,
      item.totalImportEnergy,
      item.totalExportEnergy,
      item.dailyACOutput,
      item.totalACOutput,
      item.dailyYield,
      item.totalYield,
      item.acCurrent1,
      item.acCurrent2,
      item.acCurrent3,
      item.acVoltage1,
      item.acVoltage2,
      item.acVoltage3,
      item.acPower1,
      item.acPower2,
      item.acPower3,
      item.gridFrequency,
      item.totalPowerFactor,
      item.inverterTemperature,
      item.totalActivePower,
      item.totalReactivePower
    ]);

    this.downloadCSV(headers, rows, 'solar_basic_data');
  }

  /**
   * Export MPPT (Maximum Power Point Tracking) data
   */
  static exportMPPTData(data: SolarDataResponse): void {
    const headers = [
      'Data Time',
      'Device SN',
      'MPPT1 Power (kW)',
      'MPPT1 Voltage (V)',
      'MPPT1 Current (A)',
      'MPPT2 Power (kW)',
      'MPPT2 Voltage (V)',
      'MPPT2 Current (A)',
      'MPPT3 Power (kW)',
      'MPPT3 Voltage (V)',
      'MPPT3 Current (A)',
      'MPPT4 Power (kW)',
      'MPPT4 Voltage (V)',
      'MPPT4 Current (A)',
      'MPPT5 Power (kW)',
      'MPPT5 Voltage (V)',
      'MPPT5 Current (A)',
      'MPPT6 Power (kW)',
      'MPPT6 Voltage (V)',
      'MPPT6 Current (A)'
    ];

    const rows = data.result.map(item => [
      item.dataTime,
      item.deviceSn,
      item.mpptMap.mppt1Power,
      item.mpptMap.mppt1Voltage,
      item.mpptMap.mppt1Current,
      item.mpptMap.mppt2Power,
      item.mpptMap.mppt2Voltage,
      item.mpptMap.mppt2Current,
      item.mpptMap.mppt3Power,
      item.mpptMap.mppt3Voltage,
      item.mpptMap.mppt3Current,
      item.mpptMap.mppt4Power,
      item.mpptMap.mppt4Voltage,
      item.mpptMap.mppt4Current,
      item.mpptMap.mppt5Power,
      item.mpptMap.mppt5Voltage,
      item.mpptMap.mppt5Current,
      item.mpptMap.mppt6Power,
      item.mpptMap.mppt6Voltage,
      item.mpptMap.mppt6Current
    ]);

    this.downloadCSV(headers, rows, 'solar_mppt_data');
  }

  /**
   * Export PV (Photovoltaic) string data
   */
  static exportPVStringData(data: SolarDataResponse): void {
    // Get all PV keys from the first item to create headers
    const firstItem = data.result[0];
    if (!firstItem || !firstItem.pvMap) {
      console.error('No PV data available');
      return;
    }

    const pvKeys = Object.keys(firstItem.pvMap).sort();
    const headers = ['Data Time', 'Device SN', ...pvKeys];

    const rows = data.result.map(item => [
      item.dataTime,
      item.deviceSn,
      ...pvKeys.map(key => item.pvMap[key] || 0)
    ]);

    this.downloadCSV(headers, rows, 'solar_pv_string_data');
  }

  /**
   * Export comprehensive data (all fields flattened)
   */
  static exportComprehensiveData(data: SolarDataResponse): void {
    if (!data.result || data.result.length === 0) {
      console.error('No data available for export');
      return;
    }

    const firstItem = data.result[0];
    const pvKeys = Object.keys(firstItem.pvMap).sort();
    
    const headers = [
      // Basic info
      'Data Time',
      'Plant Local Time',
      'Device SN',
      'Register No',
      'Device Status',
      
      // Power and Energy
      'Grid Power (kW)',
      'Today Import Energy (kWh)',
      'Total Import Energy (kWh)',
      'Today Export Energy (kWh)',
      'Total Export Energy (kWh)',
      'Grid Power M2 (kW)',
      'Today Import Energy M2 (kWh)',
      'Total Import Energy M2 (kWh)',
      'Today Export Energy M2 (kWh)',
      'Total Export Energy M2 (kWh)',
      
      // AC Measurements
      'AC Current 1 (A)',
      'AC Voltage 1 (V)',
      'AC Current 2 (A)',
      'AC Current 3 (A)',
      'AC Voltage 2 (V)',
      'AC Voltage 3 (V)',
      'AC Power 1 (kW)',
      'AC Power 2 (kW)',
      'AC Power 3 (kW)',
      
      // System Metrics
      'Grid Frequency (Hz)',
      'Total Power Factor',
      'Inverter Temperature (°C)',
      'Daily AC Output (kWh)',
      'Total AC Output (kWh)',
      'Daily Yield (kWh)',
      'Total Yield (kWh)',
      
      // MPPT Data
      'MPPT1 Power (kW)',
      'MPPT1 Voltage (V)',
      'MPPT1 Current (A)',
      'MPPT2 Power (kW)',
      'MPPT2 Voltage (V)',
      'MPPT2 Current (A)',
      'MPPT3 Power (kW)',
      'MPPT3 Voltage (V)',
      'MPPT3 Current (A)',
      'MPPT4 Power (kW)',
      'MPPT4 Voltage (V)',
      'MPPT4 Current (A)',
      'MPPT5 Power (kW)',
      'MPPT5 Voltage (V)',
      'MPPT5 Current (A)',
      'MPPT6 Power (kW)',
      'MPPT6 Voltage (V)',
      'MPPT6 Current (A)',
      
      // PV String Data
      ...pvKeys,
      
      // EPS Data
      'EPS L1 Voltage (V)',
      'EPS L1 Current (A)',
      'EPS L1 Active Power (kW)',
      'EPS L2 Voltage (V)',
      'EPS L2 Current (A)',
      'EPS L2 Active Power (kW)',
      'EPS L3 Voltage (V)',
      'EPS L3 Current (A)',
      'EPS L3 Active Power (kW)',
      'EPS L1 Apparent Power (kVA)',
      'EPS L2 Apparent Power (kVA)',
      'EPS L3 Apparent Power (kVA)',
      
      // Line Voltages
      'L2-L3 Voltage (V)',
      'L1-L2 Voltage (V)',
      'L1-L3 Voltage (V)',
      
      // Power Summary
      'Total Reactive Power (kVAr)',
      'Total Active Power (kW)',
      'MPPT Total Input Power (kW)'
    ];

    const rows = data.result.map(item => [
      // Basic info
      item.dataTime,
      item.plantLocalTime,
      item.deviceSn,
      item.registerNo,
      item.deviceStatus,
      
      // Power and Energy
      item.gridPower,
      item.todayImportEnergy,
      item.totalImportEnergy,
      item.todayExportEnergy,
      item.totalExportEnergy,
      item.gridPowerM2,
      item.todayImportEnergyM2,
      item.totalImportEnergyM2,
      item.todayExportEnergyM2,
      item.totalExportEnergyM2,
      
      // AC Measurements
      item.acCurrent1,
      item.acVoltage1,
      item.acCurrent2,
      item.acCurrent3,
      item.acVoltage2,
      item.acVoltage3,
      item.acPower1,
      item.acPower2,
      item.acPower3,
      
      // System Metrics
      item.gridFrequency,
      item.totalPowerFactor,
      item.inverterTemperature,
      item.dailyACOutput,
      item.totalACOutput,
      item.dailyYield,
      item.totalYield,
      
      // MPPT Data
      item.mpptMap.mppt1Power,
      item.mpptMap.mppt1Voltage,
      item.mpptMap.mppt1Current,
      item.mpptMap.mppt2Power,
      item.mpptMap.mppt2Voltage,
      item.mpptMap.mppt2Current,
      item.mpptMap.mppt3Power,
      item.mpptMap.mppt3Voltage,
      item.mpptMap.mppt3Current,
      item.mpptMap.mppt4Power,
      item.mpptMap.mppt4Voltage,
      item.mpptMap.mppt4Current,
      item.mpptMap.mppt5Power,
      item.mpptMap.mppt5Voltage,
      item.mpptMap.mppt5Current,
      item.mpptMap.mppt6Power,
      item.mpptMap.mppt6Voltage,
      item.mpptMap.mppt6Current,
      
      // PV String Data
      ...pvKeys.map(key => item.pvMap[key] || 0),
      
      // EPS Data
      item.EPSL1Voltage,
      item.EPSL1Current,
      item.EPSL1ActivePower,
      item.EPSL2Voltage,
      item.EPSL2Current,
      item.EPSL2ActivePower,
      item.EPSL3Voltage,
      item.EPSL3Current,
      item.EPSL3ActivePower,
      item.EPSL1ApparentPower,
      item.EPSL2ApparentPower,
      item.EPSL3ApparentPower,
      
      // Line Voltages
      item.l2l3Voltage,
      item.l1l2Voltage,
      item.l1l3Voltage,
      
      // Power Summary
      item.totalReactivePower,
      item.totalActivePower,
      item.MPPTTotalInputPower
    ]);

    this.downloadCSV(headers, rows, 'solar_comprehensive_data');
  }

  /**
   * Export energy summary data
   */
  static exportEnergySummary(data: SolarDataResponse): void {
    const headers = [
      'Data Time',
      'Plant Local Time',
      'Device SN',
      'Daily Yield (kWh)',
      'Total Yield (kWh)',
      'Daily AC Output (kWh)',
      'Total AC Output (kWh)',
      'Total Import Energy (kWh)',
      'Total Export Energy (kWh)',
      'Net Energy (Export - Import)',
      'Total Active Power (kW)',
      'Grid Power (kW)',
      'Power Generation Efficiency (%)'
    ];

    const rows = data.result.map(item => {
      const netEnergy = (item.totalExportEnergy || 0) - (item.totalImportEnergy || 0);
      const totalMPPTPower = Object.values(item.mpptMap).filter((_, index) => index % 3 === 0).reduce((sum, power) => sum + (power || 0), 0);
      const efficiency = totalMPPTPower > 0 ? ((item.totalActivePower || 0) / totalMPPTPower * 100) : 0;
      
      return [
        item.dataTime,
        item.plantLocalTime,
        item.deviceSn,
        item.dailyYield,
        item.totalYield,
        item.dailyACOutput,
        item.totalACOutput,
        item.totalImportEnergy,
        item.totalExportEnergy,
        netEnergy.toFixed(2),
        item.totalActivePower,
        item.gridPower,
        efficiency.toFixed(2)
      ];
    });

    this.downloadCSV(headers, rows, 'solar_energy_summary');
  }

  /**
   * Helper method to download CSV file
   */
  private static downloadCSV(headers: string[], rows: (string | number | null | undefined)[][], filename: string): void {
    try {
      const csvContent = [
        headers.map(header => this.formatValue(header)).join(','),
        ...rows.map(row => row.map(cell => this.formatValue(cell)).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      console.log(`✅ ${filename} exported successfully`);
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      throw new Error(`Failed to export ${filename}: ${error}`);
    }
  }

  /**
   * Export all data types as separate CSV files
   */
  static exportAllFormats(data: SolarDataResponse): void {
    try {
      this.exportBasicData(data);
      this.exportMPPTData(data);
      this.exportPVStringData(data);
      this.exportEnergySummary(data);
      this.exportComprehensiveData(data);
      
      console.log('✅ All solar data formats exported successfully');
    } catch (error) {
      console.error('❌ Failed to export all formats:', error);
      throw error;
    }
  }
}

/**
 * Utility function to export sample data
 */
export const exportSampleSolarData = () => {
  const sampleData: SolarDataResponse = {
    "code": 10000,
    "result": [
      {
        "deviceStatus": 0,
        "gridPower": -30.72,
        "todayImportEnergy": null,
        "totalImportEnergy": 3465.00,
        "todayExportEnergy": null,
        "totalExportEnergy": 104.00,
        "gridPowerM2": null,
        "todayImportEnergyM2": null,
        "totalImportEnergyM2": null,
        "todayExportEnergyM2": null,
        "totalExportEnergyM2": null,
        "dataTime": "2025-08-20T00:04:26Z",
        "plantLocalTime": "2025-08-20 02:04:26",
        "deviceSn": "X3G060J6567025",
        "registerNo": "SNM3G7VNVS",
        "acCurrent1": 0.0,
        "acVoltage1": 0.0,
        "acCurrent2": 0.0,
        "acCurrent3": 0.0,
        "acVoltage2": 0.0,
        "acVoltage3": 0.0,
        "acPower1": 0,
        "acPower2": 0,
        "acPower3": 0,
        "gridFrequency": 0.00,
        "totalPowerFactor": 0.00,
        "inverterTemperature": 0.0,
        "dailyACOutput": 0.00,
        "totalACOutput": 1074.90,
        "dailyYield": 0.00,
        "totalYield": 1074.90,
        "mpptMap": {
          "mppt2Power": 0.0,
          "mppt2Voltage": 0.0,
          "mppt3Voltage": 0.0,
          "mppt1Voltage": 0.0,
          "mppt4Voltage": 0.0,
          "mppt5Voltage": 0.0,
          "mppt5Power": 0.0,
          "mppt6Voltage": 0.0,
          "mppt5Current": 0.0,
          "mppt6Current": 0.0,
          "mppt3Power": 0.0,
          "mppt3Current": 0.0,
          "mppt2Current": 0.0,
          "mppt4Current": 0.0,
          "mppt4Power": 0.0,
          "mppt6Power": 0.0,
          "mppt1Current": 0.0,
          "mppt1Power": 0.0
        },
        "pvMap": {
          "pv1Voltage": 0.0,
          "pv2Voltage": 0.0,
          "pv3Voltage": 0.0,
          "pv4Voltage": 0.0,
          "pv1Power": 0.0,
          "pv10Current": 0.0,
          "pv11Current": 0.0,
          "pv4Power": 0.0,
          "pv7Power": 0.0,
          "pv9Power": 0.0,
          "pv6Power": 0.0,
          "pv12Voltage": 0.0,
          "pv9Voltage": 0.0,
          "pv8Voltage": 0.0,
          "pv6Voltage": 0.0,
          "pv7Voltage": 0.0,
          "pv10Voltage": 0.0,
          "pv5Voltage": 0.0,
          "pv3Power": 0.0,
          "pv11Voltage": 0.0,
          "pv3Current": 0.0,
          "pv1Current": 0.0,
          "pv12Power": 0.0,
          "pv4Current": 0.0,
          "pv5Current": 0.0,
          "pv2Current": 0.0,
          "pv2Power": 0.0,
          "pv10Power": 0.0,
          "pv12Current": 0.0,
          "pv8Current": 0.0,
          "pv9Current": 0.0,
          "pv5Power": 0.0,
          "pv6Current": 0.0,
          "pv7Current": 0.0,
          "pv11Power": 0.0,
          "pv8Power": 0.0
        },
        "EPSL1Voltage": null,
        "EPSL1Current": null,
        "EPSL1ActivePower": null,
        "EPSL2Voltage": null,
        "EPSL2Current": null,
        "EPSL2ActivePower": null,
        "EPSL3Voltage": null,
        "EPSL3Current": null,
        "EPSL3ActivePower": null,
        "EPSL1ApparentPower": null,
        "EPSL2ApparentPower": null,
        "EPSL3ApparentPower": null,
        "l2l3Voltage": 0.0,
        "l1l2Voltage": 0.0,
        "l1l3Voltage": 0.0,
        "totalReactivePower": 0,
        "totalActivePower": 0,
        "MPPTTotalInputPower": null
      }
      // Add more sample data entries here if needed
    ]
  };

  // Export all formats
  SolarDataExporter.exportAllFormats(sampleData);
};
