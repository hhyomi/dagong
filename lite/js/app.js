/**
 * 打工人日记 - 全局共享模块
 */

/* ========== 存储层 ========== */
const Store = {
    get(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v !== null ? JSON.parse(v) : fallback;
        } catch { return fallback; }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

/* ========== 金币系统 ========== */
const Coins = {
    get()      { return Store.get('coins', 1000); },
    set(v)     { Store.set('coins', v); },
    add(n)     { const v = this.get() + n; this.set(v); Store.set('totalCoinsEarned', this.totalEarned() + n); return v; },
    spend(n)   {
        const cur = this.get();
        if (cur < n) return false;
        this.set(cur - n);
        return true;
    },
    current()     { return this.get(); },
    totalEarned() { return Store.get('totalCoinsEarned', 0); }
};

/* ========== 精力值系统 ========== */
const Energy = {
    MAX: 100,
    get()   { return Math.min(Store.get('energy', 80), this.MAX); },
    set(v)  { Store.set('energy', Math.max(0, Math.min(v, this.MAX))); },
    add(n)  { const v = Math.min(this.get() + n, this.MAX); this.set(v); return v; },
    use(n)  {
        const cur = this.get();
        if (cur < n) return false;
        this.set(cur - n);
        return true;
    },
    current() { return this.get(); },
    percent() { return Math.round(this.get() / this.MAX * 100); }
};

/* ========== 等级系统（根据累计工作分钟数） ========== */
const Level = {
    thresholds: [0, 60, 180, 360, 600, 1000, 1500, 2200, 3000, 4000, 5500],
    titles: ['实习生', '打工新人', '摸鱼达人', '工位常客', '加班战士', '卷王候选', '部门之星', '劳模标兵', '打工皇帝', '财务自由', '退休大佬'],
    calc() {
        const mins = WorkStats.totalMinutes();
        let lv = 0;
        for (let i = this.thresholds.length - 1; i >= 0; i--) {
            if (mins >= this.thresholds[i]) { lv = i; break; }
        }
        return lv;
    },
    current()  { return this.calc(); },
    title()    { return this.titles[this.calc()]; },
    nextMins() {
        const lv = this.calc();
        if (lv >= this.thresholds.length - 1) return 0;
        return this.thresholds[lv + 1] - WorkStats.totalMinutes();
    },
    progress() {
        const lv = this.calc();
        if (lv >= this.thresholds.length - 1) return 100;
        const cur = WorkStats.totalMinutes() - this.thresholds[lv];
        const need = this.thresholds[lv + 1] - this.thresholds[lv];
        return Math.round(cur / need * 100);
    }
};

/* ========== 工作统计 ========== */
const WorkStats = {
    _todayKey() { return `workStats_${new Date().toDateString()}`; },
    todayData() {
        return Store.get(this._todayKey(), { sessions: 0, totalSec: 0, longestSec: 0, breaks: 0 });
    },
    saveTodayData(data) { Store.set(this._todayKey(), data); },
    addSession(seconds) {
        const d = this.todayData();
        d.sessions++;
        d.totalSec += seconds;
        if (seconds > d.longestSec) d.longestSec = seconds;
        this.saveTodayData(d);
        const allMins = Store.get('totalWorkMinutes', 0);
        Store.set('totalWorkMinutes', allMins + Math.floor(seconds / 60));
    },
    addBreak() {
        const d = this.todayData();
        d.breaks++;
        this.saveTodayData(d);
    },
    totalMinutes() { return Store.get('totalWorkMinutes', 0); },
    totalHours()   { return Math.floor(this.totalMinutes() / 60); },
    dayCount() {
        const first = Store.get('firstWorkDate', null);
        if (!first) return 1;
        const diff = Date.now() - new Date(first).getTime();
        return Math.max(1, Math.ceil(diff / 86400000));
    },
    ensureFirstDate() {
        if (!Store.get('firstWorkDate', null)) {
            Store.set('firstWorkDate', new Date().toISOString());
        }
    },
    weekData() {
        const result = [];
        const today = new Date();
        const dayOfWeek = today.getDay() || 7;
        for (let i = 1; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - dayOfWeek + i);
            const key = `workStats_${d.toDateString()}`;
            const data = Store.get(key, { totalSec: 0 });
            result.push(Math.round(data.totalSec / 60));
        }
        return result;
    }
};

/* ========== 工作计时器状态（跨页面持久化） ========== */
const WorkTimer = {
    getState() {
        return Store.get('workTimerState', { active: false, endTime: 0, totalHours: 8, startTime: 0 });
    },
    start(hours) {
        const now = Date.now();
        Store.set('workTimerState', {
            active: true,
            endTime: now + hours * 3600000,
            totalHours: hours,
            startTime: now
        });
        WorkStats.ensureFirstDate();
    },
    stop() {
        const state = this.getState();
        let workedSec = 0;
        if (state.active && state.startTime) {
            workedSec = Math.floor((Date.now() - state.startTime) / 1000);
            WorkStats.addSession(workedSec);
        }
        Store.set('workTimerState', { active: false, endTime: 0, totalHours: 8, startTime: 0 });
        return workedSec;
    },
    remaining() {
        const s = this.getState();
        if (!s.active) return 0;
        return Math.max(0, s.endTime - Date.now());
    },
    elapsed() {
        const s = this.getState();
        if (!s.active) return 0;
        return Math.max(0, Date.now() - s.startTime);
    },
    isActive() { return this.getState().active && this.remaining() > 0; }
};

/* ========== 购买记录持久化 ========== */
const PurchaseLog = {
    _key() { return `purchases_${new Date().toDateString()}`; },
    getToday() { return Store.get(this._key(), []); },
    add(name, icon) {
        const list = this.getToday();
        const now = new Date();
        list.unshift({
            name, icon,
            time: `${padTime(now.getHours())}:${padTime(now.getMinutes())}`
        });
        Store.set(this._key(), list);
    }
};

/* ========== 导航 ========== */
const NAV_ITEMS = [
    { icon: 'fa-home',      label: '首页', page: 'home' },
    { icon: 'fa-briefcase',  label: '工作', page: 'work' },
    { icon: 'fa-store',      label: '商城', page: 'shop' },
    { icon: 'fa-user',       label: '我的', page: 'profile' },
];

function renderTabBar(activePage) {
    const bar = document.getElementById('tab-bar');
    if (!bar) return;
    bar.innerHTML = NAV_ITEMS.map(item => `
        <div class="tab-item ${item.page === activePage ? 'active' : ''}" data-page="${item.page}">
            <i class="fas ${item.icon} tab-icon"></i>
            <span>${item.label}</span>
        </div>
    `).join('');
    bar.querySelectorAll('.tab-item').forEach(el => {
        el.addEventListener('click', () => {
            const page = el.dataset.page;
            if (page !== activePage) window.location.href = `${page}.html`;
        });
    });
}

/* ========== 状态栏 ========== */
function renderStatusBar() {
    const bar = document.getElementById('status-bar');
    if (!bar) return;
    const now = new Date();
    bar.innerHTML = `
        <div class="time">${padTime(now.getHours())}:${padTime(now.getMinutes())}</div>
        <div><i class="fa-solid fa-battery-three-quarters"></i></div>
    `;
}

/* ========== Toast（替代 alert） ========== */
function showToast(message, type = 'info', duration = 2500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-circle', coins: 'fa-coins' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ========== 特效函数 ========== */
function createStars(element, count = 5) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 70;
        star.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        star.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        star.innerHTML = '<i class="fas fa-star text-yellow-400"></i>';
        star.style.left = `${cx}px`;
        star.style.top = `${cy}px`;
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 1000);
    }
}

function createCoinRain(count = 20) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'coin-rain';
            coin.textContent = '🪙';
            const x = 50 + Math.random() * (window.innerWidth - 100);
            const fall = 300 + Math.random() * 400;
            coin.style.left = `${x}px`;
            coin.style.top = '0';
            coin.style.setProperty('--fall-height', `${fall}px`);
            document.body.appendChild(coin);
            setTimeout(() => coin.remove(), 2000);
        }, i * 100);
    }
}

function createFireworks(count = 50) {
    const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6'];
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const fw = document.createElement('div');
            fw.className = 'firework';
            fw.style.background = colors[Math.floor(Math.random() * colors.length)];
            fw.style.left = `${20 + Math.random() * (window.innerWidth - 40)}px`;
            fw.style.top = `${20 + Math.random() * (window.innerHeight - 40)}px`;
            document.body.appendChild(fw);
            const dur = 500 + Math.random() * 1000;
            const size = 3 + Math.random() * 5;
            fw.animate(
                [{ transform: 'scale(0)', opacity: 1 }, { transform: `scale(${size})`, opacity: 0 }],
                { duration: dur, easing: 'cubic-bezier(0,0,0.2,1)' }
            );
            setTimeout(() => fw.remove(), dur);
        }, Math.random() * 1500);
    }
}

function showTooltip(text, duration = 2000) {
    let tip = document.getElementById('coin-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'coin-tooltip';
        tip.className = 'coin-tooltip';
        tip.innerHTML = `<i class="fas fa-coins text-yellow-400 mr-3"></i><span></span>`;
        document.body.appendChild(tip);
    }
    tip.querySelector('span').textContent = text;
    tip.classList.add('active');
    setTimeout(() => tip.classList.remove('active'), duration);
}

/* ========== 工具函数 ========== */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    if (h < 22) return '晚上好';
    return '夜深了';
}

function getWeekday() {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
}

function formatDate() {
    const d = new Date();
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function padTime(n) {
    return n.toString().padStart(2, '0');
}

function formatDuration(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m > 0 ? m + 'm' : ''}`;
    return `${m}m`;
}

/* ========== 页面初始化 ========== */
document.addEventListener('DOMContentLoaded', () => {
    renderStatusBar();
    setInterval(renderStatusBar, 30000);
});
