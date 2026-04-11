/**
 * 天机阁 H5 - 主JavaScript文件
 * 功能：粒子动画、页面交互、八字计算、塔罗占卜
 */

// ========================================
// 粒子背景系统
// ========================================
const ParticleSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // 粒子数量根据屏幕大小调整
        const count = Math.min(50, (this.canvas.width * this.canvas.height) / 15000);
        if (this.particles.length > count) {
            this.particles = this.particles.slice(0, count);
        }
    },

    createParticles() {
        const count = Math.min(50, (this.canvas.width * this.canvas.height) / 15000);
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    },

    animate() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和绘制粒子
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            // 边界处理
            if (p.x > this.canvas.width) p.x = 0;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.y > this.canvas.height) p.y = 0;
            if (p.y < 0) p.y = this.canvas.height;

            // 绘制粒子
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
            this.ctx.fill();
        });

        // 连接临近粒子
        this.particles.forEach((a, i) => {
            this.particles.slice(i + 1).forEach(b => {
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 80) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(212, 175, 55, ${0.1 * (1 - dist / 80)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(a.x, a.y);
                    this.ctx.lineTo(b.x, b.y);
                    this.ctx.stroke();
                }
            });
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};

// ========================================
// 八字计算模块
// ========================================
const BaziCalculator = {
    gan: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    zhi: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    wuxing: ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'],
    personalities: ['刚毅果断', '温和善良', '聪慧机敏', '沉稳踏实', '热情开朗', '细腻敏感'],
    careers: ['适合从事管理、领导工作', '适合从事教育、文化领域', '适合从事创意、艺术行业', '适合从事技术、专业领域', '适合从事商业、金融领域'],
    fortunes: ['近期运势平稳，宜守成', '有新机遇出现，把握时机', '需留意人际关系，谨言慎行', '财运亨通，适合投资理财', '感情方面有新进展'],

    selectedGender: null,

    setGender(element, gender) {
        document.querySelectorAll('.gender-option').forEach(opt => opt.classList.remove('active'));
        element.classList.add('active');
        this.selectedGender = gender;
    },

    calculate() {
        const year = document.getElementById('birthYear')?.value;
        const month = document.getElementById('birthMonth')?.value;
        const day = document.getElementById('birthDay')?.value;
        const hour = document.getElementById('birthHour')?.value;

        if (!year || !month || !day || !hour || !this.selectedGender) {
            this.showToast('请填写完整的出生信息');
            return;
        }

        // 计算八字
        const yearGan = this.gan[(year - 4) % 10];
        const yearZhi = this.zhi[(year - 4) % 12];
        const monthGan = this.gan[(year * 2 + parseInt(month)) % 10];
        const monthZhi = this.zhi[(parseInt(month) + 1) % 12];

        // 日柱使用简化计算
        const baseDate = new Date(1900, 0, 31);
        const birthDate = new Date(year, month - 1, day);
        const daysDiff = Math.floor((birthDate - baseDate) / (1000 * 60 * 60 * 24));
        const dayGan = this.gan[daysDiff % 10];
        const dayZhi = this.zhi[daysDiff % 12];

        const hourGan = this.gan[(parseInt(hour) + 1) % 10];
        const hourZhi = this.zhi[parseInt(hour)];

        this.displayResult({
            year: yearGan + yearZhi,
            month: monthGan + monthZhi,
            day: dayGan + dayZhi,
            hour: hourGan + hourZhi,
            dayGan: dayGan
        });
    },

    displayResult(bazi) {
        const resultPanel = document.getElementById('baziResult');
        const content = document.getElementById('baziContent');

        const wuxingStr = this.wuxing[this.gan.indexOf(bazi.dayGan)];
        const personality = this.personalities[Math.floor(Math.random() * this.personalities.length)];
        const career = this.careers[Math.floor(Math.random() * this.careers.length)];
        const fortune = this.fortunes[Math.floor(Math.random() * this.fortunes.length)];

        content.innerHTML = `
            <div class="bazi-grid">
                <div class="bazi-cell">
                    <div class="bazi-char">${bazi.year}</div>
                    <div class="bazi-label">年柱</div>
                </div>
                <div class="bazi-cell">
                    <div class="bazi-char">${bazi.month}</div>
                    <div class="bazi-label">月柱</div>
                </div>
                <div class="bazi-cell">
                    <div class="bazi-char">${bazi.day}</div>
                    <div class="bazi-label">日柱</div>
                </div>
                <div class="bazi-cell">
                    <div class="bazi-char">${bazi.hour}</div>
                    <div class="bazi-label">时柱</div>
                </div>
            </div>
            <div class="result-content">
                <p><strong>日主：</strong>${bazi.dayGan}，五行属${wuxingStr}，性格${personality}。</p>
                <p><strong>事业：</strong>${career}</p>
                <p><strong>运势：</strong>${fortune}</p>
            </div>
        `;

        resultPanel.classList.add('active');
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    showToast(message) {
        // 简单的提示实现
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26,26,46,0.95);
            color: var(--color-accent-gold);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid var(--color-accent-gold);
            z-index: 1000;
            font-size: 0.9rem;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
};

// ========================================
// 塔罗占卜模块
// ========================================
const TarotReader = {
    deck: [
        { name: '愚者', meaning: '新的开始，冒险，信任直觉' },
        { name: '魔术师', meaning: '创造力，意志力，资源整合' },
        { name: '女祭司', meaning: '直觉，内在智慧，神秘' },
        { name: '皇后', meaning: '丰饶，母性，创造力' },
        { name: '皇帝', meaning: '权威，稳定，掌控' },
        { name: '教皇', meaning: '传统，精神指引，信仰' },
        { name: '恋人', meaning: '爱情，选择，和谐' },
        { name: '战车', meaning: '意志力，胜利，控制' },
        { name: '力量', meaning: '勇气，耐心，内在力量' },
        { name: '隐士', meaning: '内省，独处，寻找真理' },
        { name: '命运之轮', meaning: '变化，命运，转折点' },
        { name: '正义', meaning: '公平，因果，真理' },
        { name: '倒吊人', meaning: '牺牲，新视角，等待' },
        { name: '死神', meaning: '转变，结束，新生' },
        { name: '节制', meaning: '平衡，节制，和谐' },
        { name: '恶魔', meaning: '束缚，欲望，物质主义' },
        { name: '塔', meaning: '突变，觉醒，打破旧有' },
        { name: '星星', meaning: '希望，灵感，宁静' },
        { name: '月亮', meaning: '幻觉，恐惧，潜意识' },
        { name: '太阳', meaning: '成功，快乐，活力' },
        { name: '审判', meaning: '重生，觉醒，救赎' },
        { name: '世界', meaning: '完成，圆满，成就' }
    ],

    currentCards: [],
    revealedCards: [],
    isRevealing: false,

    init() {
        this.shuffle();
    },

    shuffle() {
        this.revealedCards = [];
        this.isRevealing = false;

        // 随机抽取3张牌
        const shuffled = [...this.deck].sort(() => Math.random() - 0.5);
        this.currentCards = shuffled.slice(0, 3);

        // 重置UI
        for (let i = 0; i < 3; i++) {
            const card = document.getElementById(`tarotCard${i}`);
            if (card) {
                card.classList.remove('flipped');
                card.style.transform = '';
            }
            const nameEl = document.getElementById(`cardName${i}`);
            const meaningEl = document.getElementById(`cardMeaning${i}`);
            if (nameEl) nameEl.textContent = '';
            if (meaningEl) meaningEl.textContent = '';
        }

        const result = document.getElementById('tarotResult');
        if (result) result.classList.remove('active');
    },

    reveal(index) {
        if (this.isRevealing || this.revealedCards.includes(index)) return;

        const card = document.getElementById(`tarotCard${index}`);
        if (!card) return;

        this.isRevealing = true;

        // 添加翻转动画
        card.classList.add('flipped');

        // 设置牌面内容
        setTimeout(() => {
            const nameEl = document.getElementById(`cardName${index}`);
            const meaningEl = document.getElementById(`cardMeaning${index}`);
            if (nameEl) nameEl.textContent = this.currentCards[index].name;
            if (meaningEl) meaningEl.textContent = this.currentCards[index].meaning;
        }, 300);

        this.revealedCards.push(index);
        this.isRevealing = false;

        // 所有牌都翻开，显示解读
        if (this.revealedCards.length === 3) {
            setTimeout(() => this.showReading(), 800);
        }
    },

    showReading() {
        const positions = ['过去/根源', '现在/状况', '未来/指引'];
        const result = document.getElementById('tarotResult');
        const content = document.getElementById('tarotContent');

        let html = '';
        this.revealedCards.forEach((cardIndex, i) => {
            const card = this.currentCards[cardIndex];
            html += `
                <div class="tarot-reading-item">
                    <div class="reading-position">${positions[i]}</div>
                    <div class="reading-card-name">${card.name}</div>
                    <div class="reading-meaning">${card.meaning}</div>
                </div>
            `;
        });

        html += `
            <div class="reading-summary">
                <div class="reading-summary-title">综合启示</div>
                <div class="reading-summary-text">
                    从${this.currentCards[0].name}到${this.currentCards[1].name}再到${this.currentCards[2].name}，
                    这三张牌描绘了一段完整的能量流动。每一张牌都是一面镜子，映照出您内心深处的真实。
                    建议您保持觉知，信任生命的智慧。
                </div>
            </div>
        `;

        content.innerHTML = html;
        result.classList.add('active');
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

// ========================================
// 页面初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化粒子背景
    ParticleSystem.init();

    // 初始化塔罗
    if (document.getElementById('tarotCard0')) {
        TarotReader.init();
    }

    // 添加触摸反馈优化
    document.querySelectorAll('.btn, .service-card, .tarot-card').forEach(el => {
        el.addEventListener('touchstart', () => {
            el.style.transform = 'scale(0.98)';
        });
        el.addEventListener('touchend', () => {
            el.style.transform = '';
        });
    });
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    ParticleSystem.destroy();
});
