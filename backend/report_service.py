import io
import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class ReportService:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = workspace_dir

    def generate_pdf_report(
        self,
        analysis_data: Dict[str, Any],
        original_image_bytes: Optional[bytes] = None,
        gradcam_image_bytes: Optional[bytes] = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom futuristic dark/cyan styling
        primary_violet = colors.HexColor("#7C3AED")
        accent_cyan = colors.HexColor("#06B6D4")
        dark_navy = colors.HexColor("#0B1120")
        card_bg = colors.HexColor("#1E293B")
        text_dark = colors.HexColor("#0F172A")
        text_muted = colors.HexColor("#64748B")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=primary_violet,
            fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=accent_cyan,
            fontName="Helvetica-Bold"
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1E293B"),
            fontName="Helvetica-Bold",
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=text_dark
        )
        caption_style = ParagraphStyle(
            "Caption",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=text_muted,
            alignment=1 # Centered
        )
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#DC2626"),
            alignment=1
        )

        elements = []

        # 1. Header Banner
        header_table = Table(
            [
                [
                    Paragraph("<b>BIOLENS AI</b>", title_style),
                    Paragraph(
                        f"<b>REPORT ID:</b> BIO-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}<br/>"
                        f"<b>DATE:</b> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                        ParagraphStyle("MetaRight", parent=styles["Normal"], fontSize=8, leading=11, alignment=2, textColor=text_muted)
                    )
                ],
                [
                    Paragraph("COLORECTAL TISSUE INTELLIGENCE PLATFORM &bull; EXPLAINABLE AI WORKSTATION", subtitle_style),
                    ""
                ]
            ],
            colWidths=[4.2 * inch, 3.0 * inch]
        )
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 10))

        # Thin cyan divider rule
        divider = Table([[""]], colWidths=[7.2 * inch], rowHeights=[2])
        divider.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), accent_cyan)]))
        elements.append(divider)
        elements.append(Spacer(1, 12))

        # 2. Specimen & Prediction Summary
        pred_class = analysis_data.get("predicted_class", "UNKNOWN")
        confidence = analysis_data.get("confidence_percentage", 0.0)
        gt_class = analysis_data.get("ground_truth")
        filename = analysis_data.get("filename", "Specimen_Histology_Tile.tif")
        dimensions = analysis_data.get("input_dimensions", [150, 150])

        summary_rows = [
            [
                Paragraph("<b>Histology Tile Filename:</b>", body_style),
                Paragraph(str(filename), body_style),
                Paragraph("<b>Predicted Tissue Class:</b>", body_style),
                Paragraph(f"<font color='#7C3AED'><b>{pred_class}</b></font>", body_style)
            ],
            [
                Paragraph("<b>Input Tile Dimensions:</b>", body_style),
                Paragraph(f"{dimensions[0]} &times; {dimensions[1]} px", body_style),
                Paragraph("<b>Model Confidence:</b>", body_style),
                Paragraph(f"<b>{confidence:.2f}%</b>", body_style)
            ],
            [
                Paragraph("<b>Ground Truth Label:</b>", body_style),
                Paragraph(f"<b>{gt_class or 'Not Annotated'}</b>", body_style),
                Paragraph("<b>Verification Status:</b>", body_style),
                Paragraph(
                    "<font color='#059669'><b>MATCHED</b></font>" if gt_class and gt_class == pred_class
                    else ("<font color='#D97706'><b>MISMATCH</b></font>" if gt_class else "Unverified"),
                    body_style
                )
            ]
        ]
        summary_table = Table(summary_rows, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 14))

        # 3. Dual Visualizations: Original Histology & Grad-CAM Attention Map
        img_cells = []
        if original_image_bytes:
            orig_img_io = io.BytesIO(original_image_bytes)
            rl_orig = RLImage(orig_img_io, width=2.6 * inch, height=2.6 * inch)
            img_cells.append([
                rl_orig,
                Paragraph("<b>Original Histology Tile</b><br/>H&E Colorectal Biopsy", caption_style)
            ])
        else:
            img_cells.append([Paragraph("Original Image Unavailable", body_style), ""])

        if gradcam_image_bytes:
            grad_img_io = io.BytesIO(gradcam_image_bytes)
            rl_grad = RLImage(grad_img_io, width=2.6 * inch, height=2.6 * inch)
            img_cells.append([
                rl_grad,
                Paragraph("<b>Grad-CAM Saliency Overlay</b><br/>Last Conv2D Activation Map", caption_style)
            ])
        else:
            img_cells.append([Paragraph("Grad-CAM Overlay Unavailable", body_style), ""])

        vis_table = Table(
            [
                [img_cells[0][0], img_cells[1][0]],
                [img_cells[0][1], img_cells[1][1]]
            ],
            colWidths=[3.6 * inch, 3.6 * inch]
        )
        vis_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
            ("TOPPADDING", (0, 1), (-1, 1), 2),
        ]))
        elements.append(vis_table)
        elements.append(Spacer(1, 14))

        # 4. Probabilities Breakdown
        elements.append(Paragraph("<b>Class Probability Distribution (Kather 8-Class Model)</b>", section_style))
        probs = analysis_data.get("probabilities_sorted", [])
        prob_header = [
            Paragraph("<b>Rank</b>", body_style),
            Paragraph("<b>Tissue Class</b>", body_style),
            Paragraph("<b>Probability</b>", body_style),
            Paragraph("<b>Score Distribution</b>", body_style)
        ]
        prob_rows = [prob_header]
        for idx, item in enumerate(probs[:8], 1):
            p = item.get("probability", 0.0)
            bar_len = int(p * 25)
            bar_str = "&block;" * bar_len
            prob_rows.append([
                Paragraph(f"#{idx}", body_style),
                Paragraph(f"<b>{item.get('class_name', '')}</b>", body_style),
                Paragraph(f"{p * 100:.2f}%", body_style),
                Paragraph(f"<font color='#06B6D4'>{bar_str}</font>", body_style)
            ])

        prob_table = Table(prob_rows, colWidths=[0.8 * inch, 2.5 * inch, 1.4 * inch, 2.5 * inch])
        prob_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(prob_table)
        elements.append(Spacer(1, 14))

        # 5. Scientific Explainability & Clinical Context
        elements.append(Paragraph("<b>Explainable AI (XAI) Scientific Analysis</b>", section_style))
        explanation = analysis_data.get("explanation_summary", {})
        morphology = explanation.get("clinical_morphology", "Gradient activations reflect histological pattern features.")
        saliency = explanation.get("saliency_metrics", "Visual attention localized on salient cellular structures.")

        xai_p = Paragraph(
            f"<b>Histomorphological Findings:</b> {morphology}<br/><br/>"
            f"<b>Feature Attention Metrics:</b> {saliency}",
            body_style
        )
        xai_box = Table([[xai_p]], colWidths=[7.2 * inch])
        xai_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, primary_violet),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(xai_box)
        elements.append(Spacer(1, 14))

        # 6. Disclaimer
        disclaimer_text = (
            "<b>RESEARCH & EDUCATIONAL USE ONLY:</b> BioLens AI is an artificial intelligence research platform. "
            "Model predictions, Grad-CAM attention visualizations, and automated metrics are experimental decision-support features "
            "and do NOT constitute diagnostic clinical evaluations or medical advice. Histopathological diagnoses must be performed "
            "by certified pathologists evaluating comprehensive whole slide imaging (WSI) and patient clinical records."
        )
        elements.append(Paragraph(disclaimer_text, disclaimer_style))

        doc.build(elements)
        return buffer.getvalue()
