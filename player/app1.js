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
    camera = new THREE.PerspectiveCamera(fov, widthHeightRatio, minRenderDistance,maxRenderDistance);
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

    for (var i = 0; i < tileUrls.length; i++) {
        var video = document.createElement('video');
        // 支持跨域请求
        video.crossOrigin = 'anonymous';
        // 自动播放
        video.autoplay = true;
        // 视频静音
        video.muted = true;
        video.loop = false;

        var dashPlayer = dashjs.MediaPlayer().create();
        // 第三个参数 true 表示启用自动播放
        dashPlayer.initialize(video, tileUrls[i], true);
        dashPlayers.push(dashPlayer);

        // 创建视频纹理
        var texture = new THREE.VideoTexture(video);
        // 设置纹理的最小过滤器，影响纹理缩小时的效果
        texture.minFilter = THREE.LinearFilter;
        // 设置纹理在 S 和 T 方向（即 x 和 y 轴）上的重复方式，ClampToEdgeWrapping 表示纹理不重复，边缘部分被拉伸
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // 双面渲染
        var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        materials.push(material);
    }

    // 将材质数组应用到 BoxGeometry 的每个面
    var cube = new THREE.Mesh(geometry, materials);
    cube.geometry.scale(1, 1, -1); // 反转几何体，使摄像机位于立方体内部
    scene.add(cube);
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

    animate();
}

init(); // 启动应用