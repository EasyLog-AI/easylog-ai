"""Patient Reports API endpoints.

Serves generated PDF reports for MUMC patients.
"""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/patient-reports", tags=["Patient Reports"])


@router.get("/{filename}")
async def get_patient_report(filename: str) -> FileResponse:
    """Serve a patient report PDF file.

    Args:
        filename: The PDF filename to serve

    Returns:
        FileResponse with the PDF file

    Raises:
        HTTPException: If file not found or invalid filename
    """
    # Security: Only allow PDF files and prevent path traversal
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    if ".." in filename or "/" in filename:
        raise HTTPException(
            status_code=400, detail="Invalid filename"
        )

    # Check file exists
    reports_dir = Path("/tmp/patient_reports")
    file_path = reports_dir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    # Check file is actually in the reports directory (no symlink attacks)
    try:
        file_path.resolve().relative_to(reports_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf",
        headers={"X-Content-Type-Options": "nosniff"},
    )

