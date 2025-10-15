from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import os
import glob
from datetime import datetime
from io import BytesIO
import sys

# Ensure parent directory (sales-sync-backend) is in sys.path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
from daily_visits_report import generate_xlsx_bytes as generate_daily_visits_xlsx
from team_lead_visit_details_export import generate_xlsx_bytes as generate_team_lead_details_xlsx
from team_lead_visits_report import generate_xlsx_bytes as generate_team_lead_visits_xlsx

app = Flask(__name__)
CORS(app)

# Base directory for reports (local to sales-sync-backend)
REPORTS_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), 'reports'))

REPORT_TYPES = {
    'visit_details': 'visit_details',
    'team_lead_visit_report': 'team_lead_visit_report',
    'team_lead_visits_details_export': 'team-lead_visits_details_export',
}

def get_latest_file(report_type):
    folder = os.path.join(REPORTS_BASE, REPORT_TYPES[report_type])
    files = glob.glob(os.path.join(folder, '*.csv')) + glob.glob(os.path.join(folder, '*.xlsx'))
    if not files:
        return None
    latest = max(files, key=os.path.getmtime)
    return latest

def get_all_files(report_type):
    folder = os.path.join(REPORTS_BASE, REPORT_TYPES[report_type])
    files = glob.glob(os.path.join(folder, '*.csv')) + glob.glob(os.path.join(folder, '*.xlsx'))
    files = sorted(files, key=os.path.getmtime, reverse=True)
    return files

@app.route('/api/reports/latest', methods=['GET'])
def list_latest_reports():
    result = {}
    for key in REPORT_TYPES:
        latest = get_latest_file(key)
        if latest:
            result[key] = {
                'filename': os.path.basename(latest),
                'download_url': f"/api/reports/download/{key}"
            }
        else:
            result[key] = None
    return jsonify(result)

@app.route('/api/reports/all', methods=['GET'])
def list_all_reports():
    result = {}
    for key in REPORT_TYPES:
        files = get_all_files(key)
        xlsx_files = [f for f in files if f.endswith('.xlsx')]
        # Enhanced filter and date extraction for team_lead_visits_details_export and team_lead_visit_report
        if key in ['team_lead_visits_details_export', 'team_lead_visit_report']:
            visit_dates = []
            for f in xlsx_files:
                fname = os.path.basename(f)
                # Accept both daily_visits_YYYY-MM-DD.xlsx and team_lead_daily_visits_YYYY-MM-DD.xlsx
                if fname.startswith('daily_visits_') and fname.endswith('.xlsx'):
                    try:
                        date_str = fname[len('daily_visits_'):-len('.xlsx')]
                        visit_dates.append(datetime.strptime(date_str, '%Y-%m-%d'))
                    except Exception:
                        pass
                elif fname.startswith('team_lead_daily_visits_') and fname.endswith('.xlsx'):
                    try:
                        date_str = fname[len('team_lead_daily_visits_'):-len('.xlsx')]
                        visit_dates.append(datetime.strptime(date_str, '%Y-%m-%d'))
                    except Exception:
                        pass
            if visit_dates:
                start_date = min(visit_dates).strftime('%Y-%m-%d')
                end_date = max(visit_dates).strftime('%Y-%m-%d')
            else:
                start_date = end_date = None
        # If no xlsx files, provide a direct download link to the streaming endpoint
        if not xlsx_files:
            if key == 'visit_details':
                download_url = '/api/reports/daily_visits_xlsx'
                filename = 'daily_visits.xlsx'
            elif key == 'team_lead_visit_report':
                download_url = '/api/reports/team_lead_visits_xlsx'
                filename = 'team_lead_visits.xlsx'
            elif key == 'team_lead_visits_details_export':
                download_url = '/api/reports/team_lead_visit_details_xlsx'
                filename = 'team_lead_visit_details.xlsx'
            result[key] = {
                'files': [
                    {
                        'filename': filename,
                        'download_url': download_url
                    }
                ]
            }
            if key in ['team_lead_visits_details_export', 'team_lead_visit_report']:
                result[key]['start_date'] = start_date
                result[key]['end_date'] = end_date
            continue
        result[key] = {
            'files': [
                {
                    'filename': os.path.basename(f),
                    'download_url': f"/api/reports/download/{key}?file={os.path.basename(f)}"
                }
                for f in xlsx_files
            ]
        }
        if key in ['team_lead_visits_details_export', 'team_lead_visit_report']:
            result[key]['start_date'] = start_date
            result[key]['end_date'] = end_date
    return jsonify(result)

@app.route('/api/reports/download/<report_type>', methods=['GET'])
def download_report(report_type):
    if report_type not in REPORT_TYPES:
        return jsonify({'error': 'Invalid report type'}), 400
    file_param = request.args.get('file')
    if file_param:
        folder = os.path.join(REPORTS_BASE, REPORT_TYPES[report_type])
        file_path = os.path.join(folder, file_param)
        if not os.path.isfile(file_path):
            return jsonify({'error': 'File not found'}), 404
        return send_file(file_path, as_attachment=True)
    # fallback to latest
    latest = get_latest_file(report_type)
    if not latest:
        return jsonify({'error': 'No report found'}), 404
    return send_file(latest, as_attachment=True)

@app.route('/api/reports/daily_visits_xlsx', methods=['GET'])
def get_daily_visits_xlsx():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    try:
        xlsx_bytes = generate_daily_visits_xlsx(start_date, end_date)
        return send_file(
            BytesIO(xlsx_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='daily_visits.xlsx'
        )
    except Exception as e:
        import traceback
        print('Error generating daily visits xlsx:', e)
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate report', 'details': str(e)}), 500

@app.route('/api/reports/team_lead_visit_details_xlsx', methods=['GET'])
def get_team_lead_visit_details_xlsx():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    xlsx_bytes = generate_team_lead_details_xlsx(start_date, end_date)
    return send_file(
        BytesIO(xlsx_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='team_lead_visit_details.xlsx'
    )

@app.route('/api/reports/team_lead_visits_xlsx', methods=['GET'])
def get_team_lead_visits_xlsx():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    xlsx_bytes = generate_team_lead_visits_xlsx(start_date, end_date)
    return send_file(
        BytesIO(xlsx_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='team_lead_visits.xlsx'
    )

@app.route('/api/reports/team_lead_visit_details_xlsx/<lead_slug>', methods=['GET'])
def get_team_lead_visit_details_lead_xlsx(lead_slug):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    # Generate all team lead files in memory
    from team_lead_visit_details_export import LEAD_ORDER, normalize_name_for_match, generate_xlsx_bytes, export_visit_details
    # Use export_visit_details to generate files for all leads
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        export_visit_details(start_date, end_date, tmpdir)
        # Find the file for the requested lead
        for lead in LEAD_ORDER:
            slug = normalize_name_for_match(lead).replace(' ', '-')
            if slug == lead_slug:
                xlsx_path = os.path.join(tmpdir, f"visit_details_{slug}.xlsx")
                if os.path.exists(xlsx_path):
                    return send_file(
                        xlsx_path,
                        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True,
                        download_name=f"visit_details_{slug}.xlsx"
                    )
        return jsonify({'error': 'Team lead file not found'}), 404

# --- CSV download endpoints ---
@app.route('/api/reports/daily_visits_csv', methods=['GET'])
def get_daily_visits_csv():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    from daily_visits_report import generate_csv_bytes as generate_daily_visits_csv
    csv_bytes = generate_daily_visits_csv(start_date, end_date)
    return send_file(
        BytesIO(csv_bytes),
        mimetype='text/csv',
        as_attachment=True,
        download_name='daily_visits.csv'
    )

@app.route('/api/reports/team_lead_visit_details_csv', methods=['GET'])
def get_team_lead_visit_details_csv():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    from team_lead_visit_details_export import generate_csv_bytes as generate_team_lead_details_csv
    csv_bytes = generate_team_lead_details_csv(start_date, end_date)
    return send_file(
        BytesIO(csv_bytes),
        mimetype='text/csv',
        as_attachment=True,
        download_name='team_lead_visit_details.csv'
    )

@app.route('/api/reports/team_lead_visits_csv', methods=['GET'])
def get_team_lead_visits_csv():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    from team_lead_visits_report import generate_csv_bytes as generate_team_lead_visits_csv
    csv_bytes = generate_team_lead_visits_csv(start_date, end_date)
    return send_file(
        BytesIO(csv_bytes),
        mimetype='text/csv',
        as_attachment=True,
        download_name='team_lead_visits.csv'
    )

if __name__ == '__main__':
    app.run(port=5050, debug=True)
