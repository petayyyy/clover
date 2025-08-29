// Internationalization module for Clover Blocks
// Manages language switching and translations

class I18n {
    constructor() {
        this.currentLanguage = 'ru-RU'; // Default language is Russian
        this.translations = {};
        this.initialized = false;
        this.languageChangeCallbacks = [];
        
        // Load saved language preference
        const savedLanguage = localStorage.getItem('clover_blocks_language');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
        }
        
        // Fallback translations in case files fail to load
        this.fallbackTranslations = {
            'en-US': {
                'title': 'Clover Blocks',
                'blocks_tab': 'Blocks',
                'python_tab': 'Python',
                'disconnected': 'Disconnected',
                'running': 'Running...',
                'run_button': 'Run',
                'stop_button': 'Stop',
                'land_button': 'Land',
                'unsaved': '<Unsaved>',
                'clear': 'Clear...',
                'save': 'Save... (Ctrl+S)',
                'user_programs': 'User',
                'example_programs': 'Examples',
                'files_saved_in': 'Files are saved in <package_path>/programs/.',
                'run_tooltip': 'Run the program',
                'stop_tooltip': 'Stop the program',
                'land_tooltip': 'Stop the program and land',
                'run_program_confirm': 'Run program?',
                'clear_workspace_confirm': 'Clear workspace?',
                'discard_changes_confirm': 'Discard changes?',
                'enter_program_name': 'Enter new program name:',
                'error_prefix': 'Error: ',
                'unable_to_land': 'Unable to land: ',
                'unable_to_store': 'Unable to store: ',
                'error_loading_programs': 'Error loading programs list.\n\nHave you enabled \'blocks\' in clover.launch?',
                'language_tooltip': 'Select interface language',
                'english': 'English',
                'russian': 'Русский'
            },
            'ru-RU': {
                'title': 'Clover Blocks',
                'blocks_tab': 'Blocks',
                'python_tab': 'Python',
                'disconnected': 'Disconnected',
                'running': 'Running...',
                'run_button': 'Run',
                'stop_button': 'Stop',
                'land_button': 'Land',
                'unsaved': '<Unsaved>',
                'clear': 'Clear...',
                'save': 'Save... (Ctrl+S)',
                'user_programs': 'User',
                'example_programs': 'Examples',
                'files_saved_in': 'Files are saved in <package_path>/programs/.',
                'run_tooltip': 'Run the program',
                'stop_tooltip': 'Stop the program',
                'land_tooltip': 'Stop the program and land',
                'run_program_confirm': 'Run program?',
                'clear_workspace_confirm': 'Clear workspace?',
                'discard_changes_confirm': 'Discard changes?',
                'enter_program_name': 'Enter new program name:',
                'error_prefix': 'Error: ',
                'unable_to_land': 'Unable to land: ',
                'unable_to_store': 'Unable to store: ',
                'error_loading_programs': 'Error loading programs list.\n\nHave you enabled \'blocks\' in clover.launch?',
                'language_tooltip': 'Select interface language',
                'english': 'English',
                'russian': 'Русский'
            }
        };
    }

    // Initialize the i18n system
    async init() {
        try {
            // Load translation files
            await this.loadTranslations();
            // Load Blockly built-in messages for current language
            await this.loadBlocklyMessages(this.currentLanguage);
            
            // Apply initial language without updating interface immediately
            this.currentLanguage = this.currentLanguage;
            localStorage.setItem('clover_blocks_language', this.currentLanguage);
            document.documentElement.lang = this.currentLanguage.startsWith('ru') ? 'ru' : 'en';
            
            this.initialized = true;
            console.log('I18n system initialized with language:', this.currentLanguage);
        } catch (error) {
            console.error('Failed to initialize i18n system:', error);
            // Use fallback translations and continue
            this.translations['en-US'] = this.fallbackTranslations['en-US'];
            this.translations['ru-RU'] = this.fallbackTranslations['ru-RU'];
            this.initialized = true;
            console.log('I18n system initialized with fallback translations');
        }
    }

    // Load translation files
    async loadTranslations() {
        try {
            // Load English translations
            const enResponse = await fetch('lang/en-US/translations.js');
            if (enResponse.ok) {
                const enScript = await enResponse.text();
                // Create a script element to load translations
                const script = document.createElement('script');
                script.textContent = enScript;
                document.head.appendChild(script);
                this.translations['en-US'] = window.enUS || {};
                document.head.removeChild(script);
                console.log('English translations loaded');
            } else {
                console.error('Failed to load English translations:', enResponse.status);
                // Use fallback translations
                this.translations['en-US'] = this.fallbackTranslations['en-US'];
            }

            // Load Russian translations
            const ruResponse = await fetch('lang/ru-RU/translations.js');
            if (ruResponse.ok) {
                const ruScript = await ruResponse.text();
                // Create a script element to load translations
                const script = document.createElement('script');
                script.textContent = ruScript;
                document.head.appendChild(script);
                this.translations['ru-RU'] = window.ruRU || {};
                document.head.removeChild(script);
                console.log('Russian translations loaded');
            } else {
                console.error('Failed to load Russian translations:', ruResponse.status);
                // Use fallback translations
                this.translations['ru-RU'] = this.fallbackTranslations['ru-RU'];
            }

            console.log('Translation files loaded successfully');
            console.log('Available translations:', Object.keys(this.translations));
        } catch (error) {
            console.error('Failed to load translation files:', error);
            // Use fallback translations on error
            this.translations['en-US'] = this.fallbackTranslations['en-US'];
            this.translations['ru-RU'] = this.fallbackTranslations['ru-RU'];
            console.log('Using fallback translations');
        }
    }

    // Get translation for a key
    t(key, params = {}) {
        const translation = this.translations[this.currentLanguage]?.[key] || 
                          this.translations['en-US']?.[key] || 
                          this.fallbackTranslations[this.currentLanguage]?.[key] ||
                          this.fallbackTranslations['en-US']?.[key] ||
                          key;
        
        // Replace parameters in translation
        return this.interpolate(translation, params);
    }

    // Interpolate parameters in translation string
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // Set language and update interface
    async setLanguage(language) {
        if (this.currentLanguage === language) {
            return;
        }

        this.currentLanguage = language;
        localStorage.setItem('clover_blocks_language', language);
        
        // Update document language attribute
        document.documentElement.lang = language.startsWith('ru') ? 'ru' : 'en';
        
        // Load Blockly messages for the selected language before updating UI
        await this.loadBlocklyMessages(language);
        
        // Only update interface if DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.updateInterface();
        }
        
        // Notify callbacks
        this.languageChangeCallbacks.forEach(callback => callback(language));
        
        console.log('Language changed to:', language);
    }

    // Update all interface elements with new translations
    updateInterface() {
        try {
            // Update title
            document.title = this.t('title');
            
            // Update tab labels - scope to the tabs list to avoid matching body[data-tab]
            const blocksTab = document.querySelector('#tabs [data-tab="blocks"]');
            const pythonTab = document.querySelector('#tabs [data-tab="python"]');
            
            if (blocksTab && blocksTab.tagName === 'LI') {
                blocksTab.textContent = this.t('blocks_tab');
            }
            if (pythonTab && pythonTab.tagName === 'LI') {
                pythonTab.textContent = this.t('python_tab');
            }
            
            // Update connection status
            const disconnectedElem = document.querySelector('.disconnected');
            const backendFailElem = document.querySelector('.backend-fail');
            const runningElem = document.getElementById('running');
            
            if (disconnectedElem) disconnectedElem.textContent = this.t('disconnected');
            if (backendFailElem) backendFailElem.innerHTML = this.t('backend_fail');
            if (runningElem) runningElem.textContent = this.t('running');
            
            // Update program selector options
            this.updateProgramSelector();
            
            // Update buttons - be more specific with selectors
            const runButton = document.getElementById('run');
            const stopButton = document.querySelector('button[onclick="stopProgram()"]');
            const landButton = document.querySelector('button[onclick="land()"]');
            
            if (runButton && runButton.tagName === 'BUTTON') {
                runButton.textContent = this.t('run_button');
                runButton.title = this.t('run_tooltip');
            }
            if (stopButton && stopButton.tagName === 'BUTTON') {
                stopButton.textContent = this.t('stop_button');
                stopButton.title = this.t('stop_tooltip');
            }
            if (landButton && landButton.tagName === 'BUTTON') {
                landButton.textContent = this.t('land_button');
                landButton.title = this.t('land_tooltip');
            }
            
            // Update language selector
            this.updateLanguageSelector();
            
            // Update Blockly toolbox categories
            this.updateBlocklyToolbox();

            // Recreate blocks so their static labels pick up the new language
            this.refreshWorkspaceBlocks();

            // Ensure toolbox/flyout reflects new labels even for the currently selected category
            this.refreshToolboxSelection();
        } catch (error) {
            console.error('Error updating interface:', error);
        }
    }

    // Update program selector options
    updateProgramSelector() {
        const programSelect = document.getElementById('program-name');
        if (!programSelect) return;
        
        // Update title attribute
        programSelect.title = this.t('files_saved_in');
        
        // Update option texts
        const options = programSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') {
                option.textContent = this.t('unsaved');
            } else if (option.value === '@clear') {
                option.textContent = this.t('clear');
            } else if (option.value === '@save') {
                option.textContent = this.t('save');
            }
        });
        
        // Update optgroup labels
        const userGroup = programSelect.querySelector('optgroup[data-type="user"]');
        const exampleGroup = programSelect.querySelector('optgroup[data-type="example"]');
        
        if (userGroup) userGroup.label = this.t('user_programs');
        if (exampleGroup) exampleGroup.label = this.t('example_programs');
    }

    // Update language selector
    updateLanguageSelector() {
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.title = this.t('language_tooltip');
            
            const options = languageSelector.querySelectorAll('option');
            options.forEach(option => {
                if (option.value === 'en-US') {
                    option.textContent = this.t('english');
                } else if (option.value === 'ru-RU') {
                    option.textContent = this.t('russian');
                }
            });
        }
    }

    // Update Blockly toolbox categories
    updateBlocklyToolbox() {
        if (typeof Blockly === 'undefined') {
            return;
        }
        
        try {
            // Merge current language messages into Blockly.Msg
            if (this.currentLanguage === 'ru-RU' && typeof window !== 'undefined' && window.ruRU) {
                Object.assign(Blockly.Msg, window.ruRU);
            } else if (this.currentLanguage === 'en-US' && typeof window !== 'undefined' && window.enUS) {
                Object.assign(Blockly.Msg, window.enUS);
            }

            // Get toolbox XML
            const toolbox = document.getElementById('toolbox');
            if (!toolbox) return;
            
            // Update category names
            const categories = toolbox.querySelectorAll('category');
            categories.forEach(category => {
                const name = category.getAttribute('name');
                if (name) {
                    const translationKey = this.getCategoryTranslationKey(name);
                    if (translationKey) {
                        category.setAttribute('name', this.t(translationKey));
                    }
                }
            });
            
            // Refresh toolbox in the current workspace so changes apply immediately
            if (window.workspace && typeof window.workspace.updateToolbox === 'function') {
                window.workspace.updateToolbox(toolbox);
            }
        } catch (error) {
            console.error('Failed to update Blockly toolbox:', error);
        }
    }

    // Rebuild current workspace so block field labels reinitialize with new language
    refreshWorkspaceBlocks() {
        try {
            if (!window.workspace || typeof Blockly === 'undefined') return;
            const xml = Blockly.Xml.workspaceToDom(window.workspace);
            window.workspace.clear();
            Blockly.Xml.domToWorkspace(xml, window.workspace);
        } catch (e) {
            console.error('Failed to refresh workspace blocks:', e);
        }
    }

    // Try to refresh toolbox/flyout selection to update visible labels immediately
    refreshToolboxSelection() {
        try {
            if (!window.workspace) return;
            const ws = window.workspace;
            // Blockly 2019-2021 APIs
            if (ws.getToolbox && typeof ws.getToolbox === 'function') {
                const tb = ws.getToolbox();
                if (tb && typeof tb.refreshSelection === 'function') {
                    tb.refreshSelection();
                } else if (tb && typeof tb.getSelectedItem === 'function' && typeof tb.setSelectedItem === 'function') {
                    const sel = tb.getSelectedItem();
                    if (sel) tb.setSelectedItem(sel);
                }
            } else if (ws.toolbox_ && ws.toolbox_.tree_) {
                // Older internal API
                const tree = ws.toolbox_.tree_;
                if (typeof tree.setSelectedItem === 'function' && tree.selectedItem_) {
                    tree.setSelectedItem(tree.selectedItem_);
                }
            }
            if (typeof Blockly !== 'undefined' && typeof Blockly.svgResize === 'function') {
                Blockly.svgResize(ws);
            }
        } catch (e) {
            console.error('Failed to refresh toolbox selection:', e);
        }
    }

    // Get translation key for category name
    getCategoryTranslationKey(categoryName) {
        const categoryMap = {
            'Flight': 'flight_category',
            'State': 'state_category',
            'NEW': 'new_category',
            'LED': 'led_category',
            'GPIO': 'gpio_category',
            'Logic': 'logic_category',
            'Loops': 'loops_category',
            'Math': 'math_category',
            'Text': 'text_category',
            'Lists': 'lists_category',
            'Colour': 'colour_category',
            'Variables': 'variables_category',
            'Functions': 'functions_category'
        };
        
        return categoryMap[categoryName];
    }

    // Add callback for language change events
    onLanguageChange(callback) {
        this.languageChangeCallbacks.push(callback);
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // Check if i18n is initialized
    isInitialized() {
        return this.initialized;
    }

    // Load Blockly built-in message bundle for a given language
    async loadBlocklyMessages(language) {
        if (typeof document === 'undefined') return;
        const code = language.startsWith('ru') ? 'ru' : 'en';
        const localPath = `blockly/msg/js/${code}.js`;
        const cdnPath = `https://unpkg.com/blockly/msg/${code}.js`;
        
        // If already loaded for this code, skip
        if (window.__blocklyMsgLang === code) return;
        
        // Try local file first
        const loaded = await this.injectScript(localPath).catch(() => false);
        if (!loaded) {
            await this.injectScript(cdnPath).catch(() => {});
        }
        window.__blocklyMsgLang = code;
    }

    // Helper to inject a script and resolve when loaded
    injectScript(src) {
        return new Promise((resolve, reject) => {
            try {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve(true);
                script.onerror = () => reject(false);
                document.head.appendChild(script);
            } catch (e) {
                reject(false);
            }
        });
    }
}

// Create global i18n instance
window.i18n = new I18n();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}
