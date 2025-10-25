function renderMultilingualText(page, text, options) {
    const { width, height } = page.getSize();
    const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

    try {
        // For Arabic text, use different positioning and settings
        if (isArabic) {
            // Adjust position for Arabic text (RTL)
            const x = width / 2 - 80; // Move slightly to the right for RTL
            const y = height / 2;

            page.drawText(text, {
                x: x,
                y: y,
                size: options.size,
                color: options.color,
                opacity: options.opacity,
                // Remove rotation for Arabic text as it may cause issues
                rotate: PDFLib.degrees(0)
            });
        } else {
            // For non-Arabic text, use normal positioning with rotation
            page.drawText(text, {
                x: width / 2 - 100,
                y: height / 2,
                size: options.size,
                color: options.color,
                opacity: options.opacity,
                rotate: options.rotate || PDFLib.degrees(45)
            });
        }
    } catch (error) {
        console.error('Error rendering text:', error);
        // Fallback: try without rotation for all text
        try {
            page.drawText(text, {
                x: width / 2 - 100,
                y: height / 2,
                size: options.size,
                color: options.color,
                opacity: options.opacity
            });
        } catch (fallbackError) {
            console.error('Fallback text rendering also failed:', fallbackError);
            throw new Error('Unable to render text on PDF');
        }
    }
}

// Function to create a simple Arabic-compatible font
async function createArabicFont(pdfDoc) {
    // For better Arabic support, we can try to use a different approach
    // This is a simplified version - in production, you'd want to embed a proper Arabic font
    return null; // Return null for now, let PDF-lib handle it with default fonts
}
function waitForPDFLib() {
    return new Promise((resolve, reject) => {
        const checkPDFLib = () => {
            if (typeof PDFLib !== 'undefined') {
                resolve();
            } else {
                setTimeout(checkPDFLib, 100);
            }
        };
        checkPDFLib();
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}

// Test PDFLib functionality - simplified
async function testPDFLib() {
    try {
        if (typeof PDFLib === 'undefined') {
            throw new Error('PDFLib is not loaded');
        }
        console.log('PDFLib is available');
        return true;
    } catch (error) {
        console.error('PDFLib test failed:', error);
        return false;
    }
}
const modal = document.getElementById('tool-modal');
const closeBtn = document.getElementsByClassName('close')[0];
const modalBody = document.getElementById('modal-body');

// Tool cards
document.getElementById('qr-generator').addEventListener('click', () => openTool('qr'));
document.getElementById('pdf-editor').addEventListener('click', () => openTool('pdf'));
document.getElementById('pdf-maker').addEventListener('click', () => openTool('pdf-maker'));
document.getElementById('text-editor').addEventListener('click', () => openTool('text'));
document.getElementById('calculator').addEventListener('click', () => openTool('calc'));

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

function openTool(tool) {
    let content = '';
    switch(tool) {
        case 'qr':
            content = `
                <h2 style="text-align: center; color: #667eea; margin-bottom: 30px; font-size: 2rem;">
                    <i class="fas fa-qrcode" style="margin-right: 10px;"></i>
                    QR Code Generator
                </h2>
                <p style="text-align: center; color: #666; margin-bottom: 40px; font-size: 1.1rem;">
                    Generate QR codes instantly with customizable size and download options
                </p>
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="margin-bottom: 20px;">
                        <label for="qr-input" style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">Enter text or URL:</label>
                        <input type="text" id="qr-input" placeholder="Enter text or URL for QR code" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="qr-size" style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">QR Code Size: <span id="size-value">200</span>px</label>
                        <input type="range" id="qr-size" min="100" max="500" value="200" step="50" style="width: 100%; height: 8px; border-radius: 5px; background: #ddd; outline: none; -webkit-appearance: none;">
                    </div>
                    <div style="text-align: center; margin-bottom: 30px;">
                        <button onclick="generateQRCode()" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Generate QR Code</button>
                    </div>
                    <div id="qr-output" style="text-align: center; margin-top: 20px;"></div>
                    <div id="qr-download-options" style="display: none; text-align: center; margin-top: 20px;">
                        <h3 style="color: #667eea; margin-bottom: 15px;">Download Options:</h3>
                        <button onclick="downloadQRAsPNG()" style="padding: 10px 20px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 20px; cursor: pointer; margin: 0 5px; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; overflow: hidden; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Download PNG</button>
                        <button onclick="downloadQRAsJPG()" style="padding: 10px 20px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border: none; border-radius: 20px; cursor: pointer; margin: 0 5px; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; overflow: hidden; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Download JPG</button>
                        <button onclick="downloadQRAsPDF()" style="padding: 10px 20px; background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 20px; cursor: pointer; margin: 0 5px; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; overflow: hidden; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Download PDF</button>
                    </div>
                </div>
            `;
            break;
        case 'pdf':
            content = `
                <h2 style="text-align: center; color: #667eea; margin-bottom: 30px; font-size: 2rem;">
                    <i class="fas fa-file-pdf" style="margin-right: 10px;"></i>
                    PDF Tools Suite
                </h2>
                <p style="text-align: center; color: #666; margin-bottom: 40px; font-size: 1.1rem;">
                    Choose from our collection of professional PDF tools
                </p>
                <div class="pdf-tools-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 20px;">
                    <div class="pdf-tool-card" onclick="selectPDFTool('merge')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease-out;">
                        <i class="fas fa-compress-arrows-alt" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                        <h3 style="font-size: 1.3rem; margin-bottom: 10px;">Merge PDFs</h3>
                        <p style="font-size: 0.9rem; opacity: 0.9;">Combine multiple PDF files into one</p>
                    </div>
                    <div class="pdf-tool-card" onclick="selectPDFTool('split')" style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 25px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease-out 0.1s both;">
                        <i class="fas fa-cut" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                        <h3 style="font-size: 1.3rem; margin-bottom: 10px;">Split PDF</h3>
                        <p style="font-size: 0.9rem; opacity: 0.9;">Split PDF into separate pages or sections</p>
                    </div>
                    <div class="pdf-tool-card" onclick="selectPDFTool('convert')" style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 25px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease-out 0.2s both;">
                        <i class="fas fa-exchange-alt" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                        <h3 style="font-size: 1.3rem; margin-bottom: 10px;">Convert PDF</h3>
                        <p style="font-size: 0.9rem; opacity: 0.9;">Convert PDF to JPG and PNG images</p>
                    </div>
                                        <div class="pdf-tool-card" onclick="selectPDFTool('viewer')" style="background: linear-gradient(135deg, #d299c2, #fef9d7); color: #333; padding: 25px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease-out 0.4s both;">
                        <i class="fas fa-eye" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                        <h3 style="font-size: 1.3rem; margin-bottom: 10px;">View PDF</h3>
                        <p style="font-size: 0.9rem; opacity: 0.7;">View and navigate PDF documents</p>
                    </div>
                    <div class="pdf-tool-card" onclick="selectPDFTool('watermark')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease-out 0.5s both;">
                        <i class="fas fa-water" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                        <h3 style="font-size: 1.3rem; margin-bottom: 10px;">Add Watermark</h3>
                        <p style="font-size: 0.9rem; opacity: 0.9;">Add text, image, or PDF watermarks</p>
                    </div>
                    <div class="pdf-tool-card" onclick="selectPDFTool('image-to-pdf')" style="background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #333; padding: 25px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; animation: fadeInUp 0.5s ease-out 0.6s both;">
                        <i class="fas fa-image" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                        <h3 style="font-size: 1.3rem; margin-bottom: 10px;">Images to PDF</h3>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Convert images to PDF documents</p>
                    </div>
                </div>
                <div id="pdf-tool-content" style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px; min-height: 200px;"></div>
            `;
            break;
        case 'pdf-maker':
            content = `
                <h2 style="text-align: center; color: #28a745; margin-bottom: 30px; font-size: 2rem;">
                    <i class="fas fa-plus-circle" style="margin-right: 10px;"></i>
                    PDF Maker
                </h2>
                <p style="text-align: center; color: #666; margin-bottom: 40px; font-size: 1.1rem;">
                    Create a new PDF document from scratch with text and images
                </p>
                <div style="max-width: 800px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="margin-bottom: 20px;">
                        <label for="pdf-title" style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">Document Title:</label>
                        <input type="text" id="pdf-title" placeholder="Enter document title" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="pdf-content" style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">Content (Text):</label>
                        <textarea id="pdf-content" placeholder="Enter the text content for your PDF" rows="10" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s; resize: vertical;"></textarea>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="pdf-font-size" style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">Font Size: <span id="font-size-value">12</span>pt</label>
                        <input type="range" id="pdf-font-size" min="8" max="24" value="12" step="1" style="width: 100%; height: 8px; border-radius: 5px; background: #ddd; outline: none; -webkit-appearance: none;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="pdf-image" style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">Add Image (Optional):</label>
                        <input type="file" id="pdf-image" accept="image/*" style="padding: 10px; border: 2px dashed #28a745; border-radius: 8px; width: 100%;">
                        <div id="image-preview" style="margin-top: 10px; text-align: center;"></div>
                    </div>
                    <div style="text-align: center; margin-bottom: 30px;">
                        <button onclick="createPDF()" style="padding: 12px 30px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">Create PDF</button>
                    </div>
                    <div id="pdf-maker-status" style="text-align: center; margin-top: 20px; color: #28a745;"></div>
                </div>
            `;
            break;
        case 'text':
            content = `
                <h2>Text Counter</h2>
                <p>Enter text below to count words, characters, and more:</p>
                <textarea id="text-input-area" oninput="calculateTextStats()" style="width: 100%; height: 200px; padding: 10px; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px;" placeholder="Enter your text here..."></textarea>
                <button onclick="clearTextStats()" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">Clear</button>
                <div id="text-stats" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <h3>Results:</h3>
                    <p><strong>Characters (with spaces):</strong> <span id="char-count">0</span></p>
                    <p><strong>Characters (without spaces):</strong> <span id="char-no-space-count">0</span></p>
                    <p><strong>Words:</strong> <span id="word-count">0</span></p>
                    <p><strong>Lines:</strong> <span id="line-count">0</span></p>
                    <p><strong>Paragraphs:</strong> <span id="paragraph-count">0</span></p>
                </div>
            `;
            break;
        case 'calc':
            content = `
                <h2>Calculator</h2>
                <input type="text" id="calc-display" readonly style="width: 100%; padding: 10px; margin: 20px 0; font-size: 1.5rem; text-align: right;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px;">
                    <button onclick="appendToDisplay('7')" style="padding: 15px; font-size: 1.2rem;">7</button>
                    <button onclick="appendToDisplay('8')" style="padding: 15px; font-size: 1.2rem;">8</button>
                    <button onclick="appendToDisplay('9')" style="padding: 15px; font-size: 1.2rem;">9</button>
                    <button onclick="appendToDisplay('/')" style="padding: 15px; font-size: 1.2rem;">/</button>
                    <button onclick="appendToDisplay('4')" style="padding: 15px; font-size: 1.2rem;">4</button>
                    <button onclick="appendToDisplay('5')" style="padding: 15px; font-size: 1.2rem;">5</button>
                    <button onclick="appendToDisplay('6')" style="padding: 15px; font-size: 1.2rem;">6</button>
                    <button onclick="appendToDisplay('*')" style="padding: 15px; font-size: 1.2rem;">*</button>
                    <button onclick="appendToDisplay('1')" style="padding: 15px; font-size: 1.2rem;">1</button>
                    <button onclick="appendToDisplay('2')" style="padding: 15px; font-size: 1.2rem;">2</button>
                    <button onclick="appendToDisplay('3')" style="padding: 15px; font-size: 1.2rem;">3</button>
                    <button onclick="appendToDisplay('-')" style="padding: 15px; font-size: 1.2rem;">-</button>
                    <button onclick="appendToDisplay('0')" style="padding: 15px; font-size: 1.2rem;">0</button>
                    <button onclick="appendToDisplay('.')" style="padding: 15px; font-size: 1.2rem;">.</button>
                    <button onclick="calculate()" style="padding: 15px; font-size: 1.2rem; background: #667eea; color: white;">=</button>
                    <button onclick="appendToDisplay('+')" style="padding: 15px; font-size: 1.2rem;">+</button>
                </div>
                <button onclick="clearDisplay()" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">Clear</button>
            `;
            break;
    }
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

function openPrivacyPolicy() {
    const content = `
        <h2 style="text-align: center; color: #667eea; margin-bottom: 30px; font-size: 2rem;">
            <i class="fas fa-shield-alt" style="margin-right: 10px;"></i>
            Privacy Policy
        </h2>
        <div style="max-width: 700px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); line-height: 1.6;">
            <h3 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Your Privacy is Our Priority</h3>

            <p style="margin-bottom: 20px; color: #555; font-size: 1.1rem;">
                At <strong>i want to edit</strong>, we are committed to protecting your privacy and ensuring the security of your data. This privacy policy explains how we handle the files and information you upload to our platform.
            </p>

            <h4 style="color: #667eea; margin: 25px 0 15px 0; font-size: 1.3rem;">
                <i class="fas fa-lock" style="margin-right: 8px;"></i>Data Protection & Security
            </h4>
            <p style="margin-bottom: 20px; color: #555;">
                All files you upload to our website are treated with the utmost care and confidentiality. We understand that your documents may contain sensitive information, and we take every measure to ensure they remain secure.
            </p>

            <h4 style="color: #667eea; margin: 25px 0 15px 0; font-size: 1.3rem;">
                <i class="fas fa-shield-check" style="margin-right: 8px;"></i>File Handling Policy
            </h4>
            <ul style="margin-bottom: 20px; padding-left: 20px; color: #555;">
                <li style="margin-bottom: 10px;"><strong>No Storage:</strong> Your uploaded files are processed in real-time and are not stored permanently or temporarily on our servers.</li>
                <li style="margin-bottom: 10px;"><strong>Client-Side Processing:</strong> Whenever possible, file processing is done locally in your browser for maximum security.</li>
                <li style="margin-bottom: 10px;"><strong>Encrypted Transmission:</strong> All file transfers use secure, encrypted connections (HTTPS) to protect your data in transit.</li>
            </ul>

            <h4 style="color: #667eea; margin: 25px 0 15px 0; font-size: 1.3rem;">
                <i class="fas fa-user-secret" style="margin-right: 8px;"></i>Privacy Assurance
            </h4>
            <p style="margin-bottom: 20px; color: #555;">
                We do not share, sell, or distribute your files to any third parties. Your documents remain completely confidential and are only accessible to you during the processing session. Our commitment to your privacy means that once you close your browser or complete your task, your files are gone forever from our systems.
            </p>

            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-top: 30px;">
                <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <h4 style="margin: 0 0 10px 0;">Rest assured, your files are safe with us!</h4>
                <p style="margin: 0; opacity: 0.9;">We prioritize your privacy and security above all else.</p>
            </div>
        </div>
    `;

    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

// QR Code Generator with professional features
let qrCodeInstance = null;

function generateQRCode() {
    const input = document.getElementById('qr-input').value;
    const size = parseInt(document.getElementById('qr-size').value);
    const qrOutput = document.getElementById('qr-output');
    const downloadOptions = document.getElementById('qr-download-options');

    if (!input) {
        qrOutput.innerHTML = '<p style="color: red; font-weight: bold;">Please enter text or URL to generate QR code.</p>';
        return;
    }

    // Clear previous QR code
    qrOutput.innerHTML = '';

    // Create QR code container
    const qrContainer = document.createElement('div');
    qrContainer.id = 'qr-code-container';
    qrContainer.style.display = 'inline-block';
    qrContainer.style.padding = '20px';
    qrContainer.style.background = 'white';
    qrContainer.style.borderRadius = '10px';
    qrContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

    // Generate QR code using QRCode.js
    qrCodeInstance = new QRCode(qrContainer, {
        text: input,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.H
    });

    qrOutput.appendChild(qrContainer);

    // Show download options
    downloadOptions.style.display = 'block';

    // Update size value display
    document.getElementById('size-value').textContent = size;
}

// Download functions
function downloadQRAsPNG() {
    const qrContainer = document.getElementById('qr-code-container');
    if (!qrContainer) {
        alert('Please generate a QR code first.');
        return;
    }

    // Create canvas from QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = parseInt(document.getElementById('qr-size').value);

    // Use standard page size (A4 proportions but as image)
    const pageWidth = 800; // Standard image width
    const pageHeight = 1131; // A4 proportions (297/210 * 800)

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    // Fill background with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate position to center the QR code on the page
    // Convert pixels to match the proportion
    const qrSize = size;
    const x = (pageWidth - qrSize) / 2;
    const y = (pageHeight - qrSize) / 2;

    // Draw QR code onto canvas at center position with original size
    const qrImg = qrContainer.querySelector('img');
    if (qrImg) {
        ctx.drawImage(qrImg, x, y, qrSize, qrSize);
    } else {
        const qrCanvas = qrContainer.querySelector('canvas');
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, x, y, qrSize, qrSize);
        }
    }

    // Download as PNG
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadQRAsJPG() {
    const qrContainer = document.getElementById('qr-code-container');
    if (!qrContainer) {
        alert('Please generate a QR code first.');
        return;
    }

    // Create canvas from QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = parseInt(document.getElementById('qr-size').value);

    // Use standard page size (A4 proportions but as image)
    const pageWidth = 800; // Standard image width
    const pageHeight = 1131; // A4 proportions (297/210 * 800)

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    // Fill background with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate position to center the QR code on the page
    const qrSize = size;
    const x = (pageWidth - qrSize) / 2;
    const y = (pageHeight - qrSize) / 2;

    // Draw QR code onto canvas at center position with original size
    const qrImg = qrContainer.querySelector('img');
    if (qrImg) {
        ctx.drawImage(qrImg, x, y, qrSize, qrSize);
    } else {
        const qrCanvas = qrContainer.querySelector('canvas');
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, x, y, qrSize, qrSize);
        }
    }

    // Download as JPG
    const link = document.createElement('a');
    link.download = 'qr-code.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
}

function downloadQRAsPDF() {
    const qrContainer = document.getElementById('qr-code-container');
    if (!qrContainer) {
        alert('Please generate a QR code first.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const size = parseInt(document.getElementById('qr-size').value);

    // Create canvas for QR code with exact size needed
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = size;
    canvas.height = size;

    // Fill background with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code onto canvas at original size
    const qrImg = qrContainer.querySelector('img');
    if (qrImg) {
        ctx.drawImage(qrImg, 0, 0, size, size);
    } else {
        const qrCanvas = qrContainer.querySelector('canvas');
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, 0, 0, size, size);
        }
    }

    // Use standard A4 page size (210mm x 297mm)
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm

    // Calculate position to center the QR code on the page
    // Convert pixels to mm (assuming 96 DPI, 1px = 0.264mm)
    const qrSizeMm = (size * 0.264);
    const x = (pageWidth - qrSizeMm) / 2;
    const y = (pageHeight - qrSizeMm) / 2;

    // Add QR code to PDF at center position with original size
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, qrSizeMm, qrSizeMm);

    // Download PDF without any text
    pdf.save('qr-code.pdf');
}

// Initialize size slider functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for size slider after modal content is loaded
    const originalOpenTool = openTool;
    openTool = function(tool) {
        originalOpenTool(tool);

        if (tool === 'pdf-maker') {
            setTimeout(() => {
                const fontSizeSlider = document.getElementById('pdf-font-size');
                const fontSizeValue = document.getElementById('font-size-value');

                if (fontSizeSlider && fontSizeValue) {
                    fontSizeSlider.addEventListener('input', function() {
                        fontSizeValue.textContent = this.value;
                    });
                }
            }, 100);
        }
    };
});

// PDF Tool Functions
async function mergePDFs() {
    const files = document.getElementById('merge-files').files;
    const status = document.getElementById('merge-status');

    if (files.length < 2) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select at least 2 PDF files to merge.';
        status.className = 'status-error';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging PDFs...';
    status.className = 'status-loading';

    try {
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (let file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'merged_document.pdf';
        downloadLink.textContent = 'Download merged PDF';
        downloadLink.className = 'download-link';

        status.innerHTML = `<i class="fas fa-check-circle"></i> PDFs merged successfully! `;
        status.appendChild(downloadLink);
        status.className = 'status-success';

    } catch (error) {
        console.error('Error merging PDFs:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error merging PDFs. Please try again.';
        status.className = 'status-error';
    }
}

async function splitPDF() {
    const file = document.getElementById('split-file').files[0];
    const status = document.getElementById('split-status');

    if (!file) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a PDF file to split.';
        status.className = 'status-error';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Splitting PDF...';
    status.className = 'status-loading';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();

        let splitDocuments = [];

        // Always split each page into separate documents (pages method)
        for (let i = 0; i < totalPages; i++) {
            const newPdf = await PDFLib.PDFDocument.create();
            const [page] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(page);

            const pdfBytes = await newPdf.save();
            splitDocuments.push({
                name: `page_${i + 1}.pdf`,
                blob: new Blob([pdfBytes], { type: 'application/pdf' })
            });
        }

        // Create download links
        const downloadContainer = document.createElement('div');
        downloadContainer.className = 'download-container';

        splitDocuments.forEach((doc, index) => {
            const url = URL.createObjectURL(doc.blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = doc.name;
            downloadLink.textContent = `Download ${doc.name}`;
            downloadLink.className = 'download-link';
            downloadContainer.appendChild(downloadLink);
            if (index < splitDocuments.length - 1) {
                downloadContainer.appendChild(document.createElement('br'));
            }
        });

        status.innerHTML = `<i class="fas fa-check-circle"></i> PDF split successfully! `;
        status.appendChild(downloadContainer);
        status.className = 'status-success';

    } catch (error) {
        console.error('Error splitting PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error splitting PDF. Please try again.';
        status.className = 'status-error';
    }
}

async function compressPDF() {
    const file = document.getElementById('compress-file').files[0];
    const level = document.getElementById('compression-level').value;
    const status = document.getElementById('compress-status');

    if (!file) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a PDF file to compress.';
        status.className = 'status-error';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compressing PDF...';
    status.className = 'status-loading';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);

        // Basic compression by reducing precision and removing metadata
        if (level === 'high') {
            // Remove all metadata and annotations for maximum compression
            pdf.setTitle('');
            pdf.setAuthor('');
            pdf.setSubject('');
            pdf.setKeywords([]);
            pdf.setProducer('');
            pdf.setCreator('');

            // Remove annotations from all pages
            const pages = pdf.getPages();
            pages.forEach(page => {
                const annotations = page.node.Annots();
                if (annotations) {
                    annotations.clear();
                }
            });
        }

        const compressedPdfBytes = await pdf.save({
            useObjectStreams: level !== 'low',
            addDefaultPage: false,
            objectsPerTick: level === 'high' ? 50 : 100
        });

        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });

        // Calculate compression ratio
        const originalSize = arrayBuffer.byteLength;
        const compressedSize = compressedPdfBytes.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        // Create download link
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `compressed_${file.name}`;
        downloadLink.textContent = `Download compressed PDF (${compressionRatio}% smaller)`;
        downloadLink.className = 'download-link';

        status.innerHTML = `<i class="fas fa-check-circle"></i> PDF compressed successfully! (${compressionRatio}% size reduction) `;
        status.appendChild(downloadLink);
        status.className = 'status-success';

    } catch (error) {
        console.error('Error compressing PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error compressing PDF. Please try again.';
        status.className = 'status-error';
    }
}

async function convertPDF() {
    const file = document.getElementById('convert-file').files[0];
    const format = document.getElementById('convert-format').value;
    const status = document.getElementById('convert-status');

    if (!file) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a PDF file to convert.';
        status.className = 'status-error';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting PDF to image...';
    status.className = 'status-loading';

    try {
        const arrayBuffer = await file.arrayBuffer();

        // Use PDF.js to render the first page as image
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const scale = 2.0;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = file.name.replace('.pdf', '.' + format);
            downloadLink.textContent = `Download converted ${format.toUpperCase()}`;
            downloadLink.className = 'download-link';

            status.innerHTML = `<i class="fas fa-check-circle"></i> PDF converted to ${format.toUpperCase()} successfully! `;
            status.appendChild(downloadLink);
            status.className = 'status-success';
        }, 'image/' + format);

    } catch (error) {
        console.error('Error converting PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error converting PDF. Please try again.';
        status.className = 'status-error';
    }
}


async function addWatermark() {
    const fileInput = document.getElementById('watermark-file');
    const status = document.getElementById('watermark-status');

    // Check if required elements exist
    if (!fileInput || !status) {
        console.error('Required elements not found');
        if (status) {
            status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Required elements not found. Please refresh the page.';
            status.className = 'status-error';
        }
        return;
    }

    if (!fileInput || !fileInput.files[0]) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a PDF file to add watermark.';
        status.className = 'status-error';
        return;
    }

    // Check if PDFLib is loaded
    if (typeof PDFLib === 'undefined') {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PDF library not loaded. Please refresh the page.';
        status.className = 'status-error';
        console.error('PDFLib not loaded');
        return;
    }

    const file = fileInput.files[0];
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding watermark...';
    status.className = 'status-loading';

    try {
        // Load PDF using async/await
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        if (pages.length === 0) {
            throw new Error('PDF has no pages');
        }

        // Get watermark type and settings
        const watermarkTypeInput = document.getElementById('watermark-type');
        if (!watermarkTypeInput) {
            throw new Error('Watermark type not configured');
        }

        const watermarkType = watermarkTypeInput.value;
        const settings = getWatermarkSettings(watermarkType);

        if (!settings) {
            if (watermarkType === 'text') {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter watermark text.';
            } else if (watermarkType === 'image') {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a watermark image.';
            }
            status.className = 'status-error';
            return;
        }

        // Process based on watermark type
        if (watermarkType === 'text') {
            // Get text watermark settings
            const text = settings.text;
            const fontSize = settings.fontSize;
            const opacity = settings.opacity;
            const x = settings.x;
            const y = settings.y;
            const rotation = settings.rotation;

            // Create a canvas to render the text as an image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size based on text length and font size
            const maxWidth = 800;
            const lineHeight = fontSize * 1.2;

            // Check if text contains Arabic
            const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

            // Set font with fallback for Arabic
            let fontFamily = 'Arial, sans-serif';
            if (isArabic) {
                fontFamily = '"Noto Sans Arabic", "Arial Unicode MS", Arial, sans-serif';
            }

            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
            ctx.textAlign = isArabic ? 'right' : 'center';
            ctx.textBaseline = 'middle';

            // Handle text wrapping for long text
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }

            // Calculate canvas dimensions
            const textHeight = lines.length * lineHeight;
            const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            canvas.width = Math.min(textWidth + 40, maxWidth);
            canvas.height = textHeight + 40;

            // Clear canvas and set background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Reset font and style
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
            ctx.textAlign = isArabic ? 'right' : 'center';
            ctx.textBaseline = 'middle';

            // Draw text lines
            const startY = (canvas.height - textHeight) / 2;
            lines.forEach((line, index) => {
                const y = startY + (index * lineHeight) + (lineHeight / 2);
                const x = isArabic ? canvas.width - 20 : canvas.width / 2;
                ctx.fillText(line, x, y);
            });

            // Convert canvas to image and embed in PDF
            const imageData = canvas.toDataURL('image/png');
            const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());

            let image;
            try {
                image = await pdfDoc.embedPng(imageBytes);
            } catch (pngError) {
                // Fallback to JPG if PNG fails
                const jpgData = canvas.toDataURL('image/jpeg', 0.9);
                const jpgBytes = await fetch(jpgData).then(res => res.arrayBuffer());
                image = await pdfDoc.embedJpg(jpgBytes);
            }

            // Add watermark to each page
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                // Calculate image size and position with consistent scaling
                const scaleFactor = Math.min(1, Math.min(width / canvas.width, height / canvas.height) * 0.8);
                const imageWidth = canvas.width * scaleFactor;
                const imageHeight = canvas.height * scaleFactor;

                // Use custom position if provided, otherwise center
                let drawX = (width - imageWidth) / 2;
                let drawY = (height - imageHeight) / 2;

                if (x !== undefined) {
                    drawX = (width / 2) + x - (imageWidth / 2);
                }
                if (y !== undefined) {
                    drawY = (height / 2) + y - (imageHeight / 2);
                }

                // Add rotation for non-Arabic text
                if (!isArabic) {
                    page.drawImage(image, {
                        x: drawX,
                        y: drawY,
                        width: imageWidth,
                        height: imageHeight,
                        opacity: opacity,
                        rotate: PDFLib.degrees(rotation)
                    });
                } else {
                    // For Arabic text, don't rotate to maintain readability
                    page.drawImage(image, {
                        x: drawX,
                        y: drawY,
                        width: imageWidth,
                        height: imageHeight,
                        opacity: opacity
                    });
                }

                // Update progress
                status.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Adding watermark to page ${i + 1} of ${pages.length}...`;
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } else if (watermarkType === 'image') {
            // Process image watermark for all pages
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                await addImageWatermarkToPage(page, settings, width, height, pdfDoc);

                // Update progress
                status.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Adding watermark to page ${i + 1} of ${pages.length}...`;
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        // Save the modified PDF
        const watermarkedPdfBytes = await pdfDoc.save();
        const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `watermarked_${file.name}`;
        downloadLink.textContent = 'Download watermarked PDF';
        downloadLink.className = 'download-link';

        status.innerHTML = `<i class="fas fa-check-circle"></i> Watermark added successfully! `;
        status.appendChild(downloadLink);
        status.className = 'status-success';

    } catch (error) {
        console.error('Error adding watermark:', error);
        let errorMessage = 'Error adding watermark. Please try again.';

        if (error.message.includes('no pages')) {
            errorMessage = 'Error: The PDF file appears to be empty or corrupted.';
        } else if (error.message.includes('Failed to load')) {
            errorMessage = 'Error: Could not load the PDF file. Please check if the file is valid.';
        } else if (error.message.includes('PDFLib')) {
            errorMessage = 'Error: PDF processing library error. Please refresh the page and try again.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Error: Network error occurred. Please check your connection and try again.';
        }

        status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
        status.className = 'status-error';
    }
}

// Helper function to add text watermark to a page
async function addTextWatermarkToPage(page, settings, width, height, pdfDoc) {
    const { text, fontSize, opacity, x, y, rotation } = settings;

    // Create a canvas to render the text as an image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size based on text length and font size
    const maxWidth = 800;
    const lineHeight = fontSize * 1.2;

    // Check if text contains Arabic
    const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

    // Set font with fallback for Arabic
    let fontFamily = 'Arial, sans-serif';
    if (isArabic) {
        fontFamily = '"Noto Sans Arabic", "Arial Unicode MS", Arial, sans-serif';
    }

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
    ctx.textAlign = isArabic ? 'right' : 'center';
    ctx.textBaseline = 'middle';

    // Handle text wrapping for long text
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    // Calculate canvas dimensions
    const textHeight = lines.length * lineHeight;
    const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    canvas.width = Math.min(textWidth + 40, maxWidth);
    canvas.height = textHeight + 40;

    // Clear canvas and set background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset font and style
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
    ctx.textAlign = isArabic ? 'right' : 'center';
    ctx.textBaseline = 'middle';

    // Draw text lines
    const startY = (canvas.height - textHeight) / 2;
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight) + (lineHeight / 2);
        const x = isArabic ? canvas.width - 20 : canvas.width / 2;
        ctx.fillText(line, x, y);
    });

    // Convert canvas to image and embed in PDF
    const imageData = canvas.toDataURL('image/png');
    const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());

    let image;
    try {
        image = await pdfDoc.embedPng(imageBytes);
    } catch (pngError) {
        // Fallback to JPG if PNG fails
        const jpgData = canvas.toDataURL('image/jpeg', 0.9);
        const jpgBytes = await fetch(jpgData).then(res => res.arrayBuffer());
        image = await pdfDoc.embedJpg(jpgBytes);
    }

    // Calculate image size and position
    const imageWidth = Math.min(canvas.width * 0.8, width * 0.6);
    const imageHeight = (canvas.height / canvas.width) * imageWidth;

    // Use custom position if provided, otherwise center
    let drawX = (width - imageWidth) / 2;
    let drawY = (height - imageHeight) / 2;

    if (x !== undefined) {
        drawX = (width / 2) + x - (imageWidth / 2);
    }
    if (y !== undefined) {
        drawY = (height / 2) + y - (imageHeight / 2);
    }

    // Add rotation for non-Arabic text
    if (!isArabic) {
        page.drawImage(image, {
            x: drawX,
            y: drawY,
            width: imageWidth,
            height: imageHeight,
            opacity: opacity,
            rotate: PDFLib.degrees(rotation)
        });
    } else {
        // For Arabic text, don't rotate to maintain readability
        page.drawImage(image, {
            x: drawX,
            y: drawY,
            width: imageWidth,
            height: imageHeight,
            opacity: opacity
        });
    }
}

// Helper function to add image watermark to a page
async function addImageWatermarkToPage(page, settings, width, height, pdfDoc) {
    const { imageFile, opacity, x, y, rotation } = settings;

    return new Promise(async (resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const imageBytes = await fetch(e.target.result).then(res => res.arrayBuffer());

                    let image;
                    try {
                        image = await pdfDoc.embedPng(imageBytes);
                    } catch (pngError) {
                        // Fallback to JPG if PNG fails
                        image = await pdfDoc.embedJpg(imageBytes);
                    }

                    // Calculate image size and position with consistent scaling (matching preview)
                    const originalWidth = image.width;
                    const originalHeight = image.height;

                    // Use the same scaling logic as in preview for consistency
                    const scaleFactor = Math.min(1, Math.min(width / originalWidth, height / originalHeight) * 0.4);
                    const imageWidth = originalWidth * scaleFactor;
                    const imageHeight = originalHeight * scaleFactor;

                    // Use custom position if provided, otherwise center
                    let drawX = (width - imageWidth) / 2;
                    let drawY = (height - imageHeight) / 2;

                    if (x !== undefined) {
                        drawX = (width / 2) + x - (imageWidth / 2);
                    }
                    if (y !== undefined) {
                        drawY = (height / 2) + y - (imageHeight / 2);
                    }

                    // Apply rotation if specified
                    if (rotation !== 0) {
                        page.drawImage(image, {
                            x: drawX,
                            y: drawY,
                            width: imageWidth,
                            height: imageHeight,
                            opacity: opacity,
                            rotate: PDFLib.degrees(rotation)
                        });
                    } else {
                        page.drawImage(image, {
                            x: drawX,
                            y: drawY,
                            width: imageWidth,
                            height: imageHeight,
                            opacity: opacity
                        });
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        } catch (error) {
            reject(error);
        }
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}

// Function to generate thumbnails for images
function generateImageThumbnails(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    document.getElementById('image-to-pdf-thumbnails').style.display = 'block';

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const thumbnailCard = document.createElement('div');
                thumbnailCard.className = 'pdf-thumbnail-card';
                thumbnailCard.style.position = 'relative';

                const pageLabel = document.createElement('div');
                pageLabel.className = 'pdf-thumbnail-label';
                pageLabel.textContent = `Image ${index + 1}`;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxSize = 100;
                let { width, height } = img;

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                thumbnailCard.appendChild(pageLabel);
                thumbnailCard.appendChild(canvas);
                container.appendChild(thumbnailCard);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}

// Function to convert images to PDF
async function convertImagesToPDF() {
    const filesInput = document.getElementById('image-to-pdf-files');
    const files = Array.from(filesInput.files);
    const status = document.getElementById('image-to-pdf-status');

    if (files.length === 0) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select at least one image to convert.';
        status.className = 'status-error';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting images to PDF...';
    status.className = 'status-loading';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Create image element to get dimensions
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            await new Promise((resolve, reject) => {
                img.onload = function() {
                    // Set canvas size to image size
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // Convert to base64
                    const imgData = canvas.toDataURL('image/jpeg', 0.9);

                    // Add to PDF (A4 size)
                    const pdfWidth = 210; // A4 width in mm
                    const pdfHeight = 297; // A4 height in mm

                    // Calculate dimensions to fit A4
                    const imgAspectRatio = img.width / img.height;
                    const pageAspectRatio = pdfWidth / pdfHeight;

                    let imgWidth, imgHeight;
                    if (imgAspectRatio > pageAspectRatio) {
                        imgWidth = pdfWidth;
                        imgHeight = pdfWidth / imgAspectRatio;
                    } else {
                        imgHeight = pdfHeight;
                        imgWidth = pdfHeight * imgAspectRatio;
                    }

                    // Center the image
                    const x = (pdfWidth - imgWidth) / 2;
                    const y = (pdfHeight - imgHeight) / 2;

                    // Add new page for each image except the first
                    if (i > 0) {
                        pdf.addPage();
                    }

                    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
                    resolve();
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(file);
            });
        }

        // Download PDF
        pdf.save('images_to_pdf.pdf');

        status.innerHTML = `<i class="fas fa-check-circle"></i> PDF created successfully with ${files.length} images!`;
        status.className = 'status-success';

    } catch (error) {
        console.error('Error converting images to PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error converting images to PDF. Please try again.';
        status.className = 'status-error';
    }
}

let previewPdfDoc = null;
let previewCurrentSettings = {};

async function previewWatermark() {
    const fileInput = document.getElementById('watermark-file');
    const status = document.getElementById('watermark-status');
    const previewContainer = document.getElementById('watermark-preview-container');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewStatus = document.getElementById('preview-status');

    // Check if required elements exist
    if (!fileInput || !status || !previewContainer || !previewCanvas || !previewStatus) {
        console.error('Preview elements not found. Make sure watermark tool is loaded.');
        if (status) {
            status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Preview elements not found. Please refresh the page.';
            status.className = 'status-error';
        }
        return;
    }

    if (!fileInput.files || !fileInput.files[0]) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a PDF file first.';
        status.className = 'status-error';
        return;
    }

    // Check if PDFLib is loaded
    if (typeof PDFLib === 'undefined') {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PDF library not loaded. Please refresh the page.';
        status.className = 'status-error';
        console.error('PDFLib not loaded');
        return;
    }

    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PDF.js library not loaded. Please refresh the page.';
        status.className = 'status-error';
        console.error('pdfjsLib not loaded');
        return;
    }

    const file = fileInput.files[0];
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating preview...';
    status.className = 'status-loading';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        if (pdfDoc.getPageCount() === 0) {
            throw new Error('PDF has no pages');
        }

        // Get current settings
        const watermarkTypeInput = document.getElementById('watermark-type');
        if (!watermarkTypeInput) {
            throw new Error('Watermark type not configured');
        }

        const watermarkType = watermarkTypeInput.value;
        const settings = getWatermarkSettings(watermarkType);

        if (!settings) {
            throw new Error('Please configure watermark settings');
        }

        // Generate preview
        await generateWatermarkPreview(pdfDoc, settings, previewCanvas);

        // Show preview container
        previewContainer.style.display = 'block';
        previewStatus.textContent = 'Preview generated successfully';

        // Store current settings for auto-update
        previewCurrentSettings = settings;

        status.innerHTML = '<i class="fas fa-check-circle"></i> Preview generated successfully!';
        status.className = 'status-success';

    } catch (error) {
        console.error('Error generating preview:', error);
        previewStatus.textContent = 'Error generating preview: ' + error.message;
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error generating preview. Please check your settings.';
        status.className = 'status-error';
    }
}

function clearPreview() {
    const previewContainer = document.getElementById('watermark-preview-container');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewStatus = document.getElementById('preview-status');

    previewContainer.style.display = 'none';
    previewCanvas.width = 0;
    previewCanvas.height = 0;
    previewStatus.textContent = 'Preview will appear here';
    previewCurrentSettings = {};
}

function getWatermarkSettings(type) {
    // Validate that required DOM elements exist
    if (!document.getElementById('watermark-type')) {
        console.error('Watermark type element not found');
        return null;
    }

    const settings = {
        type: type,
        opacity: 0.3, // Default opacity
        x: 0, // Default position
        y: 0, // Default position
        rotation: 0 // Default rotation
    };

    if (type === 'text') {
        const textInput = document.getElementById('watermark-text');
        if (!textInput) {
            console.error('Watermark text input not found');
            return null;
        }

        const text = textInput.value.trim();
        if (!text) {
            console.error('Watermark text is empty');
            return null;
        }

        settings.text = text;

        // Get font size with fallback and validation
        const fontSizeInput = document.getElementById('watermark-font-size');
        if (fontSizeInput) {
            const fontSize = parseInt(fontSizeInput.value);
            settings.fontSize = (fontSize && fontSize > 0) ? fontSize : 50;
        } else {
            console.warn('Font size input not found, using default');
            settings.fontSize = 50;
        }

        // Get opacity with fallback and validation
        const opacityInput = document.getElementById('watermark-opacity');
        if (opacityInput) {
            const opacity = parseFloat(opacityInput.value);
            settings.opacity = (opacity && opacity >= 0 && opacity <= 1) ? opacity : 0.3;
        } else {
            console.warn('Opacity input not found, using default');
            settings.opacity = 0.3;
        }

        // Get position with fallback and validation
        const xInput = document.getElementById('watermark-x');
        if (xInput) {
            settings.x = parseInt(xInput.value) || 0;
        }

        const yInput = document.getElementById('watermark-y');
        if (yInput) {
            settings.y = parseInt(yInput.value) || 0;
        }

        // Get rotation with fallback and validation
        const rotationInput = document.getElementById('watermark-rotation');
        if (rotationInput) {
            settings.rotation = parseInt(rotationInput.value) || 0;
        }

    } else if (type === 'image') {
        const imageFileInput = document.getElementById('watermark-image');
        if (!imageFileInput) {
            console.error('Watermark image input not found');
            return null;
        }

        if (!imageFileInput.files || !imageFileInput.files[0]) {
            console.error('No watermark image file selected');
            return null;
        }

        settings.imageFile = imageFileInput.files[0];

        // Get opacity with fallback and validation
        const opacityInput = document.getElementById('watermark-image-opacity');
        if (opacityInput) {
            const opacity = parseFloat(opacityInput.value);
            settings.opacity = (opacity && opacity >= 0 && opacity <= 1) ? opacity : 0.3;
        } else {
            console.warn('Image opacity input not found, using default');
            settings.opacity = 0.3;
        }

        // Get position with fallback and validation
        const xInput = document.getElementById('watermark-image-x');
        if (xInput) {
            settings.x = parseInt(xInput.value) || 0;
        }

        const yInput = document.getElementById('watermark-image-y');
        if (yInput) {
            settings.y = parseInt(yInput.value) || 0;
        }

        // Get rotation with fallback and validation
        const rotationInput = document.getElementById('watermark-image-rotation');
        if (rotationInput) {
            settings.rotation = parseInt(rotationInput.value) || 0;
        }
    }

    return settings;
}

async function generateWatermarkPreview(pdfDoc, settings, canvas) {
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Set canvas size to match actual PDF dimensions (no scale for accurate preview)
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Render the original PDF page content first
    try {
        // Load the same PDF using PDF.js for rendering
        const arrayBuffer = await pdfDoc.save();
        const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdfjsDoc.getPage(1);

        const viewport = page.getViewport({ scale: 1.0 }); // Use actual scale for accurate preview
        const renderCanvas = document.createElement('canvas');
        const renderCtx = renderCanvas.getContext('2d');
        renderCanvas.height = viewport.height;
        renderCanvas.width = viewport.width;

        await page.render({
            canvasContext: renderCtx,
            viewport: viewport
        }).promise;

        // Draw the rendered page onto our preview canvas
        ctx.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);

    } catch (error) {
        console.error('Error rendering PDF page:', error);
        // Fallback: fill with white background if PDF rendering fails
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply watermark preview based on type with consistent positioning
    if (settings.type === 'text') {
        await drawTextPreview(ctx, settings, width, height);
    } else if (settings.type === 'image') {
        await drawImagePreview(ctx, settings, width, height);
    }
}

async function drawTextPreview(ctx, settings, pageWidth, pageHeight) {
    const { text, fontSize, opacity, x, y, rotation } = settings;

    // Create a small canvas for text rendering
    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d');

    // Set canvas size based on text length and font size
    const maxWidth = 800;
    const lineHeight = fontSize * 1.2;

    // Check if text contains Arabic
    const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

    // Set font with fallback for Arabic
    let fontFamily = 'Arial, sans-serif';
    if (isArabic) {
        fontFamily = '"Noto Sans Arabic", "Arial Unicode MS", Arial, sans-serif';
    }

    textCtx.font = `${fontSize}px ${fontFamily}`;
    textCtx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
    textCtx.textAlign = isArabic ? 'right' : 'center';
    textCtx.textBaseline = 'middle';

    // Handle text wrapping for long text
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const metrics = textCtx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    // Calculate canvas dimensions
    const textHeight = lines.length * lineHeight;
    const textWidth = Math.max(...lines.map(line => textCtx.measureText(line).width));
    textCanvas.width = Math.min(textWidth + 40, maxWidth);
    textCanvas.height = textHeight + 40;

    // Clear canvas and set background
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

    // Reset font and style
    textCtx.font = `${fontSize}px ${fontFamily}`;
    textCtx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
    textCtx.textAlign = isArabic ? 'right' : 'center';
    textCtx.textBaseline = 'middle';

    // Draw text lines
    const startY = (textCanvas.height - textHeight) / 2;
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight) + (lineHeight / 2);
        const x = isArabic ? textCanvas.width - 20 : textCanvas.width / 2;
        textCtx.fillText(line, x, y);
    });

    // Calculate image size and position with consistent scaling (matching final result)
    const scaleFactor = Math.min(1, Math.min(pageWidth / textCanvas.width, pageHeight / textCanvas.height) * 0.8);
    const imageWidth = textCanvas.width * scaleFactor;
    const imageHeight = textCanvas.height * scaleFactor;

    // Use custom position if provided, otherwise center
    let drawX = (pageWidth - imageWidth) / 2;
    let drawY = (pageHeight - imageHeight) / 2;

    if (x !== undefined) {
        drawX = (pageWidth / 2) + x - (imageWidth / 2);
    }
    if (y !== undefined) {
        drawY = (pageHeight / 2) + y - (imageHeight / 2);
    }

    // Apply rotation if specified
    if (rotation !== 0) {
        ctx.save();
        ctx.translate(drawX + imageWidth/2, drawY + imageHeight/2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.drawImage(textCanvas, -imageWidth/2, -imageHeight/2, imageWidth, imageHeight);
        ctx.restore();
    } else {
        ctx.globalAlpha = opacity;
        ctx.drawImage(textCanvas, drawX, drawY, imageWidth, imageHeight);
    }
}

async function drawImagePreview(ctx, settings, pageWidth, pageHeight) {
    const { imageFile, opacity, x, y, rotation } = settings;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Calculate image size and position with consistent scaling (matching final result)
                const scaleFactor = Math.min(1, Math.min(pageWidth / img.width, pageHeight / img.height) * 0.4);
                const imageWidth = img.width * scaleFactor;
                const imageHeight = img.height * scaleFactor;

                // Use custom position if provided, otherwise center
                let drawX = (pageWidth - imageWidth) / 2;
                let drawY = (pageHeight - imageHeight) / 2;

                if (x !== undefined) {
                    drawX = (pageWidth / 2) + x - (imageWidth / 2);
                }
                if (y !== undefined) {
                    drawY = (pageHeight / 2) + y - (imageHeight / 2);
                }

                // Apply rotation if specified
                if (rotation !== 0) {
                    ctx.save();
                    ctx.translate(drawX + imageWidth/2, drawY + imageHeight/2);
                    ctx.rotate((rotation * Math.PI) / 180);
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(img, -imageWidth/2, -imageHeight/2, imageWidth, imageHeight);
                    ctx.restore();
                } else {
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(img, drawX, drawY, imageWidth, imageHeight);
                }

                resolve();
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}

async function drawPDFPreview(ctx, settings, pageWidth, pageHeight, scale) {
    try {
        const arrayBuffer = await settings.pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: scale * 0.3 });
        const pdfCanvas = document.createElement('canvas');
        const pdfCtx = pdfCanvas.getContext('2d');
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        await page.render({
            canvasContext: pdfCtx,
            viewport: viewport
        }).promise;

        const x = (pageWidth / 2 + settings.x) * scale;
        const y = (pageHeight / 2 + settings.y) * scale;

        // Apply rotation and draw
        if (settings.rotation !== 0) {
            ctx.save();
            ctx.translate(x + pdfCanvas.width/2, y + pdfCanvas.height/2);
            ctx.rotate((settings.rotation * Math.PI) / 180);
            ctx.globalAlpha = settings.opacity;
            ctx.drawImage(pdfCanvas, -pdfCanvas.width/2, -pdfCanvas.height/2);
            ctx.restore();
        } else {
            ctx.globalAlpha = settings.opacity;
            ctx.drawImage(pdfCanvas, x, y);
        }
    } catch (error) {
        console.error('Error rendering PDF preview:', error);
        // Draw a placeholder
        ctx.fillStyle = `rgba(128, 128, 128, ${settings.opacity})`;
        ctx.fillRect(
            (pageWidth / 2 + settings.x) * scale,
            (pageHeight / 2 + settings.y) * scale,
            100 * scale,
            60 * scale
        );
    }
}

// Enhanced PDF Viewer using PDF.js
let pdfDoc = null;
let currentPage = 1;
let scale = 1.5;

async function viewPDF() {
    const fileInput = document.getElementById('view-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a PDF file to view.');
        return;
    }

    const pdfViewer = document.getElementById('pdf-viewer');
    pdfViewer.innerHTML = '<div id="pdf-loading">Loading PDF...</div>';

    try {
        const arrayBuffer = await file.arrayBuffer();

        // Load PDF using PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdfDoc = pdf;

        // Update viewer with controls
        pdfViewer.innerHTML = `
            <div id="pdf-controls" style="text-align: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <button onclick="previousPage()" id="prev-btn" style="padding: 8px 16px; margin: 0 5px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Previous</button>
                <span id="page-info" style="margin: 0 15px; font-weight: bold;">Page 1 of ${pdf.numPages}</span>
                <button onclick="nextPage()" id="next-btn" style="padding: 8px 16px; margin: 0 5px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Next</button>
                <button onclick="zoomIn()" style="padding: 8px 12px; margin: 0 5px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">+</button>
                <button onclick="zoomOut()" style="padding: 8px 12px; margin: 0 5px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">-</button>
                <span id="zoom-info" style="margin-left: 15px; font-size: 0.9em; color: #666;">Zoom: ${Math.round(scale * 100)}%</span>
            </div>
            <div id="pdf-canvas-container" style="text-align: center; overflow: auto; height: 400px; border: 1px solid #ddd; background: #f8f9fa;">
                <canvas id="pdf-canvas"></canvas>
            </div>
        `;

        // Now render the first page after creating the canvas
        await renderPage(1);

        // Update button states
        updateNavigationButtons();

    } catch (error) {
        console.error('Error loading PDF:', error);
        pdfViewer.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Error loading PDF. Please try again.</div>';
    }
}

async function renderPage(pageNum) {
    if (!pdfDoc) return;

    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Update page info
        document.getElementById('page-info').textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;

    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

function nextPage() {
    if (currentPage < pdfDoc.numPages) {
        currentPage++;
        renderPage(currentPage);
        updateNavigationButtons();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
        updateNavigationButtons();
    }
}

function zoomIn() {
    scale += 0.25;
    renderPage(currentPage);
    document.getElementById('zoom-info').textContent = `Zoom: ${Math.round(scale * 100)}%`;
}

function zoomOut() {
    if (scale > 0.5) {
        scale -= 0.25;
        renderPage(currentPage);
        document.getElementById('zoom-info').textContent = `Zoom: ${Math.round(scale * 100)}%`;
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= pdfDoc.numPages;

        prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1';
        nextBtn.style.opacity = currentPage >= pdfDoc.numPages ? '0.5' : '1';
    }
}

// PDF processing functions are now implemented with real functionality above

// PDF Thumbnail Generation
async function generatePDFThumbnails(file, containerId, maxPages = 10, selectable = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = Math.min(pdf.numPages, maxPages);

        container.innerHTML = '';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 0.4; // Reduced scale for better fit
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = 'pdf-thumbnail-canvas';

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Create thumbnail card
            const thumbnailCard = document.createElement('div');
            thumbnailCard.className = 'pdf-thumbnail-card';
            thumbnailCard.dataset.pageNumber = pageNum;
            thumbnailCard.style.position = 'relative';

            // Add click functionality for selection
            if (selectable) {
                thumbnailCard.style.cursor = 'pointer';
                thumbnailCard.addEventListener('click', function() {
                    toggleThumbnailSelection(this, containerId);
                });
            }

            const pageLabel = document.createElement('div');
            pageLabel.className = 'pdf-thumbnail-label';
            pageLabel.textContent = `Page ${pageNum}`;

            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'thumbnail-checkbox';
            checkboxContainer.innerHTML = '<i class="fas fa-check"></i>';
            checkboxContainer.style.display = 'none';

            thumbnailCard.appendChild(checkboxContainer);
            thumbnailCard.appendChild(pageLabel);
            thumbnailCard.appendChild(canvas);
            container.appendChild(thumbnailCard);
        }

        if (pdf.numPages > maxPages) {
            const morePagesLabel = document.createElement('div');
            morePagesLabel.textContent = `... and ${pdf.numPages - maxPages} more pages`;
            morePagesLabel.style.textAlign = 'center';
            morePagesLabel.style.fontSize = '0.8rem';
            morePagesLabel.style.color = '#999';
            morePagesLabel.style.padding = '10px';
            morePagesLabel.style.gridColumn = '1 / -1';
            container.appendChild(morePagesLabel);
        }

        // Add selection info if selectable
        if (selectable) {
            const selectionInfo = document.createElement('div');
            selectionInfo.id = `${containerId}-selection-info`;
            selectionInfo.className = 'selection-info';
            selectionInfo.style.textAlign = 'center';
            selectionInfo.style.marginTop = '15px';
            selectionInfo.style.padding = '10px';
            selectionInfo.style.background = 'rgba(102, 126, 234, 0.1)';
            selectionInfo.style.borderRadius = '8px';
            selectionInfo.style.fontSize = '0.9rem';
            selectionInfo.style.color = '#667eea';
            selectionInfo.textContent = 'Click on the cards to select the pages you want';
            container.parentElement.appendChild(selectionInfo);
        }

    } catch (error) {
        console.error('Error generating thumbnails:', error);
        container.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Error generating thumbnails</div>';
    }
}

// Generate thumbnails for merge tool (multiple files)
async function generateThumbnailsForMerge(files) {
    const container = document.getElementById('merge-thumbnails-grid');
    if (!container) return;

    container.innerHTML = '';
    document.getElementById('merge-thumbnails').style.display = 'block';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Create file label
        const fileLabel = document.createElement('div');
        fileLabel.textContent = `${file.name}`;
        fileLabel.style.fontWeight = 'bold';
        fileLabel.style.marginBottom = '10px';
        fileLabel.style.color = '#667eea';
        fileLabel.style.textAlign = 'center';

        // Create thumbnails container for this file
        const fileThumbnailsContainer = document.createElement('div');
        fileThumbnailsContainer.style.marginBottom = '20px';

        try {
            await generatePDFFileThumbnails(file, fileThumbnailsContainer, 3); // Show first 3 pages per file
        } catch (error) {
            console.error(`Error generating thumbnails for ${file.name}:`, error);
            fileThumbnailsContainer.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Error loading PDF</div>';
        }

        // Create wrapper for file label and thumbnails
        const fileWrapper = document.createElement('div');
        fileWrapper.style.border = '1px solid #ddd';
        fileWrapper.style.borderRadius = '10px';
        fileWrapper.style.padding = '15px';
        fileWrapper.style.marginBottom = '15px';
        fileWrapper.style.background = '#f9f9f9';

        fileWrapper.appendChild(fileLabel);
        fileWrapper.appendChild(fileThumbnailsContainer);
        container.appendChild(fileWrapper);
    }
}

// Helper function to generate thumbnails for a single PDF file
async function generatePDFFileThumbnails(file, container, maxPages = 3) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = Math.min(pdf.numPages, maxPages);

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 0.3;
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.border = '1px solid #ccc';
            canvas.style.borderRadius = '3px';
            canvas.style.margin = '2px';

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Create thumbnail card
            const thumbnailCard = document.createElement('div');
            thumbnailCard.style.textAlign = 'center';
            thumbnailCard.style.display = 'inline-block';
            thumbnailCard.style.margin = '5px';

            const pageLabel = document.createElement('div');
            pageLabel.textContent = `P${pageNum}`;
            pageLabel.style.fontSize = '0.7rem';
            pageLabel.style.marginBottom = '3px';
            pageLabel.style.color = '#666';

            thumbnailCard.appendChild(pageLabel);
            thumbnailCard.appendChild(canvas);
            container.appendChild(thumbnailCard);
        }

        if (pdf.numPages > maxPages) {
            const morePagesLabel = document.createElement('div');
            morePagesLabel.textContent = `+${pdf.numPages - maxPages} more`;
            morePagesLabel.style.fontSize = '0.7rem';
            morePagesLabel.style.color = '#999';
            morePagesLabel.style.textAlign = 'center';
            morePagesLabel.style.display = 'inline-block';
            morePagesLabel.style.margin = '5px';
            morePagesLabel.style.padding = '10px';
            container.appendChild(morePagesLabel);
        }

    } catch (error) {
        throw error;
    }
}

// Thumbnail selection functionality
function toggleThumbnailSelection(card, containerId) {
    const checkbox = card.querySelector('.thumbnail-checkbox');
    const isSelected = card.classList.contains('selected');

    if (isSelected) {
        // Deselect
        card.classList.remove('selected');
        checkbox.style.display = 'none';
        card.style.border = '2px solid transparent';
    } else {
        // Select
        card.classList.add('selected');
        checkbox.style.display = 'block';
        card.style.border = '2px solid #667eea';
    }

    // Update selection info
    updateSelectionInfo(containerId);
}

// Update selection information display
function updateSelectionInfo(containerId) {
    const container = document.getElementById(containerId);
    const infoElement = document.getElementById(`${containerId}-selection-info`);
    const selectedCards = container.querySelectorAll('.pdf-thumbnail-card.selected');
    const totalCards = container.querySelectorAll('.pdf-thumbnail-card').length;

    if (infoElement && selectedCards.length > 0) {
        const selectedPages = Array.from(selectedCards).map(card => card.dataset.pageNumber).join(', ');
        infoElement.textContent = `Selected ${selectedCards.length} of ${totalCards} pages: ${selectedPages}`;
        infoElement.style.background = 'rgba(40, 167, 69, 0.1)';
        infoElement.style.color = '#28a745';
    } else if (infoElement) {
        infoElement.textContent = 'Click on the cards to select the pages you want';
        infoElement.style.background = 'rgba(102, 126, 234, 0.1)';
        infoElement.style.color = '#667eea';
    }
}

// Get selected pages from container
function getSelectedPages(containerId) {
    const container = document.getElementById(containerId);
    const selectedCards = container.querySelectorAll('.pdf-thumbnail-card.selected');
    return Array.from(selectedCards).map(card => parseInt(card.dataset.pageNumber));
}

// Select all pages in container
function selectAllPages(containerId) {
    const container = document.getElementById(containerId);
    const cards = container.querySelectorAll('.pdf-thumbnail-card');
    cards.forEach(card => {
        if (!card.classList.contains('selected')) {
            toggleThumbnailSelection(card, containerId);
        }
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}

// Deselect all pages in container
function deselectAllPages(containerId) {
    const container = document.getElementById(containerId);
    const selectedCards = container.querySelectorAll('.pdf-thumbnail-card.selected');
    selectedCards.forEach(card => {
        toggleThumbnailSelection(card, containerId);
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}

// Split only selected pages
async function splitSelectedPDF() {
    const file = document.getElementById('split-file').files[0];
    const selectedPages = getSelectedPages('split-thumbnails-grid');
    const status = document.getElementById('split-status');

    if (!file) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select a PDF file to split.';
        status.className = 'status-error';
        return;
    }

    if (selectedPages.length === 0) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please select at least one page to split.';
        status.className = 'status-error';
        return;
    }

    // Sort selected pages in ascending order
    selectedPages.sort((a, b) => a - b);

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF with selected pages...';
    status.className = 'status-loading';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();

        // Create new PDF with selected pages in order
        const newPdf = await PDFLib.PDFDocument.create();

        for (let i = 0; i < selectedPages.length; i++) {
            const pageIndex = selectedPages[i] - 1; // Convert to 0-based index
            if (pageIndex >= 0 && pageIndex < totalPages) {
                const [page] = await newPdf.copyPages(pdf, [pageIndex]);
                newPdf.addPage(page);

                // Update progress
                status.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Adding page ${selectedPages[i]}... (${i + 1}/${selectedPages.length})`;
            }
        }

        const newPdfBytes = await newPdf.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `selected_pages_${selectedPages.length}_pages.pdf`;
        downloadLink.textContent = `Download Selected Pages PDF (${selectedPages.length} pages)`;
        downloadLink.className = 'download-link';

        // Update status with download link
        status.innerHTML = `<i class="fas fa-check-circle"></i> PDF created successfully with ${selectedPages.length} selected pages! `;
        status.appendChild(downloadLink);
        status.className = 'status-success';

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.className = 'status-error';
    }
}

// PDF Tools Suite
function selectPDFTool(tool) {
    const contentDiv = document.getElementById('pdf-tool-content');
    let content = '';

    switch(tool) {
        case 'merge':
            content = `
                <h3 style="color: #667eea; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-compress-arrows-alt" style="margin-right: 10px;"></i>
                    Merge PDF Files
                </h3>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">Upload multiple PDF files to combine them into one document</p>
                <div style="text-align: center;">
                    <input type="file" id="merge-files" accept="application/pdf" multiple style="margin: 20px 0; padding: 10px; border: 2px dashed #667eea; border-radius: 10px; width: 80%;">
                    <div id="merge-thumbnails" style="margin: 20px 0; display: none;">
                        <h4 style="color: #667eea; margin-bottom: 15px;">Uploaded PDFs Preview:</h4>
                        <div id="merge-thumbnails-grid" class="pdf-thumbnails-grid"></div>
                    </div>
                    <button onclick="mergePDFs()" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease;">Merge PDFs</button>
                    <div id="merge-status" style="margin-top: 20px; color: #667eea;"></div>
                </div>
            `;
            break;
        case 'split':
            content = `
                <h3 style="color: #f5576c; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-cut" style="margin-right: 10px;"></i>
                    Split PDF
                </h3>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">Upload a PDF file to split it into separate pages</p>
                <div style="text-align: center;">
                    <input type="file" id="split-file" accept="application/pdf" style="margin: 20px 0; padding: 10px; border: 2px dashed #f5576c; border-radius: 10px; width: 80%;">
                    <div id="split-thumbnails" style="margin: 20px 0; display: none;">
                        <h4 style="color: #f5576c; margin-bottom: 15px;">PDF Preview - Select Pages to Split:</h4>
                        <div id="split-thumbnails-grid" class="pdf-thumbnails-grid"></div>
                    </div>
                    <button onclick="splitSelectedPDF()" style="padding: 12px 30px; background: linear-gradient(135deg, #f093fb, #f5576c); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease;">Split Selected Pages</button>
                    <button onclick="selectAllPages('split-thumbnails-grid')" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem; margin-left: 10px;">Select All</button>
                    <button onclick="deselectAllPages('split-thumbnails-grid')" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem; margin-left: 5px;">Deselect All</button>
                    <div id="split-status" style="margin-top: 20px; color: #f5576c;"></div>
                </div>
            `;
            break;
        case 'convert':
            content = `
                <h3 style="color: #fa709a; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-exchange-alt" style="margin-right: 10px;"></i>
                    Convert PDF to Images
                </h3>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">Convert PDF pages to JPG or PNG image formats</p>
                <div style="text-align: center;">
                    <input type="file" id="convert-file" accept="application/pdf" style="margin: 20px 0; padding: 10px; border: 2px dashed #fa709a; border-radius: 10px; width: 80%;">
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 10px; color: #333;">Convert to:</label>
                        <div class="custom-dropdown">
                            <div class="dropdown-trigger" id="convert-dropdown-trigger">
                                <span id="convert-selected-text">JPG Image</span>
                                <span class="dropdown-arrow">▼</span>
                            </div>
                            <div class="dropdown-options" id="convert-dropdown-options">
                                <div class="dropdown-option" data-value="jpg">JPG Image</div>
                                <div class="dropdown-option" data-value="png">PNG Image</div>
                            </div>
                        </div>
                        <input type="hidden" id="convert-format" value="jpg">
                    </div>
                    <button onclick="convertPDF()" style="padding: 12px 30px; background: linear-gradient(135deg, #fa709a, #fee140); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease;">Convert to Image</button>
                    <div id="convert-status" style="margin-top: 20px; color: #fa709a;"></div>
                </div>
            `;
            break;
        case 'viewer':
            content = `
                <h3 style="color: #d299c2; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-eye" style="margin-right: 10px;"></i>
                    PDF Viewer
                </h3>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">View and navigate PDF documents</p>
                <div style="text-align: center;">
                    <input type="file" id="view-file" accept="application/pdf" style="margin: 20px 0; padding: 10px; border: 2px dashed #d299c2; border-radius: 10px; width: 80%;">
                    <button onclick="viewPDF()" style="padding: 12px 30px; background: linear-gradient(135deg, #d299c2, #fef9d7); color: #333; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease;">View PDF</button>
                    <div id="pdf-viewer" style="margin-top: 20px; height: 400px; border: 1px solid #ddd; border-radius: 10px; background: white;"></div>
                </div>
            `;
            break;
        case 'watermark':
            content = `
                <h3 style="color: #667eea; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-water" style="margin-right: 10px;"></i>
                    Add Watermark
                </h3>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">Add text or image watermarks to your document</p>
                <div style="text-align: center;">
                    <input type="file" id="watermark-file" accept="application/pdf" style="margin: 20px 0; padding: 10px; border: 2px dashed #667eea; border-radius: 10px; width: 80%;">
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 10px; color: #333;">Watermark Type:</label>
                        <div class="custom-dropdown">
                            <div class="dropdown-trigger" id="watermark-dropdown-trigger">
                                <span id="watermark-selected-text">Text Watermark</span>
                                <span class="dropdown-arrow">▼</span>
                            </div>
                            <div class="dropdown-options" id="watermark-dropdown-options">
                                <div class="dropdown-option" data-value="text">Text Watermark</div>
                                <div class="dropdown-option" data-value="image">Image Watermark</div>
                            </div>
                        </div>
                        <input type="hidden" id="watermark-type" value="text">
                    </div>
                    <div id="watermark-options" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <div id="text-options">
                            <label style="display: block; margin-bottom: 5px; color: #333;">Watermark Text:</label>
                            <input type="text" id="watermark-text" placeholder="Enter watermark text" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <label style="display: block; margin-bottom: 5px; color: #333;">Font Size:</label>
                            <input type="number" id="watermark-font-size" value="50" min="10" max="200" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <label style="display: block; margin-bottom: 5px; color: #333;">Opacity:</label>
                            <input type="range" id="watermark-opacity" min="0.1" max="1" step="0.1" value="0.3" style="width: 100%; margin-bottom: 10px;">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #333; font-weight: bold;">Position & Rotation:</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                    <div>
                                        <label style="display: block; margin-bottom: 3px; color: #555;">X Position:</label>
                                        <input type="number" id="watermark-x" value="0" step="10" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Center: 0">
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: 3px; color: #555;">Y Position:</label>
                                        <input type="number" id="watermark-y" value="0" step="10" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Center: 0">
                                    </div>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 3px; color: #555;">Rotation Angle:</label>
                                    <select id="watermark-rotation" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="0" selected>0° (No rotation)</option>
                                        <option value="15">15°</option>
                                        <option value="30">30°</option>
                                        <option value="45">45°</option>
                                        <option value="60">60°</option>
                                        <option value="90">90°</option>
                                        <option value="-15">-15°</option>
                                        <option value="-30">-30°</option>
                                        <option value="-45">-45°</option>
                                        <option value="-60">-60°</option>
                                        <option value="-90">-90°</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div id="image-options" style="display: none;">
                            <label style="display: block; margin-bottom: 5px; color: #333;">Watermark Image:</label>
                            <input type="file" id="watermark-image" accept="image/*" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <label style="display: block; margin-bottom: 5px; color: #333;">Opacity:</label>
                            <input type="range" id="watermark-image-opacity" min="0.1" max="1" step="0.1" value="0.3" style="width: 100%; margin-bottom: 10px;">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #333; font-weight: bold;">Position & Rotation:</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                    <div>
                                        <label style="display: block; margin-bottom: 3px; color: #555;">X Position:</label>
                                        <input type="number" id="watermark-image-x" value="0" step="10" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Center: 0">
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: 3px; color: #555;">Y Position:</label>
                                        <input type="number" id="watermark-image-y" value="0" step="10" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Center: 0">
                                    </div>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 3px; color: #555;">Rotation Angle:</label>
                                    <select id="watermark-image-rotation" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="0" selected>0° (No rotation)</option>
                                        <option value="15">15°</option>
                                        <option value="30">30°</option>
                                        <option value="45">45°</option>
                                        <option value="60">60°</option>
                                        <option value="90">90°</option>
                                        <option value="-15">-15°</option>
                                        <option value="-30">-30°</option>
                                        <option value="-45">-45°</option>
                                        <option value="-60">-60°</option>
                                        <option value="-90">-90°</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: center; margin: 20px 0;">
                        <button onclick="previewWatermark()" style="padding: 10px 25px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease; margin-right: 10px;">Preview Watermark</button>
                        <button onclick="clearPreview()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem; transition: transform 0.2s ease;">Clear Preview</button>
                    </div>
                    <div id="watermark-preview-container" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #ddd; text-align: center; display: none;">
                        <h4 style="color: #667eea; margin-bottom: 15px;">Watermark Preview</h4>
                        <div id="watermark-preview" style="max-width: 400px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <canvas id="preview-canvas" style="max-width: 100%; height: auto; border: 1px solid #ddd;"></canvas>
                            <p id="preview-status" style="margin-top: 10px; color: #666; font-size: 0.9rem;">Preview will appear here</p>
                        </div>
                    </div>
                    <button onclick="addWatermark()" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease;">Add Watermark</button>
                    <div id="watermark-status" style="margin-top: 20px; color: #667eea;"></div>
                </div>
            `;
            break;
        case 'image-to-pdf':
            content = `
                <h3 style="color: #ff9a9e; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-image" style="margin-right: 10px;"></i>
                    Convert Images to PDF
                </h3>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">Upload one or more images to convert them into a PDF document</p>
                <div style="text-align: center;">
                    <input type="file" id="image-to-pdf-files" accept="image/*" multiple style="margin: 20px 0; padding: 10px; border: 2px dashed #ff9a9e; border-radius: 10px; width: 80%;">
                    <div id="image-to-pdf-thumbnails" style="margin: 20px 0; display: none;">
                        <h4 style="color: #ff9a9e; margin-bottom: 15px;">Selected Images Preview:</h4>
                        <div id="image-to-pdf-thumbnails-grid" class="pdf-thumbnails-grid"></div>
                    </div>
                    <button onclick="convertImagesToPDF()" style="padding: 12px 30px; background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #333; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: transform 0.2s ease;">Convert to PDF</button>
                    <div id="image-to-pdf-status" style="margin-top: 20px; color: #ff9a9e;"></div>
                </div>
            `;
            break;
    }

    contentDiv.innerHTML = content;
    contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (tool === 'merge') {
        const mergeFilesInput = document.getElementById('merge-files');
        if (mergeFilesInput) {
            mergeFilesInput.addEventListener('change', function() {
                const files = Array.from(this.files);
                if (files.length > 0) {
                    generateThumbnailsForMerge(files);
                }
            });
        }
    } else if (tool === 'split') {
        const splitFileInput = document.getElementById('split-file');
        if (splitFileInput) {
            splitFileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    document.getElementById('split-thumbnails').style.display = 'block';
                    generatePDFThumbnails(file, 'split-thumbnails-grid', 20, true); // Enable selection, show more pages
                }
            });
        }
    } else if (tool === 'image-to-pdf') {
        const imageToPdfFilesInput = document.getElementById('image-to-pdf-files');
        if (imageToPdfFilesInput) {
            imageToPdfFilesInput.addEventListener('change', function() {
                const files = Array.from(this.files);
                if (files.length > 0) {
                    generateImageThumbnails(files, 'image-to-pdf-thumbnails-grid');
                }
            });
        }
    }
}

// Text Counter functions
function calculateTextStats() {
    const text = document.getElementById('text-input-area').value;

    // حساب عدد الأحرف مع المسافات
    const charCount = text.length;

    // حساب عدد الأحرف بدون المسافات
    const charNoSpaceCount = text.replace(/\s/g, '').length;

    // حساب عدد الكلمات (افتراض أن الكلمات مفصولة بمسافات أو فواصل)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // حساب عدد السطور (بناءً على فواصل السطر)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const lineCount = lines.length;

    // حساب عدد الفقرات (بناءً على فواصل الفقرات)
    const paragraphs = text.split('\n\n').filter(para => para.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // عرض النتائج
    document.getElementById('char-count').textContent = charCount;
    document.getElementById('char-no-space-count').textContent = charNoSpaceCount;
    document.getElementById('word-count').textContent = wordCount;
    document.getElementById('line-count').textContent = lineCount;
    document.getElementById('paragraph-count').textContent = paragraphCount;
}

function clearTextStats() {
    document.getElementById('text-input-area').value = '';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('char-no-space-count').textContent = '0';
    document.getElementById('word-count').textContent = '0';
    document.getElementById('line-count').textContent = '0';
    document.getElementById('paragraph-count').textContent = '0';
}

// Calculator functions
function appendToDisplay(value) {
    const display = document.getElementById('calc-display');
    if (display) {
        display.value += value;
    }
}

function clearDisplay() {
    const display = document.getElementById('calc-display');
    if (display) {
        display.value = '';
    }
}

function calculate() {
    const display = document.getElementById('calc-display');
    if (display) {
        try {
            display.value = eval(display.value);
        } catch (error) {
            display.value = 'Error';
        }
    }
}

// Custom Dropdown Functionality for Convert Tool
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dropdown functionality when PDF tool content is loaded
    const originalSelectPDFTool = selectPDFTool;
    selectPDFTool = function(tool) {
        originalSelectPDFTool(tool);

    // Initialize dropdown for convert tool
        if (tool === 'convert') {
            setTimeout(() => {
                initializeConvertDropdown();
            }, 100);
        }
        // Initialize dropdown for watermark tool
        if (tool === 'watermark') {
            setTimeout(() => {
                initializeWatermarkDropdown();
                // إضافة معالج حدث لتغيير عرض خيارات العلامة المائية
                const watermarkTypeInput = document.getElementById('watermark-type');
                if (watermarkTypeInput) {
                    watermarkTypeInput.addEventListener('change', function() {
                        const type = this.value;
                        const textOptions = document.getElementById('text-options');
                        const imageOptions = document.getElementById('image-options');

                        // إخفاء جميع الخيارات أولاً
                        if (textOptions) textOptions.style.display = 'none';
                        if (imageOptions) imageOptions.style.display = 'none';

                        // إظهار الخيارات المناسبة حسب النوع المختار
                        if (type === 'text' && textOptions) {
                            textOptions.style.display = 'block';
                        } else if (type === 'image' && imageOptions) {
                            imageOptions.style.display = 'block';
                        }

                        // Auto-update preview if file is loaded
                        setTimeout(() => {
                            if (document.getElementById('watermark-file').files[0]) {
                                previewWatermark();
                            }
                        }, 100);
                    });

                    // تفعيل الحدث الأولي لإظهار خيارات النص الافتراضية
                    watermarkTypeInput.dispatchEvent(new Event('change'));
                }

                // Add auto-update for watermark settings
                const watermarkInputs = [
                    'watermark-text', 'watermark-font-size', 'watermark-opacity',
                    'watermark-x', 'watermark-y', 'watermark-rotation',
                    'watermark-image', 'watermark-image-opacity',
                    'watermark-image-x', 'watermark-image-y', 'watermark-image-rotation'
                ];

                watermarkInputs.forEach(inputId => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.addEventListener('input', function() {
                            // Debounce the preview update
                            clearTimeout(window.watermarkPreviewTimeout);
                            window.watermarkPreviewTimeout = setTimeout(() => {
                                if (document.getElementById('watermark-file').files[0] &&
                                    document.getElementById('watermark-type').value) {
                                    previewWatermark();
                                }
                            }, 500);
                        });

                        // For file inputs, update immediately
                        if (input.type === 'file') {
                            input.addEventListener('change', function() {
                                if (document.getElementById('watermark-file').files[0] &&
                                    document.getElementById('watermark-type').value) {
                                    previewWatermark();
                                }
                            });
                        }
                    }
                });

                // Add event listener for main file input
                const mainFileInput = document.getElementById('watermark-file');
                if (mainFileInput) {
                    mainFileInput.addEventListener('change', function() {
                        if (this.files[0] && document.getElementById('watermark-type').value) {
                            previewWatermark();
                        }
                    });
                }
            }, 100);
        }
    };
});

function initializeConvertDropdown() {
    const dropdownTrigger = document.getElementById('convert-dropdown-trigger');
    const dropdownOptions = document.getElementById('convert-dropdown-options');
    const dropdownOptionElements = dropdownOptions.querySelectorAll('.dropdown-option');
    const selectedText = document.getElementById('convert-selected-text');

    if (!dropdownTrigger || !dropdownOptions) return;

    // Toggle dropdown on click
    dropdownTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = dropdownTrigger.classList.contains('active');

        // Close all other dropdowns first
        document.querySelectorAll('.dropdown-trigger.active').forEach(trigger => {
            if (trigger !== dropdownTrigger) {
                trigger.classList.remove('active');
                const options = trigger.nextElementSibling;
                options.classList.remove('show');
            }
        });

        // Toggle current dropdown
        if (isActive) {
            dropdownTrigger.classList.remove('active');
            dropdownOptions.classList.remove('show');
        } else {
            dropdownTrigger.classList.add('active');
            dropdownOptions.classList.add('show');
        }
    });

    // Handle option selection
    dropdownOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const text = this.textContent;

            // Remove selected class from all options
            dropdownOptionElements.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            this.classList.add('selected');

            // Update selected text
            selectedText.textContent = text;

            // Close dropdown
            dropdownTrigger.classList.remove('active');
            dropdownOptions.classList.remove('show');

            // Update convert format value for the convertPDF function
            const convertFormatInput = document.getElementById('convert-format');
            if (convertFormatInput) {
                convertFormatInput.value = value;
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownTrigger.contains(e.target) && !dropdownOptions.contains(e.target)) {
            dropdownTrigger.classList.remove('active');
            dropdownOptions.classList.remove('show');
        }
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}


function initializeWatermarkDropdown() {
    const dropdownTrigger = document.getElementById('watermark-dropdown-trigger');
    const dropdownOptions = document.getElementById('watermark-dropdown-options');
    const dropdownOptionElements = dropdownOptions.querySelectorAll('.dropdown-option');
    const selectedText = document.getElementById('watermark-selected-text');

    if (!dropdownTrigger || !dropdownOptions) return;

    // Toggle dropdown on click
    dropdownTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = dropdownTrigger.classList.contains('active');

        // Close all other dropdowns first
        document.querySelectorAll('.dropdown-trigger.active').forEach(trigger => {
            if (trigger !== dropdownTrigger) {
                trigger.classList.remove('active');
                const options = trigger.nextElementSibling;
                options.classList.remove('show');
            }
        });

        // Toggle current dropdown
        if (isActive) {
            dropdownTrigger.classList.remove('active');
            dropdownOptions.classList.remove('show');
        } else {
            dropdownTrigger.classList.add('active');
            dropdownOptions.classList.add('show');
        }
    });

    // Handle option selection
    dropdownOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const text = this.textContent;

            // Remove selected class from all options
            dropdownOptionElements.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            this.classList.add('selected');

            // Update selected text
            selectedText.textContent = text;

            // Close dropdown
            dropdownTrigger.classList.remove('active');
            dropdownOptions.classList.remove('show');

            // Update watermark type value for the addWatermark function
            const watermarkTypeInput = document.getElementById('watermark-type');
            if (watermarkTypeInput) {
                watermarkTypeInput.value = value;
                // Trigger the options display change
                const event = new Event('change');
                watermarkTypeInput.dispatchEvent(event);
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownTrigger.contains(e.target) && !dropdownOptions.contains(e.target)) {
            dropdownTrigger.classList.remove('active');
            dropdownOptions.classList.remove('show');
        }
    });
}

// PDF Maker functionality
function createPDF() {
    const title = document.getElementById('pdf-title').value.trim();
    const content = document.getElementById('pdf-content').value.trim();
    const fontSize = parseInt(document.getElementById('pdf-font-size').value);
    const imageFile = document.getElementById('pdf-image').files[0];
    const status = document.getElementById('pdf-maker-status');

    if (!content && !imageFile) {
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter text content or select an image.';
        status.style.color = '#dc3545';
        return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    status.style.color = '#28a745';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Set font size
        pdf.setFontSize(fontSize);

        // Add title if provided
        if (title) {
            pdf.setFontSize(fontSize + 4);
            pdf.text(title, 20, 20);
            pdf.setFontSize(fontSize);
        }

        // Add text content if provided
        if (content) {
            const lines = pdf.splitTextToSize(content, 170); // Wrap text to fit page width
            const startY = title ? 35 : 20;
            pdf.text(lines, 20, startY);
        }

        // Add image if provided
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate image dimensions to fit page
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const margin = 20;

                    let imgWidth = img.width;
                    let imgHeight = img.height;

                    // Scale image to fit page with margins
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin;

                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        const scale = Math.min(widthRatio, heightRatio);

                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Center image on page
                    const x = (pageWidth - imgWidth) / 2;
                    const y = title || content ? 50 : 20;

                    pdf.addImage(e.target.result, 'JPEG', x, y, imgWidth, imgHeight);

                    // Download PDF
                    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
                    pdf.save(fileName);

                    status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
                    status.style.color = '#28a745';
                };
                img.onerror = function() {
                    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading image. Please try again.';
                    status.style.color = '#dc3545';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error reading image file.';
                status.style.color = '#dc3545';
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Download PDF without image
            const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'created_document.pdf';
            pdf.save(fileName);

            status.innerHTML = '<i class="fas fa-check-circle"></i> PDF created successfully!';
            status.style.color = '#28a745';
        }

    } catch (error) {
        console.error('Error creating PDF:', error);
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error creating PDF. Please try again.';
        status.style.color = '#dc3545';
    }
}