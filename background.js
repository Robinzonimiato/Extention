'use strict';

const CONFIG_API_URL = 'https://us-central1-affilates-5f993.cloudfunctions.net/getConfig';

const CHECK_ALARM_NAME = 'checkAffiliateConfig';
const STORAGE_KEY_CONFIG_VERSION = 'affiliateConfigVersion';
const STORAGE_KEY_PENDING_NOTIFICATION = 'pendingUpdateNotification';

const handleActionClick = async (tab) => {
    if (tab.id) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'toggleAdminPanel'
            });
        } catch (error) {
            // Ігноруємо помилку, якщо content_script не активний на цій вкладці.
        }
    }
};

chrome.action.onClicked.addListener(handleActionClick);

async function checkForUpdates() {
    try {
        const response = await fetch(CONFIG_API_URL);

        if (!response.ok) {
            throw new Error(`Помилка сервера API: ${response.status} ${response.statusText}`);
        }

        const remoteConfig = await response.json();

        if (!remoteConfig.version || !Array.isArray(remoteConfig.affiliates)) {
            throw new Error('Структура конфігурації з API є невірною.');
        }

        const remoteVersion = remoteConfig.version;
        const localData = await chrome.storage.local.get(STORAGE_KEY_CONFIG_VERSION);
        const localVersion = localData[STORAGE_KEY_CONFIG_VERSION];

        if (remoteVersion !== localVersion) {
            const tabs = await chrome.tabs.query({
                url: ["https://*.gosystem.io/*", "https://*.livechatinc.com/*", "https://*.livechat.com/*"]
            });

            const sendPromises = tabs.map(tab =>
                tab.id ? chrome.tabs.sendMessage(tab.id, {
                    action: 'configUpdateAvailable',
                    updateData: remoteConfig
                }).catch(() => Promise.reject()) : Promise.reject()
            );

            try {
                await Promise.any(sendPromises);
                await chrome.storage.local.remove(STORAGE_KEY_PENDING_NOTIFICATION);
            } catch (error) {
                // Якщо активних вкладок немає, зберігаємо оновлення для майбутнього
                await chrome.storage.local.set({
                    [STORAGE_KEY_PENDING_NOTIFICATION]: remoteConfig
                });
            }
            return {
                updated: true,
                version: remoteVersion
            };
        } else {
            return {
                updated: false
            };
        }
    } catch (error) {
        console.error("Помилка під час оновлення конфігурації з API:", error);
        return {
            updated: false,
            error: error.message
        };
    }
}

chrome.runtime.onInstalled.addListener(() => {
    checkForUpdates();
    chrome.alarms.create(CHECK_ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: 60
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CHECK_ALARM_NAME) {
        checkForUpdates();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "manualUpdateCheck") {
        (async () => {
            const updateResult = await checkForUpdates();
            if (!chrome.runtime.lastError) {
                sendResponse({
                    status: "ok",
                    updateStatus: updateResult
                });
            }
        })();
        return true;
    }
});
