import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, Zap } from 'lucide-react';
import { SolarDataExporter, exportSampleSolarData, SolarDataResponse } from '@/utils/solarDataExporter';
import { toast } from 'sonner';

/**
 * Demo component showing how to use the Solar Data Exporter
 */
const SolarDataExportDemo: React.FC = () => {
  // Sample data with multiple entries (your provided data)
  const sampleSolarData: SolarDataResponse = {
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
      },
      {
        "deviceStatus": 0,
        "gridPower": -18.96,
        "todayImportEnergy": null,
        "totalImportEnergy": 3653.00,
        "todayExportEnergy": null,
        "totalExportEnergy": 104.00,
        "gridPowerM2": null,
        "todayImportEnergyM2": null,
        "totalImportEnergyM2": null,
        "todayExportEnergyM2": null,
        "totalExportEnergyM2": null,
        "dataTime": "2025-08-20T06:04:27Z",
        "plantLocalTime": "2025-08-20 08:04:27",
        "deviceSn": "X3G060J6567025",
        "registerNo": "SNM3G7VNVS",
        "acCurrent1": 26.1,
        "acVoltage1": 228.7,
        "acCurrent2": 25.9,
        "acCurrent3": 26.2,
        "acVoltage2": 230.3,
        "acVoltage3": 230.2,
        "acPower1": 5,
        "acPower2": 5,
        "acPower3": 6,
        "gridFrequency": 49.89,
        "totalPowerFactor": 0.97,
        "inverterTemperature": 42.0,
        "dailyACOutput": 12.00,
        "totalACOutput": 1086.90,
        "dailyYield": 12.00,
        "totalYield": 1086.90,
        "mpptMap": {
          "mppt2Power": 3.0,
          "mppt2Voltage": 746.5,
          "mppt3Voltage": 767.3,
          "mppt1Voltage": 667.9,
          "mppt4Voltage": 753.2,
          "mppt5Voltage": 713.1,
          "mppt5Power": 3.1,
          "mppt6Voltage": 765.6,
          "mppt5Current": 4.4,
          "mppt6Current": 3.5,
          "mppt3Power": 3.1,
          "mppt3Current": 4.1,
          "mppt2Current": 4.1,
          "mppt4Current": 4.1,
          "mppt4Power": 3.0,
          "mppt6Power": 2.6,
          "mppt1Current": 3.8,
          "mppt1Power": 2.5
        },
        "pvMap": {
          "pv1Voltage": 667.9,
          "pv2Voltage": 667.9,
          "pv3Voltage": 746.5,
          "pv4Voltage": 746.5,
          "pv1Power": 2.5,
          "pv10Current": 0.0,
          "pv11Current": 3.3,
          "pv4Power": 0.0,
          "pv7Power": 3.0,
          "pv9Power": 3.1,
          "pv6Power": 0.0,
          "pv12Voltage": 765.6,
          "pv9Voltage": 713.1,
          "pv8Voltage": 753.2,
          "pv6Voltage": 767.3,
          "pv7Voltage": 753.2,
          "pv10Voltage": 713.1,
          "pv5Voltage": 767.3,
          "pv3Power": 3.0,
          "pv11Voltage": 765.6,
          "pv3Current": 4.1,
          "pv1Current": 3.8,
          "pv12Power": 0.1,
          "pv4Current": 0.0,
          "pv5Current": 4.1,
          "pv2Current": 0.0,
          "pv2Power": 0.0,
          "pv10Power": 0.0,
          "pv12Current": 0.2,
          "pv8Current": 0.0,
          "pv9Current": 4.4,
          "pv5Power": 3.1,
          "pv6Current": 0.0,
          "pv7Current": 4.1,
          "pv11Power": 2.5,
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
        "l2l3Voltage": 402.8,
        "l1l2Voltage": 399.6,
        "l1l3Voltage": 403.2,
        "totalReactivePower": -3,
        "totalActivePower": 17,
        "MPPTTotalInputPower": null
      }
    ]
  };

  const handleExport = (exportType: string) => {
    try {
      switch (exportType) {
        case 'basic':
          SolarDataExporter.exportBasicData(sampleSolarData);
          toast.success('Basic solar data exported successfully!');
          break;
        case 'mppt':
          SolarDataExporter.exportMPPTData(sampleSolarData);
          toast.success('MPPT data exported successfully!');
          break;
        case 'pv':
          SolarDataExporter.exportPVStringData(sampleSolarData);
          toast.success('PV string data exported successfully!');
          break;
        case 'energy':
          SolarDataExporter.exportEnergySummary(sampleSolarData);
          toast.success('Energy summary exported successfully!');
          break;
        case 'comprehensive':
          SolarDataExporter.exportComprehensiveData(sampleSolarData);
          toast.success('Comprehensive data exported successfully!');
          break;
        case 'all':
          SolarDataExporter.exportAllFormats(sampleSolarData);
          toast.success('All data formats exported successfully!');
          break;
        default:
          toast.error('Unknown export type');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Zap className="text-yellow-500" />
          Solar Data CSV Exporter
        </h1>
        <p className="text-muted-foreground">
          Export solar inverter monitoring data in various CSV formats
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Basic Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export main metrics: power, energy, voltage, current, and system status.
            </p>
            <Button 
              onClick={() => handleExport('basic')} 
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Basic Data
            </Button>
          </CardContent>
        </Card>

        {/* MPPT Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              MPPT Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export Maximum Power Point Tracking data for all 6 MPPT channels.
            </p>
            <Button 
              onClick={() => handleExport('mppt')} 
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export MPPT Data
            </Button>
          </CardContent>
        </Card>

        {/* PV String Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              PV String Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export photovoltaic string data for all 12 PV inputs.
            </p>
            <Button 
              onClick={() => handleExport('pv')} 
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PV Data
            </Button>
          </CardContent>
        </Card>

        {/* Energy Summary Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Energy Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export energy production summary with efficiency calculations.
            </p>
            <Button 
              onClick={() => handleExport('energy')} 
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
          </CardContent>
        </Card>

        {/* Comprehensive Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Comprehensive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all available data fields in a single comprehensive CSV.
            </p>
            <Button 
              onClick={() => handleExport('comprehensive')} 
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Fields
            </Button>
          </CardContent>
        </Card>

        {/* Export All Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              All Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all data formats simultaneously (5 CSV files).
            </p>
            <Button 
              onClick={() => handleExport('all')} 
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Formats
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Device:</strong> {sampleSolarData.result[0].deviceSn}</p>
            <p><strong>Data Points:</strong> {sampleSolarData.result.length} entries</p>
            <p><strong>Time Range:</strong> {sampleSolarData.result[0].plantLocalTime} to {sampleSolarData.result[sampleSolarData.result.length - 1].plantLocalTime}</p>
            <p><strong>Total Yield:</strong> {sampleSolarData.result[sampleSolarData.result.length - 1].totalYield} kWh</p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">How to Use:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click any export button to download the corresponding CSV file</li>
              <li>Files are automatically named with the current date</li>
              <li>Use different export types based on your analysis needs</li>
              <li>Import the CSV files into Excel, Google Sheets, or any data analysis tool</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold">Export Types:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Basic Data:</strong> Core power and energy metrics</li>
              <li><strong>MPPT Data:</strong> Maximum Power Point Tracking details</li>
              <li><strong>PV String Data:</strong> Individual photovoltaic string performance</li>
              <li><strong>Energy Summary:</strong> Production summary with efficiency</li>
              <li><strong>Comprehensive:</strong> All available data fields</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolarDataExportDemo;
