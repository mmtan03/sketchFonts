/*
 * SPDX-FileCopyrightText: 2025 明明有点Tan
 * SPDX-License-Identifier: MIT
 */

// 控制变量
let textInput, seedInput, generateBtn, randomFontsCheckbox, autoRefreshCheckbox, gifExport;
let fontSizeSlider, lineSpacingSlider, letterSpacingSlider, alignSelect;
let offsetXSlider, offsetYSlider; // 新增偏移滑杆
let frameCounter, wordInfo, bgFileInput, colorPicker;
let prevBgBtn, nextBgBtn, noBgBtn, bgInfo, bgControls;
let currentSeed = 12345;
let frameCount = 0;
let refreshInterval = 20;
let needsRedraw = false;

// 字体和背景
let availableFonts = [];
let backgroundImages = [];
let currentBgIndex = -1;

// 颜色设置
let textColor = '#000000';

const styleNames = [
    "斜线填充", "竖线填充", "手绘轮廓", "密集斜线", 
    "涂鸦乱线", "三角图案", "水彩笔刷", "点状纹理", "粗笔刷"
];

// 预加载字体
function preload() {
    const fontFiles = [
        'fonts/EDNimpkish-Regular.ttf',
        'fonts/GT-Pressura-Mono-Regular-Italic.ttf',
        'fonts/TypeType-TT-Norms-Bold.ttf'
    ];
    
    for (let fontFile of fontFiles) {
        let font = loadFont(fontFile);
        availableFonts.push(font);
    }
}

function setup() {
    let canvas = createCanvas(1080, 1440);
    canvas.parent('canvas-container');
    
    // 获取控件
    textInput = select('#textInput');
    seedInput = select('#seedInput');
    generateBtn = select('#generateBtn');
    gifExport = select('#gifExport');
    randomFontsCheckbox = select('#randomFonts');
    autoRefreshCheckbox = select('#autoRefresh');
    fontSizeSlider = select('#fontSizeSlider');
    lineSpacingSlider = select('#lineSpacingSlider');
    letterSpacingSlider = select('#letterSpacingSlider');
    alignSelect = select('#alignSelect');
    offsetXSlider = select('#offsetXSlider'); // 新增
    offsetYSlider = select('#offsetYSlider'); // 新增
    frameCounter = select('#frameCounter');
    wordInfo = select('#wordInfo');
    colorPicker = select('#colorPicker');
    
    // 背景图片控件
    bgFileInput = select('#bgFile');
    bgControls = select('#bgControls');
    prevBgBtn = select('#prevBg');
    nextBgBtn = select('#nextBg');
    noBgBtn = select('#noBg');
    bgInfo = select('#bgInfo');
    
    // 设置事件监听
    textInput.input(handleTextChange);
    seedInput.input(handleSeedChange);
    generateBtn.mousePressed(regenerateLayout);
    gifExport.mousePressed(savegif);//export GIF
    randomFontsCheckbox.changed(regenerateLayout);
    bgFileInput.changed(handleBackgroundImages);
    colorPicker.input(handleColorChange);
    
    // 背景切换按钮事件
    prevBgBtn.mousePressed(prevBackground);
    nextBgBtn.mousePressed(nextBackground);
    noBgBtn.mousePressed(removeBackground);
    
    // 滑块事件
    fontSizeSlider.input(updateSliderValues);
    lineSpacingSlider.input(updateSliderValues);
    letterSpacingSlider.input(updateSliderValues);
    alignSelect.changed(updateSliderValues);
    offsetXSlider.input(updateSliderValues); // 新增
    offsetYSlider.input(updateSliderValues); // 新增
    
    // 初始化
    updateSliderValues();
    regenerateLayout();
    //savegif();
}

function draw() {
    frameCount++;
    
    let shouldRedraw = needsRedraw;
    if (autoRefreshCheckbox.checked() && frameCount % refreshInterval === 0) {
        shouldRedraw = true;
    }
    
    if (shouldRedraw) {
        needsRedraw = false;
        background(255);
        
        // 绘制当前背景图片
        if (currentBgIndex >= 0 && currentBgIndex < backgroundImages.length) {
            image(backgroundImages[currentBgIndex], 0, 0, width, height);
        }
        
        drawAllLetters();
        updateWordInfo();
    }
    
    // 更新帧计数器
    if (autoRefreshCheckbox.checked()) {
        let remaining = refreshInterval - (frameCount % refreshInterval);
        frameCounter.html(`下次刷新: ${remaining}帧`);
    } else {
        frameCounter.html('自动刷新已关闭');
    }
}

// 处理文本变化
function handleTextChange() {
    layoutManager.parseText(textInput.value());
    regenerateLayout();
}

// 处理种子变化
function handleSeedChange() {
    currentSeed = parseInt(seedInput.value()) || 12345;
    regenerateLayout();
}

// 处理颜色变化
function handleColorChange() {
    textColor = colorPicker.value();
    needsRedraw = true;
}

// 更新滑块数值显示
function updateSliderValues() {
    let fontSize = parseInt(fontSizeSlider.value());
    let lineSpacing = parseFloat(lineSpacingSlider.value());
    let letterSpacing = parseFloat(letterSpacingSlider.value());
    let alignment = alignSelect.value();
    let offsetX = parseInt(offsetXSlider.value());
    let offsetY = parseInt(offsetYSlider.value());
    
    select('#fontSizeValue').html(fontSize);
    select('#lineSpacingValue').html(lineSpacing);
    select('#letterSpacingValue').html(letterSpacing);
    select('#offsetXValue').html(offsetX);
    select('#offsetYValue').html(offsetY);
    
    layoutManager.updateSettings(fontSize, lineSpacing, letterSpacing, alignment);
    layoutManager.updateOffsets(offsetX, offsetY); // 新增偏移设置
    regenerateLayout();
}

// 重新生成布局
function regenerateLayout() {
    layoutManager.parseText(textInput.value());
    layoutManager.calculateLayout(
        width, 
        height, 
        currentSeed, 
        randomFontsCheckbox.checked(), 
        availableFonts
    );
    needsRedraw = true;
}

function savegif() {
    saveGif('sketch.gif', 2);
}
// 绘制所有字母
function drawAllLetters() {
    for (let config of layoutManager.letterConfigs) {
        push();
        translate(config.x, config.y);
        
        if (config.font) {
            textFont(config.font);
        }
        
        // 使用选定的颜色
        let letterColor = color(textColor);
        
        drawLetterWithStyle(config.letter, config.style, config.font, letterColor);
        pop();
    }
}

// 更新信息显示
function updateWordInfo() {
    wordInfo.html(layoutManager.getLayoutInfo());
}

// 根据风格绘制字母
function drawLetterWithStyle(letter, style, font, letterColor) {
    let localSeed = currentSeed + letter.charCodeAt(0) + style * 1000 + frameCount;
    randomSeed(localSeed);
    
    switch(style) {
        case 0: drawDiagonalLines(letter, font, letterColor); break;
        case 1: drawVerticalLines(letter, font, letterColor); break;
        case 2: drawHanddrawnOutline(letter, font, letterColor); break;
        case 3: drawHanddrawnOutline(letter, font, letterColor); break;
        // case 3: drawDenseDiagonal(letter, font, letterColor); break;
        case 4: drawScribble(letter, font, letterColor); break;
        case 5: drawTrianglePattern(letter, font, letterColor); break;
        case 6: drawWatercolor(letter, font, letterColor); break;
        case 7: drawDotted(letter, font, letterColor); break;
        case 8: drawBoldBrush(letter, font, letterColor); break;
    }
}

// 创建字母图形缓冲区
function createLetterGraphics(letter, font) {
    let letterSize = layoutManager.fontSize;
    let pg = createGraphics(letterSize * 1.2, letterSize * 1.2);
    
    if (font) pg.textFont(font);
    pg.textSize(letterSize);
    pg.textAlign(CENTER, CENTER);
    pg.fill(0);
    pg.text(letter, pg.width/2, pg.height/2);
    return pg;
}

// 斜线填充
function drawDiagonalLines(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    strokeWeight(2);
    stroke(letterColor);
    
    for (let i = -bounds/2; i < bounds/2; i += 6) {
        for (let j = -bounds/2; j < bounds/2; j += 1) {
            let x = i + j * 0.5;
            let y = j;
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    let offset = noise(i * 0.02, j * 0.02, frameCount * 0.01) * 3 - 1.5;
                    let len = 6 + random(-1, 1);
                    line(x + offset, y, x + len + offset, y + len);
                }
            }
        }
    }
}

// 竖线填充
function drawVerticalLines(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    stroke(letterColor);
    
    for (let x = -bounds/2; x < bounds/2; x += 4) {
        let linePoints = [];
        for (let y = -bounds/2; y < bounds/2; y += 2) {
            let px = x + bounds/2;
            let py = y + bounds/2;
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    linePoints.push({x: x, y: y});
                }
            }
        }
        
        if (linePoints.length > 0) {
            strokeWeight(1.5 + random(-0.3, 0.8));
            noFill();
            beginShape();
            for (let p of linePoints) {
                let offset = noise(p.x * 0.02, p.y * 0.02, frameCount * 0.01) * 2 - 1;
                vertex(p.x + offset, p.y);
            }
            endShape();
        }
    }
}

// 手绘轮廓
function drawHanddrawnOutline(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    stroke(letterColor);
    strokeWeight(4);
    noFill();
    
    let edgePoints = [];
    let step = 3;
    
    for (let x = 0; x < bounds; x += step) {
        for (let y = 0; y < bounds; y += step) {
            let c = pg.get(x, y);
            if (alpha(c) > 128) {
                let isEdge = false;
                for (let dx = -step; dx <= step && !isEdge; dx += step) {
                    for (let dy = -step; dy <= step && !isEdge; dy += step) {
                        if (dx === 0 && dy === 0) continue;
                        let nx = x + dx;
                        let ny = y + dy;
                        if (nx >= 0 && nx < bounds && ny >= 0 && ny < bounds) {
                            let nc = pg.get(nx, ny);
                            if (alpha(nc) < 128) {
                                isEdge = true;
                            }
                        }
                    }
                }
                
                if (isEdge) {
                    edgePoints.push({x: x - bounds/2, y: y - bounds/2});
                }
            }
        }
    }
    
    for (let layer = 0; layer < 2; layer++) {
        stroke(letterColor);
        strokeWeight(5 - layer * 2.5);
        
        for (let i = 0; i < edgePoints.length - 1; i++) {
            if (random() < 0.2) {
                let p1 = edgePoints[i];
                let p2 = edgePoints[i + 1];
                let distance = dist(p1.x, p1.y, p2.x, p2.y);
                
                if (distance < 80) {
                    let offsetX1 = noise(i * 0.1, layer * 10, frameCount * 0.01) * 2 - 1;
                    let offsetY1 = noise(i * 0.1 + 100, layer * 10, frameCount * 0.01) * 2 - 1;
                    let offsetX2 = noise((i+1) * 0.1, layer * 10, frameCount * 0.01) * 2 - 1;
                    let offsetY2 = noise((i+1) * 0.1 + 100, layer * 10, frameCount * 0.01) * 2 - 1;
                    
                    line(p1.x + offsetX1, p1.y + offsetY1, p2.x + offsetX2, p2.y + offsetY2);
                }
            }
        }
    }
}

// 密集斜线
function drawDenseDiagonal(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    stroke(letterColor);
    strokeWeight(1);
    
    for (let i = -bounds; i < bounds; i += 2) {
        let points = [];
        for (let j = -bounds/2; j < bounds/2; j += 1) {
            let x = i + j;
            let y = j;
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    points.push({x: x, y: y});
                }
            }
        }
        
        if (points.length > 2) {
            noFill();
            beginShape();
            for (let p of points) {
                let offset = noise(p.x * 2.21, p.y * 2.21, frameCount * 0.005) * 11.5 - 1.75;
                vertex(p.x + offset, p.y + offset);
            }
            endShape();
        }
    }
}

// 涂鸦乱线
function drawScribble(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    stroke(letterColor);
    strokeWeight(1);
    noFill();
    
    for (let n = 0; n < 66; n++) {
        beginShape();
        let x = random(-bounds/2, bounds/2);
        let y = random(-bounds/2, bounds/2);
        
        for (let i = 0; i < 110; i++) {
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    vertex(x, y);
                }
            }
            
            x += random(-18, 18);
            y += random(-10, 10);
            x = constrain(x, -bounds/2, bounds/2);
            y = constrain(y, -bounds/2, bounds/2);
        }
        endShape();
    }
}

// 三角图案
function drawTrianglePattern(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    fill(letterColor);
    noStroke();
    
    let size = 12;
    for (let x = -bounds/2; x < bounds/2; x += size) {
        for (let y = -bounds/2; y < bounds/2; y += size) {
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    push();
                    translate(x, y);
                    rotate(noise(x * 0.02, y * 0.02, frameCount * 0.01) * PI);
                    let s = size * (0.7 + noise(x * 0.1, y * 0.1, frameCount * 0.01) * 0.6);
                    triangle(0, -s/2, -s/2, s/2, s/2, s/2);
                    pop();
                }
            }
        }
    }
}

// 水彩笔刷
function drawWatercolor(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    noStroke();
    
    for (let layer = 0; layer < 4; layer++) {
        for (let i = 0; i < 200; i++) {
            let x = random(-bounds/2, bounds/2);
            let y = random(-bounds/2, bounds/2);
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 228) {
                    fill(red(letterColor), green(letterColor), blue(letterColor), 215 + random(20));
                    let size = random(3, 15);
                    let offsetX = random(-3, 3);
                    let offsetY = random(-3, 3);
                    ellipse(x + offsetX, y + offsetY, size, size);
                }
            }
        }
    }
}

// 点状纹理
function drawDotted(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    fill(letterColor);
    noStroke();
    
    for (let x = -bounds/2; x < bounds/2; x += 3) {
        for (let y = -bounds/2; y < bounds/2; y += 3) {
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    let size = 1.2 + noise(x * 0.05, y * 0.05, frameCount * 0.01) * 5.0;
                    let offsetX = random(-4.8, 4.8);
                    let offsetY = random(-12.8, 12.8);
                    ellipse(x + offsetX, y + offsetY, size, size);
                }
            }
        }
    }
}

// 粗笔刷
function drawBoldBrush(letter, font, letterColor) {
    let pg = createLetterGraphics(letter, font);
    let bounds = pg.width;
    
    noStroke();
    fill(letterColor);
    
    for (let angle = 0; angle < TWO_PI; angle += 0.08) {
        for (let r = 0; r < bounds/2; r += 2) {
            let x = cos(angle) * r;
            let y = sin(angle) * r;
            let px = x + bounds/2;
            let py = y + bounds/2;
            
            if (px >= 0 && px < bounds && py >= 0 && py < bounds) {
                let c = pg.get(px, py);
                if (alpha(c) > 128) {
                    let size = 5 + noise(angle * 5, r * 0.05, frameCount * 0.01) * 2;
                    let offsetX = noise(angle * 10, r * 0.1, frameCount * 0.01) * 3 - 1.5;
                    let offsetY = noise(angle * 10 + 100, r * 0.1, frameCount * 0.01) * 3 - 1.5;
                    ellipse(x + offsetX, y + offsetY, size, size * 0.7);
                }
            }
        }
    }
}

// 处理多个背景图片上传
function handleBackgroundImages() {
    let files = bgFileInput.elt.files;
    if (files.length > 0) {
        backgroundImages = [];
        let loadedCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            let reader = new FileReader();
            reader.onload = function(e) {
                let img = createImg(e.target.result);
                img.hide();
                backgroundImages.push(img);
                loadedCount++;
                
                if (loadedCount === files.length) {
                    currentBgIndex = 0;
                    updateBgControls();
                    needsRedraw = true;
                }
            };
            reader.readAsDataURL(files[i]);
        }
    }
}

function prevBackground() {
    if (backgroundImages.length > 0) {
        currentBgIndex = (currentBgIndex - 1 + backgroundImages.length) % backgroundImages.length;
        updateBgControls();
        needsRedraw = true;
    }
}

function nextBackground() {
    if (backgroundImages.length > 0) {
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        updateBgControls();
        needsRedraw = true;
    }
}

function removeBackground() {
    currentBgIndex = -1;
    updateBgControls();
    needsRedraw = true;
}

function updateBgControls() {
    if (backgroundImages.length > 0) {
        bgControls.style('display', 'block');
        if (currentBgIndex >= 0) {
            bgInfo.html(`${currentBgIndex + 1}/${backgroundImages.length}`);
        } else {
            bgInfo.html(`无背景/${backgroundImages.length}`);
        }
    } else {
        bgControls.style('display', 'none');
    }
}