import * as THREE from 'three'; // 导入 THREE.js 模块
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // 导入 OrbitControls

var scene, camera, renderer, controls, dashPlayers = [];
var tileUrls = [];

// 视角大小
var fov = 75;
// 相机宽高比，需要与显示宽高比相同，否则会导致画面畸变
var widthHeightRatio = window.innerWidth / window.innerHeight;
// 最近渲染距离，小于该距离的物体不会被渲染
var minRenderDistance = 0.1;
// 最远渲染距离，大于该距离的物体不会被渲染
var maxRenderDistance = 1000;

// 初始化 3D 场景
function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(fov, widthHeightRatio, minRenderDistance, maxRenderDistance);
    camera.position.set(0, 0, 0.1); // 摄像机位于立方体内部中心

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // 使用 OrbitControls 控制摄像机
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;  // 允许缩放，滚动鼠标滚轮可以缩放
    controls.enablePan = false; // 禁止平移
}

// 使用 BoxGeometry 创建视频瓦片立方体
function createVideoTileBox(tileUrls) {
    var geometry = new THREE.BoxGeometry(1, 1, 1); // 创建立方体几何体
    var materials = []; // 存储每个面的材质
    var masterPlayer = null; // 主播放器，用于同步其他播放器

    for (var i = 0; i < tileUrls.length; i++) {
        var video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // 支持跨域请求
        video.autoplay = true;          // 自动播放
        video.muted = true;             // 视频静音
        video.loop = false;             // 直播流通常不需要循环播放

        var dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(video, tileUrls[i], true);
        dashPlayers.push(dashPlayer);

        if (i === 0) {
            // 第一个播放器作为主播放器
            masterPlayer = dashPlayer;
        } else {
            // 为其他播放器设置同步
            dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_TIME_UPDATED, function () {
                synchronizePlayers(masterPlayer, dashPlayer);
            });
        }

        // 创建视频纹理
        var texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter; // 设置纹理的最小过滤器
        texture.wrapS = THREE.ClampToEdgeWrapping; // 设置纹理在 S 方向上的重复方式
        texture.wrapT = THREE.ClampToEdgeWrapping; // 设置纹理在 T 方向上的重复方式

        var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }); // 双面渲染
        materials.push(material);
    }

    // 将材质数组应用到 BoxGeometry 的每个面
    var cube = new THREE.Mesh(geometry, materials);
    cube.geometry.scale(1, 1, -1); // 反转几何体，使摄像机位于立方体内部
    scene.add(cube);
}

// 同步播放器
function synchronizePlayers(masterPlayer, slavePlayer) {
    if (!masterPlayer || !slavePlayer) return;

    // 获取主播放器和从播放器的当前时间
    var masterTime = masterPlayer.time();
    var slaveTime = slavePlayer.time();

    // 计算时间差，考虑 availabilityStartTime
    var timeDifference = masterTime - slaveTime;

    // 如果时间差超过阈值，则调整从播放器
    var syncThreshold = 0.5; // 0.1秒为同步阈值
    if (Math.abs(timeDifference) > syncThreshold) {
        console.log("masterTime: "+masterTime+"|slaveTime: "+slaveTime)
        slavePlayer.seek(masterTime); // 调整从播放器时间
    }
}

var count = 0;

// 定时打印所有播放器的时间戳（在同一行）
function printPlayerTimestamps() {
    setInterval(function() {
        count++;
        if(count == 5) {
            for(var i=0;i<6;i++) {
                dashPlayers[i].seek(1);
            }
        }

        // 输出所有播放器的时间戳
        var timestamps = dashPlayers.map(function(player, index) {
            return `Player ${index + 1}: ${player.time().toFixed(2)}s`;
        }).join(' | ');

        // 打印所有时间戳
        console.log(timestamps);
    }, 1000); // 每秒打印一次
}

// 动画渲染
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 更新 OrbitControls
    renderer.render(scene, camera);
}

// 初始化应用程序
function init() {
    initScene();

    // 示例瓦片 URL
    tileUrls = [
        'http://localhost:8080/data/dash_output1/output.mpd',
        'http://localhost:8080/data/dash_output2/output.mpd',
        'http://localhost:8080/data/dash_output3/output.mpd',
        'http://localhost:8080/data/dash_output4/output.mpd',
        'http://localhost:8080/data/dash_output5/output.mpd',
        'http://localhost:8080/data/dash_output6/output.mpd',
    ];

    // 创建立方体视频瓦片
    createVideoTileBox(tileUrls);

    // 开始定时打印播放器时间戳
    printPlayerTimestamps();

    animate();
}

init();
