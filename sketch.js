//網站資訊視覺化p5.js畫布
//////////////////////////////////////////////////全域變數//////////////////////////////////////////////////////////////
let butterflyImages = []; // 存储上传的蝴蝶图像                                                                      
let outline; // 存储巨型蝴蝶的外轮廓                                                                               
let selectedButterflyData = null;
let isModalOpen = false;
let depth = true;
let yes = 1;
let clickedButterfly = null;
let currentRecordId = null; // 在客户端全局保存 recordId              
let isTooltipVisible = false;
let existingPoints = [];
let isRandomMoving = false;
let scaleFactorUP;   // 动态定义 scaleFactorUP
let scaleFactorDOWN; // 动态定义 scaleFactorDOWN

let globalWing1Width = 0; // 默认值为0，或者一个合理的默认值
let globalWing1Height = 0;

// 定义一个数组来存储接收到的数据
let dataBuffer = [];
const MAX_BATCH_SIZE = 10; // 每批处理的最大数据量
const PROCESS_INTERVAL = 1000; // 处理间隔时间，单位为毫秒


// 确保在使用之前初始化 socket
const socket = io();
// 客户端代码
socket.on('recordId', (data) => {
    currentRecordId = data.recordId;
    console.log("Received recordId:", currentRecordId);
    console.log("p5.js loaded:", !!window.p5); // Should log true if p5.js is loaded


});
// 现在你可以使用 socket 变量了
socket.on('message', function (data) {
    if (data && data.recordId && data.recordId === currentRecordId) {
        console.log(data);
    }
});
socket.on('search', (data) => {
    console.log(`Searching for: ${data.inputValue}`);
    searchButterflyByName(data.inputValue);
});


function searchButterflyByName(name) {
    if (!name) {
        console.error("No input value for search.");
        return;
    }
    let found = butterflyImages.find(b => b.customData.name.toLowerCase() === name.toLowerCase());
    if (found) {

        moveAllButterfliesToOutline();
        simulateClickOnButterfly(found);  // 模仿点击事件
    } else {
        console.log('No butterfly found with the given name.');
        socket.emit('no_butterfly_found', { message: 'No butterfly found with the given name.' });
    }
}
function simulateClickOnButterfly(butterfly) {
    if (!butterfly) {
        console.error("Invalid butterfly object for simulation.");
        return;
    }


    // 更新全局变量
    clickedButterfly = butterfly;
    isTooltipVisible = true;


    // 显示并更新工具提示
    let tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `
        <div class="tooltip-item tooltip-item-usernum">${butterfly.customData.name}的蝴蝶</div>
        <div class="tooltip-div">${butterfly.customData.title}</div>
        <img src="${butterfly.customData.img}" alt="Butterfly Image">
        <div class="tooltip-grid">
            <div class="tooltip-item">第 ${butterfly.customData.usernum} 位玩家</div>
            <div class="tooltip-item"><span class="tooltip-label">此斑紋人數</span>${butterfly.customData.match}</div>
            <div class="tooltip-item"><span class="tooltip-label">我想說的話</span>${butterfly.customData.comment}</div>
        </div>
    `;
    tooltip.style.display = "block";
    document.querySelector('.modal').style.display = "block";
}


//用於上傳=在畫布的四边隨機生成起點 畫布大小為頁面大小(windowWidth, windowHeight)
function getRandomStartPosition() {
    let x, y;
    let edge = floor(random(2)); // 随机选择一个边（右、左）
    switch (edge) {

        case 0: // 右侧
            x = width / 2 + globalWing1Width*2+500;
            y = random(-height / 2, height / 2);
            z = random(-100, 0);
            break;

        case 1: // 左侧
            x = -width / 2 - globalWing1Width*2-500;
            y = random(-height / 2, height / 2);
            z = random(-100, 0);
            break;
    }
    
    return createVector(x, y, z);


}
//用於切換類別=畫布外生成起點 
function getRandomStartPositionOutside() {//這邊有問題
    let x, y;
    let edge = floor(random(2)); // 随机选择一个边（右、左）


    switch (edge) {

        case 0: // 右侧外
            x = width / 2 + globalWing1Width*2+1000; // 确保在屏幕右侧外
            y = random(-height / 2, height / 2); // 调整为 3D 环境
            z = random(-100, 0); // 使得z坐标足够远
            break;

        case 1: // 左侧外
            x = -width / 2 - globalWing1Width*2-1000; // 确保在屏幕左侧外
            y = random(-height / 2, height / 2); // 调整为 3D 环境
            z = random(-100, 0); // 使得z坐标足够远
            break;
    }

// console.log('座標',x,y,z)
    return createVector(x, y, z);
    // let x = width / 2 + 300; // 确保在屏幕右侧外
    // let y = random(-height / 2, height / 2); // 调整为 3D 环境
    // return createVector(x, y)
}

// 在屏幕内生成一个随机位置
function getRandomPositionWithinScreen() {
    let x = random(-width / 2 + globalWing1Width*2, width / 2 - globalWing1Width*2);
    let y = random(-height / 2 + globalWing1Height, height / 2 - globalWing1Height*2-50);
    let z = 0;
    return createVector(x, y, z);
}


////////////////////////////////////////////////////////???????????????????????????????????????//////////////////////////////////////////


function setup() {
    let canvasHeight = windowHeight; // 根據視窗高度來設定畫布高度
    renderer = createCanvas(windowWidth, canvasHeight - 200, WEBGL).parent('canvasHolder');

    // 根据画布宽度计算比例因子
    calculateScaleFactors();

    setupLighting(); // 设置光照
    window.addEventListener('click', handleMouseClick);
    outline = createButterflyOutline(); // 创建并存储蝴蝶外轮廓
    drawButterflyOutline(outline);
    bindCategoryButtons(); // 绑定分类按钮的事件
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight - 200);
    calculateScaleFactors(); // 重新计算因子
    outline = createButterflyOutline(); // 重新创建蝴蝶外轮廓
    drawButterflyOutline(outline);
 
}
function resizeCanvasHolder() {
    var canvasHolder = document.getElementById('canvasHolder');
    if (canvasHolder) {
        canvasHolder.style.width = document.body.clientWidth + 'px';
        canvasHolder.style.height = window.innerHeight + 'px';
    }
}

function calculateScaleFactors() {
    let aspectRatio = width / height;
    scaleFactorUP = width * 0.00175 / sqrt(aspectRatio); // 使用 sqrt 函数平衡宽高比影响
    scaleFactorDOWN = width * 0.0014 / sqrt(aspectRatio);
}

document.addEventListener('DOMContentLoaded', resizeCanvasHolder);
window.addEventListener('resize', resizeCanvasHolder);




function setupLighting() {
    // 添加光照效果
    ambientLight(200); // 环境光
    pointLight(255, 255, 255, 0, 0, 500); // 点光源
    // 设置线条宽度和阴影效果
    stroke(255); // 设置线条颜色
    strokeWeight(5); // 增加线条宽度
}


function bindCategoryButtons() {
    document.getElementById('ALL').addEventListener('click', () => handleCategoryClick('all'));
    document.getElementById('category1').addEventListener('click', () => handleCategoryClick('Freckle'));
    // 假设您有多个分类，这里以分类名为ID进行绑定
    document.getElementById('category2').addEventListener('click', () => handleCategoryClick('Agespots'));
    document.getElementById('category3').addEventListener('click', () => handleCategoryClick('Sweatspots'));
    // 假设您有多个分类，这里以分类名为ID进行绑定
    document.getElementById('category4').addEventListener('click', () => handleCategoryClick('Mole'));
    document.getElementById('category5').addEventListener('click', () => handleCategoryClick('Atopicdermatitis'));
    // 假设您有多个分类，这里以分类名为ID进行绑定
    document.getElementById('category6').addEventListener('click', () => handleCategoryClick('Melasma'));
    document.getElementById('category7').addEventListener('click', () => handleCategoryClick('Vitiligo'));
    // 假设您有多个分类，这里以分类名为ID进行绑定
    document.getElementById('category8').addEventListener('click', () => handleCategoryClick('Other'));


}

function handleCategoryClick(data) {

    if (data === 'all') {
        //移入所有蝴蝶
        moveAllButterfliesToOutline();
    } else {
        //根據範圍選擇蝴蝶
        updateButterflies(data);
    }
    drawButterflyOutline(outline);
}


/////////////////////////////////////////////////////////根據範圍選擇蝴蝶，並將他們移動到頁面外或頁面內///////////////////////////////////////
function updateButterflies(spot) {
    for (let butterfly of butterflyImages) {
        let newTargetPos;
        if (butterfly.customData.title === spot) {

            //在範圍內


            //範圍內 不在螢幕=沿bezier移入輪廓後在頁面中隨機飛舞
            if (!isPointInsideScreen(butterfly.position.x, butterfly.position.y)) {

                //在輪廓生成一個隨機起點
                newTargetPos = getRandomPositionWithinOutline(outline);
                updateButterflyPosition(butterfly, newTargetPos);

                //開始隨機飛行
                butterfly.isRandomMoving = true;

            }
            //範圍內 在螢幕內=在頁面中隨機飛舞
            else {
                //隨機飛行

                newTargetPos = getRandomPositionWithinScreen();
                updateButterflyPosition(butterfly, newTargetPos); butterfly.isRandomMoving = true;
            }
        }

        //不在範圍內
        else {

            //範圍外 在螢幕=言bezier移出
            if (isPointInsideScreen(butterfly.position.x, butterfly.position.y)) {
                //飛出銀幕外
                newTargetPos = getRandomStartPositionOutside();
                updateButterflyPosition(butterfly, newTargetPos);
                butterfly.isRandomMoving = false;

            }

            //範圍外 不在螢幕=維持
            else {
                // 如果蝴蝶已经在屏幕外，则保持当前位置
                continue;
            }

        }
        // 更新蝴蝶的目标位置
        updateButterflyPosition(butterfly, newTargetPos);
    }
}


//////////////////////////////////////////////////////////////更新蝴蝶位置,并重新计算贝塞尔曲线控制点///////////////////////
function updateButterflyPosition(butterfly, newTargetPos) {
    butterfly.targetPos = newTargetPos;//蝴蝶将朝向新位置移动
    butterfly.bezierControlPoints = butterfly.calculateBezierControlPoints(butterfly.position, newTargetPos);
    butterfly.progress = 0; //蝴蝶开始向新目标位置移动时，进度会从0开始，并随着蝴蝶的移动逐渐增加，直到达到目的地
}



///将所有蝴蝶移动到轮廓内
function moveAllButterfliesToOutline() {


    for (let butterfly of butterflyImages) {
     
        butterfly.isRandomMoving = false;
        //不在頁面中或者不在輪廓內的蝴蝶 都要移動到輪廓內
        if (!isPointInsideOutline(butterfly.position.x, butterfly.position.y, outline) || !isPointInsideScreen(butterfly.position.x, butterfly.position.y)) {//檢查xy就好 z沒差
            let newTargetPos = getRandomPositionWithinOutline(outline);
            updateButterflyPosition(butterfly, newTargetPos);
            // 确保蝴蝶按照贝塞尔曲线移动
            //   butterfly.isRandomMoving = false;
        }


    }
}




//检查鼠标是否悬停在工具提示上
function mouseOverTooltip() {
    let tooltip = document.getElementById("tooltip");
    let tooltipRect = tooltip.getBoundingClientRect();
    return (
        mouseX >= tooltipRect.left && mouseX <= tooltipRect.right &&
        mouseY >= tooltipRect.top && mouseY <= tooltipRect.bottom
    );
}
function getClickedButterflyImage() {
    // Replace this with the actual logic to get the clicked butterfly image
    // This is a placeholder and should be replaced with the actual butterfly object
    return clickedButterfly;
}

// 检查鼠标是否在模态框上
function mouseOverModal() {
    let modal = document.getElementById("myModal");
    let modalRect = modal.getBoundingClientRect();
    return (
        mouseX >= modalRect.left && mouseX <= modalRect.right &&
        mouseY >= modalRect.top && mouseY <= modalRect.bottom
    );
}





// 假设你已经有一个socket连接 不須知道是誰傳的 只是將資料及圖片放入資訊視覺化
socket.on('infovisionInfo update', (data) => {
    if (data) {
        // 当接收到图片信息时，调用函数处理
        console.log("接收到的图片信息: ", data);
        let infovisionInfo = data.infovisionInfo;
        // 处理接收到的图片信息，例如显示图片等
        setTimeout(() => {
            handleReceivedImage(infovisionInfo);
            // displayCustomData(infovisionInfo);
            handleCategoryClick(infovisionInfo.spot);


        }, 5000);


    }
    else {
        console.error('無法接收图片信息: ')
    }
});


// 定时处理接收到的数据
setInterval(() => {
    if (dataBuffer.length > 0) {
        processBatchData();
    }
}, PROCESS_INTERVAL);


// 处理一批数据
function processBatchData() {
    // 取出一定数量的数据进行处理
    const batch = dataBuffer.splice(0, MAX_BATCH_SIZE);
    batch.forEach(infovisionInfo => {
        handleReceivedImage(infovisionInfo);
        handleCategoryClick(infovisionInfo.spot);
    });
}
function handleReceivedImage(infovisionInfo) {


    let imageUrl = infovisionInfo.scanmixUrl;


    // 检查imageUrl是否为空或未定义
    if (!imageUrl) {
        console.error('Received an empty or undefined imageUrl.');
        return; // 直接返回，不执行后续的加载图像操作
    }
    // 照片大小
    loadImage(imageUrl, (img) => {
        let biggerImg = createImage(img.width * 0.1, img.height * 0.1);
        biggerImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width * 0.1, img.height * 0.1);


        imageMode(CENTER);
        // 然后从放大的图片中获取两个翅膀的部分
        let wing1 = biggerImg.get(0, 0, biggerImg.width / 2, biggerImg.height);
        let wing2 = biggerImg.get(biggerImg.width / 2, 0, biggerImg.width / 2, biggerImg.height);

        globalWing1Width = wing1.width; // 更新全局宽度
        globalWing1Height = wing1.height; // 更新全局高度

        let startPos = getRandomStartPosition();
        let targetPos = getRandomPositionWithinOutline(outline);


        // 使用从广播中接收到的数据填充customData
        let customData = {


            title: infovisionInfo.spot,
            name: infovisionInfo.userName,
            comment: infovisionInfo.typing2,
            match: infovisionInfo.prompt1MatchCount, // 从广播的信息中获取文件名
            usernum: infovisionInfo.sequenceNumber,
            img: infovisionInfo.scanmixUrl
        };


        let newButterfly = new Butterfly(wing1, wing2, startPos, targetPos, customData);
        butterflyImages.push(newButterfly);
        // 可以在这里或其他地方重新绘制画布，以显示新添加的蝴蝶
    });
}


// 注意：假设 loadImage, getRandomStartPosition, getRandomPositionWithinOutline, 和 outline 等函数/变量已经定义好



let isClick = false;

document.getElementById('explore-button').addEventListener('click', function () {
    isClick = !isClick;
    console.log(isClick);
});


// draw 函数
function draw() {
    if (yes == 1) {
        console.log("yes=" + yes);
        depth = !depth;
        if (depth) renderer.drawingContext.enable(renderer.drawingContext.DEPTH_TEST);
        else renderer.drawingContext.disable(renderer.drawingContext.DEPTH_TEST);
        yes = yes + 1;
    }
    clear(); // 使用 clear() 替代 background()


    //设置相机位置和方向以实现俯视效果
    //    let cameraX = 0; // 相机在 X 轴的位置
    //    let cameraY = -5000; // 相机在 Y 轴的位置，负值表示在场景上方
    //    let cameraZ = (height/2.0) / tan(PI*30.0 / 180.0); // 相机在 Z 轴的位置
    //    let centerX = 0; // 观察点 X 坐标
    //    let centerY = 0; // 观察点 Y 坐标
    //    let centerZ = 0; // 观察点 Z 坐标
    //    let upX = 0; // 上方向 X 分量
    //    let upY = 1; // 上方向 Y 分量
    //    let upZ = 0; // 上方向 Z 分量


    //    camera(cameraX, cameraY, cameraZ, centerX, centerY, centerZ, upX, upY, upZ);


    // 绘制其余的场景
    drawButterflyOutline(outline);




    let tooltip = document.getElementById("tooltip"); // 确保获取 tooltip 元素
    //  let tooltipVisible = false; // 标记是否显示工具提示
    mouseOverButterfly = false;


    for (let butterfly of butterflyImages) {
        //    butterfly.drawPath();
        butterfly.update();
        butterfly.display();
        //   butterfly.randomMove();
        if (butterfly.isMouseOver()) {
            mouseOverButterfly = true;
            if (mouseIsPressed && !isTooltipVisible) {
                clickedButterfly = butterfly;
                isTooltipVisible = true;
                if (isClick) {
                    tooltip.style.display = "block"; // 就是這個在搞
                } else {
                    tooltip.style.display = "none"; // 就是這個在搞
                }
                // tooltip.style.left = (mouseX + 15) + "px";
                // tooltip.style.top = mouseY + "px";
                tooltip.innerHTML = `
                <div class="tooltip-item tooltip-item-usernum"> ${butterfly.customData.name}的蝴蝶</div>
                <div class="tooltip-div"> ${butterfly.customData.title}</div>
                <img src="${butterfly.customData.img}" alt=" Butterfly Image">
                <div class="tooltip-grid">
                    <div class="tooltip-item">第 ${butterfly.customData.usernum} 位玩家</div>
                    <div class="tooltip-item"><span class="tooltip-label">此斑紋人數</span>${butterfly.customData.match}</div>
                    <div class="tooltip-item"><span class="tooltip-label">我想說的話</span>${butterfly.customData.comment}</div>
                </div>
                `;

                if (isClick) {
                    document.querySelector('.modal').style.display = "block";
                } else {
                    document.querySelector('.modal').style.display = "none";
                }
            }
        }
    }
    // 监听遮罩层的点击事件
    document.querySelector('.modal').addEventListener('click', function () {
        // 隐藏工具提示
        document.getElementById("tooltip").style.display = "none";
        // 隐藏遮罩层
        this.style.display = "none";
        // 设置工具提示不可见
        isTooltipVisible = false;
        // 重置点击的蝴蝶
        clickedButterfly = null;
    });


}


////////////////////////////////////STEP1=生成贝塞尔曲线上的点////////////////////////////////////////////////////////
function getBezierPoints(x1, y1, x2, y2, x3, y3, x4, y4, numPoints) {
    let points = [];
    for (let t = 0; t <= 1; t += 1 / numPoints) {
        let x = bezierPoint(x1, x2, x3, x4, t);
        let y = bezierPoint(y1, y2, y3, y4, t);
        points.push(createVector(x, y));
    }
    return points;
}
//////////////////////////////////STEP2=建立蝴蝶轮廓////////////////////////////////////////////

//////////////////////////////////STEP2=建立蝴蝶轮廓////////////////////////////////////////////
function createButterflyOutline() {
    let outlinePoints = [];

    // let scaleFactorUP = 1.5; // 上翅size調整
    // let scaleFactorDOWN = 1; // 下翅size調整
    let downShift = 20; // 整体下移10个单位

    clear();
    // noFill();


    // 右上翅膀
    outlinePoints = outlinePoints.concat(getBezierPoints(
        0, (-10 * scaleFactorUP) + downShift,
        23 * scaleFactorUP, (-132 * scaleFactorUP) + downShift,
        122 * scaleFactorUP, (-177 * scaleFactorUP) + downShift,
        188 * scaleFactorUP, (-165 * scaleFactorUP) + downShift,
        1000));

    outlinePoints = outlinePoints.concat(getBezierPoints(
        188 * scaleFactorUP, (-165 * scaleFactorUP) + downShift,
        177 * scaleFactorUP, (-132 * scaleFactorUP) + downShift,
        225 * scaleFactorUP, (-72 * scaleFactorUP) + downShift,
        159 * scaleFactorUP, (-10 * scaleFactorUP) + downShift,
        1000));

    outlinePoints = outlinePoints.concat(getBezierPoints(
        159 * scaleFactorUP, (-10 * scaleFactorUP) + downShift,
        80 * scaleFactorUP, (18 * scaleFactorUP) + downShift,
        80 * scaleFactorUP, (18 * scaleFactorUP) + downShift,
        0, (-10 * scaleFactorUP) + downShift,
        1000));

    // 左上翅膀
    outlinePoints = outlinePoints.concat(getBezierPoints(
        0, (-10 * scaleFactorUP) + downShift,
        -23 * scaleFactorUP, (-132 * scaleFactorUP) + downShift,
        -122 * scaleFactorUP, (-177 * scaleFactorUP) + downShift,
        -188 * scaleFactorUP, (-165 * scaleFactorUP) + downShift,
        1000));
    outlinePoints = outlinePoints.concat(getBezierPoints(
        -188 * scaleFactorUP, (-165 * scaleFactorUP) + downShift,
        -177 * scaleFactorUP, (-132 * scaleFactorUP) + downShift,
        -225 * scaleFactorUP, (-72 * scaleFactorUP) + downShift,
        -159 * scaleFactorUP, (-10 * scaleFactorUP) + downShift,
        1000));
    outlinePoints = outlinePoints.concat(getBezierPoints(
        -159 * scaleFactorUP, (-10 * scaleFactorUP) + downShift,
        -80 * scaleFactorUP, (18 * scaleFactorUP) + downShift,
        -80 * scaleFactorUP, (18 * scaleFactorUP) + downShift,
        0, (-10 * scaleFactorUP) + downShift,
        1000));

    // 右下翅膀
    outlinePoints = outlinePoints.concat(getBezierPoints(
        0, (0 * scaleFactorDOWN) + downShift,
        100 * scaleFactorDOWN, (30 * scaleFactorDOWN) + downShift,
        180 * scaleFactorDOWN, (-32 * scaleFactorDOWN) + downShift,
        200 * scaleFactorDOWN, (180 * scaleFactorDOWN) + downShift,
        1000));
    outlinePoints = outlinePoints.concat(getBezierPoints(
        200 * scaleFactorDOWN, (180 * scaleFactorDOWN) + downShift,
        -10 * scaleFactorDOWN, (250 * scaleFactorDOWN) + downShift,
        10 * scaleFactorDOWN, (32 * scaleFactorDOWN) + downShift,
        0, (0 * scaleFactorDOWN) + downShift,
        1000));

    // 左下翅膀
    outlinePoints = outlinePoints.concat(getBezierPoints(
        0, (0 * scaleFactorDOWN) + downShift,
        -100 * scaleFactorDOWN, (30 * scaleFactorDOWN) + downShift,
        -180 * scaleFactorDOWN, (-32 * scaleFactorDOWN) + downShift,
        -200 * scaleFactorDOWN, (180 * scaleFactorDOWN) + downShift,
        1000));
    outlinePoints = outlinePoints.concat(getBezierPoints(
        -200 * scaleFactorDOWN, (180 * scaleFactorDOWN) + downShift,
        10 * scaleFactorDOWN, (250 * scaleFactorDOWN) + downShift,
        -10 * scaleFactorDOWN, (32 * scaleFactorDOWN) + downShift,
        0, (0 * scaleFactorDOWN) + downShift,
        1000));

    return outlinePoints;
}

/////////////////////////////STEP3=将这些点绘制成蝴蝶的外轮廓///////////////////////////////////
function drawButterflyOutline(outline) {
    // 根据 outline 绘制蝴蝶的外轮廓
    beginShape();
    noStroke();


    // fill(0,0,0,0);


    noFill();
    for (let point of outline) {
        vertex(point.x, point.y);
    }
    endShape(CLOSE);
}

function getRandomPositionWithinOutline(outline) {
    let attempts = 0;
    while (attempts < 1000) {
        // 随机生成x和y坐标
        let x = random(-width / 2, width / 2);
        let y = random(-height / 2, height / 2);


        // 检查点(x, y)是否在轮廓内
        if (isPointInsideOutline(x, y, outline)) {
            return createVector(x, y); // 如果点在轮廓内，返回该点
        }


        attempts++;
    }
    // 如果在1000次尝试后仍未找到在轮廓内的点，返回中心点
    return createVector(0, 0); // 如果未找到在轮廓内的点，返回一个默认位置
}

////////////////////////////////////邏輯1=判断座標是否在輪廓内////////////////////////////////////
function isPointInsideOutline(x, y, outline) {
    let inside = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
        let xi = outline[i].x, yi = outline[i].y;
        let xj = outline[j].x, yj = outline[j].y;

        // 檢查點是否正好在頂點上
        if ((xi === x && yi === y) || (xj === x && yj === y)) {
            return true;
        }

        // 檢查點是否在邊上
        if ((yi === yj) && (y === yi) && (x >= Math.min(xi, xj)) && (x <= Math.max(xi, xj))) {
            return true;
        }

        // 標準射線法判斷
        let intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

///////////////////////////////////////邏輯2=判斷座標是否在頁面內//////////////////////////////////////
function isPointInsideScreen(x, y) {
    return x >= -width / 2 && x <= width / 2 && y >= -height / 2 && y <= height / 2;
}




function butterflylerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}
// 计算贝塞尔切线角度的函数
function getBezierTangent(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, t) {
    let dx = bezierTangent(x1, x2, x3, x4, t);
    let dy = bezierTangent(y1, y2, y3, y4, t);
    let dz = bezierTangent(z1, z2, z3, z4, t);
    // 正规化切线向量
    let len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return createVector(dx / len, dy / len, dz / len);
}
// 新增一个函数来调整角度，确保它在适当的范围内
function adjustAngle(angle, target) {
    while (angle < target - Math.PI) angle += TWO_PI;
    while (angle > target + Math.PI) angle -= TWO_PI;
    return angle;
}




//定义蝴蝶对象的类。包含了图像、位置、目标位置、自定資料、控制蝴蝶动画的方法
class Butterfly {
    constructor(wing1, wing2, startPos, targetPos, customData, ang_Y, ang_X) {


        // console.log('StartPos:', startPos); // 调试
        this.customData = customData; //自定义数据
        this.position = startPos.copy();
        this.targetPos = targetPos.copy();
        this.progress = 0;//跟踪蝴蝶沿着贝塞尔曲线的运动进度 它是一个从 0 到 1 的值，表示从起始点到目标点的插值比例
        this.moveSpeed = random(0.005, 0.006); // 重新随机设定速度
        this.frameCounter = random(5000); //跟踪动画帧数或者用于在 draw 函数中的循环中进行计时(counter) 控制翅膀拍动的速率
        this.frameCounterSpeed = 10; // 初始速度
        this.flapAngle_FLY = 0;//翅膀拍动时的角度
        this.flapAngle_STOP = 0;//翅膀拍动时的角度
        this.rate = 1;
        this.wing1 = wing1;
        this.wing2 = wing2;
        this.ang_Y = ang_Y;//設置y軸旋轉角度
        this.ang_X = ang_X;//設置Z軸旋轉角度
        // 假设这些是类的成员变量，用于平滑过渡
        this.targetAng_Y = 0; // 目标 Y 轴旋转角度
        this.targetAng_X = 0; // 目标 X 轴旋转角度
        this.bezierControlPoints = this.calculateBezierControlPoints(startPos, targetPos);
        this.isWaiting = false; // 是否正在等待
        this.waitUntil = 0; // 等待到的时间点（以秒为单位）
        this.isRandomMoving = false; // 默认为 false，表示不使用随机漫游


    }


    //生成控制贝塞尔曲线运动的控制点。  弧度大
    //使用中点和随机偏移量来确保曲线不是直线，并给动画增加自然感。
    // calculateBezierControlPoints(startPos, targetPos) {
    //     // 计算中点
    //     let midX = (startPos.x + targetPos.x) / 2;
    //     let midY = (startPos.y + targetPos.y) / 2;


    //     // 计算起点到终点的向量
    //     let dx = targetPos.x - startPos.x;
    //     let dy = targetPos.y - startPos.y;


    //     // 生成一个小的随机偏移量
    //     let offsetRange = 500; // 可根据需要调整这个值
    //     let offsetX = random(-offsetRange, offsetRange);
    //     let offsetY = random(-offsetRange, offsetRange);


    //     // 生成控制点，确保它们不在直线上，但也不会太远
    //     let cp1 = createVector(midX + offsetY - dx / 3, midY - offsetX - dy / 3);
    //     let cp2 = createVector(midX - offsetY + dx / 3, midY + offsetX + dy / 3);
    //   //  let cp3 = createVector(midX - offsetY - dx / 3, midY - offsetX - dy / 3);
    //     // 首先设置 bezierControlPoints
    //     this.bezierControlPoints = { startPos, cp1, cp2, targetPos };
    // // 计算曲线的近似长度
    // this.pathLength = this.approximatePathLength();
    //     return { startPos, cp1, cp2, targetPos };
    // }


    //近似计算贝塞尔曲线的长度，用于动画的平滑过渡。
    approximatePathLength() {
        // 这里是计算贝塞尔曲线长度的简化方法
        // 实际项目中可能需要更精确的方法
        let bp = this.bezierControlPoints;
        let length = 0;
        let steps = 10; // 增加或减少以改变精度
        let prevX = bp.startPos.x, prevY = bp.startPos.y, prevZ = bp.startPos.z;
        for (let t = 0; t <= 1; t += 1 / steps) {
            let x = bezierPoint(bp.startPos.x, bp.cp1.x, bp.cp2.x, bp.targetPos.x, t);
            let y = bezierPoint(bp.startPos.y, bp.cp1.y, bp.cp2.y, bp.targetPos.y, t);
            let z = bezierPoint(bp.startPos.z, bp.cp1.z, bp.cp2.z, bp.targetPos.z, t);
            length += dist(prevX, prevY, prevZ, x, y, z);
            prevX = x;
            prevY = y;
            prevZ = z;
        }
        return length;
    }


    // 绘制蝴蝶的飞行轨迹，主要用于调试和可视化路径。
    drawPath() {
        let bp = this.bezierControlPoints;


        // 设置轨迹的基本属性
        stroke(100); // 轨迹颜色
        strokeWeight(2); // 加粗轨迹
        noFill();


        // 绘制轨迹
        beginShape();
        for (let t = 0; t <= 1; t += 0.01) {
            let x = bezierPoint(bp.startPos.x, bp.cp1.x, bp.cp2.x, bp.targetPos.x, t);
            let y = bezierPoint(bp.startPos.y, bp.cp1.y, bp.cp2.y, bp.targetPos.y, t);
            let z = bezierPoint(bp.startPos.z, bp.cp1.z, bp.cp2.z, bp.targetPos.z, t);
            vertex(x, y, z);
        }
        endShape();


        // 绘制阴影以增强立体效果
        stroke(50, 50, 50, 50); // 半透明的阴影颜色
        strokeWeight(4); // 阴影更粗
        beginShape();
        for (let t = 0; t <= 1; t += 0.01) {
            let x = bezierPoint(bp.startPos.x, bp.cp1.x, bp.cp2.x, bp.targetPos.x, t) + 2; // 轻微偏移 X 轴
            let y = bezierPoint(bp.startPos.y, bp.cp1.y, bp.cp2.y, bp.targetPos.y, t) + 2; // 轻微偏移 Y 轴
            let z = bezierPoint(bp.startPos.z, bp.cp1.z, bp.cp2.z, bp.targetPos.z, t); // Z 轴不变
            vertex(x, y, z);
        }
        endShape();
    }

    //检测鼠标是否悬停在蝴蝶图像上
    isMouseOver() {
        // 将鼠标坐标转换为相对于画布中心的坐标
        let mousePos = createVector(mouseX - width / 2, mouseY - height / 2);


        // 计算左翅和右翅的边界
        let leftWingX = this.position.x - this.wing1.width;
        let rightWingX = this.position.x;
        let leftWingY = this.position.y - this.wing1.height;
        let rightWingY = this.position.y - this.wing2.height;


        // 检查鼠标是否在左翅范围内
        let overLeftWing = mousePos.x >= leftWingX && mousePos.x <= this.position.x &&
            mousePos.y >= leftWingY && mousePos.y <= this.position.y;


        // 检查鼠标是否在右翅范围内
        let overRightWing = mousePos.x >= rightWingX && mousePos.x <= rightWingX + this.wing2.width &&
            mousePos.y >= rightWingY && mousePos.y <= this.position.y;


        // 如果鼠标在左翅或右翅上，返回 true
        return overLeftWing || overRightWing;




    }
    //弧度小
    calculateBezierControlPoints(startPos, targetPos) {
        let midX = (startPos.x + targetPos.x) / 2;
        // let midY = (startPos.y + targetPos.y) / 2;
        let y = startPos.y;
        let midZ = (startPos.z + targetPos.z) / 2; // 为 Z 轴添加简单的计算（例如，基于 X 和 Y 轴的平均值）
        let distance = dist(startPos.x, startPos.z, targetPos.x, targetPos.z) / 3; // 分为三个等分
        let angle = atan2(targetPos.z - startPos.z, targetPos.x - startPos.x) + HALF_PI;
        // 设置第一个控制点
        let cp1X = midX + cos(angle) * distance;
        let cp1Z = midZ + sin(angle) * distance;
        // 设置第二个控制点
        let cp2X = midX - cos(angle) * distance;
        let cp2Z = midZ - sin(angle) * distance;


        let cp1 = createVector(cp1X, y, cp1Z);
        let cp2 = createVector(cp2X, y, cp2Z);


        //   // 输出起点和终点的 Z 轴坐标
        //   console.log("Start position Z:",startPos.x);
        //   console.log("cp1Z:",cp1.x);
        //   console.log("cp2 Z:",cp2.x);
        //   console.log("Target position Z:", targetPos.x);
        //   console.log("Start position Z:",startPos.y);
        //   console.log("cp1Z:",cp1.y);
        //   console.log("cp2 Z:",cp2.y);
        //   console.log("Target position Z:", targetPos.y);
        //   console.log("Start position Z:",startPos.z);
        //   console.log("cp1Z:",cp1.z);
        //   console.log("cp2 Z:",cp2.z);
        //   console.log("Target position Z:", targetPos.z);
        return { startPos, cp1, cp2, targetPos };

    }


    // 获取贝塞尔曲线上给定 t 值的点
    getPointOnBezierCurve(t) {
        let bp = this.bezierControlPoints;
        let x = bezierPoint(bp.startPos.x, bp.cp1.x, bp.cp2.x, bp.targetPos.x, t);
        let y = bezierPoint(bp.startPos.y, bp.cp1.y, bp.cp2.y, bp.targetPos.y, t);
        let z = bezierPoint(bp.startPos.z, bp.cp1.z, bp.cp2.z, bp.targetPos.z, t);
        return createVector(x, y, z);
    }


    // 获取贝塞尔曲线上给定 t 值的点的切线
    getBezierTangentAtPoint(t) {
        let bp = this.bezierControlPoints;
        return getBezierTangent(bp.startPos.x, bp.startPos.y, bp.startPos.z,
            bp.cp1.x, bp.cp1.y, bp.cp1.z,
            bp.cp2.x, bp.cp2.y, bp.cp2.z,
            bp.targetPos.x, bp.targetPos.y, bp.targetPos.z, t);
    }




    //控制蝴蝶的两种移动模式（随机漫游和沿贝塞尔曲线移动） & 模拟翅膀扇动的视觉效果
    update() {
        if (this.isRandomMoving) {
            if (!this.isWaiting) {
                this.randomMove();
            } else {
                this.checkWait(); // 检查是否完成等待
            }
        }
        else {
            this.updatePosition();
        }
    }








    randomMove() {
        if (this.progress < 1) {
            // 如果当前进度未完成，继续沿贝塞尔曲线移动
            this.position = this.getPointOnBezierCurve(this.progress);
            let tangent = this.getBezierTangentAtPoint(this.progress);
            this.updateRotation(tangent);
            this.progress += this.moveSpeed;
        } else {
            // 进度完成，设置等待状态
            this.isWaiting = true;
            this.setWait(); // 设置等待时间
        }
    }
    setWait() {
        // 设置等待结束的时间（当前时间 + 随机等待秒数）
        this.waitUntil = millis() + random(5000, 12000); // 1秒=1000毫秒, 10秒=10000毫秒   隨機等待1-10秒
    }


    checkWait() {
        // 检查当前时间是否已经达到等待结束的时间
        if (millis() >= this.waitUntil) {
            this.isWaiting = false; // 结束等待
            this.progress = 0; // 重置进度
            // 选择新的随机目标位置开始下一次移动
            let newTargetPos = getRandomPositionWithinScreen();
            this.bezierControlPoints = this.calculateBezierControlPoints(this.position, newTargetPos);
            this.targetPos = newTargetPos;
        }
    }

    updatePosition() {


        if (this.progress < 1) {


            this.position = this.getPointOnBezierCurve(this.progress);
            let tangent = this.getBezierTangentAtPoint(this.progress);
            this.updateRotation(tangent);
            this.progress += this.moveSpeed;
        }
    }


    updateRotation(tangent) {
        // console.log("Tangent vector:", tangent); // 输出切线向量
        // 确保切线向量不是零向量
        if (tangent.x !== 0 || tangent.z !== 0) {


            // 计算期望的 Y 轴旋转角度
            let desiredAng_Y = Math.atan2(tangent.x, tangent.z);


            // 根据位置关系调整旋转方向
            if (this.position.x < this.targetPos.x) {
                // 逆时针旋转


                desiredAng_Y = adjustAngle(desiredAng_Y, Math.PI);
            } else {
                // 顺时针旋转
                desiredAng_Y = adjustAngle(desiredAng_Y, 0);
            }


            // 平滑过渡旋转
            this.ang_Y = butterflylerp(this.ang_Y, desiredAng_Y, 0.05);
        } else {
            // 如果切线向量是零向量，保持当前角度不变或设置为默认值
            this.ang_Y = this.ang_Y || 0; // 如果当前角度为undefined或NaN，则设置为0
        }
        // 在应用旋转之前检查 this.ang_Y 是否为 NaN
        if (isNaN(this.ang_Y)) {
            //  console.error('Current angle is undefined or NaN');
            this.ang_Y = 0; // 重置为0，避免旋转错误
        }
        this.ang_X = 0.35 * -Math.PI - this.flapAngle_FLY * 0.06;


        //  console.log(`当前旋转角度: Y轴=${this.ang_Y}, X轴=${this.ang_X}`);
    }




    adjustForContinuity(desiredAngle, currentAngle) {
        if (Math.abs(desiredAngle - currentAngle) > Math.PI) {
            if (desiredAngle > currentAngle) {
                desiredAngle -= TWO_PI;
            } else {
                desiredAngle += TWO_PI;
            }
        }
        return butterflylerp(currentAngle, desiredAngle, 0.05);
    }

    // 新增 flap 方法来控制翅膀的挥动效果
    flap() {
        this.flapAngle_FLY = sin(this.frameCounter * 0.06 / this.rate) * (PI / 4); // 调整这里来改变挥动幅度
        this.flapAngle_STOP = sin(this.frameCounter * 0.02 / this.rate) * (PI / 10); // 调整这里来改变挥动幅度
        this.rate = 5 + (10 * noise(this.frameCounter / 50000));




        if (this.progress < 1) {
            // 移动中的逻辑保持不变


            rotateY(this.ang_Y);
            rotateX(this.ang_X);

            this.frameCounterSpeed = lerp(this.frameCounterSpeed, 40, 0.99);


            // 绘制左翅
            push();
            rotateY(this.flapAngle_FLY);
            image(this.wing1, -this.wing1.width / 2, -this.wing1.height / 2);
            pop();


            // 绘制右翅
            push();
            rotateY(-this.flapAngle_FLY);
            image(this.wing2, this.wing2.width / 2, -this.wing2.height / 2);
            pop();


        }


        else {


            this.frameCounterSpeed = lerp(this.frameCounterSpeed, 30, 0.99);
            this.ang_Y = butterflylerp(this.ang_Y, this.targetAng_Y, 0.09);
            this.ang_X = butterflylerp(this.ang_X, this.targetAng_X, 0.09);
            if (this.position.x < this.targetPos.x) {
                // 更新角度以使其逐渐接近目标值
                // console.log('逆');
                this.targetAng_Y = Math.PI;
                this.targetAng_X = 0;
            } else {
                // 可以设置其他目标角度
                // console.log('順');
                this.targetAng_Y = -Math.PI;
                this.targetAng_X = 0;
            }


            rotateY(this.ang_Y);
            rotateX(this.ang_X);


            push();
            rotateY(this.flapAngle_STOP);
            image(this.wing1, -this.wing1.width / 2, -this.wing1.height / 2);
            pop();


            // 绘制右翅
            push();
            rotateY(-this.flapAngle_STOP);
            image(this.wing2, this.wing2.width / 2, -this.wing2.height / 2);
            pop();




        }


        this.frameCounter += this.frameCounterSpeed;



        // console.log(this.category);//調適方向


    }


    //根据蝴蝶的当前位置和大小，将蝴蝶的图像绘制到屏幕上
    display() {
        push();
        translate(this.position.x, this.position.y, this.position.z);


        this.flap(); // 在这里调用 flap 方法




        //             // 获取当前进度对应的切线向量
        // let tangent = this.getBezierTangentAtPoint(this.progress);


        // // 绘制切线
        // stroke(20,100, 50); // 切线为红色
        // line(0, 0, 0, tangent.x * 1000, tangent.y * 1000, tangent.z * 1000); // 绘制切线
        // line(0, 0, 0, -tangent.x * 1000, -tangent.y * 1000, -tangent.z * 1000); // 绘制切线


        //     // 绘制和标记x轴
        //     stroke(255, 0, 0);
        //     line(0, 0, 0, 300, 0, 0); // x轴 +
        //     stroke(139, 0, 0);
        //     line(0, 0, 0, -300, 0, 0); // x轴 -


        //     // 绘制和标记y轴
        //     stroke(0, 255, 0);
        //     line(0, 0, 0, 0, 300, 0); // y轴 +
        //     stroke(0, 139, 0);
        //     line(0, 0, 0, 0, -300, 0); // y轴 -




        //     // 绘制和标记z轴
        //     stroke(0, 0, 255);
        //     line(0, 0, 0, 0, 0, 300); // z轴 +
        //     stroke(0, 0, 139);
        //     line(0, 0, 0, 0, 0, -300); // z轴 -




        //        // 绘制 xy 平面
        //     //noFill(); // 不填充颜色
        //     stroke(200, 200, 200, 200); // 设置为白色，半透明
        //     for (let i = -50; i <= 50; i += 10) {
        //         // 绘制平行于 x 轴的线
        //         line(-50, i, 0, 50, i, 0);
        //         // 绘制平行于 y 轴的线
        //         line(i, -50, 0, i, 50, 0);
        //     }


        pop();
        // 可视化翅膀边界
        //    noFill();
        // stroke(255, 0, 0); // 红色边界
        //       push(); // 可能需要再次保存状态，以便单独应用变换
        // rect(this.position.x - this.wing1.width, this.position.y - this.wing1.height, this.wing1.width, this.wing1.height);
        // rect(this.position.x, this.position.y - this.wing2.height , this.wing2.width, this.wing2.height);
        //           pop(); // 恢复到之前的变换状态


    }


}
function handleMouseClick() {
    let modal = document.getElementById("myModal");
    if (isModalOpen && !mouseOverModal()) {
        modal.style.display = "none";
        isModalOpen = false;
    }


    if (isTooltipVisible && !mouseOverTooltip() && !clickedButterfly.isMouseOver()) {
        let tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none";
        isTooltipVisible = false;
        clickedButterfly = null;
    }


    // 检查是否点击了蝴蝶并且工具提示可见
    if (clickedButterfly && isTooltipVisible) {
        // 获取 ButterflyCanvas
        let canvas = document.getElementById('ButterflyCanvas');
        // 如果已经有 p5 实例，可能需要先移除
        if (window.myP5) {
            window.myP5.remove();
        }
        // 创建新的 p5 实例绘制蝴蝶
        window.myP5 = new p5((p) => {
            p.setup = function () {
                let canvasHeight = windowHeight; // 根據視窗高度來設定畫布高度
                p.createCanvas(windowWidth, canvasHeight - 200, WEBGL).parent('canvasHolder');

                setupLighting(); // 设置光照
                p.window.addEventListener('click', handleMouseClick);
                outline = createButterflyOutline(scaleFactorUP, scaleFactorDOWN); // 创建并存储蝴蝶外轮廓
                moreLink = document.getElementById('moreLink'); // 获取更多链接元素
                drawButterflyOutline(outline);
                bindCategoryButtons(); // 绑定分类按钮的事件
            };

            p.draw = function () {
                // 定义 draw 内容
            };
        }, canvas);
    }
}


// // 确保只有一个 p5 实例
// let myP5 = null;

// function startCanvas() {
//     // 检查是否已存在 p5 实例，如果存在则先移除
//     if (myP5) {
//         myP5.remove();
//         myP5 = null;  // 重置变量，确保彻底删除旧实例
//     }

//     // 创建新的 p5 实例绘制蝴蝶
//     myP5 = new p5((p) => {
//         p.setup = function() {
//             let canvasHeight = windowHeight; // 根据窗口高度设置画布高度
//             p.createCanvas(windowWidth, canvasHeight - 300, WEBGL).parent('canvasHolder');
//             setupLighting(); // 设置光照
//             outline = createButterflyOutline(scaleFactorUP, scaleFactorDOWN); // 创建并存储蝴蝶外轮廓
//             drawButterflyOutline(outline);
//             bindCategoryButtons(); // 绑定分类按钮的事件
//         };

//         p.draw = function() {
//             // 定义 draw 内容
//         };
//     });
// }

// // 监听探索按钮点击事件
// document.getElementById('explore-button').addEventListener('click', function () {
//     // 如果画布未初始化，则初始化
//     startCanvas();  // 即使多次点击，也只会有一个画布存在

//     // 其他需要执行的代码
//     var newContent = document.getElementById('new-content');
//     newContent.style.opacity = '1';
//     newContent.style.pointerEvents = 'auto';
// });
