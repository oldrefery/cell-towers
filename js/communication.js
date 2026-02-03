/**
 * BroadcastChannel wrapper for cross-window communication
 */

class TowerCommunication {
    constructor(channelName = 'cell_tower_channel') {
        this.channel = new BroadcastChannel(channelName);
        this.listeners = new Map();
        this.infoWindow = null;
        this.monitorWindow = null;
        this.consoleWindow = null;
        this.preferSecondary = this.getPreference();

        this.channel.onmessage = (event) => {
            const { type, data } = event.data;
            console.debug('[TowerComm] recv', type, data);
            if (this.listeners.has(type)) {
                this.listeners.get(type).forEach(callback => callback(data));
            }
        };
    }

    getPreference() {
        const stored = localStorage.getItem('ios_prefer_secondary');
        return stored === 'true';
    }

    setPreferSecondary(value) {
        this.preferSecondary = Boolean(value);
        localStorage.setItem('ios_prefer_secondary', this.preferSecondary ? 'true' : 'false');
    }

    async getWindowPosition(width, height, preferSecondary) {
        if (!preferSecondary) {
            return {
                left: window.screenX + 40,
                top: window.screenY + 40
            };
        }

        if ('getScreenDetails' in window) {
            try {
                const permission = await navigator.permissions.query({ name: 'window-management' });
                if (permission.state === 'granted' || permission.state === 'prompt') {
                    const details = await window.getScreenDetails();
                    const target = details.screens.find(screen => screen !== details.currentScreen) || details.currentScreen;
                    return {
                        left: Math.round(target.availLeft + Math.max(0, (target.availWidth - width) / 2)),
                        top: Math.round(target.availTop + Math.max(0, (target.availHeight - height) / 2))
                    };
                }
            } catch (error) {
                console.warn('Window placement not available, falling back to default.', error);
            }
        }

        return {
            left: window.screenX + window.outerWidth + 20,
            top: window.screenY + 20
        };
    }

    send(type, data) {
        const message = {
            type,
            data,
            timestamp: Date.now()
        };
        console.debug('[TowerComm] send', message);
        this.channel.postMessage(message);
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }

    async openTowerInfo(towerId) {
        // Check if window already exists and is still open
        if (this.infoWindow && !this.infoWindow.closed) {
            this.infoWindow.focus();
            this.send('open_tower_info', { towerId });
            return;
        }

        // Open new window
        const width = 600;
        const height = 700;
        const { left, top } = await this.getWindowPosition(width, height, this.preferSecondary);

        const infoUrl = `tower-info.html?towerId=${encodeURIComponent(towerId)}`;
        this.infoWindow = window.open(
            infoUrl,
            'tower_info_window',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (this.infoWindow) {
            this.infoWindow.focus();

            // Send message after short delay to ensure window is ready
            setTimeout(() => {
                this.send('open_tower_info', { towerId });
            }, 200);
        } else {
            console.error('Failed to open window - check popup blocker');
        }
    }

    async openMonitor(towerId) {
        // Check if window already exists and is still open
        if (this.monitorWindow && !this.monitorWindow.closed) {
            this.monitorWindow.focus();
            this.send('start_monitoring', { towerId });
            return;
        }

        // Open new window
        const width = 800;
        const height = 600;
        const { left, top } = await this.getWindowPosition(width, height, this.preferSecondary);

        const monitorUrl = `monitor.html?towerId=${encodeURIComponent(towerId)}`;
        this.monitorWindow = window.open(
            monitorUrl,
            'monitor_window',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (this.monitorWindow) {
            this.monitorWindow.focus();

            // Send message after short delay to ensure window is ready
            setTimeout(() => {
                this.send('start_monitoring', { towerId });
            }, 200);
        }
    }

    async openConsole() {
        if (this.consoleWindow && !this.consoleWindow.closed) {
            this.consoleWindow.focus();
            return;
        }

        const width = 1100;
        const height = 760;
        const { left, top } = await this.getWindowPosition(width, height, this.preferSecondary);

        this.consoleWindow = window.open(
            'console.html',
            'console_window',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (this.consoleWindow) {
            this.consoleWindow.focus();
        }
    }

    updateOpenWindows(towerId) {
        // Broadcast to any open windows (map may not own their references).
        this.send('open_tower_info', { towerId });
        this.send('start_monitoring', { towerId });
    }

    close() {
        this.channel.close();
    }
}
