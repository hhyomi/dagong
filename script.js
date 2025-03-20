// 更新打工状态人数
function updateWorkingStatus() {
    const countElement = document.querySelector('.count');
    const currentCount = parseInt(countElement.textContent.replace(',', ''));
    const newCount = currentCount + Math.floor(Math.random() * 10) - 5;
    countElement.textContent = newCount.toLocaleString();
    showToast('已更新工作状态');
}

// 小人跳到下班按钮的动画
function jumpToOffWork() {
    const avatar = document.querySelector('.avatar');
    const offWorkBtn = document.querySelector('.off-work');
    
    gsap.to(avatar, {
        y: -100,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
            gsap.to(avatar, {
                y: 0,
                duration: 0.5,
                ease: "bounce.out"
            });
        }
    });
    showToast('下班啦！好好休息吧');
}

// 生成图片
function generateImage() {
    const previewArea = document.getElementById('previewArea');
    
    html2canvas(previewArea, {
        allowTaint: true,
        useCORS: true,
        scale: 2
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = imgData;
        link.download = '打工人生存指南.png';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('图片已生成');
    }).catch(err => {
        console.error('图片生成失败', err);
        showToast('图片生成失败，请重试');
    });
}

// 分享图片
function shareImage() {
    const previewArea = document.getElementById('previewArea');
    
    html2canvas(previewArea, {
        allowTaint: true,
        useCORS: true,
        scale: 2
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        if (navigator.share) {
            canvas.toBlob(blob => {
                const file = new File([blob], '打工人生存指南.png', { type: 'image/png' });
                
                navigator.share({
                    title: '打工人生存指南',
                    text: '我的打工日记',
                    files: [file]
                }).then(() => {
                    showToast('分享成功');
                }).catch((error) => {
                    console.error('分享失败:', error);
                    showToast('分享失败，请手动保存图片');
                });
            });
        } else {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = '打工人生存指南.png';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('请保存图片后手动分享');
        }
    }).catch(err => {
        console.error('图片生成失败', err);
        showToast('生成分享图失败，请重试');
    });
}

// 自定义文案输入
document.getElementById('customText').addEventListener('input', function(e) {
    const previewText = document.querySelector('.preview-text');
    previewText.textContent = e.target.value || '在这里输入你的文案';
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加一些初始动画
    gsap.from('.banner', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });
}); 