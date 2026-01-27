/**
 * BroadcastChannel wrapper for cross-window communication
 */

class TowerCommunication {
    constructor(channelName = 'cell_tower_channel') {
        this.channel = new BroadcastChannel(channelName);
        this.listeners = new Map();

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
        console.log('openTowerInfo called for:', towerId);

        const width = 600;
        const height = 700;
        const left = window.screenX + window.outerWidth;
        const top = window.screenY;

        console.log('Attempting to open window...');
        const win = window.open(
            'tower-info.html',
            'tower_info_window',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (win) {
            console.log('Window opened successfully');
            win.focus();

            // Send message after short delay to ensure window is ready
            setTimeout(() => {
                console.log('Sending tower info message...');
                this.send('open_tower_info', { towerId });
            }, 200);
        } else {
            console.error('Failed to open window - check popup blocker');
        }
    }

    openMonitor(towerId) {
        const width = 800;
        const height = 600;
        const left = window.screenX + window.outerWidth + 620;
        const top = window.screenY;

        const win = window.open(
            'monitor.html',
            'monitor_window',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (win) {
            win.focus();

            // Send message after short delay to ensure window is ready
            setTimeout(() => {
                this.send('start_monitoring', { towerId });
            }, 200);
        }
    }

    close() {
        this.channel.close();
    }
}
