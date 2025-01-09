// 视频 URL 地址
var tileUrls = [
    'http://10.29.160.99:8080/data/dash_output6/output.mpd',
    'http://10.29.160.99:8080/data/dash_output5/output.mpd',
    'http://10.29.160.99:8080/data/dash_output2/output.mpd',
    'http://10.29.160.99:8080/data/dash_output1/output.mpd',
    'http://10.29.160.99:8080/data/dash_output3/output.mpd',
    'http://10.29.160.99:8080/data/dash_output4/output.mpd',
];

var dashPlayers = [];
var videoElements = [];
var masterPlayer = null;
var count = 0;

// 初始化 Dash 播放器并创建视频纹理
function initializeDashPlayers() {
    tileUrls.forEach(function (url, index) {
        var videoElement = document.createElement('video');
        videoElement.crossOrigin = 'anonymous'; // 支持跨域请求
        videoElement.autoplay = true;            // 自动播放
        videoElement.muted = true;               // 静音
        videoElement.loop = false;                // 循环播放

        var dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(videoElement, url, true);
        dashPlayers.push(dashPlayer);
        videoElements.push(videoElement);

        // 创建视频纹理
        var texture = new THREE.VideoTexture(videoElement);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // 给每个面赋予对应的视频纹理
        var materialId = 'video-' + (index + 1);
        var plane = document.getElementById(materialId);
        if (plane) {
            plane.setAttribute('material', 'src', texture);
        }
    });
}

// 同步播放：让从播放器与主播放器时间同步
function synchronizePlayers(masterPlayer, slavePlayer) {
    if (!masterPlayer || !slavePlayer) return;

    // 获取主播放器和从播放器的当前时间
    var masterTime = masterPlayer.time();
    var slaveTime = slavePlayer.time();

    // 计算时间差
    var timeDifference = masterTime - slaveTime;

    // 如果时间差超过阈值，则调整从播放器的时间
    var syncThreshold = 0.5; // 0.5秒为同步阈值
    if (Math.abs(timeDifference) > syncThreshold) {
        slavePlayer.seek(masterTime); // 调整从播放器时间
        console.log(`Synchronizing: masterTime ${masterTime.toFixed(2)}s | slaveTime ${slaveTime.toFixed(2)}s`);
    }
}

// 定时打印所有播放器的时间戳（在同一行）
function printPlayerTimestamps() {
    setInterval(function () {
        count++;
        if (count === 1) {
            for (var i = 0; i < 6; i++) {
                dashPlayers[i].seek(1);
            }
        }

        // 输出所有播放器的时间戳
        var timestamps = dashPlayers.map(function (player, index) {
            return `Player ${index + 1}: ${player.time().toFixed(2)}s`;
        }).join(' | ');

        // 打印所有时间戳
        console.log(timestamps);
    }, 1000); // 每秒打印一次
}

// 页面加载后初始化
window.onload = function () {
    initializeDashPlayers();
    printPlayerTimestamps();
};
