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
    PageBreak,
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
        # Title style - larger and bolder
        self.title_style = ParagraphStyle(
            "CustomTitle",
            parent=self.styles["Heading1"],
            fontSize=32,
            textColor=colors.HexColor("#1a4d80"),
            spaceAfter=12,
            alignment=1,  # Center
            fontName="Helvetica-Bold",
            leading=38,
        )

        # Subtitle style
        self.subtitle_style = ParagraphStyle(
            "CustomSubtitle",
            parent=self.styles["Heading2"],
            fontSize=18,
            textColor=colors.HexColor("#4A90E2"),
            spaceAfter=40,
            alignment=1,  # Center
            fontName="Helvetica-Bold",
        )

        # Heading style - modern blue
        self.heading_style = ParagraphStyle(
            "CustomHeading",
            parent=self.styles["Heading2"],
            fontSize=18,
            textColor=colors.HexColor("#1a4d80"),
            spaceAfter=16,
            spaceBefore=24,
            fontName="Helvetica-Bold",
            borderWidth=0,
            borderColor=colors.HexColor("#4A90E2"),
            borderPadding=6,
            leftIndent=0,
        )

        # Subheading style
        self.subheading_style = ParagraphStyle(
            "CustomSubHeading",
            parent=self.styles["Heading3"],
            fontSize=13,
            textColor=colors.HexColor("#4A90E2"),
            spaceAfter=10,
            spaceBefore=12,
            fontName="Helvetica-Bold",
        )

        # Body style - better readability
        self.body_style = ParagraphStyle(
            "CustomBody",
            parent=self.styles["Normal"],
            fontSize=11,
            spaceAfter=8,
            leading=16,
            textColor=colors.HexColor("#333333"),
        )

        # Info box style
        self.info_style = ParagraphStyle(
            "InfoStyle",
            parent=self.styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#666666"),
            spaceAfter=6,
            leading=14,
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
        story.append(PageBreak())  # Start nieuwe pagina na cover

        # Profile section
        if report_data.get("profile"):
            story.extend(self._create_profile_section(report_data["profile"]))

        # Medication section (op zelfde pagina als profiel)
        if report_data.get("medications"):
            story.extend(self._create_medication_section(report_data["medications"]))

        # ZLM section
        if report_data.get("zlm_scores"):
            story.append(PageBreak())  # Nieuwe pagina voor ZLM
            story.extend(self._create_zlm_section(report_data["zlm_scores"]))

        # Goals section
        if report_data.get("goals"):
            story.append(PageBreak())  # Nieuwe pagina voor Doelen
            story.extend(self._create_goals_section(report_data["goals"]))

        # Steps section (onderaan)
        if report_data.get("steps_data"):
            story.append(PageBreak())  # Nieuwe pagina voor Stappen
            story.extend(self._create_steps_section(report_data["steps_data"]))

        # Build PDF
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)

        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    def _create_cover(self, report_data: dict[str, Any]) -> list:
        """Create cover page with modern design."""
        story = []

        # Top spacing
        story.append(Spacer(1, 4 * cm))
        
        # Main title
        story.append(Paragraph("COPD Coach", self.title_style))
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph("Patiënt Verslag", self.subtitle_style))

        story.append(Spacer(1, 3 * cm))

        # Patient info in a nice box
        patient_name = report_data.get("patient_name", "Patiënt")
        period = report_data.get("period", "")
        generated_date = datetime.now(pytz.timezone("Europe/Amsterdam")).strftime("%d %B %Y")

        # Create info table with modern styling
        info_data = [
            ["Patiënt:", patient_name],
            ["Periode:", period],
            ["Gegenereerd:", generated_date],
        ]

        info_table = Table(info_data, colWidths=[5 * cm, 11 * cm])
        info_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1a4d80")),
                    ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#333333")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 12),
                    ("LEFTPADDING", (0, 0), (-1, -1), 20),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 20),
                    ("TOPPADDING", (0, 0), (-1, -1), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                    ("LINEABOVE", (0, 0), (-1, 0), 3, colors.HexColor("#4A90E2")),
                    ("LINEBELOW", (0, -1), (-1, -1), 3, colors.HexColor("#4A90E2")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(info_table)

        story.append(Spacer(1, 3 * cm))
        
        # Footer text
        footer_info = ParagraphStyle(
            "CoverFooter",
            parent=self.info_style,
            alignment=1,  # Center
            textColor=colors.HexColor("#666666"),
            fontSize=10,
        )
        story.append(Paragraph("Maastricht Universitair Medisch Centrum+", footer_info))
        story.append(Paragraph("Afdeling Longziekten", footer_info))

        return story

    def _create_profile_section(self, profile: dict[str, Any]) -> list:
        """Create profile information section with modern design."""
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
                        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f7ff")),
                        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1a4d80")),
                        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#333333")),
                        ("ALIGN", (0, 0), (0, -1), "LEFT"),
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                        ("FONTSIZE", (0, 0), (-1, -1), 11),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 10),
                        ("LEFTPADDING", (0, 0), (-1, -1), 15),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 15),
                        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e0e0e0")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 0.5 * cm))

        return story

    def _create_zlm_section(self, zlm_scores: dict[str, Any]) -> list:
        """Create ZLM (Ziektelastmeter) section with multiple measurements over time."""
        story = []

        story.append(Paragraph("Ziektelast (ZLM)", self.heading_style))

        # Introduction
        intro_text = (
            "De Ziektelastmeter (ZLM) meet de impact van COPD op verschillende levensdomeinen. "
            "Scores variëren van 0 (geen last) tot 6 (maximale last). De ballonkleur geeft de ernst aan."
        )
        story.append(Paragraph(intro_text, self.body_style))
        story.append(Spacer(1, 0.4 * cm))

        # Get measurements
        measurements = zlm_scores.get("measurements", [])
        
        if measurements:
            # Domain labels
            domain_labels = {
                "longklachten": "Long klachten",
                "long_klachten": "Long klachten",
                "longaanvallen": "Long aanvallen",
                "long_aanvallen": "Long aanvallen",
                "lichamelijke_beperkingen": "Lichamelijke beperkingen",
                "vermoeidheid": "Vermoeidheid",
                "nachtrust": "Nachtrust",
                "gevoelens_emoties": "Emoties",
                "emoties": "Emoties",
                "seksualiteit": "Seksualiteit",
                "relaties_en_werk": "Relaties en werk",
                "medicijnen": "Medicijnen",
                "gewicht_bmi": "BMI",
                "bewegen": "Bewegen",
                "alcohol": "Alcohol",
                "roken": "Roken",
            }
            
            # Get all unique domains from all measurements
            all_domains = set()
            for measurement in measurements:
                all_domains.update(measurement["scores"].keys())
            
            # Remove gewicht_bmi from domains (we'll add BMI separately)
            all_domains.discard("gewicht_bmi")
            all_domains.discard("bmi")
            
            # Build header row: Domein | Date1 | Date2 | ...
            header = ["Domein"]
            for measurement in measurements:
                header.append(measurement["date"])
            data = [header]
            
            # Add rows for each domain
            for domain_key in sorted(all_domains):
                label = domain_labels.get(domain_key, domain_key.title())
                row = [label]
                
                for measurement in measurements:
                    score = measurement["scores"].get(domain_key)
                    if score is not None:
                        # Create colored cell
                        score_text = f"{score:.1f}"
                        if score <= 2:
                            cell_text = f"🟢 {score_text}"
                        elif score <= 4:
                            cell_text = f"🟡 {score_text}"
                        else:
                            cell_text = f"🔴 {score_text}"
                        row.append(cell_text)
                    else:
                        row.append("-")
                
                data.append(row)
            
            # Add BMI row
            bmi_row = ["BMI"]
            for measurement in measurements:
                bmi_value = measurement.get("bmi_value")
                if bmi_value:
                    bmi_str = f"{bmi_value:.1f}"
                    if bmi_value < 18.5:
                        bmi_row.append(f"🟡 {bmi_str}")
                    elif 18.5 <= bmi_value < 25:
                        bmi_row.append(f"🟢 {bmi_str}")
                    elif 25 <= bmi_value < 30:
                        bmi_row.append(f"🟡 {bmi_str}")
                    else:
                        bmi_row.append(f"🔴 {bmi_str}")
                else:
                    bmi_row.append("-")
            data.append(bmi_row)
            
            # Calculate column widths dynamically
            num_measurements = len(measurements)
            if num_measurements == 1:
                col_widths = [8 * cm, 8 * cm]
            elif num_measurements == 2:
                col_widths = [7 * cm, 4.5 * cm, 4.5 * cm]
            else:
                # More than 2 measurements: distribute space
                date_col_width = 12 * cm / num_measurements
                col_widths = [4 * cm] + [date_col_width] * num_measurements
            
            table = Table(data, colWidths=col_widths)
            
            # Build style commands
            style_commands = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a4d80")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),  # Left align domain names
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),  # Center align scores
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),  # Bold domain names
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("TOPPADDING", (0, 0), (-1, 0), 12),
                ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e0e0e0")),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
            ]
            
            table.setStyle(TableStyle(style_commands))
            story.append(table)

        story.append(Spacer(1, 0.5 * cm))

        return story

    def _create_goals_section(self, goals: list[dict[str, Any]]) -> list:
        """Create goals section with modern design and text wrapping."""
        story = []

        story.append(Paragraph("Doelen", self.heading_style))

        if goals:
            # Use Paragraph objects for text wrapping
            data = [["#", "Doel", "Vastgesteld", "Status"]]

            # Style for goal text with wrapping
            goal_text_style = ParagraphStyle(
                "GoalText",
                parent=self.body_style,
                fontSize=10,
                leading=14,
                spaceAfter=0,
            )

            for idx, goal in enumerate(goals, 1):
                goal_text = goal.get("goal", "")
                status = goal.get("status", "In uitvoering")
                date = goal.get("date", "")

                # Wrap goal text in Paragraph for automatic wrapping
                goal_para = Paragraph(goal_text, goal_text_style)

                data.append([str(idx), goal_para, date, status])

            table = Table(data, colWidths=[1 * cm, 8 * cm, 3.5 * cm, 3.5 * cm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a4d80")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (0, -1), "CENTER"),
                        ("ALIGN", (2, 0), (2, -1), "CENTER"),  # Center date column
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 11),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                        ("TOPPADDING", (0, 0), (-1, 0), 12),
                        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e0e0e0")),
                        ("FONTSIZE", (0, 1), (0, -1), 10),  # Number column
                        ("FONTSIZE", (2, 1), (-1, -1), 9),  # Date and status columns
                        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                        ("TOPPADDING", (0, 1), (-1, -1), 8),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),  # Top align for better text flow
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
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

    def _create_medication_section(self, medications: dict[str, Any]) -> list:
        """Create medication section with updates over time."""
        story = []

        story.append(Paragraph("Medicatie", self.heading_style))

        # Get medication updates
        updates = medications.get("updates", [])
        
        if updates:
            # Show only the most recent update
            latest_update = updates[0]
            
            # Add date subtitle if available
            if latest_update.get("date"):
                date_text = f"Startdatum: {latest_update['date']}"
                story.append(Paragraph(date_text, self.subheading_style))
                story.append(Spacer(1, 0.2 * cm))
            
            data = [["Medicijn", "Dosering", "Aantal pufjes per dag"]]

            # Style for medication text with wrapping
            med_text_style = ParagraphStyle(
                "MedicationText",
                parent=self.body_style,
                fontSize=10,
                leading=14,
                spaceAfter=0,
            )

            for med in latest_update.get("medications", []):
                name = med.get("name", "")
                dosage = med.get("dosage", "")
                timing = med.get("timing", "")

                # Wrap medication in Paragraph for automatic wrapping
                name_para = Paragraph(name, med_text_style) if name else ""
                dosage_para = Paragraph(dosage, med_text_style) if dosage else ""
                timing_para = Paragraph(timing, med_text_style) if timing else ""

                data.append([name_para, dosage_para, timing_para])

            table = Table(data, colWidths=[6 * cm, 5 * cm, 5 * cm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a4d80")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 12),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                        ("TOPPADDING", (0, 0), (-1, 0), 12),
                        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e0e0e0")),
                        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                        ("TOPPADDING", (0, 1), (-1, -1), 8),
                        ("LEFTPADDING", (0, 0), (-1, -1), 12),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),  # Top align for better text flow
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
                    ]
                )
            )
            story.append(table)
            
            # Show history if there are multiple updates
            if len(updates) > 1:
                story.append(Spacer(1, 0.3 * cm))
                history_text = f"<i>Wijzigingshistorie: {len(updates)} update(s)</i>"
                story.append(Paragraph(history_text, self.info_style))
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

