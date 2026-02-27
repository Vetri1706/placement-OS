import sys


def main() -> int:
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: extract_pdf_text.py <pdf_path>\n")
        return 2

    pdf_path = sys.argv[1]

    try:
        import fitz  # PyMuPDF
    except Exception as e:
        sys.stderr.write(
            "PyMuPDF is not installed (missing 'fitz'). Install with: pip install pymupdf\n"
        )
        sys.stderr.write(f"Import error: {e}\n")
        return 3

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        sys.stderr.write(f"Failed to open PDF: {e}\n")
        return 4

    parts = []
    try:
        for page in doc:
            text = page.get_text() or ""
            if text:
                parts.append(text)
    finally:
        try:
            doc.close()
        except Exception:
            pass

    out = "\n\n".join(parts).strip()
    sys.stdout.write(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
