"use strict";
let is_run = false, ticker, ticker2, wasted = 0, tasks = [], time = 0, version = 'v0.1.5';
(async () => {
    // tools
    document.querySelector('#app .tools .refresh-page').addEventListener('click', () => {
        location.reload();
    });
    document.querySelector('#app .tools .reset-data').addEventListener('click', async () => {
        let willDelete = await swal({
            text: "确定要删除所有自定义数据?",
            dangerMode: true,
            buttons: {
                cancel: "取消",
                confirm: "确定",
            },
        });
        if (willDelete) {
            for (let i = 0; i < 2; i++) {
                r();
            }
            function r() {
                for (let i = 0; i < localStorage.length; i++) {
                    let key = localStorage.key(i);
                    if (/^waste_traffic\./.test(key)) {
                        console.log(key);
                        localStorage.removeItem(key);
                    }
                }
            }
            swal("删除完成", "", "success");
        }
    });
    renderExp(document.querySelector('#app .tools .version'), { version: version });
})();
(async () => {
    // module-settings source
    let ele_select = document.querySelector('#app .module-settings .source select');
    let ele_select_inst = new mdui.Select(ele_select, { position: 'bottom' });
    let ele_input = document.querySelector('#app .module-settings .source input');
    if (localStorage['waste_traffic.source.value']) ele_input.value = localStorage['waste_traffic.source.value'];
    ele_select.value = ele_input.value;
    ele_select.addEventListener('change', () => {
        localStorage['waste_traffic.source.value'] = ele_select.value;
        ele_input.value = ele_select.value;
    });
    ele_input.addEventListener('input', () => {
        localStorage['waste_traffic.source.value'] = ele_input.value;
        ele_select.value = ele_input.value;
        ele_select_inst.handleUpdate();
    });
})();
(async () => {
    // module-settings thread
    let ele_input = document.querySelector('#app .module-settings .thread input');
    let ele_now = document.querySelector('#app .module-settings .thread .now');
    if (!localStorage['waste_traffic.thread.value']) localStorage['waste_traffic.thread.value'] = 1;
    ele_input.value = localStorage['waste_traffic.thread.value'];
    renderExp(ele_now, { thread: ele_input.value });
    ele_input.addEventListener('input', () => {
        localStorage['waste_traffic.thread.value'] = ele_input.value;
        renderExp(ele_now, { thread: ele_input.value });
    });
})();
(async () => {
    // run
    let ele = document.querySelector('#app .run button span');
    renderExp(ele);
    ele.parentElement.addEventListener('click', () => {
        is_run = !is_run;
        if (!localStorage['waste_traffic.source.value'] || localStorage['waste_traffic.source.value'] == "") {
            is_run = false;
            swal("请输入链接", "", "warning");
        } else if (/^about:/.test(localStorage['waste_traffic.source.value'])) {
            is_run = false;
            swal("此链接会使页面卡死", "", "warning");
        } else if (!/^http(s?):\/\/[^\s]+/.test(localStorage['waste_traffic.source.value'])) {
            is_run = false;
            swal("非标准链接", "", "warning");
        }
        showBlockOperate(is_run);
        ele.handleUpdate();
        if (is_run) {
            time = 0, wasted = 0;
            let ele_time = document.querySelector('#app .status .run_time');
            let ele_speed = document.querySelector('#app .status .waste_per_second');
            let ele_wasted = document.querySelector('#app .status .total_waste');
            renderExp(ele_time);
            renderExp(ele_speed, { speed: 0 });
            renderExp(ele_wasted);
            let last_length = 0;
            ticker = setInterval(() => {
                time++;
                renderExp(ele_time);
                renderExp(ele_speed, { speed: wasted - last_length });
                last_length = wasted;
            }, 1000);

            for (let i = 0; i < localStorage['waste_traffic.thread.value']; i++) {
                download(i);
            }
            async function download(index) {
                // console.log(index);
                try {
                    let response = await fetch(localStorage['waste_traffic.source.value'], {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    tasks[index] = response;
                    let reader = response.body.getReader();
                    while (true) {
                        if (!is_run) break;
                        const { done, value } = await reader.read();
                        if (done) {
                            if (is_run) download(index);
                            break;
                        }
                        wasted += value.length;
                    }
                } catch {
                    if (is_run) download(index);
                }
            }
        } else {
            clearInterval(ticker);
            // for (var i in tasks) {
            //     tasks[i].abort();
            // }
        }
    });
    (() => {
        let ele_time = document.querySelector('#app .status .run_time');
        let ele_speed = document.querySelector('#app .status .waste_per_second');
        let ele_wasted = document.querySelector('#app .status .total_waste');
        renderExp(ele_time);
        renderExp(ele_speed, { speed: 0 });
        renderExp(ele_wasted);
        ticker2 = setInterval(() => {
            renderExp(ele_wasted);
        }, 500);
    })();
})();
(async () => {
    // ip info
    let trace = null;
    let ips = [];
    trace = await (await fetch('https://ip.sb/cdn-cgi/trace')).text();
    ips.push(trace.match(/ip=(.*?)\n/)[1]);
    console.log(ips);
    let txt = '';
    for (let i in ips) {
        txt += ips[i] + "&ensp;";
    }
    renderExp(document.querySelector('#app .status .ips'), { ip: txt });
})();


function renderExp(ele, parameter) {
    ele.parameter = parameter;
    try {
        let js = ele.textContent.match(/{{(.*)}}/)[1];
        ele.handleUpdate = new Function(`this.innerHTML=${js}`);
    } catch { }
    ele.handleUpdate();
}
function renderExpUpdate(ele, ...args) {
    ele.parameter = args;
    ele.handleUpdate();
}
function showBlockOperate(will_show) {
    if (will_show) {
        document.querySelector('#app .module-settings').classList.add('paused');
        setTimeout(() => {
            document.querySelector('#app .module-settings .block-operate').classList.add('ani');
        }, 0);
    } else {
        document.querySelector('#app .module-settings .block-operate').classList.remove('ani');
        setTimeout(() => {
            document.querySelector('#app .module-settings').classList.remove('paused');
        }, 200);
    }
}
function autoUnitSize(size, reservationBitrvationBit = -1, automaticMerge = true) {
    let dataSize, dataUnit;
    if (size < 1024) {
        dataSize = size;
        dataUnit = 'B';
    } else if (size / Math.pow(1024, 1) < 1024) {
        dataSize = size / Math.pow(1024, 1);
        dataUnit = 'KB';
    } else if (size / Math.pow(1024, 2) < 1024) {
        dataSize = size / Math.pow(1024, 2);
        dataUnit = 'MB';
    } else {
        dataSize = size / Math.pow(1024, 3);
        dataUnit = 'GB';
    }
    if (reservationBitrvationBit > -1) {
        dataSize = Math.trunc(dataSize * Math.pow(10, reservationBitrvationBit)) / Math.pow(10, reservationBitrvationBit)
    }
    if (automaticMerge) {
        return dataSize + ' ' + dataUnit;
    }
    return {
        'dataSize': dataSize,
        'dataUnit': dataUnit,
    };
}
function autoUnitTime(time) {
    if (time < 60) {
        return time + 's';
    } else if (time / Math.pow(60, 1) < 60) {
        return Math.trunc(time / Math.pow(60, 1)) + 'm' + ' ' + (time % Math.pow(60, 1)) + 's';
    } else if ((time / Math.pow(60, 2) < 24)) {
        return Math.trunc(time / Math.pow(60, 2)) + 'h ' + Math.trunc(time % Math.pow(60, 2) / Math.pow(60, 1)) + 'm ' + (time % Math.pow(60, 1)) + 's';
    } else if (time != null) {
        return Math.trunc(time / (Math.pow(60, 2) * 24)) + 'd ' + Math.trunc(time % (Math.pow(60, 2) * 24) / Math.pow(60, 2)) + 'h ' + Math.trunc(time % Math.pow(60, 2) / Math.pow(60, 1)) + 'm ' + (time % Math.pow(60, 1)) + 's';
    } else {
        return NaN;
    }
}
