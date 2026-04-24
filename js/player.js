// 加载语言
let zh_CN = ($("title").text() == "音频可视化圆环特效");

// 初始化文件
function clearInputFiles(inputId) {
    let inputElement = document.getElementById(inputId);
    if (inputElement.files && inputElement.files.length > 0) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(inputElement.files[0]);
        reader.onload = function () {
            inputElement.value = '';
        };
    }
}

// 还原背景图
function recover_bg() {
    $(".bg").css("background-image", "url(./src/bg.jpg)");
    clearInputFiles("bgFile");
}

// 加载全屏按钮
function openFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

// exit fullscreen
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }
}

function loadFullscreen() {
    // fullscreen related
    document.getElementById("fullscreen").addEventListener("click", function () {
        if (document.fullscreenElement) {
            closeFullscreen();
        } else {
            openFullscreen(document.documentElement);
        }
    });

    document.addEventListener('fullscreenchange', function () {
        if (document.fullscreenElement) {
            document.getElementById("fullscreen").innerText = zh_CN ? "退出全屏" : "Exit fullscreen";
        } else {
            document.getElementById("fullscreen").innerText = zh_CN ? "全屏" : "Fullscreen";
        }
    });
}

// 检查设备类型
function checkDeviceType() {
    const userAgent = navigator.userAgent || window.opera;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        let warning = zh_CN ? "请使用 PC 端浏览器查看!" : "Please view on PC browsers!"
        $("body").remove();
        $("html").append(`<body><h1 style="text-align: center; font-size: xxx-large;">${warning}</h1></body>`);
        return false;
    }
    return true;
}

window.onload = function () {
    if (!checkDeviceType()) return;
    wrap.width = window.innerWidth - 1;
    wrap.height = window.innerHeight - 1;
    let canvasCtx = wrap.getContext("2d");
    let AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    let audioContext = new AudioContext();
    canvasCtx.shadowColor = "white";
    canvasCtx.shadowBlur = 10;

    $("#home").click(function () {
        recover_bg();
    });

    $('#upl').hover(function () {
        $(this).removeClass("first");
    });

    $('#bgFile').change(function () {
        if (this.files.length <= 0) return;
        if (this.files[0].size > 5242880) {
            alert(zh_CN ? '文件大小超过 5M' : 'File size larger than 5M');
            return;
        }
        let file = this.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            $('.bg').css('background-image', 'url(' + reader.result + ')');
        };
    });

    $('#musicFile').change(function () {
        if (this.files.length == 0) {
            $("#tip").text(zh_CN ? "上传待可视化的音频👉" : "Upload audio to be visualized👉");
            return;
        }
        audioContext.close();
        audioContext = new AudioContext();
        $("#startStop").val(zh_CN ? '暂停' : 'Pause');
        let file = $('#musicFile')[0].files[0];
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function (e) {
            let count = 0;
            $('#tip').text(zh_CN ? '开始解码' : 'Start decoding')
            let timer = setInterval(function () {
                count++;
                $('#tip').text((zh_CN ? '正在解码中, 已耗时 ' : 'In decoding, already used ') + count + 's')
            }, 1000)
            audioContext.decodeAudioData(e.target.result, function (buffer) {
                clearInterval(timer)
                $('#tip').text((zh_CN ? '解码成功, 总耗时 ' : 'Decoded successfully, total time ') + count + 's');
                let audioBufferSourceNode = audioContext.createBufferSource();
                let analyser = audioContext.createAnalyser();
                audioBufferSourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
                audioBufferSourceNode.buffer = buffer;
                audioBufferSourceNode.start();
                startStop.onclick = function () {
                    if (audioContext.state === 'running') {
                        audioContext.suspend().then(function () {
                            $("#startStop").val(zh_CN ? '播放' : 'Play');
                        });
                    } else if (audioContext.state === 'suspended') {
                        audioContext.resume().then(function () {
                            $("#startStop").val(zh_CN ? '暂停' : 'Pause');
                        });
                    }
                }
                let oW = wrap.width;
                let oH = wrap.height;
                let color1 = canvasCtx.createLinearGradient(oW / 2, oH / 2 - 10, oW / 2, oH / 2 - 150);
                color1.addColorStop(0, '#1E90FF');
                color1.addColorStop(.25, '#FF7F50');
                color1.addColorStop(.5, '#8A2BE2');
                color1.addColorStop(.75, '#4169E1');
                color1.addColorStop(1, '#00FFFF');
                let color2 = canvasCtx.createLinearGradient(0, 0, oW, oH);
                color2.addColorStop(0, '#1E90FF');
                color2.addColorStop(.25, '#FFD700');
                color2.addColorStop(.5, '#8A2BE2');
                color2.addColorStop(.75, '#4169E1');
                color2.addColorStop(1, '#FF0000');
                let output = new Uint8Array(180);
                let du = 2;
                let R = 200;
                let W = 2;
                (function drawSpectrum() {
                    analyser.getByteFrequencyData(output);
                    canvasCtx.clearRect(0, 0, wrap.width, wrap.height);
                    for (let i = 0; i < 360; i++) {
                        let value = output[i] / 10;
                        canvasCtx.beginPath();
                        canvasCtx.lineWidth = W;
                        Rv1 = (R - value);
                        Rv2 = (R + value);
                        canvasCtx.moveTo((Math.sin((i * du) / 180 * Math.PI) * Rv1 + oW / 2), -Math.cos((i * du) / 180 * Math.PI) * Rv1 + oH / 2);
                        canvasCtx.lineTo((Math.sin((i * du) / 180 * Math.PI) * Rv2 + oW / 2), -Math.cos((i * du) / 180 * Math.PI) * Rv2 + oH / 2);
                        canvasCtx.strokeStyle = color1;
                        canvasCtx.stroke();
                    }
                    canvasCtx.font = "italic bold 20px Microsoft Yahei";
                    canvasCtx.fillStyle = color2;
                    canvasCtx.textAlign = "center";
                    canvasCtx.textBaseline = "middle";
                    canvasCtx.fillText(file.name.split('.mp3')[0], oW / 2, oH / 2);
                    requestAnimationFrame(drawSpectrum);
                })();

                $(window).resize(function () {
                    wrap.width = window.innerWidth - 1;
                    wrap.height = window.innerHeight - 1;
                    let oW = wrap.width;
                    let oH = wrap.height;
                    (function drawSpectrum() {
                        analyser.getByteFrequencyData(output);
                        canvasCtx.clearRect(0, 0, wrap.width, wrap.height);
                        for (let i = 0; i < 360; i++) {
                            let value = output[i] / 10;
                            canvasCtx.beginPath();
                            canvasCtx.lineWidth = W;
                            Rv1 = (R - value);
                            Rv2 = (R + value);
                            canvasCtx.moveTo((Math.sin((i * du) / 180 * Math.PI) * Rv1 + oW / 2), -Math.cos((i * du) / 180 * Math.PI) * Rv1 + oH / 2);
                            canvasCtx.lineTo((Math.sin((i * du) / 180 * Math.PI) * Rv2 + oW / 2), -Math.cos((i * du) / 180 * Math.PI) * Rv2 + oH / 2);
                            canvasCtx.strokeStyle = color1;
                            canvasCtx.stroke();
                        }
                        canvasCtx.font = "italic bold 20px Microsoft Yahei";
                        canvasCtx.fillStyle = color2;
                        canvasCtx.textAlign = "center";
                        canvasCtx.textBaseline = "middle";
                        canvasCtx.fillText(file.name.split('.mp3')[0], oW / 2, oH / 2);
                        requestAnimationFrame(drawSpectrum);
                    })();
                });
            })
        }
    });

    loadFullscreen();
}