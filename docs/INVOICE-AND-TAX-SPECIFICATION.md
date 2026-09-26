# PVS Silk S — Invoice & Tax Specification (Phase 4C-D)

## 1. Statutory Identity & GST Details

| Attribute | Specification |
| :--- | :--- |
| **Legal Entity** | PVS Silk S Private Limited |
| **Trade Name** | PVS Silk S |
| **State / UT** | Tamil Nadu (State Code: 33) |
| **Principal Place of Business** | Kanchipuram, Tamil Nadu 631501, India |
| **GSTIN** | `33AAAAA1234A1Z5` |
| **Jurisdiction** | Kanchipuram Central & State Tax Division |

---

## 2. HSN & SAC Classification

In accordance with the Central Goods and Services Tax (CGST) Act and Tamil Nadu SGST provisions:

| HSN Code | Description | Standard GST Rate | Intra-State (CGST + SGST) | Inter-State (IGST) |
| :--- | :--- | :---: | :---: | :---: |
| **5007** | Woven fabrics of silk or of silk waste (Handloom Kanchipuram Silk Sarees) | **5.0%** | 2.5% CGST + 2.5% SGST | 5.0% IGST |
| **5004** | Silk yarn (other than yarn spun from silk waste) | **5.0%** | 2.5% CGST + 2.5% SGST | 5.0% IGST |
| **5605** | Metallised yarn (Gold & Silver Zari thread / Kasavu) | **12.0%** | 6.0% CGST + 6.0% SGST | 12.0% IGST |
| **3204** | Synthetic organic colouring matter & acid dyes | **18.0%** | 9.0% CGST + 9.0% SGST | 18.0% IGST |

---

## 3. Place of Supply Rules

1. **Intra-State Supply (Tamil Nadu to Tamil Nadu):**
   * Applied when the client's billing/delivery state is Tamil Nadu (`Place of Supply: Tamil Nadu (33)`).
   * **Tax Calculation:**
     $$\text{CGST} = \text{Taxable Value} \times 2.5\%$$
     $$\text{SGST} = \text{Taxable Value} \times 2.5\%$$
     $$\text{Total Tax} = \text{CGST} + \text{SGST} = 5.0\%$$
2. **Inter-State Supply (Tamil Nadu to other Indian States/UTs):**
   * Applied when the client is located outside Tamil Nadu (e.g., Karnataka, Maharashtra, Delhi, Andhra Pradesh).
   * **Tax Calculation:**
     $$\text{IGST} = \text{Taxable Value} \times 5.0\%$$

---

## 4. PDF Tax Invoice Engine Architecture

Generated using **ReportLab** with custom typography, high-definition styling, and vector layout:
* **Page Dimensions:** A4 Portrait (595.27 × 841.89 pt).
* **Color Palette:**
  * Royal Burgundy (`#4A0E17` / `#2D0A0F`)
  * Royal Heritage Gold (`#D4AF37` / `#AA7C11`)
  * Charcoal Charcoal (`#1F2937` / `#4B5563`)
  * Ivory Accent (`#FAF7F2`)
* **Mandatory Statutory Sections:**
  1. Header with PVS Silk S branding and GSTIN.
  2. Tax Invoice Number & Date.
  3. Buyer details (Name, Address, Phone, GSTIN, State code).
  4. Itemized table with HSN code, quantity, unit rate, taxable amount, and GST.
  5. Tax summary breakdown (CGST/SGST/IGST).
  6. Company Bank NEFT/RTGS wire instructions.
  7. Terms & Conditions.
  8. Authorized Signatory block.
