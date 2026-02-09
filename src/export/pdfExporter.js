// pdfExporter.js - PDF Export (html2canvas-pro: oklch 지원)
import { t } from '../i18n/index.js';

/**
 * HTML을 PDF로 변환
 * @param {string} htmlContent - HTML 문자열
 * @param {string} filename - 파일명
 * @returns {Promise<Blob>} PDF Blob
 */
export async function exportToPDF(
  htmlContent,
  filename = 'cohort-summary.pdf'
) {
  // Dynamic import for code splitting
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas-pro');

  // 임시 컨테이너 생성
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const sourceElement = container.firstElementChild;

  try {
    // HTML → Canvas
    const canvas = await html2canvas(sourceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Canvas → Image
    const imgData = canvas.toDataURL('image/png');

    // PDF 생성 (A4)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 이미지 비율 계산
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    // PDF 저장
    pdf.save(filename);

    // Blob 반환
    return pdf.output('blob');
  } finally {
    // 임시 컨테이너 제거
    document.body.removeChild(container);
  }
}

/**
 * PDF 미리보기 모달
 * @param {string} htmlContent - HTML 문자열
 */
export function showPDFPreview(htmlContent) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h2 style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
          ${t('pdf.preview')}
        </h2>
        <div style="display: flex; gap: 0.5rem;">
          <button id="downloadPDF" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            ${t('pdf.download')}
          </button>
          <button id="closePreview" class="btn-ghost">${t('pdf.close')}</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-paper">
          ${htmlContent}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('closePreview').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document
    .getElementById('downloadPDF')
    .addEventListener('click', async () => {
      const downloadBtn = document.getElementById('downloadPDF');
      const originalHTML = downloadBtn.innerHTML;
      downloadBtn.textContent = t('pdf.generating');
      downloadBtn.disabled = true;

      try {
        await exportToPDF(htmlContent);
        downloadBtn.textContent = t('pdf.done');
        downloadBtn.style.background = 'var(--green)';
        downloadBtn.style.color = '#ffffff';
        setTimeout(() => {
          downloadBtn.innerHTML = originalHTML;
          downloadBtn.disabled = false;
          downloadBtn.style.background = '';
          downloadBtn.style.color = '';
        }, 2000);
      } catch {
        downloadBtn.textContent = t('pdf.error');
        downloadBtn.style.background = 'var(--red)';
        downloadBtn.style.color = '#fff';
        setTimeout(() => {
          downloadBtn.innerHTML = originalHTML;
          downloadBtn.disabled = false;
          downloadBtn.style.background = '';
          downloadBtn.style.color = '';
        }, 2000);
      }
    });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}
