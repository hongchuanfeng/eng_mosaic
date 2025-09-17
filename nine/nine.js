class NineGridCutter {
    constructor() {
        this.images = [];
        this.cutResults = [];
        this.isProcessing = false;
        this.currentGrid = { rows: 3, cols: 3 };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupGridTypeToggle();
        this.setupPresetGrids();
        this.setupCustomGrid();
        this.setupOptionToggles();
    }

    bindEvents() {
        // 文件上传
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 滑块控制
        document.getElementById('borderWidth').addEventListener('input', (e) => this.updateBorderWidthValue(e));
        
        // 按钮事件
        document.getElementById('cutImagesBtn').addEventListener('click', () => this.cutAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewCutting());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
        document.getElementById('downloadPreviewBtn').addEventListener('click', () => this.downloadPreview());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('请选择图片文件');
            return;
        }

        if (imageFiles.length > 10) {
            alert('最多只能上传10张图片');
            return;
        }

        imageFiles.forEach(file => this.loadImage(file));
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    dataUrl: e.target.result,
                    img: img
                };
                
                this.images.push(imageData);
                this.displayImages();
                this.showSettings();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayImages() {
        const imagesGrid = document.getElementById('imagesGrid');
        imagesGrid.innerHTML = '';

        this.images.forEach(imageData => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="image-preview" />
                <div class="image-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="image-name">${imageData.name}</div>
                <div class="image-actions">
                    <button class="btn btn-primary" onclick="nineGridCutter.cutSingleImage('${imageData.id}')">切图</button>
                    <button class="btn btn-secondary" onclick="nineGridCutter.removeImage('${imageData.id}')">删除</button>
                </div>
            `;
            imagesGrid.appendChild(imageItem);
        });
    }

    removeImage(imageId) {
        this.images = this.images.filter(img => img.id != imageId);
        this.displayImages();
        
        if (this.images.length === 0) {
            this.hideSettings();
        }
    }

    showSettings() {
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('imagesSection').style.display = 'block';
    }

    hideSettings() {
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('imagesSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
    }

    setupGridTypeToggle() {
        document.querySelectorAll('input[name="gridType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleGridTypeChange(e));
        });
    }

    handleGridTypeChange(e) {
        const presetGroup = document.getElementById('presetGridGroup');
        const customGroup = document.getElementById('customGridGroup');
        
        if (e.target.value === 'preset') {
            presetGroup.style.display = 'flex';
            customGroup.style.display = 'none';
        } else {
            presetGroup.style.display = 'none';
            customGroup.style.display = 'flex';
            this.updateCustomGridPreview();
        }
    }

    setupPresetGrids() {
        document.querySelectorAll('.grid-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectPresetGrid(e));
        });
    }

    selectPresetGrid(e) {
        // 更新选中状态
        document.querySelectorAll('.grid-option').forEach(opt => {
            opt.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // 更新网格设置
        const rows = parseInt(e.currentTarget.dataset.rows);
        const cols = parseInt(e.currentTarget.dataset.cols);
        this.currentGrid = { rows, cols };
    }

    setupCustomGrid() {
        document.getElementById('customRows').addEventListener('input', () => this.updateCustomGridPreview());
        document.getElementById('customCols').addEventListener('input', () => this.updateCustomGridPreview());
    }

    updateCustomGridPreview() {
        const rows = parseInt(document.getElementById('customRows').value) || 1;
        const cols = parseInt(document.getElementById('customCols').value) || 1;
        
        this.currentGrid = { rows, cols };
        
        const preview = document.getElementById('customGridPreview');
        preview.innerHTML = '';
        
        // 创建网格预览
        const cellWidth = 100 / cols;
        const cellHeight = 100 / rows;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.style.left = (c * cellWidth) + '%';
                cell.style.top = (r * cellHeight) + '%';
                cell.style.width = cellWidth + '%';
                cell.style.height = cellHeight + '%';
                preview.appendChild(cell);
            }
        }
    }

    setupOptionToggles() {
        // 边框设置切换
        document.getElementById('addBorders').addEventListener('change', (e) => {
            document.getElementById('borderSettings').style.display = e.target.checked ? 'flex' : 'none';
        });
        
        // 编号设置切换
        document.getElementById('addNumbers').addEventListener('change', (e) => {
            document.getElementById('numberSettings').style.display = e.target.checked ? 'flex' : 'none';
        });
    }

    updateBorderWidthValue(e) {
        document.getElementById('borderWidthValue').textContent = e.target.value + 'px';
    }

    async cutSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const cutResult = await this.cutImage(imageData);
        if (cutResult) {
            this.cutResults.push(cutResult);
            this.displayResults();
        }
    }

    async cutAllImages() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.cutResults = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `正在切图: ${imageData.name}`);
            
            try {
                const cutResult = await this.cutImage(imageData);
                if (cutResult) {
                    this.cutResults.push(cutResult);
                }
                completed++;
            } catch (error) {
                console.error('切图失败:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, '切图完成');
        this.isProcessing = false;
        this.displayResults();
    }

    async cutImage(imageData) {
        return new Promise((resolve) => {
            const { rows, cols } = this.currentGrid;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const originalWidth = imageData.width;
            const originalHeight = imageData.height;
            
            // 计算每个切片的尺寸
            const sliceWidth = Math.floor(originalWidth / cols);
            const sliceHeight = Math.floor(originalHeight / rows);
            
            const cutImages = [];
            const settings = this.getCutSettings();
            
            // 生成每个切片
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const sliceCanvas = document.createElement('canvas');
                    const sliceCtx = sliceCanvas.getContext('2d');
                    
                    // 设置画布尺寸
                    sliceCanvas.width = sliceWidth;
                    sliceCanvas.height = sliceHeight;
                    
                    // 计算源图像中的位置
                    const sourceX = col * sliceWidth;
                    const sourceY = row * sliceHeight;
                    
                    // 绘制切片
                    sliceCtx.drawImage(
                        imageData.img,
                        sourceX, sourceY, sliceWidth, sliceHeight,
                        0, 0, sliceWidth, sliceHeight
                    );
                    
                    // 应用效果
                    this.applyEffects(sliceCtx, sliceWidth, sliceHeight, settings, row, col);
                    
                    // 生成数据URL
                    const mimeType = this.getMimeType(imageData.file, settings.outputFormat);
                    const dataUrl = sliceCanvas.toDataURL(mimeType, 0.9);
                    
                    // 创建Blob
                    const byteString = atob(dataUrl.split(',')[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], { type: mimeType });
                    
                    // 生成文件名
                    const originalName = imageData.name.split('.')[0];
                    const fileExtension = this.getFileExtension(imageData.file.name, settings.outputFormat);
                    const fileName = `${originalName}_${row + 1}_${col + 1}.${fileExtension}`;
                    
                    cutImages.push({
                        id: Date.now() + Math.random(),
                        name: fileName,
                        size: blob.size,
                        width: sliceWidth,
                        height: sliceHeight,
                        dataUrl: dataUrl,
                        blob: blob,
                        mimeType: mimeType,
                        row: row + 1,
                        col: col + 1
                    });
                }
            }
            
            // 生成预览图
            this.generatePreviewImageAsync(imageData, cutImages, settings).then(previewImage => {
                resolve({
                    id: Date.now() + Math.random(),
                    originalImage: imageData,
                    cutImages: cutImages,
                    previewImage: previewImage,
                    grid: { rows, cols },
                    settings: settings
                });
            });
        });
    }

    applyEffects(ctx, width, height, settings, row, col) {
        // 添加边框
        if (settings.addBorders) {
            ctx.strokeStyle = settings.borderColor;
            ctx.lineWidth = settings.borderWidth;
            ctx.strokeRect(0, 0, width, height);
        }
        
        // 添加编号
        if (settings.addNumbers) {
            this.addNumber(ctx, width, height, settings, row, col);
        }
        
        // 添加阴影
        if (settings.addShadows) {
            this.addShadow(ctx, width, height);
        }
    }

    addNumber(ctx, width, height, settings, row, col) {
        const number = (row * this.currentGrid.cols) + col + 1;
        const position = settings.numberPosition;
        const style = settings.numberStyle;
        
        // 设置字体
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // 计算位置
        let x, y;
        const padding = 10;
        
        switch (position) {
            case 'top-left':
                x = padding;
                y = padding + 20;
                break;
            case 'top-right':
                x = width - padding - 20;
                y = padding + 20;
                break;
            case 'bottom-left':
                x = padding;
                y = height - padding;
                break;
            case 'bottom-right':
                x = width - padding - 20;
                y = height - padding;
                break;
            case 'center':
            default:
                x = width / 2 - 10;
                y = height / 2 + 10;
                break;
        }
        
        if (style === 'circle') {
            // 绘制圆形背景
            ctx.beginPath();
            ctx.arc(x + 10, y - 10, 15, 0, 2 * Math.PI);
            ctx.fillStyle = '#007bff';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制数字
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(number.toString(), x + 10, y + 5);
        } else if (style === 'square') {
            // 绘制方形背景
            ctx.fillStyle = '#007bff';
            ctx.fillRect(x, y - 20, 20, 20);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y - 20, 20, 20);
            
            // 绘制数字
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(number.toString(), x + 10, y - 5);
        } else {
            // 纯文字
            ctx.strokeText(number.toString(), x, y);
            ctx.fillText(number.toString(), x, y);
        }
    }

    addShadow(ctx, width, height) {
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }

    async generatePreviewImageAsync(originalImage, cutImages, settings) {
        if (!settings.generatePreview) return null;
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const { rows, cols } = this.currentGrid;
            const previewWidth = 300;
            const previewHeight = 300;
            
            canvas.width = previewWidth;
            canvas.height = previewHeight;
            
            // 绘制背景
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, previewWidth, previewHeight);
            
            // 计算每个预览切片的尺寸
            const sliceWidth = previewWidth / cols;
            const sliceHeight = previewHeight / rows;
            
            // 等待所有图片加载完成
            let loadedCount = 0;
            const totalImages = cutImages.length;
            
            cutImages.forEach(cutImage => {
                const img = new Image();
                img.onload = () => {
                    const col = cutImage.col - 1;
                    const row = cutImage.row - 1;
                    
                    ctx.drawImage(
                        img,
                        col * sliceWidth,
                        row * sliceHeight,
                        sliceWidth,
                        sliceHeight
                    );
                    
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        // 所有图片加载完成后添加网格线
                        this.addGridLines(ctx, previewWidth, previewHeight, rows, cols, sliceWidth, sliceHeight);
                        resolve(canvas.toDataURL('image/png'));
                    }
                };
                img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.addGridLines(ctx, previewWidth, previewHeight, rows, cols, sliceWidth, sliceHeight);
                        resolve(canvas.toDataURL('image/png'));
                    }
                };
                img.src = cutImage.dataUrl;
            });
            
            // 如果没有图片，直接返回
            if (totalImages === 0) {
                this.addGridLines(ctx, previewWidth, previewHeight, rows, cols, sliceWidth, sliceHeight);
                resolve(canvas.toDataURL('image/png'));
            }
        });
    }

    addGridLines(ctx, previewWidth, previewHeight, rows, cols, sliceWidth, sliceHeight) {
        // 添加网格线
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        
        for (let i = 1; i < cols; i++) {
            const x = i * sliceWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, previewHeight);
            ctx.stroke();
        }
        
        for (let i = 1; i < rows; i++) {
            const y = i * sliceHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(previewWidth, y);
            ctx.stroke();
        }
    }

    getCutSettings() {
        const addBorders = document.getElementById('addBorders').checked;
        const addNumbers = document.getElementById('addNumbers').checked;
        const addShadows = document.getElementById('addShadows').checked;
        const keepAspectRatio = document.getElementById('keepAspectRatio').checked;
        const borderColor = document.getElementById('borderColor').value;
        const borderWidth = parseInt(document.getElementById('borderWidth').value);
        const numberPosition = document.getElementById('numberPosition').value;
        const numberStyle = document.querySelector('input[name="numberStyle"]:checked').value;
        const generateZip = document.getElementById('generateZip').checked;
        const generatePreview = document.getElementById('generatePreview').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        
        return {
            addBorders,
            addNumbers,
            addShadows,
            keepAspectRatio,
            borderColor,
            borderWidth,
            numberPosition,
            numberStyle,
            generateZip,
            generatePreview,
            outputFormat
        };
    }

    getMimeType(originalFile, outputFormat) {
        if (outputFormat === 'original') {
            return originalFile.type;
        }
        
        switch (outputFormat) {
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            default:
                return originalFile.type;
        }
    }

    getFileExtension(originalFileName, outputFormat) {
        if (outputFormat === 'original') {
            return originalFileName.split('.').pop().toLowerCase();
        }
        
        switch (outputFormat) {
            case 'jpeg':
                return 'jpg';
            case 'png':
                return 'png';
            case 'webp':
                return 'webp';
            default:
                return originalFileName.split('.').pop().toLowerCase();
        }
    }

    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
    }

    updateProgress(current, total, text) {
        const percentage = (current / total) * 100;
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = text;
    }

    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        this.cutResults.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            let previewHtml = '';
            if (result.previewImage) {
                previewHtml = `
                    <div class="result-preview-container">
                        <img src="${result.previewImage}" alt="预览图" class="result-preview" />
                        <div class="preview-overlay">
                            <button class="btn btn-sm btn-primary" onclick="nineGridCutter.showDetailedPreview('${result.id}')">查看详情</button>
                        </div>
                    </div>
                `;
            } else {
                previewHtml = `
                    <div class="result-preview-container">
                        <div class="result-preview" style="background: #f8f9fa; display: flex; align-items: center; justify-content: center; color: #666; flex-direction: column;">
                            <div>预览图生成中...</div>
                            <button class="btn btn-sm btn-primary" onclick="nineGridCutter.regeneratePreview('${result.id}')">重新生成</button>
                        </div>
                    </div>
                `;
            }
            
            resultItem.innerHTML = `
                ${previewHtml}
                <div class="result-info">${result.grid.rows}×${result.grid.cols} 网格 | ${result.cutImages.length} 张图片</div>
                <div class="result-name">${result.originalImage.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="nineGridCutter.downloadSingleResult('${result.id}')">下载全部</button>
                    <button class="btn btn-info" onclick="nineGridCutter.downloadPreview('${result.id}')">下载预览</button>
                    <button class="btn btn-secondary" onclick="nineGridCutter.showDetailedPreview('${result.id}')">详细预览</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewCutting() {
        if (this.images.length === 0) {
            alert('请先选择图片');
            return;
        }

        const firstImage = this.images[0];
        const cutResult = await this.cutImage(firstImage);
        
        if (cutResult) {
            this.showDetailedPreview(cutResult.id);
        }
    }

    showDetailedPreview(resultId) {
        const result = this.cutResults.find(r => r.id == resultId);
        if (!result) return;

        // 创建预览窗口
        const previewWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>切图详细预览 - ${result.originalImage.name}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px; 
                            background: #f5f5f5;
                            margin: 0;
                        }
                        .preview-container { 
                            display: flex; 
                            gap: 30px; 
                            justify-content: center; 
                            flex-wrap: wrap;
                            max-width: 1200px;
                            margin: 0 auto;
                        }
                        .preview-item { 
                            text-align: center; 
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .preview-item h3 { 
                            margin-bottom: 15px; 
                            color: #333;
                        }
                        .preview-item img { 
                            max-width: 300px; 
                            max-height: 300px; 
                            border: 1px solid #ddd; 
                            border-radius: 4px;
                        }
                        .grid-preview { 
                            display: grid; 
                            grid-template-columns: repeat(${result.grid.cols}, 1fr); 
                            gap: 2px; 
                            max-width: 300px; 
                            margin: 0 auto;
                            border: 2px solid #007bff;
                            border-radius: 4px;
                            padding: 2px;
                        }
                        .grid-preview img { 
                            width: 100%; 
                            height: auto; 
                            border: 1px solid #ccc; 
                            border-radius: 2px;
                        }
                        .info-panel {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            margin: 20px auto;
                            max-width: 1200px;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 15px;
                        }
                        .info-item {
                            padding: 10px;
                            background: #f8f9fa;
                            border-radius: 4px;
                        }
                        .info-label {
                            font-weight: bold;
                            color: #666;
                            font-size: 12px;
                        }
                        .info-value {
                            color: #333;
                            margin-top: 5px;
                        }
                    </style>
                </head>
                <body>
                    <h2 style="text-align: center; color: #333; margin-bottom: 30px;">切图详细预览</h2>
                    
                    <div class="info-panel">
                        <h3 style="margin-top: 0;">图片信息</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">原图名称</div>
                                <div class="info-value">${result.originalImage.name}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">原图尺寸</div>
                                <div class="info-value">${result.originalImage.width} × ${result.originalImage.height}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">文件大小</div>
                                <div class="info-value">${this.formatFileSize(result.originalImage.size)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">网格类型</div>
                                <div class="info-value">${result.grid.rows} × ${result.grid.cols}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">切片数量</div>
                                <div class="info-value">${result.cutImages.length} 张</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">切片尺寸</div>
                                <div class="info-value">${result.cutImages[0]?.width || 0} × ${result.cutImages[0]?.height || 0}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="preview-container">
                        <div class="preview-item">
                            <h3>原图</h3>
                            <img src="${result.originalImage.dataUrl}" alt="原图" />
                        </div>
                        <div class="preview-item">
                            <h3>切图结果</h3>
                            <div class="grid-preview">
                                ${result.cutImages.map(img => `<img src="${img.dataUrl}" alt="${img.name}" title="${img.name}" />`).join('')}
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `);
    }

    async regeneratePreview(resultId) {
        const result = this.cutResults.find(r => r.id == resultId);
        if (!result) return;

        // 重新生成预览图
        const settings = this.getCutSettings();
        const previewImage = await this.generatePreviewImageAsync(result.originalImage, result.cutImages, settings);
        
        // 更新结果
        result.previewImage = previewImage;
        
        // 重新显示结果
        this.displayResults();
    }

    downloadSingleResult(resultId) {
        const result = this.cutResults.find(r => r.id == resultId);
        if (!result) return;

        result.cutImages.forEach(cutImage => {
            setTimeout(() => {
                this.downloadImage(cutImage.dataUrl, cutImage.name);
            }, 100);
        });
    }

    downloadPreview(resultId) {
        const result = this.cutResults.find(r => r.id == resultId);
        if (!result || !result.previewImage) return;

        this.downloadImage(result.previewImage, `${result.originalImage.name.split('.')[0]}_preview.png`);
    }

    downloadImage(dataUrl, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.cutResults.forEach(result => {
            this.downloadSingleResult(result.id);
        });
    }

    async downloadAsZip() {
        if (this.cutResults.length === 0) {
            alert('没有可下载的图片');
            return;
        }

        // 由于浏览器限制，我们无法直接创建ZIP文件
        // 这里提供一个替代方案：逐个下载
        alert('由于浏览器限制，将逐个下载图片文件');
        this.downloadAllImages();
    }

    downloadPreview() {
        this.cutResults.forEach(result => {
            if (result.previewImage) {
                this.downloadPreview(result.id);
            }
        });
    }

    clearAll() {
        this.images = [];
        this.cutResults = [];
        this.displayImages();
        this.hideSettings();
        document.getElementById('fileInput').value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 初始化应用
let nineGridCutter;
document.addEventListener('DOMContentLoaded', () => {
    nineGridCutter = new NineGridCutter();
});
