// pdfExporter.js - PDF Export

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
  const { default: html2canvas } = await import('html2canvas');

  // 임시 컨테이너 생성
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const sourceElement = container.firstElementChild;

  try {
    // HTML → Canvas (onclone으로 oklch 문제 해결)
    const canvas = await html2canvas(sourceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (_clonedDoc, clonedElement) => {
        // 1. 원본 computed style(rgb)을 클론 요소에 인라인
        inlineComputedStyles(sourceElement, clonedElement);

        // 2. 클론 문서에서 모든 스타일시트 제거 (oklch 파싱 오류 방지)
        // computed style이 이미 인라인되었으므로 외부 CSS 불필요
        _clonedDoc
          .querySelectorAll('link[rel="stylesheet"], style')
          .forEach((el) => el.remove());
      },
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
  // 모달 생성
  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
      <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">📄 PDF 미리보기</h2>
        <div class="flex gap-2">
          <button id="downloadPDF" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            💾 PDF 다운로드
          </button>
          <button id="closePreview" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
            ✕ 닫기
          </button>
        </div>
      </div>
      <div class="p-8">
        ${htmlContent}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 이벤트 리스너
  document.getElementById('closePreview').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document.getElementById('downloadPDF').addEventListener('click', async () => {
    const downloadBtn = document.getElementById('downloadPDF');
    downloadBtn.textContent = '⏳ 생성 중...';
    downloadBtn.disabled = true;

    try {
      await exportToPDF(htmlContent);
      downloadBtn.textContent = '✅ 다운로드 완료!';
      setTimeout(() => {
        downloadBtn.textContent = '💾 PDF 다운로드';
        downloadBtn.disabled = false;
      }, 2000);
    } catch (error) {
      downloadBtn.textContent = '❌ 오류 발생';
      console.error('PDF 생성 오류:', error);
      setTimeout(() => {
        downloadBtn.textContent = '💾 PDF 다운로드';
        downloadBtn.disabled = false;
      }, 2000);
    }
  });

  // 모달 외부 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * 원본 요소의 computed style을 클론 요소에 인라인으로 복사
 * getComputedStyle은 색상을 rgb()로 반환하므로 oklch 문제 우회
 */
function inlineComputedStyles(originalEl, clonedEl) {
  const styleProps = [
    'color',
    'background-color',
    'background-image',
    'background',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-width',
    'border-style',
    'border-radius',
    'box-shadow',
    'outline-color',
    'font-size',
    'font-weight',
    'font-family',
    'line-height',
    'text-align',
    'text-decoration',
    'display',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'grid-template-columns',
    'padding',
    'margin',
    'width',
    'max-width',
    'min-height',
    'height',
    'overflow',
    'opacity',
  ];

  copyProps(originalEl, clonedEl, styleProps);

  const origChildren = originalEl.querySelectorAll('*');
  const clonedChildren = clonedEl.querySelectorAll('*');

  origChildren.forEach((orig, i) => {
    if (clonedChildren[i]) {
      copyProps(orig, clonedChildren[i], styleProps);
    }
  });
}

function copyProps(from, to, props) {
  const computed = window.getComputedStyle(from);
  props.forEach((prop) => {
    const value = computed.getPropertyValue(prop);
    if (value) {
      to.style.setProperty(prop, value);
    }
  });
}
