/**
 * BroadcastChannel wrapper for cross-window communication
 */

class TowerCommunication {
    constructor(channelName = 'cell_tower_channel') {
        this.channel = new BroadcastChannel(channelName);
        this.listeners = new Map();
        this.infoWindow = null;
        this.monitorWindow = null;

        this.channel.onmessage = (event) => {
            const { type, data } = event.data;
            if (this.listeners.has(type)) {
                this.listeners.get(type).forEach(callback => callback(data));
            }
        };
    }

    send(type, data) {
        this.channel.postMessage({
            type,
            data,
            timestamp: Date.now()
        });
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }

    openTowerInfo(towerId) {
        // Check if window already exists and is still open
        if (this.infoWindow && !this.infoWindow.closed) {
            this.infoWindow.focus();
            this.send('open_tower_info', { towerId });
            return;
        }

        // Open new window
        const width = 600;
        const height = 700;
        const left = window.screenX + window.outerWidth;
        const top = window.screenY;

        this.infoWindow = window.open(
            'tower-info.html',
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

    openMonitor(towerId) {
        // Check if window already exists and is still open
        if (this.monitorWindow && !this.monitorWindow.closed) {
            this.monitorWindow.focus();
            this.send('start_monitoring', { towerId });
            return;
        }

        // Open new window
        const width = 800;
        const height = 600;
        const left = window.screenX + window.outerWidth + 620;
        const top = window.screenY;

        this.monitorWindow = window.open(
            'monitor.html',
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

    updateOpenWindows(towerId) {
        // Update tower info window if open
        if (this.infoWindow && !this.infoWindow.closed) {
            this.send('open_tower_info', { towerId });
        }

        // Update monitor window if open
        if (this.monitorWindow && !this.monitorWindow.closed) {
            this.send('start_monitoring', { towerId });
        }
    }

    close() {
        this.channel.close();
    }
}
