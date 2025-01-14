// 视频 URL 地址
var tileUrls = [
  'https://10.29.160.99/data/face5/face5.mpd',
  'https://10.29.160.99/data/face4/face4.mpd',
  'https://10.29.160.99/data/face1/face1.mpd',
  'https://10.29.160.99/data/face0/face0.mpd',
  'https://10.29.160.99/data/face2/face2.mpd',
  'https://10.29.160.99/data/face3/face3.mpd',
];

var dashPlayers = [];
var videoElements = [];
// 存储卡顿状态及卡顿开始时间
var stutterStartTimes = [];
var stuttering = [];

// 初始化 Dash 播放器并创建视频纹理
function initializeDashPlayers() {
  tileUrls.forEach(function (url, index) {
    var videoElement = document.createElement('video');
    videoElement.crossOrigin = 'anonymous'; // 支持跨域请求
    videoElement.autoplay = true; // 自动播放
    videoElement.muted = true; // 静音
    videoElement.loop = false; // 不循环播放

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

    // 监听比特率变化（QUALITY_CHANGE_REQUESTED）
    dashPlayer.on(
      dashjs.MediaPlayer.events.QUALITY_CHANGE_REQUESTED,
      function (event) {
        var bitrateInfoList = dashPlayer.getBitrateInfoListFor('video');
        // 更新比特率
        updateBitrate(index, bitrateInfoList[event.newQuality]);
      }
    );

    // 监听缓冲事件
    dashPlayer.on(
      dashjs.MediaPlayer.events.BUFFER_LEVEL_STATE_CHANGED,
      function (event) {
        if (event.state == 'bufferStalled') {
          // 缓冲开始时记录卡顿的开始时间
          stuttering[index] = true;
          stutterStartTimes[index] = dashPlayer.time();
        } else if (event.state == 'bufferLoaded') {
          // 缓冲完成时，停止卡顿
          stuttering[index] = false;
          stutterStartTimes[index] = undefined;
        }
      }
    );
  });
}

// 更新右侧面板显示比特率（以Mbps为单位）
function updateBitrate(tileIndex, bitrateInfo) {
  const bitrateElement = document.getElementById(`bitrate-${tileIndex + 1}`);
  if (bitrateElement) {
    // 将比特率从 bps 转换为 Mbps
    const bitrateMbps = (bitrateInfo.bitrate / 1000000).toFixed(2); // 保留两位小数
    bitrateElement.textContent = `${bitrateMbps}Mbps(level${bitrateInfo.qualityIndex})`;
  }
}

// 定时打印所有播放器的时间戳（在同一行）
function printPlayerTimestamps() {
  setInterval(function () {
    var timestamps = dashPlayers
      .map(function (player, index) {
        return `Player ${index + 1}: ${player.time().toFixed(2)}s`;
      })
      .join(' | ');

    console.log(timestamps);
  }, 1000); // 每秒打印一次
}

// 播放/暂停控制
function togglePlayPause() {
  dashPlayers.forEach(function (player) {
    if (player.isPaused()) {
      player.play();
    } else {
      player.pause();
    }
  });
}

// 切换全屏
function toggleFullscreen() {
  const scene = document.getElementById('vr-scene');
  if (scene.requestFullscreen) {
    scene.requestFullscreen();
  } else if (scene.mozRequestFullScreen) {
    scene.mozRequestFullScreen();
  } else if (scene.webkitRequestFullscreen) {
    scene.webkitRequestFullscreen();
  } else if (scene.msRequestFullscreen) {
    scene.msRequestFullscreen();
  }
}

// 显示或隐藏选项
function toggleOptions() {
  const rightPanel = document.querySelector('.right-panel');
  rightPanel.style.display =
    rightPanel.style.display === 'none' ? 'block' : 'none';
}

// 更新右侧面板显示缓冲区长度（以秒为单位）
function updateBufferLength(tileIndex, dashPlayer) {
  const bufferElement = document.getElementById(`buffer-${tileIndex + 1}`);
  if (bufferElement) {
    // 获取当前播放器的缓冲区长度
    const bufferLength = dashPlayer.getBufferLength();
    bufferElement.textContent = `${bufferLength.toFixed(2)} s`; // 保留两位小数
  }
}

// 更新卡顿时长
function updateStutterDuration(tileIndex, dashPlayer) {
  const stutterElement = document.getElementById(`rebuffer-${tileIndex + 1}`);
  if (stutterElement) {
    const currentTime = dashPlayer.time();

    // 如果正在卡顿，计算卡顿时长
    if (stuttering[tileIndex]) {
      const stutterDuration = (
        currentTime - stutterStartTimes[tileIndex]
      ).toFixed(2);
      stutterElement.textContent = `${stutterDuration} s`;
    } else {
      stutterElement.textContent = `0 s`;
    }
  }
}

// 页面加载后初始化
window.onload = function () {
  initializeDashPlayers();
  printPlayerTimestamps();

  const pauseButton = document.getElementById('pause');
  const fullScreenButton = document.getElementById('fullScreen');
  const showOptionsButton = document.getElementById('show-options');

  // 按钮点击事件
  pauseButton.addEventListener('click', togglePlayPause);
  fullScreenButton.addEventListener('click', toggleFullscreen);
  showOptionsButton.addEventListener('click', toggleOptions);

  // 动态加载流路径
  document.getElementById('load').addEventListener('click', function () {
    const streamPath = document.getElementById('stream-path').value;
    if (streamPath) {
      tileUrls = [streamPath];
      initializeDashPlayers();
    } else {
      alert('请输入有效的直播流路径');
    }
  });

  // 初始化流播放
  setTimeout(function () {
    console.log('all tile real item is set 1');
    for (var i = 0; i < 6; i++) {
      dashPlayers[i].seek(1);
    }
  }, 1000); // 1000毫秒 = 1秒

  setInterval(function () {
    dashPlayers.forEach(function (dashPlayer, index) {
      // 更新缓冲区长度
      updateBufferLength(index, dashPlayer);
      // 更新卡顿时长
      updateStutterDuration(index, dashPlayer);
    });
  }, 1000);
};
