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
  container.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(container);

  const sourceElement = container.firstElementChild;

  // 모든 요소에 computed style(rgb)을 인라인 복사
  inlineComputedStyles(sourceElement);

  // 스타일시트 DOM 요소를 완전 제거 (html2canvas 클론 시 복사 방지)
  const removedEls = [];
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
    removedEls.push({ el, parent: el.parentNode, next: el.nextSibling });
    el.remove();
  });

  try {
    // html2canvas 실행 (문서에 스타일시트 요소 없음 → oklch 파싱 불가)
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
    // 스타일시트 DOM 요소 복원
    removedEls.forEach(({ el, parent, next }) => {
      parent.insertBefore(el, next);
    });
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
function inlineComputedStyles(el) {
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

  // 루트 요소와 모든 자식에 computed style 인라인
  inlineProps(el, styleProps);
  el.querySelectorAll('*').forEach((child) => {
    inlineProps(child, styleProps);
  });
}

// oklch 색상을 rgb hex로 변환 (canvas 2d context 활용)
const colorCtx = (() => {
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  return c.getContext('2d');
})();

function resolveColor(value) {
  if (!value || !value.includes('oklch')) return value;
  // oklch()를 포함하는 값을 canvas fillStyle로 강제 변환
  colorCtx.fillStyle = '#000000';
  colorCtx.fillStyle = value;
  return colorCtx.fillStyle;
}

const COLOR_PROPS = new Set([
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'box-shadow',
  'background-image',
  'background',
]);

function inlineProps(el, props) {
  const computed = window.getComputedStyle(el);
  props.forEach((prop) => {
    let value = computed.getPropertyValue(prop);
    if (value) {
      // 색상 관련 속성은 oklch → rgb 강제 변환
      if (COLOR_PROPS.has(prop) || value.includes('oklch')) {
        value = resolveColor(value);
      }
      el.style.setProperty(prop, value);
    }
  });
}
