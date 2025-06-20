(() => {
    'use strict';

    const config = {
        HOST_NR: "nr.gosystem.io",
        HOST_BOOMERANG: "nr1-boomerang.gosystem.io",
        DEFAULT_REFRESH_MINUTES_NR2: 7,
        DEFAULT_REFRESH_MINUTES_NR1: 10,
        MIN_REFRESH_INTERVAL_MINUTES: 1,
        CLICK_DEBOUNce_DELAY_MS: 200,
        FEEDBACK_TIMEOUT_MS: 3500,
        AFFILIATE_ID_CHECK_DEBOUNCE_MS: 150,
        INITIAL_CHECK_TIMEOUT_BASE_MS: 1000,
        MAX_INITIAL_CHECKS_COUNT: 3,
        STORAGE_KEYS: {
            REFRESH_INTERVAL_NR2: 'customRefreshIntervalMinutes_nr2_v1.0',
            AUTO_REFRESHER_ENABLED_NR2: 'autoRefresherEnabled_nr2_v1.0',
            REFRESH_INTERVAL_NR1: 'customRefreshIntervalMinutes_nr1_v1.0',
            AUTO_REFRESHER_ENABLED_NR1: 'autoRefresherEnabled_nr1_v1.0',
            AFFILIATE_MAPPINGS: 'customAffiliateMappings_v1.5_optimized_map',
            AFFILIATE_CONFIG_VERSION: 'affiliateConfigVersion',
            CLOCK_TYPE: 'clockType_v1.1',
            CURRENT_LANG: 'currentLang_v1.0',
            LIVECHAT_NAME_REPLACER_ENABLED: 'liveChatNameReplacerEnabled_v1',
            LIVECHAT_COPY_TOOLS_ENABLED: 'liveChatCopyToolsEnabled_v1',
            NR2_ID_COPY_ENABLED: 'nr2IdCopyEnabled_v1',
            CLEAR_RECENT_PLAYERS_ENABLED: 'clearRecentPlayersEnabled_v1',
            PENDING_UPDATE_NOTIFICATION: 'pendingUpdateNotification'
        },
        SITE_CONFIGS: {
            "nr.gosystem.io": {
                PLAYER_URL_PATTERNS: {
                    PLAYER_ID_REGEX: /^https:\/\/nr\.gosystem\.io\/players\/(\d+)(?:\/.*)?$/,
                    MAIN_PLAYER_PAGE_REGEX: /^https:\/\/nr\.gosystem\.io\/players\/\d+$/
                },
                AFFILIATE_INFO_ELEMENTS: {
                    PLAYER_INFO_TITLE_SELECTOR: "div.css-10xoxfq.e1cq1b422",
                    PLAYER_INFO_TITLE_TEXT: "Player info",
                    DL_IN_PLAYER_INFO_SELECTOR: "dl.css-1wq9tko.e1iw9x8m0",
                    DT_TEXT_CONTENT: "Affiliate ext."
                },
                PERFORMANCE_INFO_ELEMENTS: {
                    TOTAL_PERFORMANCE_TITLE_SELECTOR: "div.css-10xoxfq.e1cq1b422",
                    TOTAL_PERFORMANCE_TITLE_TEXT: "Total performance",
                    PERFORMANCE_DATA_CONTAINER_SELECTOR: "div.css-yvbb9j.e1cq1b424",
                    PERFORMANCE_DL_SELECTOR: "dl.e1cq1b423.css-1wq9tko.e1iw9x8m0",
                    BONUSES_RECEIVED_DT_TEXT: "Bonuses received",
                    TOTAL_DEPOSITS_DT_TEXT: "Total deposits",
                },
                NR2_ID_CONTAINER_SELECTOR: 'div.css-15gx7pk',
                NR2_ID_TEXT_WRAPPER_SELECTOR: 'span.css-178itt7',
                MUTATION_OBSERVER_ROOT_NODE_SELECTOR: "#app"
            },
            "nr1-boomerang.gosystem.io": {
                PERFORMANCE_PANEL_SELECTOR: "div.x-panel-body div[id^='form-'][id$='-innerCt']",
                NET_PROFIT_LAST_BONUS_INPUT_NAME: "netProfitSinceLastActivatedBonus",
                BONUSES_RECEIVED_INPUT_NAME: "bonusReceived",
                DEPOSITS_INPUT_NAME: "deposit",
                BONUS_RATE_FIELD_ID_PREFIX: "custom-bonus-rate-field-boomerang-",
                MUTATION_OBSERVER_ROOT_NODE_SELECTOR: "body",
                TABS_SELECTOR: ".x-tab-bar .x-tab",
                HEADER_CONTAINER_SELECTOR: "#panel-1016-innerCt"
            }
        },
        LIVECHAT_LV_CONFIG: {
            PRECHAT_SELECTOR: 'div[data-testid="prechat-form"]',
            INPUT_ID: 'chat-feed-text-area-id',
            NAME_REGEX: /\b(NAME)\b/g,
            WIDGET_CONTAINER_SELECTORS: ['#livechat-widget', 'div[data-id="lc-main-window"]'],
            SURNAME_PARTICLES: new Set(['von', 'der', 'de', 'van', 'di', 'da', 'do', 'dos', 'das', 'del', 'della', 'la', 'le', 'ter', 'ten', 'den', 'af', 'du', 'des', 'el'])
        },
        UI_ICONS: {
            COPY_ICON_SVG_PATH: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
            CHECK_ICON_SVG_PATH: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
            REFRESH_ICON_SVG_PATH: "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        }
    };

    const state = {
        isI18nReady: false,
        lang: 'uk',
        i18nData: {},
        localesCache: {},
        currentAffiliateMappings: new Map(),
        currentConfigVersion: '0.0.0',
        currentlyEditingId: null,
        currentOnConfirmCallback: null,
        currentOnCancelCallback: null,
        shownAffiliateForCurrentPlayerContext: {
            playerId: null,
            affiliateIdText: null
        },
        shownBonusRateForCurrentContext: {
            contextKey: null,
            htmlOutput: null
        },
        shownBonusRateBoomerang: {},
        lastCheckedAffiliateTextGlobal: null,
        domCheckDebounceTimeoutId: null,
        observer: null,
        refreshTimeoutId: null,
        countdownAnimFrameId: null,
        lastCountdownUpdateTime: 0,
        targetTime: 0,
        singleClickTimeoutRefresher: null,
        singleClickTimeoutHeaderRefresher: null,
        isRefresherInputControlsVisible: false,
        isHeaderRefresherInputControlsVisible: false,
        initialCheckCount: 0,
        currentSiteConfig: null,
        isNrSite: false,
        isBoomerangSite: false,
        isLiveChatSite: false,
        liveChatLV: {
            isEnabled: false,
            cachedFirstName: null,
            inputObservers: new WeakMap(),
            lastCheckedUrlForNameCache: null
        },
        featuresEnabled: {
            liveChatNameReplacer: false,
            liveChatCopyTools: true,
            nr2IdCopy: true,
            clearRecentPlayers: true,
        },
        clockType: 'implemented',
        currentSiteRefreshSettings: {
            intervalMinutes: config.DEFAULT_REFRESH_MINUTES_NR2,
            isEnabled: true,
            intervalKey: config.STORAGE_KEYS.REFRESH_INTERVAL_NR2,
            enabledKey: config.STORAGE_KEYS.AUTO_REFRESHER_ENABLED_NR2,
            defaultMinutes: config.DEFAULT_REFRESH_MINUTES_NR2
        }
    };

    const dom = {
        adminModal: {
            backdrop: null,
            content: null,
            listContainer: null,
            formContainer: null,
            feedback: null,
            fileInput: null,
            addNewButton: null,
            closeButton: null,
            title: null,
            listSection: null,
            settings: {
                title: null,
                timerSectionTitle: null,
                featuresSectionTitle: null,
                autoRefreshToggleLabel: null,
                clockTypeTitle: null,
                clockTypeOverlayLabel: null,
                clockTypeImplementedLabel: null,
                nameReplacerToggleLabel: null,
                copyToolsToggleLabel: null,
                nr2CopyIdToggleLabel: null,
                clearRecentToggleLabel: null,
            },
            mainButtons: {
                container: null,
                langSwitch: null,
                manualUpdate: null,
                import: null,
                export: null,
                saveAll: null,
            }
        },
        confirmModal: {
            backdrop: null,
            content: null,
            message: null,
            okButton: null,
            cancelButton: null
        },
        exportOptionsModal: {
            backdrop: null,
            content: null,
            versionInput: null,
            notesInput: null,
            exportButton: null,
            cancelButton: null,
        },
        refresher: {
            container: null,
            display: null,
            intervalInput: null,
            inputGroup: null,
            setButton: null,
            promptText: null
        },
        headerRefresher: {
            container: null,
            display: null,
            intervalInput: null,
            inputGroup: null,
            setButton: null,
            promptText: null
        },
        affiliateInfoModal: {
            backdrop: null
        },
        previewTooltip: null
    };

    const storageApi = typeof browser !== 'undefined' ? browser : chrome;

    async function loadLocale(lang) {
        state.isI18nReady = false;
        if (state.localesCache[lang]) {
            state.i18nData = state.localesCache[lang];
            state.isI18nReady = true;
            return;
        }
        if (!storageApi?.runtime?.getURL) {
            state.i18nData = {};
            return;
        }
        try {
            const localeUrl = storageApi.runtime.getURL(`_locales/${lang}/messages.json`);
            const response = await fetch(localeUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const messages = await response.json();
            state.i18nData = messages;
            state.localesCache[lang] = messages;
            state.isI18nReady = true;
        } catch (error) {
            state.i18nData = {};
        }
    }

    function getI18nMessage(key, substitutions) {
        if (!state.isI18nReady) return '';
        const messageData = state.i18nData[key];
        if (!messageData) return key;

        let message = messageData.message;
        if (substitutions) {
            const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
            subs.forEach((sub, i) => {
                message = message.replace(`$${i + 1}`, sub);
            });
        }
        return message;
    }

    function createPreviewTooltip() {
        if (document.getElementById('mapping-preview-tooltip')) return;
        dom.previewTooltip = createElement('div', {
            id: 'mapping-preview-tooltip'
        }, [createElement('img', {
            id: 'preview-tooltip-image'
        })]);
        document.body.appendChild(dom.previewTooltip);
    }

    function showPreview(event, resourceKey) {
        if (!dom.previewTooltip) return;
        const img = dom.previewTooltip.querySelector('#preview-tooltip-image');
        if (!img) return;

        const resourcePath = getI18nMessage(resourceKey);

        img.src = resourcePath.startsWith('images/') ? storageApi.runtime.getURL(resourcePath) : resourcePath;
        img.onerror = () => img.src = 'https://placehold.co/300x180/ffcccc/333?text=Error%20Loading%20Image';
        img.onload = () => {
            if (dom.previewTooltip) {
                requestAnimationFrame(() => {
                    dom.previewTooltip.style.left = `${event.clientX + 15}px`;
                    dom.previewTooltip.style.top = `${event.clientY + 15}px`;
                    dom.previewTooltip.style.display = 'block';
                });
            }
        };
    }

    function movePreview(event) {
        if (!dom.previewTooltip || dom.previewTooltip.style.display === 'none') return;
        requestAnimationFrame(() => {
            dom.previewTooltip.style.left = `${event.clientX + 15}px`;
            dom.previewTooltip.style.top = `${event.clientY + 15}px`;
        });
    }

    function hidePreview() {
        if (dom.previewTooltip) {
            dom.previewTooltip.style.display = 'none';
        }
    }

    function createElement(tag, options = {}, children = []) {
        const element = document.createElement(tag);
        for (const key in options) {
            const value = options[key];
            if (key === 'style') Object.assign(element.style, value);
            else if (key === 'dataset') Object.assign(element.dataset, value);
            else if (key === 'events') {
                for (const event in value) element.addEventListener(event, value[event]);
            } else if (value !== null && value !== undefined) element[key] = value;
        }
        if (children.length > 0) {
            element.append(...children.map(child => child instanceof Node ? child : document.createTextNode(String(child))));
        }
        return element;
    }

    function createSvgIcon(pathData, width = 16, height = 16) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        svg.appendChild(path);
        return svg;
    }
    async function saveDataToStorage(key, value) {
        if (!storageApi?.storage?.local?.set) return;
        try {
            await storageApi.storage.local.set({
                [key]: value
            });
        } catch (e) {
            // Error saving data
        }
    }

    async function loadDataFromStorage(key, defaultValue = null) {
        if (!storageApi?.storage?.local?.get) return defaultValue;
        try {
            const result = await storageApi.storage.local.get(key);
            return result?.[key] ?? defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function focusOnSearchInput() {
        if (window.location.pathname !== '/players/search') {
            document.body.classList.remove('initial-focus-applied-search');
            return;
        }
        if (document.body.classList.contains('initial-focus-applied-search')) {
            return;
        }
        const emailInput = document.querySelector('input[name="email"]');
        if (emailInput) {
            setTimeout(() => {
                emailInput.focus();
                document.body.classList.add('initial-focus-applied-search');
            }, 300);
        }
    }

    function addClearRecentPlayersButton() {
        if (!state.isI18nReady || !state.isNrSite || !state.featuresEnabled.clearRecentPlayers) {
            document.getElementById('clear-recent-players-btn-container')?.remove();
            return;
        };

        const buttonContainerId = 'clear-recent-players-btn-container';
        let container = document.getElementById(buttonContainerId);
        if (container) {
            const button = container.querySelector('button');
            if (button) {
                button.textContent = getI18nMessage('clearRecentPlayersButton');
                button.title = getI18nMessage('clearRecentPlayersTitle');
            }
            return;
        }
        const findPlayerLink = document.querySelector('a.css-s5nbdy.e7yzq172');
        if (!findPlayerLink?.parentElement?.parentElement) return;
        const clearButton = createElement('button', {
            textContent: getI18nMessage('clearRecentPlayersButton'),
            title: getI18nMessage('clearRecentPlayersTitle'),
            events: {
                click: () => {
                    const recentPlayersHeader = Array.from(document.querySelectorAll('span.css-qll0a.e1lulrm0')).find(el => el.textContent === 'Recent players');
                    if (recentPlayersHeader) {
                        const recentPlayersContainer = recentPlayersHeader.closest('.css-8dk3vg');
                        if (recentPlayersContainer) {
                            recentPlayersContainer.querySelectorAll('div.hidden-item button:nth-of-type(2)').forEach(button => {
                                button.dispatchEvent(new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true
                                }));
                            });
                        }
                    }
                    findPlayerLink.click();
                },
                mouseenter: (e) => {
                    e.target.style.setProperty('background-color', 'var(--brand-danger)', 'important');
                    e.target.style.setProperty('color', '#ffffff', 'important');
                },
                mouseleave: (e) => {
                    e.target.style.setProperty('background-color', 'transparent', 'important');
                    e.target.style.setProperty('color', 'var(--brand-danger)', 'important');
                }
            }
        });
        Object.assign(clearButton.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '8px 15px',
            fontSize: '1rem',
            fontWeight: '500',
            lineHeight: '1.5',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'center',
            boxSizing: 'border-box',
            transition: 'background-color 0.15s ease, color 0.15s ease',
        });
        clearButton.style.setProperty('background-color', 'transparent', 'important');
        clearButton.style.setProperty('color', 'var(--brand-danger)', 'important');
        clearButton.style.setProperty('border', '2px solid var(--brand-danger)', 'important');
        const clearButtonContainer = createElement('div', {
            id: buttonContainerId,
            className: 'css-1tcimyr ebz0nkn0',
            style: {
                marginTop: '8px'
            }
        }, [clearButton]);
        findPlayerLink.parentElement.parentElement.insertBefore(clearButtonContainer, findPlayerLink.parentElement.nextSibling);
    }

    async function openAdminModal() {
        if (!document.body) return;
        if (dom.adminModal.backdrop?.style.display === 'flex') {
            closeAdminModal();
            return;
        }

        try {
            await Promise.all([
                loadAffiliateMappings(),
                loadAllSettings()
            ]);
            if (!dom.adminModal.backdrop) {
                _createAdminModalStructure();
                ensureCustomConfirmModalExists();
                ensureExportOptionsModalExists();
            } else {
                updateUIWithTranslations();
            }
        } catch (error) {
            showAdminFeedback(getI18nMessage('adminFeedbackErrorOpeningPanel'), 'error');
            dom.adminModal.backdrop?.remove();
            dom.adminModal.backdrop = null;
            return;
        }

        renderMappingsList();
        dom.adminModal.formContainer.style.display = 'none';
        dom.adminModal.listSection.style.display = 'flex';
        dom.adminModal.addNewButton.style.display = 'inline-block';
        dom.adminModal.closeButton.style.display = 'inline-block';
        if (dom.adminModal.feedback) dom.adminModal.feedback.style.display = 'none';

        state.currentlyEditingId = null;
        updateTimerToggleButtonState();
        dom.adminModal.backdrop.style.display = 'flex';
    }

    function closeAdminModal() {
        if (dom.adminModal.backdrop) dom.adminModal.backdrop.style.display = 'none';
    }

    function getActiveChatIdFromUrl() {
        try {
            const match = window.location.pathname.match(/\/chats\/(?:[A-Z0-9]+)\/([A-Z0-9]+)/);
            return match?.[1] ?? null;
        } catch (e) {
            return null;
        }
    }

    function liveChat_findAndCacheFirstName() {
        const {
            PRECHAT_SELECTOR,
            SURNAME_PARTICLES
        } = config.LIVECHAT_LV_CONFIG;
        let fullName = null;
        const activeChatId = getActiveChatIdFromUrl();

        if (activeChatId) {
            const chatListItem = document.querySelector(`li[data-testid="chat-item-${activeChatId}"]`);
            fullName = chatListItem?.querySelector('[data-testid="visitor-name"]')?.textContent?.trim() || null;
        }

        if (!fullName) {
            const headerNameElement = document.querySelector('.css-qc8s26 .css-5ua9ks > h4.privacy-masker');
            if (headerNameElement?.textContent) fullName = headerNameElement.textContent.trim();
        }

        if (!fullName) {
            const detailsCardNameElement = document.querySelector('div[data-testid="general-info"] .css-ensz22 > span');
            if (detailsCardNameElement?.textContent) {
                const emailElement = detailsCardNameElement.closest('.css-19xtuo8')?.querySelector('p[data-copy-enhanced]');
                if (emailElement?.textContent.includes('@')) {
                    fullName = detailsCardNameElement.textContent.trim();
                }
            }
        }

        if (!fullName) {
            const prechatForm = document.querySelector(PRECHAT_SELECTOR);
            if (prechatForm) {
                for (const span of prechatForm.querySelectorAll('span')) {
                    const spanText = span.textContent?.trim() || '';
                    if (spanText.startsWith('Name')) {
                        fullName = (span.nextElementSibling?.textContent || spanText.replace(/^Name:?/i, '')).trim();
                        if (fullName) break;
                    }
                }
            }
        }

        if (fullName) {
            const words = fullName.split(/\s+/).filter(Boolean);
            if (words.length === 0) {
                state.liveChatLV.cachedFirstName = null;
                return;
            };

            let nameEndIndex = words.findIndex((word, i) => i > 0 && SURNAME_PARTICLES.has(word.toLowerCase()));

            const firstNameWords = nameEndIndex !== -1 ? words.slice(0, nameEndIndex) : [words[0]];
            const firstNamePart = firstNameWords.join(' ');

            if (firstNamePart) {
                const finalName = firstNamePart.split(/([ -])/).map(word =>
                    word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word
                ).join('');

                if (state.liveChatLV.cachedFirstName !== finalName) {
                    state.liveChatLV.cachedFirstName = finalName;
                }
            } else {
                state.liveChatLV.cachedFirstName = null;
            }
        } else {
            state.liveChatLV.cachedFirstName = null;
        }
    }


    function liveChat_dispatchInputEvent(element) {
        try {
            element.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true
            }));
        } catch (e) {
            // Error is ignored
        }
    }

    function liveChat_performReplacement(inputElement) {
        if (!state.liveChatLV.isEnabled) return;
        const {
            NAME_REGEX
        } = config.LIVECHAT_LV_CONFIG;
        NAME_REGEX.lastIndex = 0;
        if (!NAME_REGEX.test(inputElement.textContent)) return;

        const replacementText = state.liveChatLV.cachedFirstName || '';
        const walker = document.createTreeWalker(inputElement, NodeFilter.SHOW_TEXT);
        let hasReplacements = false;
        let node;
        while (node = walker.nextNode()) {
            NAME_REGEX.lastIndex = 0;
            if (NAME_REGEX.test(node.nodeValue)) {
                node.nodeValue = node.nodeValue.replace(NAME_REGEX, replacementText);
                hasReplacements = true;
            }
        }
        if (hasReplacements) {
            liveChat_dispatchInputEvent(inputElement);
        }
    }

    function liveChat_setupObserverForInput(inputElement) {
        if (state.liveChatLV.inputObservers.has(inputElement)) return;
        const observer = new MutationObserver(() => {
            observer.disconnect();
            liveChat_performReplacement(inputElement);
            try {
                observer.observe(inputElement, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            } catch (e) {
                // Ignore error
            }
        });
        if (!state.liveChatLV.cachedFirstName) {
            liveChat_findAndCacheFirstName();
        }
        liveChat_performReplacement(inputElement);
        observer.observe(inputElement, {
            childList: true,
            subtree: true,
            characterData: true
        });
        state.liveChatLV.inputObservers.set(inputElement, observer);
    }

    function liveChat_mainCallback(mutations) {
        if (!state.liveChatLV.isEnabled) return;

        if (window.location.href !== state.liveChatLV.lastCheckedUrlForNameCache) {
            state.liveChatLV.lastCheckedUrlForNameCache = window.location.href;
            state.liveChatLV.cachedFirstName = null;
            liveChat_findAndCacheFirstName();
        }

        const {
            PRECHAT_SELECTOR,
            INPUT_ID
        } = config.LIVECHAT_LV_CONFIG;
        const INPUT_SELECTOR = `#${INPUT_ID}`;

        for (const mutation of mutations) {
            if (mutation.type !== 'childList') continue;
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (node.matches(PRECHAT_SELECTOR) || node.querySelector(PRECHAT_SELECTOR)) {
                    state.liveChatLV.cachedFirstName = null;
                    liveChat_findAndCacheFirstName();
                }
                const input = node.matches(INPUT_SELECTOR) ? node : node.querySelector(INPUT_SELECTOR);
                if (input) liveChat_setupObserverForInput(input);
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && (node.matches(PRECHAT_SELECTOR) || node.querySelector(PRECHAT_SELECTOR))) {
                    state.liveChatLV.cachedFirstName = null;
                }
            }
        }
    }

    function liveChat_getObserverTarget() {
        for (const selector of config.LIVECHAT_LV_CONFIG.WIDGET_CONTAINER_SELECTORS) {
            const container = document.querySelector(selector);
            if (container) return container;
        }
        return document.body;
    }

    async function initializeLiveChatNameReplacer() {
        if (storageApi?.storage?.onChanged) {
            storageApi.storage.onChanged.addListener((changes, area) => {
                if (area === 'local' && changes[config.STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED]) {
                    state.liveChatLV.isEnabled = !!changes[config.STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED].newValue;
                }
            });
        }

        if (!state.liveChatLV.isEnabled) return;

        state.liveChatLV.lastCheckedUrlForNameCache = window.location.href;
        liveChat_findAndCacheFirstName();

        const initialInput = document.getElementById(config.LIVECHAT_LV_CONFIG.INPUT_ID);
        if (initialInput) liveChat_setupObserverForInput(initialInput);

        const mainObserver = new MutationObserver(liveChat_mainCallback);
        mainObserver.observe(liveChat_getObserverTarget(), {
            childList: true,
            subtree: true
        });
    }

    function createCopyButton(textToCopy, options = {}) {
        const {
            width = 20, height = 20, className = 'copy-icon-btn'
        } = options;
        const button = createElement('button', {
            className,
            title: getI18nMessage('copyToClipboardTitle')
        });

        const setIcon = (path) => {
            button.innerHTML = '';
            button.append(createSvgIcon(path, width, height));
        };

        setIcon(config.UI_ICONS.COPY_ICON_SVG_PATH);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(textToCopy).then(() => {
                setIcon(config.UI_ICONS.CHECK_ICON_SVG_PATH);
                button.classList.add('copied-success');
                setTimeout(() => {
                    setIcon(config.UI_ICONS.COPY_ICON_SVG_PATH);
                    button.classList.remove('copied-success');
                }, 2000);
            });
        });
        return button;
    }


    function initializeLiveChatCopyTools() {
        if (!state.featuresEnabled.liveChatCopyTools) return;

        const CONTAINER_SELECTOR = 'div.css-19xtuo8';

        function processContainer(container) {
            if (!state.featuresEnabled.liveChatCopyTools) return;

            const emailElement = container.querySelector('p.css-w2ducz');
            if (!emailElement?.textContent.includes('@') || emailElement.dataset.copyEnhanced) return;

            emailElement.dataset.copyEnhanced = 'true';
            const wrapper = createElement('div', {
                className: 'email-copy-wrapper'
            });
            emailElement.parentNode.replaceChild(wrapper, emailElement);
            wrapper.append(emailElement, createCopyButton(emailElement.textContent.trim()));
        }

        const liveChatObserver = new MutationObserver((mutations) => {
            if (!state.featuresEnabled.liveChatCopyTools) return;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.matches(CONTAINER_SELECTOR)) processContainer(node);
                        else node.querySelectorAll(CONTAINER_SELECTOR).forEach(processContainer);
                    }
                }
            }
        });

        liveChatObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        document.querySelectorAll(CONTAINER_SELECTOR).forEach(processContainer);
    }

    function initializeNr2CopyFeatures() {
        if (!state.featuresEnabled.nr2IdCopy) return;

        const {
            NR2_ID_CONTAINER_SELECTOR,
            NR2_ID_TEXT_WRAPPER_SELECTOR
        } = config.SITE_CONFIGS["nr.gosystem.io"];

        function processNr2IdElement(element) {
            if (!state.featuresEnabled.nr2IdCopy) return;
            const idTextWrapper = element.querySelector(NR2_ID_TEXT_WRAPPER_SELECTOR);
            if (!idTextWrapper || idTextWrapper.dataset.copyEnhanced) return;

            idTextWrapper.dataset.copyEnhanced = 'true';
            const id = idTextWrapper.textContent?.trim();
            if (!id) return;

            Object.assign(idTextWrapper.style, {
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
            });

            const copyButton = createCopyButton(id, {
                width: 20,
                height: 20
            });
            idTextWrapper.appendChild(copyButton);
            idTextWrapper.addEventListener('click', (e) => {
                if (!e.target.closest('.copy-icon-btn')) copyButton.click();
            });
        }

        const observer = new MutationObserver((mutations) => {
            if (!state.featuresEnabled.nr2IdCopy) return;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.matches(NR2_ID_CONTAINER_SELECTOR)) {
                        processNr2IdElement(node);
                    } else {
                        node.querySelectorAll(NR2_ID_CONTAINER_SELECTOR).forEach(processNr2IdElement);
                    }
                }
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        document.querySelectorAll(NR2_ID_CONTAINER_SELECTOR).forEach(processNr2IdElement);
    }

    function initializeLiveChatScript() {
        initializeLiveChatCopyTools();
        initializeLiveChatNameReplacer().catch(() => {});
    }

    async function initializeGosystemScript() {
        createPreviewTooltip();
        if (storageApi?.storage?.onChanged) {
            storageApi.storage.onChanged.addListener(async (changes, area) => {
                if (area !== 'local') return;
                if (changes[config.STORAGE_KEYS.AFFILIATE_MAPPINGS] || changes[config.STORAGE_KEYS.AFFILIATE_CONFIG_VERSION]) {
                    await Promise.all([
                        loadAffiliateMappings(),
                        loadDataFromStorage(config.STORAGE_KEYS.AFFILIATE_CONFIG_VERSION, '0.0.0').then(v => state.currentConfigVersion = v)
                    ]);
                    if (dom.adminModal.backdrop?.style.display === 'flex') {
                        renderMappingsList();
                    }
                }
                if (changes[config.STORAGE_KEYS.CLOCK_TYPE]) {
                    state.clockType = changes[config.STORAGE_KEYS.CLOCK_TYPE].newValue || 'implemented';
                    applyClockVisibility();
                }
                if (changes[config.STORAGE_KEYS.CURRENT_LANG]) {
                    await setLanguage(changes[config.STORAGE_KEYS.CURRENT_LANG].newValue);
                }
            });
        }

        if (state.isNrSite) initializeNr2CopyFeatures();

        await setupAutoRefreshUI();

        if (state.isNrSite) ensureHeaderTimerIsAdded();
        else if (state.isBoomerangSite) ensureBoomerangHeaderTimerIsAdded();

        tryInitialChecks();
        const observerRootNode = document.querySelector(state.currentSiteConfig?.MUTATION_OBSERVER_ROOT_NODE_SELECTOR) || document.body;
        state.observer = new MutationObserver(() => {
            clearTimeout(state.domCheckDebounceTimeoutId);
            state.domCheckDebounceTimeoutId = setTimeout(() => {
                if (state.isNrSite) {
                    checkAndProcessAffiliateId(window.location.href);
                    ensureBonusRateFieldIsPresent();
                    addClearRecentPlayersButton();
                    ensureHeaderTimerIsAdded();
                    focusOnSearchInput();
                } else if (state.isBoomerangSite) {
                    ensureBonusRateFieldBoomerang();
                    ensureBoomerangHeaderTimerIsAdded();
                }
                applyClockVisibility();
            }, config.AFFILIATE_ID_CHECK_DEBOUNCE_MS);
        });
        state.observer.observe(observerRootNode, {
            childList: true,
            subtree: true
        });
        if (state.isBoomerangSite) {
            document.body.addEventListener('click', (e) => {
                if (e.target.closest(config.SITE_CONFIGS[config.HOST_BOOMERANG].TABS_SELECTOR)) {
                    setTimeout(ensureBonusRateFieldBoomerang, 150);
                }
            }, true);
        }
    }

    async function loadAllSettings() {
        const {
            STORAGE_KEYS
        } = config;
        if (!storageApi?.storage) return;

        const keysWithDefaults = {
            [STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED]: false,
            [STORAGE_KEYS.LIVECHAT_COPY_TOOLS_ENABLED]: true,
            [STORAGE_KEYS.NR2_ID_COPY_ENABLED]: true,
            [STORAGE_KEYS.CLEAR_RECENT_PLAYERS_ENABLED]: true,
            [STORAGE_KEYS.CLOCK_TYPE]: 'implemented',
            [STORAGE_KEYS.CURRENT_LANG]: 'uk',
            [STORAGE_KEYS.AFFILIATE_CONFIG_VERSION]: '0.0.0'
        };
        const storedSettings = await storageApi.storage.local.get(keysWithDefaults);

        state.featuresEnabled.liveChatNameReplacer = storedSettings[STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED];
        state.liveChatLV.isEnabled = state.featuresEnabled.liveChatNameReplacer;
        state.featuresEnabled.liveChatCopyTools = storedSettings[STORAGE_KEYS.LIVECHAT_COPY_TOOLS_ENABLED];
        state.featuresEnabled.nr2IdCopy = storedSettings[STORAGE_KEYS.NR2_ID_COPY_ENABLED];
        state.featuresEnabled.clearRecentPlayers = storedSettings[STORAGE_KEYS.CLEAR_RECENT_PLAYERS_ENABLED];
        state.clockType = storedSettings[STORAGE_KEYS.CLOCK_TYPE];
        state.lang = storedSettings[STORAGE_KEYS.CURRENT_LANG];
        state.currentConfigVersion = storedSettings[STORAGE_KEYS.AFFILIATE_CONFIG_VERSION];

        if (!state.isLiveChatSite) await loadCurrentSiteRefreshSettings();
    }

    async function lazyInitialize() {
        await loadAllSettings();
        await loadLocale(state.lang);
        await loadAffiliateMappings();

        const pendingUpdate = await loadDataFromStorage(config.STORAGE_KEYS.PENDING_UPDATE_NOTIFICATION);
        if (pendingUpdate) {
            await saveDataToStorage(config.STORAGE_KEYS.PENDING_UPDATE_NOTIFICATION, null);
            showUpdateConfirmationDialog(pendingUpdate);
        }

        if (state.isLiveChatSite) initializeLiveChatScript();
        else if (state.isNrSite || state.isBoomerangSite) initializeGosystemScript();
    }


    async function initializeScript() {
        if (!document.body) {
            setTimeout(initializeScript, 100);
            return;
        }
        detectCurrentSite();

        if (storageApi?.runtime?.onMessage) {
            storageApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "toggleAdminPanel") {
                    openAdminModal();
                } else if (request.action === "configUpdateAvailable") {
                    showUpdateConfirmationDialog(request.updateData);
                }
            });
        }

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(lazyInitialize);
        } else {
            setTimeout(lazyInitialize, 1);
        }
    }

    function detectCurrentSite() {
        const hostname = window.location.hostname;
        state.isNrSite = hostname === config.HOST_NR;
        state.isBoomerangSite = hostname === config.HOST_BOOMERANG;
        state.isLiveChatSite = hostname.includes('livechatinc.com') || hostname.includes('livechat.com');
        state.currentSiteConfig = config.SITE_CONFIGS[hostname] || null;
        document.body.classList.toggle('nr1-theme', state.isBoomerangSite);
        document.body.classList.toggle('nr2-theme', !state.isBoomerangSite && !state.isLiveChatSite);

        const settings = state.currentSiteRefreshSettings;
        if (state.isNrSite) {
            Object.assign(settings, {
                intervalKey: config.STORAGE_KEYS.REFRESH_INTERVAL_NR2,
                enabledKey: config.STORAGE_KEYS.AUTO_REFRESHER_ENABLED_NR2,
                defaultMinutes: config.DEFAULT_REFRESH_MINUTES_NR2
            });
        } else if (state.isBoomerangSite) {
            Object.assign(settings, {
                intervalKey: config.STORAGE_KEYS.REFRESH_INTERVAL_NR1,
                enabledKey: config.STORAGE_KEYS.AUTO_REFRESHER_ENABLED_NR1,
                defaultMinutes: config.DEFAULT_REFRESH_MINUTES_NR1
            });
        }
    }

    async function loadCurrentSiteRefreshSettings() {
        if (state.isLiveChatSite) return;
        const settings = state.currentSiteRefreshSettings;
        const [savedInterval, savedEnabled] = await Promise.all([
            loadDataFromStorage(settings.intervalKey, settings.defaultMinutes),
            loadDataFromStorage(settings.enabledKey, true)
        ]);
        settings.intervalMinutes = Math.max(config.MIN_REFRESH_INTERVAL_MINUTES, parseInt(savedInterval, 10) || settings.defaultMinutes);
        settings.isEnabled = savedEnabled;
        if (settings.intervalMinutes !== parseInt(savedInterval, 10)) {
            await saveDataToStorage(settings.intervalKey, settings.intervalMinutes);
        }
    }

    function normalizeUrl(url) {
        return (url && typeof url === 'string') ? url.replace(/\/$/, "") : null;
    }

    function getPlayerIdFromUrl(url) {
        if (!state.isNrSite || !state.currentSiteConfig.PLAYER_URL_PATTERNS) return null;
        const match = normalizeUrl(url)?.match(state.currentSiteConfig.PLAYER_URL_PATTERNS.PLAYER_ID_REGEX);
        return match ? match[1] : null;
    }

    function isMainPlayerPage(url) {
        if (!state.isNrSite || !state.currentSiteConfig.PLAYER_URL_PATTERNS) return false;
        return state.currentSiteConfig.PLAYER_URL_PATTERNS.MAIN_PLAYER_PAGE_REGEX.test(normalizeUrl(url));
    }

    function ensureCustomConfirmModalExists() {
        if (!state.isI18nReady) return;
        if (document.getElementById('custom-confirm-modal-backdrop')) {
            dom.confirmModal.okButton.textContent = getI18nMessage('confirmModalOkButton');
            dom.confirmModal.cancelButton.textContent = getI18nMessage('confirmModalCancelButton');
            return;
        }
        dom.confirmModal.okButton = createElement('button', {
            id: 'custom-confirm-ok-btn',
            textContent: getI18nMessage('confirmModalOkButton'),
            events: {
                click: () => {
                    state.currentOnConfirmCallback?.();
                    hideCustomConfirm();
                }
            }
        });
        dom.confirmModal.cancelButton = createElement('button', {
            id: 'custom-confirm-cancel-btn',
            textContent: getI18nMessage('confirmModalCancelButton'),
            events: {
                click: () => {
                    state.currentOnCancelCallback?.();
                    hideCustomConfirm();
                }
            }
        });
        dom.confirmModal.message = createElement('p', {
            id: 'custom-confirm-message'
        });
        const buttonsContainer = createElement('div', {
            className: 'confirm-buttons-container'
        }, [dom.confirmModal.okButton, dom.confirmModal.cancelButton]);
        dom.confirmModal.content = createElement('div', {
            id: 'custom-confirm-modal-content'
        }, [dom.confirmModal.message, buttonsContainer]);
        dom.confirmModal.backdrop = createElement('div', {
            id: 'custom-confirm-modal-backdrop',
            className: 'modal-backdrop-base'
        }, [dom.confirmModal.content]);
        document.body.appendChild(dom.confirmModal.backdrop);
    }

    function showCustomConfirm(message, onConfirm, onCancel) {
        ensureCustomConfirmModalExists();
        if (!state.isI18nReady) return;
        dom.confirmModal.message.innerHTML = '';
        dom.confirmModal.message.style.whiteSpace = typeof message === 'string' ? 'pre-wrap' : 'normal';
        dom.confirmModal.message.append(message);

        state.currentOnConfirmCallback = onConfirm;
        state.currentOnCancelCallback = onCancel;
        dom.confirmModal.cancelButton.style.display = 'inline-block';
        dom.confirmModal.backdrop.style.display = 'flex';
    }

    function hideCustomConfirm() {
        if (dom.confirmModal.backdrop) dom.confirmModal.backdrop.style.display = 'none';
        state.currentOnConfirmCallback = state.currentOnCancelCallback = null;
    }

    function showUpdateConfirmationDialog(updateData) {
        ensureCustomConfirmModalExists();
        if (!state.isI18nReady) return;

        const {
            version,
            update_notes
        } = updateData;
        const message = createElement('div', {}, [
            createElement('p', {
                textContent: getI18nMessage('updateConfirmMessage', version)
            }),
            createElement('p', {
                style: {
                    marginTop: '10px',
                    padding: '8px',
                    border: '1px solid var(--ui-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ui-subtle-bg)',
                    fontSize: '0.9em'
                },
                textContent: `${getI18nMessage('exportModalNotesLabel')} ${update_notes || getI18nMessage('updateNotesNotProvided')}`
            })
        ]);

        const onConfirm = async () => {
            try {
                await saveDataToStorage(config.STORAGE_KEYS.AFFILIATE_MAPPINGS, updateData.affiliates);
                await saveDataToStorage(config.STORAGE_KEYS.AFFILIATE_CONFIG_VERSION, updateData.version);

                state.currentAffiliateMappings = new Map(updateData.affiliates.map(item => [Number(item.id), item.data]));
                state.currentConfigVersion = version;

                if (dom.adminModal.backdrop?.style.display === 'flex') renderMappingsList();

                if (state.isNrSite) {
                    state.shownAffiliateForCurrentPlayerContext.affiliateIdText = null;
                    checkAndProcessAffiliateId(window.location.href);
                    ensureBonusRateFieldIsPresent();
                } else if (state.isBoomerangSite) {
                    state.shownBonusRateBoomerang = {};
                    ensureBonusRateFieldBoomerang();
                }

                hideCustomConfirm();
                showAdminFeedback(getI18nMessage('updateSuccessFeedback', version), 'success', 4000);

            } catch (error) {
                hideCustomConfirm();
                showAdminFeedback(getI18nMessage('manualUpdateError'), 'error');
            }
        };

        showCustomConfirm(message, onConfirm, () => {
            hideCustomConfirm();
            showAdminFeedback(getI18nMessage('updateDeferredFeedback'), 'info', 4000);
        });
        dom.confirmModal.okButton.textContent = getI18nMessage('updateConfirmYes');
        dom.confirmModal.cancelButton.textContent = getI18nMessage('updateConfirmNo');
    }


    function showAdminFeedback(message, type = 'info', duration = config.FEEDBACK_TIMEOUT_MS) {
        if (!dom.adminModal.feedback || (dom.adminModal.backdrop?.style.display === 'none' && !['error', 'success'].includes(type))) return;

        const {
            feedback
        } = dom.adminModal;
        feedback.textContent = message;
        feedback.className = `admin-feedback-message ${type}`;
        feedback.style.display = 'block';

        if (feedback._timeoutId) clearTimeout(feedback._timeoutId);

        if (duration > 0) {
            feedback._timeoutId = setTimeout(() => {
                if (feedback.textContent === message) feedback.style.display = 'none';
            }, duration);
        }
    }


    async function loadAffiliateMappings() {
        try {
            const storedMappings = await loadDataFromStorage(config.STORAGE_KEYS.AFFILIATE_MAPPINGS);
            state.currentAffiliateMappings = Array.isArray(storedMappings) ? new Map(storedMappings.map(item => [Number(item.id), item.data])) : new Map();
        } catch (error) {
            state.currentAffiliateMappings = new Map();
        }
    }

    function checkAndProcessAffiliateId(currentUrlInput) {
        if (!state.isNrSite || !document.body || !state.currentSiteConfig.AFFILIATE_INFO_ELEMENTS) return;
        const currentUrl = normalizeUrl(currentUrlInput);
        const currentPlayerId = getPlayerIdFromUrl(currentUrl);

        if (currentPlayerId !== state.shownAffiliateForCurrentPlayerContext.playerId) {
            state.shownAffiliateForCurrentPlayerContext = {
                playerId: currentPlayerId,
                affiliateIdText: null
            };
        }

        const titleEl = Array.from(document.querySelectorAll(state.currentSiteConfig.AFFILIATE_INFO_ELEMENTS.PLAYER_INFO_TITLE_SELECTOR)).find(el => el.textContent?.trim() === state.currentSiteConfig.AFFILIATE_INFO_ELEMENTS.PLAYER_INFO_TITLE_TEXT);
        const playerInfoDL = titleEl?.parentElement?.parentElement?.querySelector(state.currentSiteConfig.AFFILIATE_INFO_ELEMENTS.DL_IN_PLAYER_INFO_SELECTOR);

        let targetDdElement = null;
        if (playerInfoDL) {
            for (const dt of playerInfoDL.querySelectorAll('dt')) {
                if (dt.textContent?.trim() === state.currentSiteConfig.AFFILIATE_INFO_ELEMENTS.DT_TEXT_CONTENT) {
                    const potentialDd = dt.nextElementSibling;
                    if (potentialDd?.tagName === 'DD') {
                        targetDdElement = potentialDd;
                        break;
                    }
                }
            }
        }

        if (targetDdElement) {
            const currentAffiliateIdTextOnPage = targetDdElement.textContent.trim();
            const affiliateId = parseInt(currentAffiliateIdTextOnPage, 10);
            const isValidNumericId = !isNaN(affiliateId) && affiliateId > 0;
            if (isValidNumericId) {
                const onMainPlayerPage = currentPlayerId && isMainPlayerPage(currentUrl);
                const shouldShowNotification = (onMainPlayerPage && state.shownAffiliateForCurrentPlayerContext.affiliateIdText !== currentAffiliateIdTextOnPage) ||
                    (!currentPlayerId && currentAffiliateIdTextOnPage !== state.lastCheckedAffiliateTextGlobal);

                if (shouldShowNotification) {
                    const mapping = state.currentAffiliateMappings.get(affiliateId);
                    if (mapping && (mapping.specialText || mapping.geo || mapping.casino)) {
                        showAffiliateInfoModal(currentAffiliateIdTextOnPage, mapping);
                        if (onMainPlayerPage) state.shownAffiliateForCurrentPlayerContext.affiliateIdText = currentAffiliateIdTextOnPage;
                    }
                }
                state.lastCheckedAffiliateTextGlobal = currentAffiliateIdTextOnPage;
            } else {
                if (currentAffiliateIdTextOnPage.toLowerCase() !== 'loading...' && currentPlayerId && isMainPlayerPage(currentUrl)) {
                    state.shownAffiliateForCurrentPlayerContext.affiliateIdText = null;
                }
                state.lastCheckedAffiliateTextGlobal = null;
            }
        } else {
            if (currentPlayerId && isMainPlayerPage(currentUrl)) state.shownAffiliateForCurrentPlayerContext.affiliateIdText = null;
            state.lastCheckedAffiliateTextGlobal = null;
        }
    }

    function tryInitialChecks() {
        if (state.initialCheckCount >= config.MAX_INITIAL_CHECKS_COUNT) return;
        state.initialCheckCount++;
        const currentUrlForInitialCheck = window.location.href;
        if (state.isNrSite) {
            checkAndProcessAffiliateId(currentUrlForInitialCheck);
            ensureBonusRateFieldIsPresent();
            addClearRecentPlayersButton();
            ensureHeaderTimerIsAdded();
            focusOnSearchInput();
        } else if (state.isBoomerangSite) {
            ensureBonusRateFieldBoomerang();
            ensureBoomerangHeaderTimerIsAdded();
        }
        if (state.initialCheckCount < config.MAX_INITIAL_CHECKS_COUNT) {
            setTimeout(tryInitialChecks, config.INITIAL_CHECK_TIMEOUT_BASE_MS * state.initialCheckCount);
        }
    }

    function renderMappingsList() {
        if (!dom.adminModal.listContainer) return;
        dom.adminModal.listContainer.querySelector('ul')?.remove();

        const newUl = createElement('ul', {
            className: 'mappings-list',
            events: {
                click: handleMappingsListClick
            }
        });
        const fragment = document.createDocumentFragment();

        if (state.currentAffiliateMappings.size === 0) {
            fragment.appendChild(createElement('li', {}, [getI18nMessage('adminFeedbackMappingListEmpty')]));
        } else {
            [...state.currentAffiliateMappings.entries()].sort((a, b) => a[0] - b[0]).forEach(([id, mapping]) => {
                let detailsContentSpan, fullDetailsForTitle;
                if (mapping.specialText !== undefined) {
                    detailsContentSpan = createElement('span', {
                        className: 'mapping-details-text-content'
                    }, [makeTextClickable(mapping.specialText)]);
                    fullDetailsForTitle = mapping.specialText;
                } else if (mapping.geo !== undefined || mapping.casino !== undefined) {
                    const geoPart = mapping.geo || getI18nMessage('mappingListDetailsNa');
                    const casinoPart = mapping.casino || getI18nMessage('mappingListDetailsNa');
                    fullDetailsForTitle = `${geoPart} | ${casinoPart}`;
                    const contentChildren = [document.createTextNode(geoPart)];
                    if (geoPart !== getI18nMessage('mappingListDetailsNa') && casinoPart !== getI18nMessage('mappingListDetailsNa')) {
                        contentChildren.push(document.createTextNode("\u00A0|\u00A0"));
                    } else {
                        contentChildren.push(document.createTextNode("\u00A0"));
                    }
                    if (casinoPart !== getI18nMessage('mappingListDetailsNa') || (mapping.casino !== undefined && mapping.casino !== '')) {
                        contentChildren.push(makeTextClickable(casinoPart));
                    }
                    detailsContentSpan = createElement('span', {
                        className: 'mapping-details-text-content'
                    }, contentChildren);
                } else {
                    detailsContentSpan = createElement('span', {
                        className: 'mapping-details-text-content',
                        textContent: getI18nMessage('mappingListDetailsNoDetails')
                    });
                    fullDetailsForTitle = getI18nMessage('mappingListDetailsNoDetails');
                }
                detailsContentSpan.title = fullDetailsForTitle;

                const detailsDiv = createElement('div', {
                    className: 'mapping-details'
                }, [createElement('span', {
                    className: 'mapping-id-bold',
                    textContent: id
                }), "\u00A0|\u00A0", detailsContentSpan]);

                const actionsDiv = createElement('div', {
                    className: 'mapping-actions'
                }, [
                    createElement('button', {
                        textContent: getI18nMessage('mappingListEditButton'),
                        className: 'admin-button edit-btn',
                        title: getI18nMessage('mappingListEditButtonTitle'),
                        dataset: {
                            action: 'edit'
                        }
                    }),
                    createElement('button', {
                        textContent: getI18nMessage('mappingListDeleteButton'),
                        className: 'admin-button delete-btn',
                        title: getI18nMessage('mappingListDeleteButtonTitle'),
                        dataset: {
                            action: 'delete'
                        }
                    })
                ]);
                fragment.appendChild(createElement('li', {
                    dataset: {
                        id
                    }
                }, [detailsDiv, actionsDiv]));
            });
        }
        newUl.appendChild(fragment);
        dom.adminModal.listContainer.appendChild(newUl);
    }

    function handleMappingsListClick(event) {
        const target = event.target.closest('button.admin-button');
        if (!target) return;
        const li = target.closest('li');
        const {
            action
        } = target.dataset;
        const {
            id
        } = li?.dataset ?? {};
        if (!id) return;

        if (action === 'edit') {
            showAddEditForm(id);
        } else if (action === 'delete') {
            const confirmMessage = `${getI18nMessage('confirmModalDeletePromptPrefix')}${id}${getI18nMessage('confirmModalDeletePromptSuffix')}`;
            showCustomConfirm(confirmMessage, () => {
                state.currentAffiliateMappings.delete(Number(id));
                renderMappingsList();
                showAdminFeedback(`${getI18nMessage('adminFeedbackMappingDeletedPrefix')}${id}${getI18nMessage('adminFeedbackMappingDeletedSuffix')}`, 'info');
            }, () => showAdminFeedback(getI18nMessage('adminFeedbackDeleteCancelled'), 'info'));
        }
    }

    async function handleClockTypeChange(event) {
        const newType = event.target.value;
        if (newType === state.clockType) return;
        state.clockType = newType;
        await saveDataToStorage(config.STORAGE_KEYS.CLOCK_TYPE, newType);
        if (!state.isLiveChatSite) applyClockVisibility();
        const typeLabel = newType === 'overlay' ? getI18nMessage('adminSettingsClockTypeOverlay') : getI18nMessage('adminSettingsClockTypeImplemented');
        showAdminFeedback(`${getI18nMessage('adminFeedbackClockChanged')} "${typeLabel}".`, 'success', 2000);
    }

    function createToggleSwitch(id, labelText, tooltipText, isChecked, onChangeCallback, previewKey) {
        const label = createElement('label', {
            htmlFor: id,
            textContent: labelText
        });
        const switchInput = createElement('input', {
            type: 'checkbox',
            id,
            checked: isChecked,
            events: {
                change: onChangeCallback
            }
        });
        const switchContainer = createElement('div', {
            className: 'setting-toggle-switch',
            title: tooltipText
        }, [
            createElement('div', {
                className: 'setting-toggle-content'
            }, [label]),
            createElement('label', {
                className: 'switch'
            }, [switchInput, createElement('span', {
                className: 'slider round'
            })])
        ]);

        if (previewKey) {
            switchContainer.addEventListener('mouseenter', (e) => showPreview(e, previewKey));
            switchContainer.addEventListener('mousemove', movePreview);
            switchContainer.addEventListener('mouseleave', hidePreview);
        }
        return switchContainer;
    }

    async function handleFeatureToggle(featureStateKey, storageKey, isEnabled, feedbackMessage) {
        state.featuresEnabled[featureStateKey] = isEnabled;
        if (featureStateKey === 'liveChatNameReplacer') state.liveChatLV.isEnabled = isEnabled;
        await saveDataToStorage(storageKey, isEnabled);
        showAdminFeedback(feedbackMessage, 'success', 3000);
        if (featureStateKey === 'clearRecentPlayers') addClearRecentPlayersButton();
        if (featureStateKey === 'nr2IdCopy' || featureStateKey.startsWith('liveChat')) {
            showAdminFeedback(getI18nMessage('adminFeedbackRefreshPage'), 'info', 4000);
        }
    }

    function _createAdminModalHeader() {
        dom.adminModal.title = createElement('h2');
        dom.adminModal.addNewButton = createElement('button', {
            id: 'admin-modal-add-new-header-btn',
            events: {
                click: () => showAddEditForm()
            }
        });
        dom.adminModal.closeButton = createElement('button', {
            textContent: '\u00D7',
            className: 'admin-modal-close-button',
            events: {
                click: closeAdminModal
            }
        });
        return createElement('div', {
            className: 'admin-modal-header'
        }, [dom.adminModal.title, createElement('div', {
            className: 'admin-modal-header-buttons'
        }, [dom.adminModal.addNewButton, dom.adminModal.closeButton])]);
    }

    async function handleNameReplacerToggle(event) {
        const toggleSwitch = event.target;
        if (toggleSwitch.checked) {
            toggleSwitch.checked = false; // Prevent immediate state change
            showCustomConfirm(
                `Вмикаючи автозаміну, ви укладаєте дружню угоду з цим алгоритмом. Він зобов'язується старатися з усіх сил, а ви — люб'язно перевіряти його роботу перед надсиланням повідомлення клієнту. Цим ви підтверджуєте, що відповідальність за будь-які казуси чи непорозуміння а також подальші -5 або -15 в KPI, спричинені збоєм заміни імені, залишається за вами. Дякую за розуміння!`,
                () => {
                    toggleSwitch.checked = true;
                    handleFeatureToggle('liveChatNameReplacer', config.STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED, true, getI18nMessage('adminFeedbackNameReplacerToggled'));
                },
                () => {
                    toggleSwitch.checked = false;
                }
            );
        } else {
            handleFeatureToggle('liveChatNameReplacer', config.STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED, false, getI18nMessage('adminFeedbackNameReplacerToggled'));
        }
    }


    function _createAdminModalSettingsPanel() {
        const createRadio = (value, name, isChecked, previewKey) => {
            const radioId = `${name}-${value}`;
            const label = createElement('label', {
                htmlFor: radioId
            }, [createElement('input', {
                type: 'radio',
                name,
                id: radioId,
                value,
                checked: isChecked
            }), document.createTextNode('')]);
            label.addEventListener('mouseenter', (e) => showPreview(e, previewKey));
            label.addEventListener('mousemove', movePreview);
            label.addEventListener('mouseleave', hidePreview);
            return label;
        };

        const timerGroup = createElement('div', {
            className: 'settings-group'
        });
        dom.adminModal.settings.timerSectionTitle = createElement('h5');
        timerGroup.appendChild(dom.adminModal.settings.timerSectionTitle);

        if (!state.isLiveChatSite) {
            const autoRefreshToggle = createToggleSwitch('auto-refresh-toggle', '', '', state.currentSiteRefreshSettings.isEnabled, (e) => toggleAutoRefresherStatus(e.target), 'previewEnableTimer');
            dom.adminModal.settings.autoRefreshToggleLabel = autoRefreshToggle.querySelector('.setting-toggle-content > label');
            timerGroup.appendChild(autoRefreshToggle);

            dom.adminModal.settings.clockTypeTitle = createElement('h6');
            const clockRadioGroup = createElement('div', {
                className: 'radio-group',
                events: {
                    change: handleClockTypeChange
                }
            });
            dom.adminModal.settings.clockTypeOverlayLabel = createRadio('overlay', 'clockType', state.clockType === 'overlay', 'previewOverlay');
            dom.adminModal.settings.clockTypeImplementedLabel = createRadio('implemented', 'clockType', state.clockType === 'implemented', 'previewImplemented');
            clockRadioGroup.append(dom.adminModal.settings.clockTypeOverlayLabel, dom.adminModal.settings.clockTypeImplementedLabel);
            timerGroup.appendChild(createElement('div', {
                className: 'setting-indented'
            }, [dom.adminModal.settings.clockTypeTitle, clockRadioGroup]));
        }

        const featuresGroup = createElement('div', {
            className: 'settings-group'
        });
        dom.adminModal.settings.featuresSectionTitle = createElement('h5');
        featuresGroup.appendChild(dom.adminModal.settings.featuresSectionTitle);

        const featureToggles = [{
            id: 'name-replacer-toggle',
            key: 'liveChatNameReplacer',
            storageKey: config.STORAGE_KEYS.LIVECHAT_NAME_REPLACER_ENABLED,
            feedbackKey: 'adminFeedbackNameReplacerToggled',
            previewKey: 'previewEnableNameReplacer',
            handler: handleNameReplacerToggle
        }, {
            id: 'copy-tools-toggle',
            key: 'liveChatCopyTools',
            storageKey: config.STORAGE_KEYS.LIVECHAT_COPY_TOOLS_ENABLED,
            feedbackKey: 'adminFeedbackCopyToolsToggled',
            previewKey: 'previewEnableCopyTools'
        }, {
            id: 'nr2-copy-id-toggle',
            key: 'nr2IdCopy',
            storageKey: config.STORAGE_KEYS.NR2_ID_COPY_ENABLED,
            feedbackKey: 'adminFeedbackNr2CopyIdToggled',
            previewKey: 'previewEnableNr2CopyId'
        }, {
            id: 'clear-recent-toggle',
            key: 'clearRecentPlayers',
            storageKey: config.STORAGE_KEYS.CLEAR_RECENT_PLAYERS_ENABLED,
            feedbackKey: 'adminFeedbackClearRecentToggled',
            previewKey: 'previewEnableClearRecent'
        }, ];

        featureToggles.forEach(t => {
            const handler = t.handler || ((e) => handleFeatureToggle(t.key, t.storageKey, e.target.checked, getI18nMessage(t.feedbackKey)));
            const toggle = createToggleSwitch(t.id, '', '', state.featuresEnabled[t.key], handler, t.previewKey);
            dom.adminModal.settings[`${t.key}ToggleLabel`] = toggle.querySelector('.setting-toggle-content > label');
            featuresGroup.appendChild(toggle);
        });

        const settingsGrid = createElement('div', {
            className: 'admin-settings-grid'
        }, [timerGroup, featuresGroup]);
        dom.adminModal.settings.title = createElement('h4');
        return createElement('div', {
            className: 'admin-modal-settings'
        }, [dom.adminModal.settings.title, settingsGrid]);
    }


    function _createAdminModalMainButtons() {
        const {
            mainButtons
        } = dom.adminModal;
        mainButtons.langSwitch = createElement('button', {
            className: 'lang-switch-btn admin-main-button',
            events: {
                click: handleLangSwitch
            }
        });

        mainButtons.manualUpdate = createElement('button', {
            className: 'manual-update-btn admin-main-button',
            events: {
                click: () => {
                    showAdminFeedback(getI18nMessage('manualUpdateRequestSent'), 'info', 3000);
                    if (storageApi?.runtime?.sendMessage) {
                        storageApi.runtime.sendMessage({
                            action: "manualUpdateCheck"
                        }, (response) => {
                            if (storageApi.runtime.lastError || !response?.updateStatus) {
                                showAdminFeedback(getI18nMessage('manualUpdateError'), 'error');
                            } else if (response.updateStatus.updated === false) {
                                showAdminFeedback(getI18nMessage('manualUpdateNoUpdates'), 'success', 4000);
                            }
                        });
                    } else {
                        showAdminFeedback(getI18nMessage('manualUpdateError'), 'error');
                    }
                }
            }
        }, [createSvgIcon(config.UI_ICONS.REFRESH_ICON_SVG_PATH, 18, 18)]);

        mainButtons.import = createElement('button', {
            className: 'import-json-btn admin-main-button',
            events: {
                click: () => dom.adminModal.fileInput.click()
            }
        });
        mainButtons.export = createElement('button', {
            className: 'export-json-btn admin-main-button',
            events: {
                click: handleExportMappings
            }
        });
        mainButtons.saveAll = createElement('button', {
            className: 'save-all-btn admin-main-button',
            events: {
                click: saveAllMappingsToStorage
            }
        });

        mainButtons.container = createElement('div', {
            id: 'main-admin-buttons'
        }, [mainButtons.manualUpdate, mainButtons.langSwitch, mainButtons.import, mainButtons.export, mainButtons.saveAll]);
        return mainButtons.container;
    }


    function _createAdminModalStructure() {
        dom.adminModal.listContainer = createElement('div', {
            id: 'mappings-list-container'
        });
        dom.adminModal.listSection = createElement('div', {
            className: 'mappings-list-section'
        }, [dom.adminModal.listContainer]);

        dom.adminModal.formContainer = createElement('div', {
            id: 'add-edit-form-container',
            className: 'admin-form-section',
            style: {
                display: 'none'
            }
        });
        dom.adminModal.feedback = createElement('div', {
            id: 'admin-feedback-message'
        });
        dom.adminModal.fileInput = createElement('input', {
            type: 'file',
            id: 'import-affiliate-mappings-file',
            accept: '.json',
            style: {
                display: 'none'
            },
            events: {
                change: handleImportFileSelected
            }
        });

        dom.adminModal.content = createElement('div', {
            id: 'admin-modal-content'
        }, [
            _createAdminModalHeader(),
            createElement('div', {
                className: 'admin-modal-body-container'
            }, [dom.adminModal.listSection, dom.adminModal.formContainer]),
            dom.adminModal.feedback,
            _createAdminModalSettingsPanel(),
            _createAdminModalMainButtons(),
            dom.adminModal.fileInput
        ]);
        dom.adminModal.backdrop = createElement('div', {
            id: 'admin-modal-backdrop',
            className: 'modal-backdrop-base nr2-theme'
        }, [dom.adminModal.content]);

        document.body.appendChild(dom.adminModal.backdrop);
        updateUIWithTranslations();
    }

    function showAffiliateInfoModal(affiliateIdOriginalText, mappingData) {
        dom.affiliateInfoModal.backdrop?.remove();

        const messageContent = [document.createTextNode(getI18nMessage('affiliateInfoModalFoundPrefix')), createElement('b', {}, [affiliateIdOriginalText])];
        if (mappingData.specialText) messageContent.push("\n", makeTextClickable(mappingData.specialText));
        else {
            if (mappingData.geo) messageContent.push("\n", makeTextClickable(mappingData.geo));
            if (mappingData.casino) messageContent.push("\n", makeTextClickable(mappingData.casino));
        }

        const okButton = createElement('button', {
            textContent: getI18nMessage('affiliateInfoModalOkButton'),
            events: {
                click: () => {
                    dom.affiliateInfoModal.backdrop?.remove();
                    dom.affiliateInfoModal.backdrop = null;
                }
            }
        });

        dom.affiliateInfoModal.backdrop = createElement('div', {
            id: 'affiliate-info-modal-backdrop',
            className: 'modal-backdrop-base',
            style: {
                display: 'flex'
            }
        }, [createElement('div', {
            id: 'affiliate-info-modal-content'
        }, [createElement('p', {}, messageContent), okButton])]);

        document.body.appendChild(dom.affiliateInfoModal.backdrop);
    }

    function makeTextClickable(text) {
        const fragment = document.createDocumentFragment();
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%?=~_|])/ig;
        text.split(urlRegex).forEach((part, i) => {
            if (i % 3 === 0) {
                part.split('\n').forEach((line, j, arr) => {
                    fragment.appendChild(document.createTextNode(line));
                    if (j < arr.length - 1) fragment.appendChild(createElement('br'));
                });
            } else if (i % 3 === 1) {
                const url = part;
                let displayText = url;
                if (/^https?:\/\/t\.me\//i.test(url)) displayText = getI18nMessage('linkTextTelegram');
                else if (/^https?:\/\/www\.notion\.so\//i.test(url)) displayText = getI18nMessage('linkTextNotion');
                else if (url.length > 30) displayText = `${url.substring(0, 27)}...`;

                fragment.appendChild(createElement('a', {
                    href: url,
                    textContent: displayText,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    title: url,
                    style: {
                        color: 'var(--brand-primary)',
                        textDecoration: 'underline'
                    }
                }));
            }
        });
        return fragment;
    }

    async function saveAllMappingsToStorage() {
        try {
            const mappingsToStore = Array.from(state.currentAffiliateMappings.entries()).map(([id, data]) => ({
                id,
                data
            }));
            await saveDataToStorage(config.STORAGE_KEYS.AFFILIATE_MAPPINGS, mappingsToStore);
            showAdminFeedback(getI18nMessage('adminFeedbackSaveAllSuccess'), 'success');
            if (!state.isLiveChatSite) {
                state.shownAffiliateForCurrentPlayerContext = {
                    playerId: null,
                    affiliateIdText: null
                };
                state.shownBonusRateBoomerang = {};
                if (state.isNrSite) {
                    checkAndProcessAffiliateId(window.location.href);
                    ensureBonusRateFieldIsPresent();
                } else if (state.isBoomerangSite) {
                    ensureBonusRateFieldBoomerang();
                }
            }
        } catch (error) {
            showAdminFeedback(getI18nMessage('adminFeedbackSaveAllError'), 'error');
        }
    }

    function _performExport(version, notes) {
        try {
            const exportObject = {
                version: version || '0.0.0',
                update_notes: notes || '',
                affiliates: Array.from(state.currentAffiliateMappings.entries()).map(([id, data]) => ({
                    id,
                    data
                }))
            };

            const jsonData = JSON.stringify(exportObject, null, 2);
            const blob = new Blob([jsonData], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const formattedDate = new Date().toISOString().slice(0, 10);
            const a = createElement('a', {
                href: url,
                download: `affiliate_mappings_config_${formattedDate}.json`
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showAdminFeedback(getI18nMessage('adminFeedbackExportSuccess'), 'success');
        } catch (error) {
            showAdminFeedback(getI18nMessage('adminFeedbackExportError'), 'error');
        }
    }

    function handleExportMappings(event) {
        if (event.shiftKey) {
            showExportOptionsModal();
        } else {
            _performExport(state.currentConfigVersion, '');
        }
    }


    function handleImportFileSelected(event) {
        const fileInput = event.target;
        const file = fileInput?.files?.[0];
        if (!file) {
            showAdminFeedback(getI18nMessage('adminFeedbackImportNoFile'), 'info');
            return;
        }
        if (file.type !== "application/json") {
            showAdminFeedback(getI18nMessage('adminFeedbackImportWrongType'), 'error');
            if (fileInput) fileInput.value = null;
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                let mappingsMap = null;
                let newVersion = null;

                if (importedData?.affiliates && Array.isArray(importedData.affiliates) && importedData.version) {
                    mappingsMap = new Map(importedData.affiliates.map(item => [Number(item.id), item.data]));
                    newVersion = importedData.version;
                } else if (typeof importedData === 'object' && importedData !== null && !Array.isArray(importedData)) {
                    mappingsMap = new Map(Object.entries(importedData).map(([id, data]) => [Number(id), data]));
                    newVersion = state.currentConfigVersion;
                    showAdminFeedback(getI18nMessage('importWarningOldFormat'), 'info', 5000);
                }

                if (mappingsMap) {
                    showCustomConfirm(getI18nMessage('adminFeedbackImportConfirmPrompt'), async () => {
                        state.currentAffiliateMappings = mappingsMap;
                        if (newVersion) {
                            state.currentConfigVersion = newVersion;
                            await saveDataToStorage(config.STORAGE_KEYS.AFFILIATE_CONFIG_VERSION, newVersion);
                        }
                        renderMappingsList();
                        await saveAllMappingsToStorage();
                        showAdminFeedback(getI18nMessage('adminFeedbackImportSuccess'), 'success');
                    }, () => showAdminFeedback(getI18nMessage('adminFeedbackImportCancelled'), 'info'));
                } else {
                    showAdminFeedback(getI18nMessage('adminFeedbackImportStructureError'), 'error');
                }
            } catch (err) {
                showAdminFeedback(getI18nMessage('adminFeedbackImportParseError'), 'error');
            } finally {
                if (fileInput) fileInput.value = null;
            }
        };
        reader.onerror = () => {
            showAdminFeedback(getI18nMessage('adminFeedbackImportReadError'), 'error');
            if (fileInput) fileInput.value = null;
        };
        reader.readAsText(file);
    }

    function ensureExportOptionsModalExists() {
        if (!state.isI18nReady) return;
        if (document.getElementById('export-options-modal-backdrop')) {
            dom.exportOptionsModal.content.querySelector('h3').textContent = getI18nMessage('exportModalTitle');
            dom.exportOptionsModal.content.querySelector('label[for="export-version-input"]').textContent = getI18nMessage('exportModalVersionLabel');
            dom.exportOptionsModal.content.querySelector('label[for="export-notes-input"]').textContent = getI18nMessage('exportModalNotesLabel');
            dom.exportOptionsModal.exportButton.textContent = getI18nMessage('exportModalExportButton');
            dom.exportOptionsModal.cancelButton.textContent = getI18nMessage('exportModalCancelButton');
            return;
        }

        const {
            exportOptionsModal: modal
        } = dom;
        modal.versionInput = createElement('input', {
            type: 'text',
            id: 'export-version-input'
        });
        modal.notesInput = createElement('textarea', {
            id: 'export-notes-input'
        });
        modal.exportButton = createElement('button', {
            className: 'export-options-export-btn',
            textContent: getI18nMessage('exportModalExportButton'),
            events: {
                click: () => {
                    _performExport(modal.versionInput.value, modal.notesInput.value);
                    hideExportOptionsModal();
                }
            }
        });
        modal.cancelButton = createElement('button', {
            className: 'export-options-cancel-btn',
            textContent: getI18nMessage('exportModalCancelButton'),
            events: {
                click: hideExportOptionsModal
            }
        });

        modal.content = createElement('div', {
            id: 'export-options-modal-content'
        }, [
            createElement('h3', {}, [getI18nMessage('exportModalTitle')]),
            createElement('label', {
                htmlFor: 'export-version-input'
            }, [getI18nMessage('exportModalVersionLabel')]),
            modal.versionInput,
            createElement('label', {
                htmlFor: 'export-notes-input'
            }, [getI18nMessage('exportModalNotesLabel')]),
            modal.notesInput,
            createElement('div', {
                className: 'export-options-buttons'
            }, [modal.exportButton, modal.cancelButton])
        ]);

        modal.backdrop = createElement('div', {
            id: 'export-options-modal-backdrop',
            className: 'modal-backdrop-base'
        }, [modal.content]);
        document.body.appendChild(modal.backdrop);
    }

    function showExportOptionsModal() {
        ensureExportOptionsModalExists();
        if (!state.isI18nReady) return;
        dom.exportOptionsModal.versionInput.value = state.currentConfigVersion || '1.0.0';
        dom.exportOptionsModal.notesInput.value = '';
        dom.exportOptionsModal.backdrop.style.display = 'flex';
        dom.exportOptionsModal.versionInput.focus();
    }

    function hideExportOptionsModal() {
        if (dom.exportOptionsModal.backdrop) {
            dom.exportOptionsModal.backdrop.style.display = 'none';
        }
    }


    function flashTimerDisplay(type = 'success') {
        const className = type === 'success' ? 'flash-success' : 'flash-error';
        const displays = [dom.refresher.display, dom.headerRefresher.display];
        displays.forEach(display => {
            if (display) {
                display.classList.add(className);
                setTimeout(() => display.classList.remove(className), 700);
            }
        });
    }

    function stopCountdownAnimation() {
        if (state.countdownAnimFrameId) cancelAnimationFrame(state.countdownAnimFrameId);
        state.countdownAnimFrameId = null;
    }

    function stopRefreshCycle() {
        clearTimeout(state.refreshTimeoutId);
        state.refreshTimeoutId = null;
        stopCountdownAnimation();
    }

    function renderTimerDisplay() {
        if (!state.isI18nReady) return;
        const remainingMs = Math.max(0, state.targetTime - Date.now());
        const remainingSecondsTotal = Math.floor(remainingMs / 1000);
        const minutes = String(Math.floor(remainingSecondsTotal / 60)).padStart(2, '0');
        const seconds = String(remainingSecondsTotal % 60).padStart(2, '0');
        const text = (!state.currentSiteRefreshSettings.isEnabled || state.targetTime === 0) ?
            getI18nMessage('refresherOffText') :
            `${minutes}:${seconds}`;

        if (dom.refresher.display) dom.refresher.display.textContent = text;
        if (dom.headerRefresher.display) dom.headerRefresher.display.textContent = text;
    }

    function updateTimerLoop(timestamp) {
        if (!state.lastCountdownUpdateTime) state.lastCountdownUpdateTime = timestamp;
        if (timestamp - state.lastCountdownUpdateTime >= 1000) {
            state.lastCountdownUpdateTime = timestamp;
            renderTimerDisplay();
        }
        if (state.targetTime > Date.now()) {
            state.countdownAnimFrameId = requestAnimationFrame(updateTimerLoop);
        } else {
            stopCountdownAnimation();
        }
    }

    function applyClockVisibility() {
        if (state.isLiveChatSite) return;
        const isEnabled = state.currentSiteRefreshSettings.isEnabled;
        if (state.isNrSite && window.location.pathname === '/players/search') {
            if (dom.refresher.container) dom.refresher.container.style.display = isEnabled ? 'block' : 'none';
            if (dom.headerRefresher.container) dom.headerRefresher.container.style.display = 'none';
            return;
        }
        const isOverlay = state.clockType === 'overlay';
        if (dom.refresher.container) dom.refresher.container.style.display = (isEnabled && isOverlay) ? 'block' : 'none';
        if (dom.headerRefresher.container) dom.headerRefresher.container.style.display = (isEnabled && !isOverlay) ? 'flex' : 'none';
    }

    function startRefreshCycle(minutes) {
        if (state.isLiveChatSite) return;
        stopRefreshCycle();
        if (!state.currentSiteRefreshSettings.isEnabled) {
            applyClockVisibility();
            return;
        }
        applyClockVisibility();
        const effectiveMs = Math.max(config.MIN_REFRESH_INTERVAL_MINUTES, minutes) * 60 * 1000;
        state.targetTime = Date.now() + effectiveMs;
        state.refreshTimeoutId = setTimeout(() => {
            if (state.currentSiteRefreshSettings.isEnabled) window.location.reload();
        }, effectiveMs);
        renderTimerDisplay();
        state.lastCountdownUpdateTime = 0;
        state.countdownAnimFrameId = requestAnimationFrame(updateTimerLoop);
    }

    function handlePageActivity(event) {
        if (state.isLiveChatSite || !state.currentSiteRefreshSettings.isEnabled || state.isRefresherInputControlsVisible || state.isHeaderRefresherInputControlsVisible) return;
        if (event.target.closest('#refresh-timer-container, #header-refresh-timer-container, .modal-backdrop-base, #bonus-rate-calculate-btn, [id^="custom-bonus-rate-field-boomerang-"], a, button, input, select, textarea, details, [role="button"], [role="link"], [contenteditable="true"], .x-tab-inner')) {
            const newActivityInterval = Math.max(config.MIN_REFRESH_INTERVAL_MINUTES, Math.round(state.currentSiteRefreshSettings.intervalMinutes / 2));
            startRefreshCycle(newActivityInterval);
        }
    }

    function toggleInputControlsRefresher(show, which = 'main') {
        const elements = (which === 'main') ? dom.refresher : dom.headerRefresher;
        const isVisibleStateKey = (which === 'main') ? 'isRefresherInputControlsVisible' : 'isHeaderRefresherInputControlsVisible';
        if (!elements.container || !state.currentSiteRefreshSettings.isEnabled) return;
        elements.inputGroup.style.display = show ? 'flex' : 'none';
        state[isVisibleStateKey] = show;
        if (show) {
            elements.intervalInput.value = state.currentSiteRefreshSettings.intervalMinutes;
            elements.intervalInput.focus();
            elements.intervalInput.select();
        }
    }

    async function saveAndApplyIntervalRefresher() {
        const inputToRead = (state.isHeaderRefresherInputControlsVisible ? dom.headerRefresher.intervalInput : dom.refresher.intervalInput) || dom.refresher.intervalInput || dom.headerRefresher.intervalInput;
        if (!inputToRead || !state.currentSiteRefreshSettings.isEnabled) return;

        const newInterval = parseInt(inputToRead.value, 10);
        if (isNaN(newInterval) || newInterval < config.MIN_REFRESH_INTERVAL_MINUTES) {
            flashTimerDisplay('error');
            inputToRead.value = state.currentSiteRefreshSettings.intervalMinutes;
            return;
        }
        try {
            await saveDataToStorage(state.currentSiteRefreshSettings.intervalKey, newInterval);
            state.currentSiteRefreshSettings.intervalMinutes = newInterval;
            startRefreshCycle(newInterval);
            flashTimerDisplay('success');
            toggleInputControlsRefresher(false, 'main');
            toggleInputControlsRefresher(false, 'header');
        } catch (error) {
            flashTimerDisplay('error');
        }
    }

    async function setupAutoRefreshUI() {
        if (!state.isI18nReady || document.getElementById('refresh-timer-container') || state.isLiveChatSite) {
            return;
        }

        dom.refresher.display = createElement('div', {
            id: 'timer-display',
            title: getI18nMessage('refresherSingleClickTitle'),
            events: {
                click: () => {
                    if (!state.currentSiteRefreshSettings.isEnabled) return;
                    clearTimeout(state.singleClickTimeoutRefresher);
                    state.singleClickTimeoutRefresher = setTimeout(() => {
                        if (!state.isRefresherInputControlsVisible) {
                            startRefreshCycle(state.currentSiteRefreshSettings.intervalMinutes);
                            flashTimerDisplay('success');
                        }
                    }, config.CLICK_DEBOUNCE_DELAY_MS);
                },
                dblclick: () => {
                    if (!state.currentSiteRefreshSettings.isEnabled) return;
                    clearTimeout(state.singleClickTimeoutRefresher);
                    toggleInputControlsRefresher(false, 'header');
                    toggleInputControlsRefresher(!state.isRefresherInputControlsVisible, 'main');
                }
            }
        });

        dom.refresher.intervalInput = createElement('input', {
            type: 'number',
            id: 'refresh-interval-input',
            min: String(config.MIN_REFRESH_INTERVAL_MINUTES),
            events: {
                keydown: (event) => {
                    if (event.key === 'Enter') saveAndApplyIntervalRefresher();
                    else if (event.key === 'Escape') toggleInputControlsRefresher(false, 'main');
                }
            }
        });

        dom.refresher.setButton = createElement('button', {
            textContent: getI18nMessage('refresherSetButton'),
            events: {
                click: saveAndApplyIntervalRefresher
            }
        });
        dom.refresher.inputGroup = createElement('div', {
            className: 'input-group'
        }, [createElement('span', {
            className: 'input-label',
            textContent: getI18nMessage('refresherInputLabel')
        }), dom.refresher.intervalInput, dom.refresher.setButton]);
        dom.refresher.container = createElement('div', {
            id: 'refresh-timer-container'
        }, [createElement('div', {
            id: 'refresh-prompt-text',
            textContent: getI18nMessage('refresherPrompt')
        }), dom.refresher.display, dom.refresher.inputGroup]);

        toggleInputControlsRefresher(false, 'main');
        document.body.appendChild(dom.refresher.container);
        document.addEventListener('click', handlePageActivity, true);
        applyClockVisibility();
        if (state.currentSiteRefreshSettings.isEnabled) {
            startRefreshCycle(state.currentSiteRefreshSettings.intervalMinutes);
        }
    }

    function setupHeaderRefresherUI(targetContainer) {
        if (!state.isI18nReady) return;
        const timerId = 'header-refresh-timer-container';
        let container = document.getElementById(timerId);

        if (container) {
            container.querySelector('#header-refresh-prompt-text').textContent = getI18nMessage('refresherPrompt');
            container.querySelector('#header-timer-display').title = getI18nMessage('refresherSingleClickTitle');
            container.querySelector('.header-input-label').textContent = getI18nMessage('refresherInputLabel');
            container.querySelector('.header-input-group button').textContent = getI18nMessage('refresherSetButton');

            if (state.isBoomerangSite && targetContainer.lastChild !== container) {
                targetContainer.appendChild(container);
            }
            return;
        }

        dom.headerRefresher.promptText = createElement('div', {
            id: 'header-refresh-prompt-text',
            textContent: getI18nMessage('refresherPrompt')
        });

        dom.headerRefresher.display = createElement('div', {
            id: 'header-timer-display',
            title: getI18nMessage('refresherSingleClickTitle'),
            events: {
                click: () => {
                    if (!state.currentSiteRefreshSettings.isEnabled) return;
                    clearTimeout(state.singleClickTimeoutHeaderRefresher);
                    state.singleClickTimeoutHeaderRefresher = setTimeout(() => {
                        if (!state.isHeaderRefresherInputControlsVisible) {
                            startRefreshCycle(state.currentSiteRefreshSettings.intervalMinutes);
                            flashTimerDisplay('success');
                        }
                    }, config.CLICK_DEBOUNCE_DELAY_MS);
                },
                dblclick: () => {
                    if (!state.currentSiteRefreshSettings.isEnabled) return;
                    clearTimeout(state.singleClickTimeoutHeaderRefresher);
                    toggleInputControlsRefresher(false, 'main');
                    toggleInputControlsRefresher(!state.isHeaderRefresherInputControlsVisible, 'header');
                }
            }
        });

        dom.headerRefresher.intervalInput = createElement('input', {
            type: 'number',
            id: 'header-refresh-interval-input',
            min: String(config.MIN_REFRESH_INTERVAL_MINUTES),
            events: {
                keydown: (event) => {
                    if (event.key === 'Enter') saveAndApplyIntervalRefresher();
                    else if (event.key === 'Escape') toggleInputControlsRefresher(false, 'header');
                }
            }
        });

        dom.headerRefresher.setButton = createElement('button', {
            textContent: getI18nMessage('refresherSetButton'),
            events: {
                click: saveAndApplyIntervalRefresher
            }
        });

        dom.headerRefresher.inputGroup = createElement('div', {
            className: 'header-input-group'
        }, [createElement('span', {
            className: 'header-input-label',
            textContent: getI18nMessage('refresherInputLabel')
        }), dom.headerRefresher.intervalInput, dom.headerRefresher.setButton]);

        dom.headerRefresher.container = createElement('div', {
            id: timerId
        }, [dom.headerRefresher.promptText, dom.headerRefresher.display, dom.headerRefresher.inputGroup]);

        if (state.isBoomerangSite) {
            dom.headerRefresher.container.classList.add('boomerang-style');
            targetContainer.appendChild(dom.headerRefresher.container);
        } else if (state.isNrSite) {
            const insertionReferenceNode = targetContainer.querySelector('.css-z8bu82');
            targetContainer.insertBefore(dom.headerRefresher.container, insertionReferenceNode || targetContainer.firstChild);
        }

        toggleInputControlsRefresher(false, 'header');
        renderTimerDisplay();
        applyClockVisibility();
    }


    function ensureHeaderTimerIsAdded() {
        if (!state.isNrSite) return;
        const targetContainer = document.querySelector('.css-xky39l.etd6x7c3') || document.querySelector('.css-1ymuldf');
        if (targetContainer) setupHeaderRefresherUI(targetContainer);
    }

    function ensureBoomerangHeaderTimerIsAdded() {
        if (!state.isBoomerangSite) return;
        const targetContainer = document.querySelector(state.currentSiteConfig.HEADER_CONTAINER_SELECTOR);
        if (targetContainer) setupHeaderRefresherUI(targetContainer);
    }

    function calculateBonusRateInfo(bonuses, deposits) {
        let rate = -1,
            displayNode, color;
        if (bonuses === null || isNaN(bonuses) || deposits === null || isNaN(deposits)) {
            displayNode = createElement('strong', {}, [getI18nMessage('bonusRateNa')]);
        } else if (deposits === 0) {
            rate = (bonuses > 0) ? Infinity : 0;
            displayNode = createElement('strong', {}, [rate === Infinity ? getI18nMessage('bonusRateInfinitySymbol') : '0%']);
        } else {
            rate = (bonuses <= 0) ? 0 : (bonuses * 100) / deposits;
            displayNode = createElement('strong', {}, [`${rate.toFixed(2)}%`]);
        }

        if (rate >= 20) color = 'var(--brand-danger)';
        else if (rate >= 0) color = 'var(--brand-success)';
        else color = 'var(--ui-text)';

        return {
            displayNode,
            color
        };
    }

    function calculateAndDisplayBonusRate(dlElement, displayButtonElement, currentContextKey) {
        if (!state.isNrSite || !dlElement || !displayButtonElement) return;

        let bonuses = null,
            deposits = null;
        for (const dt of dlElement.querySelectorAll('dt')) {
            const dtText = dt.textContent?.trim();
            const dd = dt.nextElementSibling;
            if (dd?.tagName === 'DD' && dd.textContent) {
                const valueText = dd.textContent.trim().replace(/\s/g, '').replace(',', '.');
                if (dtText === config.SITE_CONFIGS["nr.gosystem.io"].PERFORMANCE_INFO_ELEMENTS.BONUSES_RECEIVED_DT_TEXT) bonuses = parseFloat(valueText);
                else if (dtText === config.SITE_CONFIGS["nr.gosystem.io"].PERFORMANCE_INFO_ELEMENTS.TOTAL_DEPOSITS_DT_TEXT) deposits = parseFloat(valueText);
            }
        }
        const {
            displayNode,
            color
        } = calculateBonusRateInfo(bonuses, deposits);
        displayNode.style.setProperty('color', color, 'important');
        displayButtonElement.parentNode.replaceChild(displayNode, displayButtonElement);
        state.shownBonusRateForCurrentContext = {
            contextKey: currentContextKey,
            htmlOutput: displayNode.outerHTML
        };
    }

    function ensureBonusRateFieldIsPresent() {
        if (!state.isI18nReady || !state.isNrSite || !state.currentSiteConfig.PERFORMANCE_INFO_ELEMENTS) return;
        const {
            TOTAL_PERFORMANCE_TITLE_SELECTOR,
            TOTAL_PERFORMANCE_TITLE_TEXT,
            PERFORMANCE_DATA_CONTAINER_SELECTOR,
            PERFORMANCE_DL_SELECTOR
        } = state.currentSiteConfig.PERFORMANCE_INFO_ELEMENTS;
        const performanceContainer = Array.from(document.querySelectorAll(TOTAL_PERFORMANCE_TITLE_SELECTOR))
            .find(el => el.textContent?.trim() === TOTAL_PERFORMANCE_TITLE_TEXT)
            ?.closest(PERFORMANCE_DATA_CONTAINER_SELECTOR);
        if (!performanceContainer) return;

        const dlElement = performanceContainer.querySelector(PERFORMANCE_DL_SELECTOR);
        if (!dlElement) return;

        const currentPlayerId = getPlayerIdFromUrl(window.location.href);
        const currentContextKey = currentPlayerId ? `player_${currentPlayerId}` : `page_${normalizeUrl(window.location.pathname)}`;

        if (state.shownBonusRateForCurrentContext.contextKey !== currentContextKey) {
            state.shownBonusRateForCurrentContext = {
                contextKey: currentContextKey,
                htmlOutput: null
            };
            document.getElementById('bonus-rate-dt')?.remove();
            document.getElementById('bonus-rate-dd')?.remove();
        }
        if (!document.getElementById('bonus-rate-dt')) {
            dlElement.append(
                createElement('dt', {
                    id: 'bonus-rate-dt',
                    className: "css-ozibme eottf9r0",
                    style: {
                        textTransform: "uppercase"
                    }
                }, [createElement('strong', {}, [getI18nMessage('bonusRateLabel')])]),
                createElement('dd', {
                    id: 'bonus-rate-dd',
                    className: "css-1otxbzn e12adj4l1"
                })
            );
        }
        const ddBonusRate = document.getElementById('bonus-rate-dd');
        if (ddBonusRate) {
            if (state.shownBonusRateForCurrentContext.htmlOutput) {
                ddBonusRate.innerHTML = state.shownBonusRateForCurrentContext.htmlOutput;
            } else if (!ddBonusRate.hasChildNodes() || !ddBonusRate.querySelector('#bonus-rate-calculate-btn')) {
                const calculateButton = createElement('button', {
                    id: 'bonus-rate-calculate-btn',
                    textContent: getI18nMessage('bonusRateCalculateButtonText'),
                    title: getI18nMessage('bonusRateCalculateButtonTitle'),
                    events: {
                        click: function() {
                            calculateAndDisplayBonusRate(dlElement, this, currentContextKey);
                        }
                    }
                });
                ddBonusRate.innerHTML = '';
                ddBonusRate.appendChild(calculateButton);
            }
        }
    }

    function createBoomerangFormField() {
        const fieldDiv = createElement('div', {
            className: 'x-field x-form-item x-form-item-default x-form-type-text x-field-default x-autocontainer-form-item',
            style: {
                float: 'left',
                padding: '5px',
                width: '220px'
            }
        });

        const labelEl = createElement('label', {
            className: 'x-form-item-label x-form-item-label-default x-form-item-label-right',
            style: {
                paddingRight: '5px',
                width: '135px'
            }
        }, [
            createElement('span', {
                className: 'x-form-item-label-inner x-form-item-label-inner-default',
                style: {
                    width: '130px'
                },
                textContent: getI18nMessage('bonusRateLabelBoomerangStrong')
            })
        ]);

        const bodyEl = createElement('div', {
            className: 'x-form-item-body x-form-item-body-default x-form-text-field-body x-form-text-field-body-default'
        });

        const valueDisplayContainer = createElement('div', {
            className: 'x-form-trigger-wrap x-form-trigger-wrap-default',
            style: {
                width: '100%'
            }
        });

        bodyEl.appendChild(valueDisplayContainer);
        fieldDiv.append(labelEl, bodyEl);

        return {
            fieldDiv,
            valueDisplayContainer
        };
    }

    function calculateAndDisplayBonusRateBoomerang(panel, currentContextKey) {
        if (!state.isBoomerangSite || !panel) return;
        const triggerWrap = panel.querySelector(`[id^="${config.SITE_CONFIGS["nr1-boomerang.gosystem.io"].BONUS_RATE_FIELD_ID_PREFIX}container-"] .x-form-trigger-wrap`);
        if (!triggerWrap) return;

        const bonusesInput = panel.querySelector(`input[name="${config.SITE_CONFIGS["nr1-boomerang.gosystem.io"].BONUSES_RECEIVED_INPUT_NAME}"]`);
        const depositsInput = panel.querySelector(`input[name="${config.SITE_CONFIGS["nr1-boomerang.gosystem.io"].DEPOSITS_INPUT_NAME}"]`);
        const bonusesValue = parseFloat(bonusesInput?.value.replace(/[^0-9.,-]+/g, '').replace(',', '.'));
        const depositsValue = parseFloat(depositsInput?.value.replace(/[^0-9.,-]+/g, '').replace(',', '.'));

        const {
            displayNode,
            color
        } = calculateBonusRateInfo(bonusesValue, depositsValue);
        
        displayNode.style.fontWeight = 'bold';

        const resultField = createElement('div', {
            className: 'x-form-field x-form-text x-form-text-default',
            style: {
                color: color,
                paddingLeft: '6px',
                lineHeight: '20px'
            }
        }, [displayNode]);

        const inputWrap = createElement('div', {
            className: 'x-form-text-wrap x-form-text-wrap-default'
        }, [resultField]);

        triggerWrap.innerHTML = '';
        triggerWrap.appendChild(inputWrap);

        state.shownBonusRateBoomerang[currentContextKey] = {
            valueHtml: triggerWrap.innerHTML
        };
    }


    function ensureBonusRateFieldBoomerang() {
        if (!state.isI18nReady || !state.isBoomerangSite) return;
        document.querySelectorAll(config.SITE_CONFIGS["nr1-boomerang.gosystem.io"].PERFORMANCE_PANEL_SELECTOR).forEach(panel => {
            const anchorInput = panel.querySelector(`input[name="${config.SITE_CONFIGS["nr1-boomerang.gosystem.io"].NET_PROFIT_LAST_BONUS_INPUT_NAME}"]`);
            const anchorFieldDiv = anchorInput?.closest('div.x-field.x-form-item');
            if (!anchorFieldDiv?.parentElement) return;

            const currentContextKey = panel.id;
            const bonusRateFieldContainerId = `${config.SITE_CONFIGS["nr1-boomerang.gosystem.io"].BONUS_RATE_FIELD_ID_PREFIX}container-${currentContextKey}`;
            let fieldDiv = document.getElementById(bonusRateFieldContainerId);
            if (fieldDiv) return;

            const creationResult = createBoomerangFormField();
            fieldDiv = creationResult.fieldDiv;
            const valueDisplayContainer = creationResult.valueDisplayContainer;
            fieldDiv.id = bonusRateFieldContainerId;

            if (state.shownBonusRateBoomerang[currentContextKey]?.valueHtml) {
                valueDisplayContainer.innerHTML = state.shownBonusRateBoomerang[currentContextKey].valueHtml;
            } else {
                const buttonInner = createElement('span', {
                    className: 'x-btn-inner x-btn-inner-default-small',
                    textContent: getI18nMessage('boomerangBonusRateCalculateButtonText')
                });
                 const buttonEl = createElement('span', {
                    className: 'x-btn-button x-btn-button-default-small x-btn-text x-btn-button-center'
                }, [buttonInner]);
                 const buttonWrap = createElement('span', {
                    className: 'x-btn-wrap x-btn-wrap-default-small'
                }, [buttonEl]);

                const buttonComponent = createElement('span', {
                     className: 'x-btn x-btn-default-small',
                     style: { display: 'table', width: '100%', cursor: 'pointer' },
                     events: {
                         click: (e) => {
                             e.preventDefault();
                             calculateAndDisplayBonusRateBoomerang(panel, currentContextKey);
                         }
                     }
                 }, [buttonWrap]);

                valueDisplayContainer.innerHTML = ''; 
                valueDisplayContainer.appendChild(buttonComponent);
            }
            anchorFieldDiv.parentElement.insertBefore(fieldDiv, anchorFieldDiv.nextSibling);
        });
    }


    function showAddEditForm(idToEdit = null) {
        if (!dom.adminModal.formContainer || !dom.adminModal.listSection) return;
        dom.adminModal.formContainer.style.display = 'block';
        dom.adminModal.listSection.style.display = 'none';
        dom.adminModal.addNewButton.style.display = 'none';
        dom.adminModal.closeButton.style.display = 'none';
        dom.adminModal.formContainer.innerHTML = '';

        state.currentlyEditingId = idToEdit;
        const mappingToEdit = idToEdit ? state.currentAffiliateMappings.get(Number(idToEdit)) : null;
        const isSpecialTypeCurrent = mappingToEdit ? mappingToEdit.hasOwnProperty('specialText') : false;

        const createRadioInput = (id, value, labelText, checked = false, previewKey) => {
            const label = createElement('label', {
                htmlFor: id
            }, [createElement('input', {
                type: 'radio',
                name: 'mappingType',
                id,
                value,
                checked
            }), document.createTextNode(labelText)]);
            if (previewKey) {
                label.addEventListener('mouseenter', (e) => showPreview(e, previewKey));
                label.addEventListener('mousemove', movePreview);
                label.addEventListener('mouseleave', hidePreview);
            }
            return label;
        };

        const radioGroup = createElement('div', {
            className: 'radio-group'
        }, [
            createRadioInput('typeGeoCasino', 'geoCasino', getI18nMessage('adminModalFormRadioGeoCasino'), !isSpecialTypeCurrent, 'previewGeoCasino'),
            createRadioInput('typeSpecial', 'special', getI18nMessage('adminModalFormRadioSpecialText'), isSpecialTypeCurrent, 'previewSpecialText')
        ]);

        const specialTextDiv = createElement('div', {
            id: 'specialTextDiv'
        }, [
            createElement('label', {
                htmlFor: 'admin-mapping-specialtext',
                textContent: getI18nMessage('adminModalFormLabelSpecialText')
            }),
            createElement('textarea', {
                id: 'admin-mapping-specialtext',
                value: mappingToEdit?.specialText || ''
            })
        ]);

        const geoCasinoDiv = createElement('div', {
            id: 'geoCasinoDiv'
        }, [
            createElement('label', {
                htmlFor: 'admin-mapping-geo',
                textContent: getI18nMessage('adminModalFormLabelGeo')
            }),
            createElement('input', {
                type: 'text',
                id: 'admin-mapping-geo',
                value: mappingToEdit?.geo || ''
            }),
            createElement('label', {
                htmlFor: 'admin-mapping-casino',
                textContent: getI18nMessage('adminModalFormLabelCasino')
            }),
            createElement('textarea', {
                id: 'admin-mapping-casino',
                value: mappingToEdit?.casino || ''
            })
        ]);

        const toggleFields = () => {
            const isSpecial = form.querySelector('#typeSpecial')?.checked;
            specialTextDiv.style.display = isSpecial ? 'block' : 'none';
            geoCasinoDiv.style.display = isSpecial ? 'none' : 'block';
        };

        radioGroup.addEventListener('change', toggleFields);
        const form = createElement('form', {
            events: {
                submit: (e) => {
                    e.preventDefault();
                    handleSaveMapping();
                }
            }
        });

        form.append(
            createElement('label', {
                textContent: getI18nMessage('adminModalFormLabelType')
            }),
            radioGroup,
            createElement('label', {
                htmlFor: 'admin-mapping-id',
                textContent: getI18nMessage('adminModalFormLabelAffiliateId')
            }),
            createElement('input', {
                type: 'number',
                id: 'admin-mapping-id',
                required: true,
                disabled: !!idToEdit,
                value: idToEdit || ''
            }),
            specialTextDiv,
            geoCasinoDiv,
            createElement('div', {
                className: 'form-buttons'
            }, [
                createElement('button', {
                    type: 'submit',
                    textContent: idToEdit ? getI18nMessage('adminModalFormButtonUpdate') : getI18nMessage('adminModalFormButtonAdd'),
                    className: 'save-mapping-btn'
                }),
                createElement('button', {
                    type: 'button',
                    textContent: getI18nMessage('adminModalFormButtonCancel'),
                    className: 'cancel-mapping-btn',
                    events: {
                        click: () => {
                            dom.adminModal.formContainer.style.display = 'none';
                            dom.adminModal.listSection.style.display = 'flex';
                            dom.adminModal.addNewButton.style.display = 'inline-block';
                            dom.adminModal.closeButton.style.display = 'inline-block';
                            state.currentlyEditingId = null;
                            showAdminFeedback(getI18nMessage('adminFeedbackFormEditCancelled'), 'info', 2000);
                        }
                    }
                })
            ])
        );

        dom.adminModal.formContainer.append(
            createElement('h3', {}, [idToEdit ? `${getI18nMessage('adminModalFormEditTitlePrefix')}${idToEdit}` : getI18nMessage('adminModalFormAddTitle')]),
            form
        );

        toggleFields();
        form.querySelector('#admin-mapping-id')?.focus();
    }

    function handleSaveMapping() {
        const form = dom.adminModal.formContainer.querySelector('form');
        if (!form) return;
        const idInput = form.querySelector('#admin-mapping-id');
        const idStr = idInput.value.trim();
        if (!idStr) return showAdminFeedback(getI18nMessage('adminFeedbackFormErrorIdEmpty'), 'error');
        const id = parseInt(idStr, 10);
        if (isNaN(id)) return showAdminFeedback(getI18nMessage('adminFeedbackFormErrorIdNan'), 'error');
        if (!state.currentlyEditingId && state.currentAffiliateMappings.has(id)) {
            return showAdminFeedback(`${getI18nMessage('adminFeedbackFormErrorIdExistsPrefix')}${id}${getI18nMessage('adminFeedbackFormErrorIdExistsSuffix')}`, 'error');
        }

        const newMapping = {};
        if (form.querySelector('#typeSpecial').checked) {
            newMapping.specialText = form.querySelector('#admin-mapping-specialtext').value.trim();
            if (newMapping.specialText === "") return showAdminFeedback(getI18nMessage('adminFeedbackFormErrorSpecialTextEmpty'), 'error');
        } else {
            newMapping.geo = form.querySelector('#admin-mapping-geo').value.trim();
            newMapping.casino = form.querySelector('#admin-mapping-casino').value.trim();
            if (!newMapping.geo && !newMapping.casino) return showAdminFeedback(getI18nMessage('adminFeedbackFormErrorGeoCasinoEmpty'), 'error');
        }

        state.currentAffiliateMappings.set(id, newMapping);
        renderMappingsList();
        dom.adminModal.formContainer.style.display = 'none';
        dom.adminModal.listSection.style.display = 'flex';
        dom.adminModal.addNewButton.style.display = 'inline-block';
        dom.adminModal.closeButton.style.display = 'inline-block';
        const feedbackSuffix = state.currentlyEditingId ? 'adminFeedbackFormSaveSuccessUpdatedSuffix' : 'adminFeedbackFormSaveSuccessAddedSuffix';
        showAdminFeedback(`${getI18nMessage('adminFeedbackFormSaveSuccessPrefix')}${id}${getI18nMessage(feedbackSuffix)}`, 'success');
        state.currentlyEditingId = null;
    }

    function updateTimerToggleButtonState() {
        const toggle = document.getElementById('auto-refresh-toggle');
        if (toggle) toggle.checked = state.currentSiteRefreshSettings.isEnabled;
    }

    async function toggleAutoRefresherStatus(toggleElement) {
        state.currentSiteRefreshSettings.isEnabled = toggleElement.checked;
        await saveDataToStorage(state.currentSiteRefreshSettings.enabledKey, state.currentSiteRefreshSettings.isEnabled);
        updateTimerToggleButtonState();

        const refresherStatus = state.currentSiteRefreshSettings.isEnabled ? getI18nMessage('adminFeedbackRefresherOn') : getI18nMessage('adminFeedbackRefresherOff');
        showAdminFeedback(`${getI18nMessage('adminFeedbackRefresherToggled')} ${refresherStatus}.`, 'info', 2000);

        if (state.currentSiteRefreshSettings.isEnabled) {
            startRefreshCycle(state.currentSiteRefreshSettings.intervalMinutes);
        } else {
            stopRefreshCycle();
            applyClockVisibility();
            renderTimerDisplay();
        }
    }

    async function handleLangSwitch() {
        const newLang = state.lang === 'uk' ? 'en' : 'uk';
        await setLanguage(newLang);
        showAdminFeedback(getI18nMessage('adminFeedbackLangChanged'), 'success', 1500);
    }

    async function setLanguage(lang) {
        await loadLocale(lang);
        await saveDataToStorage(config.STORAGE_KEYS.CURRENT_LANG, lang);
        if (dom.adminModal.backdrop) updateUIWithTranslations();
    }

    function updateUIWithTranslations() {
        if (!state.isI18nReady || !dom.adminModal.backdrop) return;

        const i18n = getI18nMessage;
        const {
            adminModal: {
                title,
                addNewButton,
                closeButton,
                settings,
                mainButtons
            }
        } = dom;

        title.textContent = i18n('adminModalTitle');
        addNewButton.textContent = i18n('adminModalAddNewButtonPlusText');
        addNewButton.title = i18n('adminModalAddNewButtonPlusTitle');
        closeButton.title = i18n('adminModalCloseTitle');

        settings.title.textContent = i18n('adminSettingsTitle');
        settings.timerSectionTitle.textContent = i18n('adminSettingsSectionTimer');
        settings.featuresSectionTitle.textContent = i18n('adminSettingsSectionFeatures');

        if (settings.autoRefreshToggleLabel) {
            settings.autoRefreshToggleLabel.textContent = i18n('adminSettingsEnableTimer');
            settings.autoRefreshToggleLabel.parentElement.parentElement.title = i18n('adminSettingsEnableTimerTooltip');
        }
        if (settings.clockTypeTitle) {
            settings.clockTypeTitle.textContent = i18n('adminSettingsClockTypeTitle');
            settings.clockTypeOverlayLabel.childNodes[1].nodeValue = i18n('adminSettingsClockTypeOverlay');
            settings.clockTypeImplementedLabel.childNodes[1].nodeValue = i18n('adminSettingsClockTypeImplemented');
        }

        Object.entries({
            liveChatNameReplacer: 'adminSettingsEnableNameReplacer',
            liveChatCopyTools: 'adminSettingsEnableCopyTools',
            nr2IdCopy: 'adminSettingsEnableNr2CopyId',
            clearRecentPlayers: 'adminSettingsEnableClearRecent',
        }).forEach(([key, labelKey]) => {
            if (settings[`${key}ToggleLabel`]) {
                settings[`${key}ToggleLabel`].textContent = i18n(labelKey);
                settings[`${key}ToggleLabel`].parentElement.parentElement.title = i18n(`${labelKey}Tooltip`);
            }
        });

        mainButtons.langSwitch.textContent = i18n('adminModalButtonSwitchLang');
        mainButtons.langSwitch.title = i18n('adminModalButtonSwitchLangTitle');
        mainButtons.manualUpdate.title = i18n('adminModalButtonManualUpdateTitle');
        mainButtons.import.textContent = i18n('adminModalButtonImportJson');
        mainButtons.import.title = i18n('adminModalButtonImportJsonTitle');
        mainButtons.export.textContent = i18n('adminModalButtonExportJson');
        mainButtons.export.title = i18n('adminModalButtonExportJsonTitle');
        mainButtons.saveAll.textContent = i18n('adminModalButtonSaveAll');
        mainButtons.saveAll.title = i18n('adminModalButtonSaveAllTitle');

        renderMappingsList();
        ensureCustomConfirmModalExists();
        ensureExportOptionsModalExists();

        document.querySelectorAll('.copy-icon-btn').forEach(btn => btn.title = i18n('copyToClipboardTitle'));
        document.querySelectorAll('#clear-recent-players-btn-container button').forEach(btn => {
            btn.textContent = i18n('clearRecentPlayersButton');
            btn.title = i18n('clearRecentPlayersTitle');
        });
        document.querySelectorAll('[id*="custom-bonus-rate-field-boomerang"] .x-btn-inner').forEach(btn => btn.textContent = i18n('boomerangBonusRateCalculateButtonText'));
        document.querySelectorAll('#bonus-rate-calculate-btn').forEach(btn => btn.textContent = i18n('bonusRateCalculateButtonText'));
    }

    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        initializeScript();
    } else {
        document.addEventListener('DOMContentLoaded', initializeScript, {
            once: true
        });
    }
})();
