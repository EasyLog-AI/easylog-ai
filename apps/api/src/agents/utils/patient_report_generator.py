"""Patient Report Generator for MUMC Agent.

This module generates professional PDF reports for COPD patients containing:
- Profile information
- ZLM (Disease Burden) scores
- Goals and progress
- Activity (steps) data
- Medication information
"""

import io
from datetime import datetime
from typing import Any

import matplotlib
import matplotlib.pyplot as plt
import pytz
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Use non-interactive backend for matplotlib
matplotlib.use("Agg")


class PatientReportGenerator:
    """Generates PDF reports for COPD patients."""

    def __init__(self) -> None:
        """Initialize the PDF generator."""
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self) -> None:
        """Set up custom paragraph styles for the report."""
        # Title style
        self.title_style = ParagraphStyle(
            "CustomTitle",
            parent=self.styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#2E5984"),
            spaceAfter=30,
            alignment=1,  # Center
            fontName="Helvetica-Bold",
        )

        # Heading style
        self.heading_style = ParagraphStyle(
            "CustomHeading",
            parent=self.styles["Heading2"],
            fontSize=16,
            textColor=colors.HexColor("#2E5984"),
            spaceAfter=12,
            spaceBefore=20,
            fontName="Helvetica-Bold",
        )

        # Subheading style
        self.subheading_style = ParagraphStyle(
            "CustomSubHeading",
            parent=self.styles["Heading3"],
            fontSize=12,
            textColor=colors.HexColor("#4A6FA5"),
            spaceAfter=8,
            spaceBefore=10,
            fontName="Helvetica-Bold",
        )

        # Body style
        self.body_style = ParagraphStyle(
            "CustomBody",
            parent=self.styles["Normal"],
            fontSize=10,
            spaceAfter=6,
            leading=14,
        )

        # Info box style
        self.info_style = ParagraphStyle(
            "InfoStyle",
            parent=self.styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#666666"),
            spaceAfter=4,
        )

    def generate_report(self, report_data: dict[str, Any]) -> bytes:
        """Generate a PDF report from patient data.

        Args:
            report_data: Dictionary containing all patient data sections

        Returns:
            PDF file as bytes
        """
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        # Build the story (content)
        story = []

        # Cover page
        story.extend(self._create_cover(report_data))

        # Profile section
        if report_data.get("profile"):
            story.extend(self._create_profile_section(report_data["profile"]))

        # ZLM section
        if report_data.get("zlm_scores"):
            story.extend(self._create_zlm_section(report_data["zlm_scores"]))

        # Goals section
        if report_data.get("goals"):
            story.extend(self._create_goals_section(report_data["goals"]))

        # Steps section
        if report_data.get("steps_data"):
            story.extend(self._create_steps_section(report_data["steps_data"]))

        # Medication section
        if report_data.get("medications"):
            story.extend(self._create_medication_section(report_data["medications"]))

        # Build PDF
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)

        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    def _create_cover(self, report_data: dict[str, Any]) -> list:
        """Create cover page."""
        story = []

        # Title
        story.append(Spacer(1, 3 * cm))
        story.append(Paragraph("COPD Coach", self.title_style))
        story.append(Paragraph("Patiënt Verslag", self.title_style))

        story.append(Spacer(1, 2 * cm))

        # Patient info
        patient_name = report_data.get("patient_name", "Patiënt")
        period = report_data.get("period", "")
        generated_date = datetime.now(pytz.timezone("Europe/Amsterdam")).strftime("%d %B %Y")

        info_lines = [
            f"<b>Patiënt:</b> {patient_name}",
            f"<b>Periode:</b> {period}",
            f"<b>Gegenereerd op:</b> {generated_date}",
        ]

        for line in info_lines:
            story.append(Paragraph(line, self.body_style))

        story.append(Spacer(1, 1 * cm))

        return story

    def _create_profile_section(self, profile: dict[str, Any]) -> list:
        """Create profile information section."""
        story = []

        story.append(Paragraph("Profiel", self.heading_style))

        # Profile table
        data = []
        if profile.get("age"):
            data.append(["Leeftijd", str(profile["age"]) + " jaar"])
        if profile.get("gender"):
            data.append(["Geslacht", profile["gender"]])
        if profile.get("diagnosis"):
            data.append(["Diagnose", profile["diagnosis"]])
        if profile.get("comorbidities"):
            data.append(["Comorbiditeit", profile["comorbidities"]])

        if data:
            table = Table(data, colWidths=[5 * cm, 11 * cm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F0F0F0")),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                        ("ALIGN", (0, 0), (0, -1), "LEFT"),
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 0.5 * cm))

        return story

    def _create_zlm_section(self, zlm_scores: dict[str, Any]) -> list:
        """Create ZLM (Ziektelastmeter) section."""
        story = []

        story.append(Paragraph("Ziektelast (ZLM)", self.heading_style))

        # Introduction
        intro_text = (
            "De Ziektelastmeter (ZLM) meet de impact van COPD op verschillende levensdomeinen. "
            "Scores variëren van 0 (geen last) tot 6 (maximale last)."
        )
        story.append(Paragraph(intro_text, self.body_style))
        story.append(Spacer(1, 0.3 * cm))

        # Scores table
        scores = zlm_scores.get("scores", {})
        if scores:
            data = [["Domein", "Score", "Beoordeling"]]

            domain_labels = {
                "longklachten": "Long klachten",
                "longaanvallen": "Long aanvallen",
                "lichamelijke_beperkingen": "Lichamelijke beperkingen",
                "vermoeidheid": "Vermoeidheid",
                "nachtrust": "Nachtrust",
                "gevoelens_emoties": "Emoties",
                "seksualiteit": "Seksualiteit",
                "relaties_en_werk": "Relaties en werk",
                "medicijnen": "Medicijnen",
                "gewicht_bmi": "BMI",
                "bewegen": "Bewegen",
                "alcohol": "Alcohol",
                "roken": "Roken",
            }

            for key, score in scores.items():
                label = domain_labels.get(key, key.title())
                score_str = f"{score:.1f}"

                # Assessment based on score
                if score <= 2:
                    assessment = "Goed"
                elif score <= 4:
                    assessment = "Matig"
                else:
                    assessment = "Aandacht nodig"

                data.append([label, score_str, assessment])

            table = Table(data, colWidths=[7 * cm, 3 * cm, 6 * cm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E5984")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 11),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                        ("TOPPADDING", (0, 0), (-1, 0), 10),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                        ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ]
                )
            )
            story.append(table)

        # BMI if available
        if zlm_scores.get("bmi_value"):
            story.append(Spacer(1, 0.3 * cm))
            bmi_text = f"<b>BMI:</b> {zlm_scores['bmi_value']:.1f}"
            story.append(Paragraph(bmi_text, self.body_style))

        story.append(Spacer(1, 0.5 * cm))

        return story

    def _create_goals_section(self, goals: list[dict[str, Any]]) -> list:
        """Create goals section."""
        story = []

        story.append(Paragraph("Doelen", self.heading_style))

        if goals:
            data = [["#", "Doel", "Status"]]

            for idx, goal in enumerate(goals, 1):
                goal_text = goal.get("goal", "")
                status = goal.get("status", "In uitvoering")

                data.append([str(idx), goal_text, status])

            table = Table(data, colWidths=[1 * cm, 11 * cm, 4 * cm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E5984")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (0, -1), "CENTER"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 11),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                        ("TOPPADDING", (0, 0), (-1, 0), 10),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                        ("TOPPADDING", (0, 1), (-1, -1), 6),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(table)
        else:
            story.append(Paragraph("Nog geen doelen vastgesteld.", self.body_style))

        story.append(Spacer(1, 0.5 * cm))

        return story

    def _create_steps_section(self, steps_data: dict[str, Any]) -> list:
        """Create steps/activity section."""
        story = []

        story.append(Paragraph("Activiteit (Stappen)", self.heading_style))

        # Summary statistics
        avg_steps = steps_data.get("average_steps", 0)
        total_steps = steps_data.get("total_steps", 0)
        days_tracked = steps_data.get("days_tracked", 0)
        goal = steps_data.get("goal", 8000)

        summary_lines = [
            f"<b>Gemiddeld per dag:</b> {avg_steps:,} stappen",
            f"<b>Totaal in periode:</b> {total_steps:,} stappen",
            f"<b>Dagen gemeten:</b> {days_tracked}",
            f"<b>Doel:</b> {goal:,} stappen per dag",
        ]

        for line in summary_lines:
            story.append(Paragraph(line, self.body_style))

        story.append(Spacer(1, 0.3 * cm))

        # Progress assessment
        if avg_steps >= goal:
            assessment = "Uitstekend! U haalt uw doel."
            color_hex = "#28a745"
        elif avg_steps >= goal * 0.8:
            assessment = "Goed bezig! U komt dichtbij uw doel."
            color_hex = "#ffc107"
        else:
            assessment = "Blijf bewegen! Elke stap telt."
            color_hex = "#dc3545"

        assessment_style = ParagraphStyle(
            "Assessment",
            parent=self.body_style,
            textColor=colors.HexColor(color_hex),
            fontName="Helvetica-Bold",
        )
        story.append(Paragraph(assessment, assessment_style))

        story.append(Spacer(1, 0.5 * cm))

        # Add chart if daily data is available
        daily_data = steps_data.get("daily_data", [])
        if daily_data and len(daily_data) > 1:
            chart_image = self._generate_steps_chart(daily_data, goal)
            story.append(chart_image)
            story.append(Spacer(1, 0.3 * cm))

        return story

    def _generate_steps_chart(self, daily_data: list[dict[str, Any]], goal: int) -> Image:
        """Generate a line chart showing daily steps over time.

        Args:
            daily_data: List of dicts with 'date' (YYYY-MM-DD) and 'steps' keys
            goal: Daily steps goal

        Returns:
            ReportLab Image object containing the chart
        """
        # Extract dates and steps
        dates = [datetime.strptime(d["date"], "%Y-%m-%d") for d in daily_data]
        steps = [d["steps"] for d in daily_data]

        # Create figure with professional styling
        fig, ax = plt.subplots(figsize=(10, 5), dpi=100)
        fig.patch.set_facecolor("white")

        # Plot steps line
        ax.plot(
            dates,
            steps,
            linewidth=2.5,
            color="#4A90E2",  # Professional blue
            marker="o",
            markersize=6,
            markerfacecolor="#4A90E2",
            markeredgecolor="white",
            markeredgewidth=1.5,
            label="Dagelijkse stappen",
            zorder=3,
        )

        # Plot goal line
        ax.axhline(
            y=goal,
            color="#28A745",  # Green for goal
            linestyle="--",
            linewidth=2,
            label=f"Doel ({goal:,} stappen)",
            zorder=2,
        )

        # Styling
        ax.set_xlabel("Datum", fontsize=11, fontweight="bold", color="#2E5984")
        ax.set_ylabel("Aantal stappen", fontsize=11, fontweight="bold", color="#2E5984")
        ax.set_title(
            "Stappen per dag",
            fontsize=14,
            fontweight="bold",
            color="#2E5984",
            pad=15,
        )

        # Grid
        ax.grid(True, alpha=0.3, linestyle="-", linewidth=0.5, color="#CCCCCC", zorder=1)
        ax.set_axisbelow(True)

        # Format x-axis dates
        if len(dates) <= 7:
            # Week view: show all dates
            date_format = "%d %b"
        elif len(dates) <= 31:
            # Month view: show every few days
            ax.xaxis.set_major_locator(plt.MaxNLocator(7))
            date_format = "%d %b"
        else:
            # Longer period: show weeks
            ax.xaxis.set_major_locator(plt.MaxNLocator(8))
            date_format = "%d %b"

        ax.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter(date_format))
        plt.xticks(rotation=45, ha="right")

        # Y-axis formatting with thousands separator
        ax.yaxis.set_major_formatter(plt.matplotlib.ticker.FuncFormatter(
            lambda x, p: f"{int(x):,}"
        ))

        # Set y-axis limits with some padding
        max_steps = max(steps + [goal])
        ax.set_ylim(0, max_steps * 1.15)

        # Legend
        ax.legend(
            loc="upper left",
            framealpha=0.95,
            edgecolor="#CCCCCC",
            fontsize=10,
        )

        # Spine styling
        for spine in ax.spines.values():
            spine.set_color("#CCCCCC")
            spine.set_linewidth(1)

        # Tight layout
        plt.tight_layout()

        # Save to bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor="white")
        plt.close(fig)
        buf.seek(0)

        # Return as ReportLab Image
        return Image(buf, width=16 * cm, height=8 * cm)

    def _create_medication_section(self, medications: list[dict[str, Any]]) -> list:
        """Create medication section."""
        story = []

        story.append(Paragraph("Medicatie", self.heading_style))

        if medications:
            data = [["Medicijn", "Dosering", "Inname"]]

            for med in medications:
                name = med.get("name", "")
                dosage = med.get("dosage", "")
                timing = med.get("timing", "")

                data.append([name, dosage, timing])

            table = Table(data, colWidths=[6 * cm, 5 * cm, 5 * cm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E5984")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 11),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                        ("TOPPADDING", (0, 0), (-1, 0), 10),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                        ("TOPPADDING", (0, 1), (-1, -1), 6),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(table)
        else:
            story.append(Paragraph("Geen medicatie geregistreerd.", self.body_style))

        story.append(Spacer(1, 0.5 * cm))

        return story

    def _add_header_footer(self, canvas_obj: canvas.Canvas, doc: SimpleDocTemplate) -> None:
        """Add header and footer to each page."""
        canvas_obj.saveState()

        # Footer
        footer_text = "Gegenereerd door COPD Coach - Maastricht UMC+"
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.grey)
        canvas_obj.drawCentredString(A4[0] / 2, 1.5 * cm, footer_text)

        # Page number
        page_num = canvas_obj.getPageNumber()
        canvas_obj.drawCentredString(A4[0] / 2, 1 * cm, f"Pagina {page_num}")

        canvas_obj.restoreState()

