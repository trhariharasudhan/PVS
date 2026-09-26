import io
from decimal import Decimal
from typing import Any
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from app.core.config import settings


def generate_invoice_pdf(invoice_data: dict[str, Any]) -> bytes:
    """
    Generates a production-grade, print-ready PDF Tax Invoice for PVS Silk S
    using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#4A0E17")   # PVS Silk Burgundy
    gold_color = colors.HexColor("#B8860B")      # PVS Silk Gold
    charcoal_dark = colors.HexColor("#1A1A1A")
    charcoal_light = colors.HexColor("#4A4A4A")
    bg_ivory = colors.HexColor("#FAF7F2")

    title_style = ParagraphStyle(
        "PVSTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )
    subtitle_style = ParagraphStyle(
        "PVSSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=charcoal_light,
    )
    badge_style = ParagraphStyle(
        "PVSBadge",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=gold_color,
        alignment=TA_RIGHT,
    )
    meta_label_style = ParagraphStyle(
        "PVSMetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=charcoal_dark,
    )
    meta_value_style = ParagraphStyle(
        "PVSMetaValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=charcoal_light,
    )
    table_hdr_style = ParagraphStyle(
        "PVSTableHdr",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=TA_CENTER,
    )
    table_cell_style = ParagraphStyle(
        "PVSTableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=charcoal_dark,
    )
    table_cell_right = ParagraphStyle(
        "PVSTableCellRight",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=charcoal_dark,
        alignment=TA_RIGHT,
    )
    table_cell_right_bold = ParagraphStyle(
        "PVSTableCellRightBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=primary_color,
        alignment=TA_RIGHT,
    )

    # 1. Header (Company Info & Invoice Badge)
    header_data = [
        [
            Paragraph(
                f"<b>{settings.BUSINESS_NAME.upper()}</b><br/>"
                f"<font size=7 color='#777777'>{settings.BUSINESS_TAGLINE.upper()} — SILK SAREE MANUFACTURERS</font><br/>"
                f"{settings.full_business_address}<br/>"
                f"GSTIN: {settings.BUSINESS_GSTIN} | Phone: {settings.BUSINESS_PHONE}<br/>"
                f"Email: {settings.BUSINESS_BILLING_EMAIL} | Web: {settings.BUSINESS_WEBSITE.replace('https://', '')}",
                subtitle_style,
            ),
            Paragraph(
                f"<b>{invoice_data.get('invoice_type', 'TAX INVOICE').replace('_', ' ')}</b><br/>"
                f"<font size=8 color='#1A1A1A'><b>Invoice #:</b> {invoice_data.get('invoice_number', 'N/A')}</font><br/>"
                f"<font size=8 color='#555555'><b>Date:</b> {invoice_data.get('invoice_date', '')}</font><br/>"
                f"<font size=8 color='#555555'><b>Due Date:</b> {invoice_data.get('due_date', '')}</font><br/>"
                f"<font size=8 color='#555555'><b>Status:</b> {invoice_data.get('status', 'ISSUED')}</font>",
                badge_style,
            ),
        ]
    ]
    header_table = Table(header_data, colWidths=[320, 200])
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ])
    )
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=gold_color, spaceBefore=4, spaceAfter=8))

    # 2. Bill To / Party Details & Place of Supply
    customer_name = invoice_data.get("customer_name") or invoice_data.get("party_name") or "Retail Client"
    customer_gstin = invoice_data.get("customer_gstin") or "Unregistered / Consumer"
    customer_phone = invoice_data.get("customer_phone") or "N/A"
    customer_address = invoice_data.get("customer_address") or "Tamil Nadu, India"
    place_of_supply = invoice_data.get("place_of_supply") or "Tamil Nadu (33)"

    bill_to_data = [
        [
            Paragraph("<b>BILLED TO / BUYER DETAILS:</b>", meta_label_style),
            Paragraph("<b>SUPPLY & DISPATCH DETAILS:</b>", meta_label_style),
        ],
        [
            Paragraph(
                f"<b>{customer_name}</b><br/>"
                f"Address: {customer_address}<br/>"
                f"Phone: {customer_phone}<br/>"
                f"GSTIN / Tax ID: <b>{customer_gstin}</b>",
                meta_value_style,
            ),
            Paragraph(
                f"Place of Supply: <b>{place_of_supply}</b><br/>"
                f"Associated Order: {invoice_data.get('order_number') or 'Direct Wholesale'}<br/>"
                f"Payment Mode: Bank Wire / RTGS / UPI<br/>"
                f"Reverse Charge Applicable: No",
                meta_value_style,
            ),
        ],
    ]
    bill_table = Table(bill_to_data, colWidths=[260, 260])
    bill_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg_ivory),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5DCCB")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5DCCB")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(bill_table)
    story.append(Spacer(1, 12))

    # 3. Line Items Table
    items_header = [
        Paragraph("#", table_hdr_style),
        Paragraph("Item Description", table_hdr_style),
        Paragraph("HSN/SAC", table_hdr_style),
        Paragraph("Qty", table_hdr_style),
        Paragraph("Rate (₹)", table_hdr_style),
        Paragraph("Taxable (₹)", table_hdr_style),
        Paragraph("GST", table_hdr_style),
        Paragraph("Total (₹)", table_hdr_style),
    ]
    items_rows = [items_header]

    items = invoice_data.get("items", [])
    for idx, it in enumerate(items, 1):
        qty = float(it.get("quantity", 1))
        uom = it.get("unit_of_measure", "PCS")
        rate = float(it.get("unit_price", 0))
        taxable = float(it.get("taxable_amount", 0))
        gst_rate = float(it.get("gst_rate", 5))
        tot = float(it.get("total_amount", 0))

        items_rows.append([
            Paragraph(str(idx), table_cell_style),
            Paragraph(it.get("item_description", "Silk Saree Item"), table_cell_style),
            Paragraph(str(it.get("hsn_sac_code", "5007")), table_cell_style),
            Paragraph(f"{qty:g} {uom}", table_cell_right),
            Paragraph(f"₹{rate:,.2f}", table_cell_right),
            Paragraph(f"₹{taxable:,.2f}", table_cell_right),
            Paragraph(f"{gst_rate:.1f}%", table_cell_style),
            Paragraph(f"₹{tot:,.2f}", table_cell_right),
        ])

    items_table = Table(items_rows, colWidths=[20, 160, 50, 45, 60, 65, 40, 80])
    items_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(items_table)
    story.append(Spacer(1, 8))

    # 4. Totals & Tax Summary
    subtotal = float(invoice_data.get("subtotal_amount", 0))
    cgst = float(invoice_data.get("cgst_amount", 0))
    sgst = float(invoice_data.get("sgst_amount", 0))
    igst = float(invoice_data.get("igst_amount", 0))
    total_tax = float(invoice_data.get("total_tax_amount", 0))
    total_amount = float(invoice_data.get("total_amount", 0))
    paid_amount = float(invoice_data.get("paid_amount", 0))
    balance_due = float(invoice_data.get("balance_due", 0))

    totals_data = [
        [
            Paragraph("<b>Bank NEFT/RTGS Transfer Details:</b><br/>"
                      f"Bank Name: <b>{settings.BANK_NAME}</b><br/>"
                      f"Account Name: <b>{settings.BANK_ACCOUNT_NAME}</b><br/>"
                      f"Account Number: <b>{settings.BANK_ACCOUNT_NUMBER}</b><br/>"
                      f"IFSC Code: <b>{settings.BANK_IFSC}</b> ({settings.BANK_BRANCH})<br/>"
                      f"UPI ID: <b>{settings.BANK_UPI_ID}</b>", meta_value_style),
            Paragraph("Subtotal Taxable Amount:", meta_value_style),
            Paragraph(f"₹{subtotal:,.2f}", table_cell_right),
        ],
        [
            "",
            Paragraph(f"CGST ({invoice_data.get('cgst_rate', 2.5)}%):", meta_value_style),
            Paragraph(f"₹{cgst:,.2f}", table_cell_right),
        ],
        [
            "",
            Paragraph(f"SGST ({invoice_data.get('sgst_rate', 2.5)}%):", meta_value_style),
            Paragraph(f"₹{sgst:,.2f}", table_cell_right),
        ],
    ]

    if igst > 0:
        totals_data.append([
            "",
            Paragraph(f"IGST ({invoice_data.get('igst_rate', 5.0)}%):", meta_value_style),
            Paragraph(f"₹{igst:,.2f}", table_cell_right),
        ])

    totals_data.extend([
        [
            "",
            Paragraph("<b>Total Tax Collected:</b>", meta_label_style),
            Paragraph(f"<b>₹{total_tax:,.2f}</b>", table_cell_right_bold),
        ],
        [
            "",
            Paragraph("<b>TOTAL INVOICE VALUE:</b>", meta_label_style),
            Paragraph(f"<b>₹{total_amount:,.2f}</b>", table_cell_right_bold),
        ],
        [
            "",
            Paragraph("Amount Paid / Received:", meta_value_style),
            Paragraph(f"₹{paid_amount:,.2f}", table_cell_right),
        ],
        [
            "",
            Paragraph("<b>BALANCE DUE:</b>", meta_label_style),
            Paragraph(f"<b>₹{balance_due:,.2f}</b>", table_cell_right_bold),
        ],
    ])

    totals_table = Table(totals_data, colWidths=[240, 160, 120])
    totals_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("SPAN", (0, 0), (0, len(totals_data) - 1)),  # Span bank info on left
            ("BACKGROUND", (0, 0), (0, -1), bg_ivory),
            ("BOX", (0, 0), (0, -1), 0.5, colors.HexColor("#E5DCCB")),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("LINEABOVE", (1, -3), (2, -3), 1, primary_color),
            ("LINEABOVE", (1, -1), (2, -1), 1, gold_color),
        ])
    )
    story.append(totals_table)
    story.append(Spacer(1, 14))

    # 5. Terms & Authorized Signatory
    terms_text = (
        invoice_data.get("terms_and_conditions")
        or "1. Goods once sold will not be taken back without valid manufacturing defect authorization.\n"
           "2. Pure silk sarees require standard dry clean care.\n"
           "3. Disputes subject to Kanchipuram jurisdiction."
    )
    footer_data = [
        [
            Paragraph(
                f"<b>TERMS & CONDITIONS:</b><br/>"
                f"<font size=7 color='#555555'>{terms_text.replace(chr(10), '<br/>')}</font>",
                meta_value_style,
            ),
            Paragraph(
                "<b>For PVS SILK S</b><br/><br/><br/>"
                "__________________________<br/>"
                "<font size=7 color='#555555'>Authorised Signatory</font>",
                badge_style,
            ),
        ]
    ]
    footer_table = Table(footer_data, colWidths=[340, 180])
    footer_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(KeepTogether(footer_table))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
