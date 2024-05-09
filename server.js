// 引入必要的模块
import express from 'express';
//import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { pathToFileURL, fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';//讀取.env
import cors from 'cors';//跨域
import { randomBytes } from 'crypto';
import http from 'http';
import path from 'path';
const app = express();

// 定义 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 使用 readFileSync 方法读取文件certs\server.cert


// 定义服务账号密钥文件的路径
const serviceAccountPath = path.join(__dirname, 'secrets/multifly-ef990-firebase-adminsdk-tlpiz-f41312f0b9.json');
dotenv.config();
// 将文件路径转换为URL
const serviceAccountURL = pathToFileURL(serviceAccountPath);

// 动态导入服务账号密钥文件，并添加断言指定文件类型为JSON
import(serviceAccountURL.href, { assert: { type: 'json' } }).then((serviceAccount) => {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount.default),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET // 你的 Firebase Storage 存储桶名称
        // 替换为您的数据库URL
    });


    // Firebase Admin初始化完成后，启动服务器
    startServer();
}).catch((error) => {
    console.error("Failed to import serviceAccount:", error);
});

function startServer() {


    const httpServer = http.createServer(app);
    const io = new SocketIO(httpServer, {
        cors: {
            origin: "*",  // Adjust according to your needs
            methods: ["GET", "POST"]
        }
    });

    app.use(cors());
    app.use(express.static(path.join(__dirname)));
    app.use('/video', express.static(path.join(__dirname, 'video')));
    app.use('/api', createProxyMiddleware({
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
    }));

    // 路由处理
    app.get(['/', '/multifly.html', '/testindex.html'], (req, res) => {
        const fileName = req.path === '/' ? 'index.html' : req.path.substring(1);
        res.sendFile(path.join(__dirname, fileName));
    });

    // Socket.IO事件监听 如果連結成功
    io.on('connection', (socket) => {
        //檢查有哪些頁面連上了
        console.log('Socket连接成功', socket.id);
        const recordId = generateRecordId(); // 假设这是生成 recordId 的函数
        socket.emit('recordId', { recordId: recordId }); // 发送 recordId 给客户端
        // console.log('用戶id',recordId);
        // 查询数据库并发送所有"完成"的记录给新连接的客户端
        emitCompletedRecords(socket);


 

        socket.on('search', (inputValue) => {

            socket.emit('search', inputValue);
            // 假设你有一个数组或者方法来查找匹配的蝴蝶
            // for loop to check for butterfly
            console.log(inputValue);
            });
            socket.on('no_butterfly_found', function (data) {
            socket.emit('no_butterfly', { message: '輸入錯誤!' });
            });
            





    });

    //設置用戶recordId方法
    function generateRecordId() {
        return randomBytes(16).toString('hex'); // 生成32字符的十六进制字符串
    }
    function isRecordComplete(record) {
        const requiredFields = ['scanmixUrl', 'userName', 'sequenceNumber', 'prompt1MatchCount', 'spot', 'typing2'];
        return requiredFields.every(field => record[field] != null);
    }
    // This function is called after an update to check and emit complete record
    function checkAndEmitCompleteRecord(dataId) {
        const recordRef = admin.database().ref(`testResults/${dataId}`);
        recordRef.once('value', snapshot => {
            const record = snapshot.val();
            if (isRecordComplete(record)) {
                // Emit the complete record to all clients
                const infovisionInfo = {
                    dataId: dataId,
                    scanmixUrl: record.scanmixUrl,        // Assuming these fields are part of the record
                    userName: record.userName,
                    typing2: record.typing2,
                    sequenceNumber: record.sequenceNumber,
                    prompt1MatchCount: record.prompt1MatchCount,
                    spot: record.spot
                };
                io.emit('infovisionInfo update', { infovisionInfo });
                console.log(`Emitted complete record for dataId: ${dataId}`);
            }
        });
    }
    // This function is called after an update to check and emit complete record
    function emitCompletedRecords(socket) {
        admin.database().ref('testResults').once('value', snapshot => {
            snapshot.forEach(childSnapshot => {
                const dataId = childSnapshot.key;
                const record = childSnapshot.val();
                if (isRecordComplete(record)) {
                    // Emit the complete record to all clients
                    const infovisionInfo = {
                        dataId: dataId,
                        scanmixUrl: record.scanmixUrl,        // Assuming these fields are part of the record
                        userName: record.userName,
                        typing2: record.typing2,
                        sequenceNumber: record.sequenceNumber,
                        prompt1MatchCount: record.prompt1MatchCount,
                        spot: record.spot
                    };
                    socket.emit('infovisionInfo update', { infovisionInfo });
                    console.log(`Emitted complete record for dataId: ${dataId}`);
                }
            });
        }).catch(error => {
            console.error('Error fetching records:', error);
        });
    }

    // Listen for changes in each record
    admin.database().ref('testResults').on('child_changed', (snapshot) => {
        const dataId = snapshot.key;
        checkAndEmitCompleteRecord(dataId);
    });

    // Also check on new additions
    admin.database().ref('testResults').on('child_added', (snapshot) => {
        const dataId = snapshot.key;
        checkAndEmitCompleteRecord(dataId);
    });


    // 定义服务端口
    const PORT = 3002; // 确保环境变量名正确
    // const HOST = '  169.254.216.220'; // 你想要监听的特定IP地址
    // const HOST = '172.20.10.5'; // 你想要监听的特定IP地址


    // 启动服务器，使其监听指定的IP地址和端口
    httpServer.listen(PORT, () => {
        console.log(`HTTP Server running at http://${PORT}`);
    });
}
