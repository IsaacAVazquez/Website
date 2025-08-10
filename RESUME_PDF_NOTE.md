# Resume PDF Setup

To complete the PDF download functionality, you need to:

1. **Create or export your resume as a PDF**
   - Name it: `Isaac_Vazquez_Resume.pdf`
   
2. **Place the PDF in the public folder**
   - Location: `/public/Isaac_Vazquez_Resume.pdf`
   
3. **The download button is already configured**
   - It will look for the file at the root of your public folder
   - When clicked, it will download with the filename `Isaac_Vazquez_Resume.pdf`

## Alternative: Generate PDF dynamically

If you prefer to generate the PDF dynamically from the HTML, you could use a library like:
- `react-to-pdf`
- `jspdf`
- `puppeteer` (server-side)

For now, the static PDF approach is simpler and gives you full control over the formatting.