(function() {
    const initWidget = () => {
        const script = document.querySelector('#assiston-script');
        const token = script ? script.getAttribute('data-token') : null;

        if (!token) {
            console.error('Assiston: Support token missing.');
            return;
        }

        let new_id = crypto.randomUUID()
        const device_id = localStorage.getItem('device_id')
        if(!device_id){
            localStorage.setItem('device_id', new_id )
        }
        window.d_id = device_id
        window.supportToken = token;
        window.API_BASE = 'http://127.0.0.1:5000';

        const style = document.createElement('style');
        style.textContent = `
            :root {
                --primary-color: #4f46e5;
                --primary-hover: #4338ca;
                --bg-gray: #f3f4f6;
                --text-main: #374151;
                --text-light: #6b7280;
                --white: #ffffff;
                --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            }
            #assiston-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .as-window {
                display: none;
                flex-direction: column;
                width: 350px;
                height: 480px;
                background: var(--white);
                border-radius: 16px;
                box-shadow: var(--shadow);
                margin-bottom: 16px;
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.05);
                animation: asSlideUp 0.3s ease-out forwards;
            }
            @keyframes asSlideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .as-window.active { display: flex; }
            .as-header {
                background: var(--primary-color);
                padding: 14px 16px;
                color: var(--white);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .as-header-info { display: flex; align-items: center; gap: 12px; }
            .as-avatar {
                width: 36px; height: 36px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; position: relative;
                font-size: 13px;
            }
            .as-status {
                position: absolute; bottom: 0; right: 0;
                width: 10px; height: 10px;
                background: #4ade80; border: 2px solid var(--primary-color);
                border-radius: 50%;
            }
            .as-header-text h3 { font-size: 14px; font-weight: 600; margin: 0; }
            .as-header-text p { font-size: 11px; opacity: 0.8; margin: 0; }
            .as-close {
                background: none; border: none; color: white;
                cursor: pointer; padding: 4px; border-radius: 8px;
            }
            .as-messages {
                flex: 1; overflow-y: auto; padding: 16px;
                background: #f9fafb; display: flex; flex-direction: column; gap: 12px;
            }
            .as-row { display: flex; width: 100%; }
            .as-row.user { justify-content: flex-end; }
            .as-bubble {
                max-width: 80%; padding: 10px 14px; font-size: 13px; line-height: 1.4;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .bot .as-bubble {
                background: var(--white); color: var(--text-main);
                border: 1px solid #e5e7eb; border-radius: 16px 16px 16px 0;
            }
            .user .as-bubble {
                background: var(--primary-color); color: var(--white);
                border-radius: 16px 16px 0 16px;
            }
            .as-tray {
                padding: 8px 16px; background: #eef2ff;
                border-top: 1px solid #e0e7ff; display: none;
            }
            .as-tray.visible { display: block; }
            .as-prog-bg { width: 100%; height: 4px; background: #c7d2fe; border-radius: 10px; }
            .as-prog-fill { height: 100%; background: var(--primary-color); width: 0%; border-radius: 10px; }
            .as-typing { padding: 8px 16px; font-size: 11px; color: var(--text-light); font-style: italic; display: none; }
            .as-input-area { padding: 12px 16px; background: var(--white); border-top: 1px solid #f3f4f6; }
            .as-actions { display: flex; gap: 10px; margin-bottom: 6px; }
            .as-action-btn { background: none; border: none; color: var(--text-light); cursor: pointer; padding: 0; }
            .as-input-wrap { display: flex; gap: 8px; }
            .as-input-wrap input {
                flex: 1; background: #f3f4f6; border: none;
                padding: 8px 16px; border-radius: 20px; outline: none; font-size: 13px; color:black;
            }
            .as-send {
                background: var(--primary-color); color: white; border: none;
                width: 32px; height: 32px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; cursor: pointer;
            }
            .as-emoji {
                position: absolute; bottom: 100px; left: 16px; right: 16px;
                background: white; border: 1px solid #e5e7eb; border-radius: 12px;
                box-shadow: var(--shadow); padding: 8px; display: none;
                grid-template-columns: repeat(6, 1fr); gap: 4px;
            }
            .as-emoji.active { display: grid; }
            .as-fab {
                width: 56px; height: 56px; background: var(--primary-color);
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                color: white; border: none; cursor: pointer; box-shadow: var(--shadow);
            }
            .as-hidden { display: none; }
            @media (max-width: 480px) { .as-window { width: calc(100vw - 48px); height: 60vh; } }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'assiston-container';
        container.innerHTML = `
            <div id="as-window" class="as-window">
                <div class="as-header">
                    <div class="as-header-info">
                        <div class="as-avatar">AS<div class="as-status"></div></div>
                        <div class="as-header-text">
                            <h3>Assiston</h3>
                            <p>Online | Average reply: 1m</p>
                        </div>
                    </div>
                    <button id="as-close" class="as-close">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div id="as-messages" class="as-messages">
                    <div class="as-row bot"><div class="as-bubble">Hello! 👋 I'm Assiston. How can we help you today?</div></div>
                </div>
                <div id="as-tray" class="as-tray">
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#4f46e5; margin-bottom:4px; font-weight:600;">
                        <span>UPLOADING...</span><span id="as-perc">0%</span>
                    </div>
                    <div class="as-prog-bg"><div id="as-fill" class="as-prog-fill"></div></div>
                </div>
                <div id="as-typing" class="as-typing">...</div>
                <div id="as-emoji" class="as-emoji"></div>
                <div class="as-input-area">
                    <div class="as-actions">
                        <button type="button" id="as-emoji-btn" class="as-action-btn">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <label class="as-action-btn">
                            <input type="file" id="as-file" class="as-hidden" accept="image/*">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </label>
                    </div>
                    <form id="as-form" class="as-input-wrap">
                        <input type="text" id="as-input" placeholder="Type your message..." autocomplete="off">
                        <button type="submit" class="as-send">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            </div>
            <button id="as-fab" class="as-fab">
                <svg id="as-icon-open" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <svg id="as-icon-close" class="as-hidden" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
        `;
        document.body.appendChild(container);

        const emojis = ['😊', '😂', '👋', '👍', '🔥', '🤔', '❤️', '✨', '🙌', '🚀', '💡', '✅'];
        const emojiGrid = document.getElementById('as-emoji');
        const input = document.getElementById('as-input');
        
        emojis.forEach(e => {
            const b = document.createElement('button');
            b.type = 'button';
            b.style.cssText = 'background:none; border:none; font-size:18px; cursor:pointer; padding:4px;';
            b.textContent = e;
            b.onclick = () => {
                input.value += e;
                emojiGrid.classList.remove('active');
                input.focus();
            };
            emojiGrid.appendChild(b);
        });

        const win = document.getElementById('as-window');
        const fab = document.getElementById('as-fab');
        const msgs = document.getElementById('as-messages');
        const typing = document.getElementById('as-typing');

        fab.onclick = () => {
            const active = win.classList.toggle('active');
            document.getElementById('as-icon-open').classList.toggle('as-hidden', active);
            document.getElementById('as-icon-close').classList.toggle('as-hidden', !active);
            if (active) input.focus();
        };

        document.getElementById('as-close').onclick = fab.onclick;
        document.getElementById('as-emoji-btn').onclick = () => emojiGrid.classList.toggle('active');

        const addMsg = (txt, user = false) => {
            const r = document.createElement('div');
            r.className = `as-row ${user ? 'user' : 'bot'}`;
            r.innerHTML = `<div class="as-bubble">${txt}</div>`;
            msgs.appendChild(r);
            msgs.scrollTop = msgs.scrollHeight;
        };

        document.getElementById('as-form').onsubmit = async (e) => {
            e.preventDefault();
            const val = input.value.trim();
            if (!val) return;

            addMsg(val, true);
            input.value = '';
            typing.style.display = 'block';

            try {
                const response = await fetch(window.API_BASE + '/support', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + window.supportToken
                    },
                    body: JSON.stringify({ 'msg': val, 'wid':window.supportToken,'email':'lutancorpinfoteam@gmail.com', 'd_id':window.d_id})
                });
                
                const data = await response.json();
                typing.style.display = 'none';

                if (data.error) {
                    addMsg("Error: " + data.error);
                } else {
                    addMsg(data.message);
                }
            } catch (err) {
                typing.style.display = 'none';
                addMsg("Connection error.");
                console.error(err);
            }
        };

        document.getElementById('as-file').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const tray = document.getElementById('as-tray');
            const fill = document.getElementById('as-fill');
            const perc = document.getElementById('as-perc');
            
            tray.classList.add('visible');
            let p = 0;
            const interval = setInterval(() => {
                p += 10;
                fill.style.width = p + '%';
                perc.textContent = p + '%';
                
                if (p >= 100) {
                    clearInterval(interval);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const r = document.createElement('div');
                        r.className = 'as-row user';
                        r.innerHTML = `<div class="as-bubble" style="padding:4px"><img src="${ev.target.result}" style="width:100%; border-radius:8px; max-height:180px; object-fit:cover;"></div>`;
                        msgs.appendChild(r);
                        msgs.scrollTop = msgs.scrollHeight;
                        tray.classList.remove('visible');
                        fill.style.width = '0%';
                    };
                    reader.readAsDataURL(file);
                }
            }, 100);
        };
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();