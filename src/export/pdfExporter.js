// pdfExporter.js - PDF Export

/**
 * HTML을 PDF로 변환
 * @param {string} htmlContent - HTML 문자열
 * @param {string} filename - 파일명
 * @returns {Promise<Blob>} PDF Blob
 */
export async function exportToPDF(htmlContent, filename = 'cohort-summary.pdf') {
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

    // html2canvas가 oklch() 색상을 파싱하지 못하므로 rgb로 변환
    convertOklchToRgb(container);

    try {
        // HTML → Canvas
        const canvas = await html2canvas(container.firstElementChild, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Canvas → Image
        const imgData = canvas.toDataURL('image/png');

        // PDF 생성 (A4)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
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
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
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
 * oklch() 색상을 rgb()로 변환 (html2canvas 호환)
 * 브라우저의 getComputedStyle로 resolved 색상을 얻어 inline style로 덮어씀
 */
function convertOklchToRgb(container) {
    const colorProps = [
        'color',
        'backgroundColor',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
    ];

    const elements = container.querySelectorAll('*');
    elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        colorProps.forEach((prop) => {
            const value = computed[prop];
            if (value && value.includes('oklch')) {
                // 브라우저가 이미 resolved한 값을 캔버스로 추출하여 rgb로 변환
                el.style[prop] = oklchToRgbFallback(value);
            }
        });
    });
}

/**
 * oklch 문자열을 rgb로 변환 (캔버스 2D 컨텍스트 활용)
 */
function oklchToRgbFallback(oklchValue) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = oklchValue;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return a < 255 ? `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
    } catch {
        return oklchValue;
    }
}
