import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const INTERVAL_SECONDS = 1200; // 20 minutes

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Eye Care Reminder'));
        this._remaining = INTERVAL_SECONDS;
        this._label = new St.Label({
            text: this._formatTime(this._remaining),
            y_align: Clutter.ActorAlign.CENTER,
            style: 'font-feature-settings: "tnum";',
        });
        this.add_child(this._label);
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._remaining--;
            if (this._remaining <= 0) {
                this._remaining = INTERVAL_SECONDS;
                this._showNotification();
            }
            this._label.set_text(this._formatTime(this._remaining));
            return GLib.SOURCE_CONTINUE;
        });
        let item = new PopupMenu.PopupMenuItem(_('Reset Timer'));
        item.connect('activate', () => {
            this._resetTimer();
            this._showNotification();
        });
        this.menu.addMenuItem(item);
    }
    
    _resetTimer() {
        this._remaining = INTERVAL_SECONDS;
        this._label.set_text(this._formatTime(this._remaining));
    }

    _formatTime(totalSeconds) {
        const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const ss = String(totalSeconds % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    }

    _showNotification() {
        Main.notify('Rest your eyes', 'The code can wait!', { 
            gicon: new Gio.ThemedIcon({ name: 'face-angry-symbolic' }), 
            bannerMarkup: true,
            resident: true
        });
    }
    
    destroy() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
        super.destroy();
    }
});

export default class EyeCareReminderExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'left');
    }
    
    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
