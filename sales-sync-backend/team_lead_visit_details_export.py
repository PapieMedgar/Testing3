import os
import sys
import csv
import json
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple
from io import BytesIO

import mysql.connector
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment

# Ensure we can import sibling modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from db_config import DATABASE_CONFIG  # type: ignore

# Reuse helpful inference utilities and team lead mapping
from daily_visits_report import (  # type: ignore
    resolve_table_name,
    get_primary_key_column,
    infer_users_name_expr,
    infer_checkins_columns,
    get_columns_for_table,
    get_earliest_visit_date,
)
from team_lead_visits_report import TEAM_LEAD_TO_USERS, LEAD_ORDER  # type: ignore


def parse_date_opt(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    return datetime.strptime(date_str, "%Y-%m-%d").date()


def format_day_mon(d: date) -> str:
    # Example: 2-Sep
    return f"{d.day}-{d.strftime('%b')}"


def normalize_name_for_match(name: str) -> str:
    # Lower, strip, remove parenthetical suffixes, collapse whitespace
    import re

    s = name or ""
    s = re.sub(r"\([^)]*\)", "", s)  # remove ( ... )
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def build_user_to_lead_map(mapping: Dict[str, List[str]]) -> Dict[str, str]:
    user_to_lead: Dict[str, str] = {}
    for lead, users in mapping.items():
        for u in users:
            user_to_lead[normalize_name_for_match(u)] = lead
    return user_to_lead


def choose_responses_column(connection, table_name: str) -> str:
    # Prefer common names, fallback to the first TEXT/JSON-ish column
    columns = get_columns_for_table(connection, table_name)
    colnames = [c for c, _ in columns]
    candidates = [
        "responses",
        "response",
        "answers",
        "payload",
        "data",
        "form_response",
        "form_data",
        "json",
    ]
    for c in candidates:
        if c in colnames:
            return c
    # fallback: pick a column with json/text-ish data type
    for name, dtype in columns:
        dt = (dtype or "").lower()
        if dt in {"json", "text", "mediumtext", "longtext"}:
            return name
    # last resort
    return colnames[0]


def infer_visit_response_checkin_id_col(connection, vr_table: str, checkins_table: str) -> Optional[str]:
    """Try to find the foreign key in visit_response that references checkins."""
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT k.COLUMN_NAME
            FROM information_schema.key_column_usage k
            WHERE k.TABLE_SCHEMA = DATABASE()
              AND k.TABLE_NAME = %s
              AND k.REFERENCED_TABLE_NAME = %s
            ORDER BY k.ORDINAL_POSITION
            LIMIT 1
            """,
            (vr_table, checkins_table),
        )
        row = cursor.fetchone()
        if row and row[0]:
            return row[0]
        # Fallback heuristics
        columns = [c for c, _ in get_columns_for_table(connection, vr_table)]
        for name in columns:
            low = name.lower()
            if "checkin" in low and low.endswith("_id"):
                return name
            if low in {"checkin_id", "visit_id", "check_in_id"}:
                return name
        return None
    finally:
        cursor.close()


def ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def to_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, dict)):
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return str(value)
    return str(value)


def flatten_responses(obj: Any) -> Dict[str, str]:
    """Attempt to flatten arbitrary response payloads into key->value mapping.

    Handles common shapes:
    - {"question": "CustomerName", "answer": "John"}
    - {"name": "CustomerName", "value": "John"}
    - {"CustomerName": "John"}
    - [ .. any of the above .. ]
    """
    flat: Dict[str, str] = {}

    def _norm_key(k: str) -> str:
        return normalize_name_for_match(k)

    def _visit(node: Any):
        if node is None:
            return
        if isinstance(node, dict):
            keys_lower = {k.lower() for k in node.keys()}
            # Keyed entries like question/answer or name/value
            if {"question", "answer"}.issubset(keys_lower):
                q = to_str(node.get("question"))
                a = to_str(node.get("answer"))
                if q:
                    flat[_norm_key(q)] = a
                return
            if {"name", "value"}.issubset(keys_lower):
                q = to_str(node.get("name"))
                a = to_str(node.get("value"))
                if q:
                    flat[_norm_key(q)] = a
                return
            # Otherwise, descend entries
            for k, v in node.items():
                if isinstance(v, (dict, list)):
                    _visit(v)
                else:
                    flat[_norm_key(to_str(k))] = to_str(v)
            return
        if isinstance(node, list):
            for item in node:
                _visit(item)
            return
        # Primitives are ignored at top-level

    _visit(obj)
    return flat


def extract_fields_from_flat(flat: Dict[str, str]) -> Tuple[str, str]:
    """Return (goldrush_id, customer_full_name)."""
    # Goldrush/Golfish candidates
    gold_keys = [
        "goldrush id",
        "goldfish id",
        "goldrushid",
        "goldfishid",
        "goldrush number",
        "goldrush",
        "customer id",
        "id number",
        "id_number",
        "id",
    ]
    goldrush_id = ""
    for k in flat.keys():
        for probe in gold_keys:
            if probe in k:
                goldrush_id = flat.get(k, "").strip()
                if goldrush_id:
                    break
        if goldrush_id:
            break

    # Name fields
    first_keys = [
        "customername",
        "customer name",
        "first name",
        "firstname",
        "name",
    ]
    last_keys = [
        "customer surname",
        "surname",
        "last name",
        "lastname",
    ]

    first_name = ""
    last_name = ""
    full_name = ""

    for k in flat.keys():
        for probe in first_keys:
            if probe in k:
                first_name = flat.get(k, "").strip()
                if first_name:
                    break
        if first_name:
            break

    for k in flat.keys():
        for probe in last_keys:
            if probe in k:
                last_name = flat.get(k, "").strip()
                if last_name:
                    break
        if last_name:
            break

    if not (first_name and last_name):
        # Try single-field full name fallbacks
        full_keys = [
            "customer full name",
            "fullname",
            "full name",
            "client name",
            "customer",
        ]
        for k in flat.keys():
            for probe in full_keys:
                if probe in k:
                    full_name = flat.get(k, "").strip()
                    if full_name:
                        break
            if full_name:
                break

    cust_name = (f"{first_name} {last_name}" if first_name or last_name else full_name).strip()
    return goldrush_id, cust_name


def write_csv(rows: List[Dict[str, str]], output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Team Lead", "Date", "Goldrush ID", "Cust Name"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)


def write_xlsx(rows: List[Dict[str, str]], output_csv_path: str) -> str:
    wb = Workbook()
    ws = wb.active
    ws.title = "Visit Details"

    headers = ["Team Lead", "Date", "Goldrush ID", "Cust Name"]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    for r in rows:
        ws.append([r.get(h, "") for h in headers])

    for col in ws.columns:
        max_length = max(len(str(cell.value)) if cell.value is not None else 0 for cell in col)
        ws.column_dimensions[col[0].column_letter].width = max_length + 2

    xlsx_path = output_csv_path.replace(".csv", ".xlsx")
    wb.save(xlsx_path)
    return xlsx_path


def export_visit_details(start_date: Optional[date], end_date: Optional[date], output_dir: str) -> List[str]:
    connection = mysql.connector.connect(**DATABASE_CONFIG)
    try:
        users_table = resolve_table_name(connection, [os.getenv("SALESYNC_TABLE_USERS"), "users", "user"]) or "users"
        checkins_table = resolve_table_name(connection, [os.getenv("SALESYNC_TABLE_CHECKINS"), "checkins", "visits"]) or "checkins"
        vr_table_resolved = resolve_table_name(
            connection, [os.getenv("SALESYNC_TABLE_VISIT_RESPONSE"), "visit_response", "visit_responses"]
        )
        visit_response_table = vr_table_resolved or "visit_response"

        users_pk = os.getenv("SALESYNC_USERS_PK") or get_primary_key_column(connection, users_table) or "id"
        users_name_expr = infer_users_name_expr(connection, users_table)
        checkins_pk, checkins_user_id_col, checkins_time_col = infer_checkins_columns(connection, checkins_table, users_table)
        vr_checkin_id_col = os.getenv("SALESYNC_VISIT_RESPONSE_CHECKIN_ID_COLUMN")
        if not vr_checkin_id_col:
            vr_checkin_id_col = infer_visit_response_checkin_id_col(connection, visit_response_table, checkins_table) or "checkin_id"
        responses_col = choose_responses_column(connection, visit_response_table)

        if start_date is None:
            start_date = get_earliest_visit_date(connection, checkins_table, checkins_time_col)

        params: List[Any] = []
        where_clauses = ["1=1", f"vr.`{responses_col}` IS NOT NULL", f"vr.`{responses_col}` <> ''"]
        if start_date is not None:
            where_clauses.append(f"DATE(c.`{checkins_time_col}`) >= %s")
            params.append(start_date.isoformat())
        if end_date is not None:
            where_clauses.append(f"DATE(c.`{checkins_time_col}`) <= %s")
            params.append(end_date.isoformat())
        where_sql = " AND ".join(where_clauses)

        query = f"""
            SELECT
                {users_name_expr} AS user_name,
                DATE(c.`{checkins_time_col}`) AS visit_date,
                vr.`{responses_col}` AS responses
            FROM `{users_table}` u
            JOIN `{checkins_table}` c ON c.`{checkins_user_id_col}` = u.`{users_pk}`
            LEFT JOIN `{visit_response_table}` vr ON vr.`{vr_checkin_id_col}` = c.`{checkins_pk}`
            WHERE {where_sql}
            ORDER BY visit_date ASC
        """

        user_to_lead = build_user_to_lead_map(TEAM_LEAD_TO_USERS)
        per_lead_rows: Dict[str, List[Dict[str, str]]] = {lead: [] for lead in LEAD_ORDER}

        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params)
            for row in cursor:
                user_display_name = str(row.get("user_name") or "")
                normalized_user = normalize_name_for_match(user_display_name)
                team_lead = user_to_lead.get(normalized_user)
                if not team_lead:
                    # Not one of the requested team leads; skip
                    continue

                raw_date = row.get("visit_date")
                if isinstance(raw_date, datetime):
                    d = raw_date.date()
                elif isinstance(raw_date, date):
                    d = raw_date
                else:
                    try:
                        d = date.fromisoformat(str(raw_date))
                    except Exception:
                        continue

                responses_raw = row.get("responses")
                if isinstance(responses_raw, (bytes, bytearray)):
                    responses_text = responses_raw.decode("utf-8", errors="ignore")
                else:
                    responses_text = str(responses_raw) if responses_raw is not None else ""

                goldrush_id = ""
                cust_name = ""

                if responses_text:
                    try:
                        payload = json.loads(responses_text)
                        flat = flatten_responses(payload)
                        goldrush_id, cust_name = extract_fields_from_flat(flat)
                    except Exception:
                        # Not JSON or unexpected shape; leave blank
                        pass

                per_lead_rows[team_lead].append(
                    {
                        "Team Lead": team_lead,
                        "Date": format_day_mon(d),
                        "Goldrush ID": goldrush_id,
                        "Cust Name": cust_name,
                    }
                )
        finally:
            cursor.close()

        # Write outputs per team lead
        written_paths: List[str] = []
        for lead in LEAD_ORDER:
            rows = per_lead_rows.get(lead, [])
            # Keep rows in chronological order (already ordered by date)
            lead_slug = normalize_name_for_match(lead).replace(" ", "-")
            output_csv = os.path.join(output_dir, f"visit_details_{lead_slug}.csv")
            write_csv(rows, output_csv)
            xlsx_path = write_xlsx(rows, output_csv)
            written_paths.append(output_csv)
            written_paths.append(xlsx_path)

        return written_paths
    finally:
        connection.close()


def generate_xlsx_bytes(start_date=None, end_date=None):
    """Generate the team lead visit details Excel file as bytes for API download."""
    # Parse dates
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            start_date_obj = None
    else:
        start_date_obj = None
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception:
            end_date_obj = None
    else:
        end_date_obj = None
    # Use a temp output path
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        paths = export_visit_details(start_date_obj, end_date_obj, tmpdir)
        # Find the xlsx file
        xlsx_path = next((p for p in paths if p.endswith(".xlsx")), None)
        if not xlsx_path:
            raise RuntimeError("No XLSX file generated")
        with open(xlsx_path, "rb") as f:
            return f.read()


def generate_csv_bytes(start_date=None, end_date=None):
    """
    Generate the team lead visit details CSV as bytes for API download (in-memory, no file I/O).
    """
    import tempfile
    from io import BytesIO, StringIO
    # Parse dates
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            start_date_obj = None
    else:
        start_date_obj = None
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception:
            end_date_obj = None
    else:
        end_date_obj = None
    # Use a temp output path to get the rows for all leads
    with tempfile.TemporaryDirectory() as tmpdir:
        paths = export_visit_details(start_date_obj, end_date_obj, tmpdir)
        # Find the CSV file (for all leads, concatenate)
        csv_paths = [p for p in paths if p.endswith(".csv")]
        # Read and concatenate all CSVs (skip header after first)
        output = StringIO()
        first = True
        for path in csv_paths:
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                if first:
                    output.writelines(lines)
                    first = False
                else:
                    output.writelines(lines[1:])  # skip header
        return output.getvalue().encode("utf-8")


def main():
    # Usage: python Scripts/team_lead_visit_details_export.py [start_date] [end_date] [output_dir]
    start_date = parse_date_opt(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] else None
    end_date = parse_date_opt(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else None
    output_dir = sys.argv[3] if len(sys.argv) > 3 else os.path.join("reports", "visit_details")

    paths = export_visit_details(start_date, end_date, output_dir)
    print("\nWrote files:\n" + "\n".join(paths))


if __name__ == "__main__":
    main()