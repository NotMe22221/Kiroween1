import type { CacheStatus, SyncStatus, UIConfig, CacheMetadata } from './types';
import './styles.css';

export class ShadowIndicatorElement extends HTMLElement {
  private _isOnline: boolean = true;
  private _cacheStatus: CacheStatus = {
    storageUsage: 0,
    cachedResourceCount: 0,
    syncStatus: 'idle',
  };
  private _syncStatus: SyncStatus = {
    syncing: false,
    pendingChanges: 0,
  };
  private _config: UIConfig = {
    theme: 'auto',
    position: 'corner',
    showDetails: true,
  };
  private _contentMetadata?: CacheMetadata;
  private _isContentCached: boolean = true;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.applyTheme();
    this.applyShadowTheme();
  }

  disconnectedCallback() {
    document.body.classList.remove('shadow-theme');
  }

  set isOnline(value: boolean) {
    this._isOnline = value;
    this.render();
    this.applyShadowTheme();
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  set cacheStatus(value: CacheStatus) {
    this._cacheStatus = value;
    this.render();
  }

  get cacheStatus(): CacheStatus {
    return this._cacheStatus;
  }

  set syncStatus(value: SyncStatus) {
    this._syncStatus = value;
    this.render();
  }

  get syncStatus(): SyncStatus {
    return this._syncStatus;
  }

  set config(value: UIConfig) {
    this._config = value;
    this.render();
    this.applyTheme();
  }

  get config(): UIConfig {
    return this._config;
  }

  set contentMetadata(value: CacheMetadata | undefined) {
    this._contentMetadata = value;
    this.render();
  }

  get contentMetadata(): CacheMetadata | undefined {
    return this._contentMetadata;
  }

  set isContentCached(value: boolean) {
    this._isContentCached = value;
    this.render();
  }

  get isContentCached(): boolean {
    return this._isContentCached;
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-shadow-theme', this._config.theme);
  }

  private applyShadowTheme() {
    if (!this._isOnline) {
      document.body.classList.add('shadow-theme');
    } else {
      document.body.classList.remove('shadow-theme');
    }
  }

  private formatAge(timestamp: number): string {
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    if (ageDays > 0) return `${ageDays}d ago`;
    if (ageHours > 0) return `${ageHours}h ago`;
    if (ageMinutes > 0) return `${ageMinutes}m ago`;
    return 'just now';
  }

  private isStale(metadata: CacheMetadata | undefined): boolean {
    if (!metadata || !metadata.expiresAt) return false;
    return Date.now() > metadata.expiresAt;
  }

  private handleSync() {
    this.dispatchEvent(new CustomEvent('sync', { bubbles: true }));
  }

  private render() {
    if (!this.shadowRoot) return;

    const positionClass = `shadow-indicator--${this._config.position}`;
    const statusDotClass = this._isOnline
      ? 'shadow-indicator__status-dot'
      : 'shadow-indicator__status-dot shadow-indicator__status-dot--offline';

    const styles = `
      <style>
        @import url('./styles.css');
      </style>
    `;

    const unavailableMessage =
      !this._isOnline && !this._isContentCached
        ? `<div class="shadow-indicator__message shadow-indicator__message--error">
            This content is not available offline
          </div>`
        : '';

    const metadataSection = this._contentMetadata
      ? `
        <div class="shadow-indicator__metadata-item">
          <span class="shadow-indicator__metadata-label">Age:</span>
          <span class="${
            this.isStale(this._contentMetadata)
              ? 'shadow-indicator__metadata-value shadow-indicator__metadata-value--stale'
              : 'shadow-indicator__metadata-value'
          }">
            ${this.formatAge(this._contentMetadata.cachedAt)}${
          this.isStale(this._contentMetadata) ? ' (stale)' : ''
        }
          </span>
        </div>
        <div class="shadow-indicator__metadata-item">
          <span class="shadow-indicator__metadata-label">Priority:</span>
          <span class="shadow-indicator__metadata-value">
            ${this._contentMetadata.priority}/10
          </span>
        </div>
      `
      : '';

    const detailsSection = this._config.showDetails
      ? `
        <div class="shadow-indicator__details">
          <div class="shadow-indicator__metadata">
            <div class="shadow-indicator__metadata-item">
              <span class="shadow-indicator__metadata-label">Cached:</span>
              <span class="shadow-indicator__metadata-value">
                ${this._cacheStatus.cachedResourceCount} resources
              </span>
            </div>
            <div class="shadow-indicator__metadata-item">
              <span class="shadow-indicator__metadata-label">Storage:</span>
              <span class="shadow-indicator__metadata-value">
                ${Math.round(this._cacheStatus.storageUsage / 1024 / 1024)}MB
              </span>
            </div>
            ${metadataSection}
          </div>
          <div class="shadow-indicator__sync">
            <button
              class="shadow-indicator__sync-button"
              ${this._syncStatus.syncing || !this._isOnline ? 'disabled' : ''}
            >
              ${this._syncStatus.syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <span class="shadow-indicator__sync-status">
              ${
                this._syncStatus.pendingChanges > 0
                  ? `${this._syncStatus.pendingChanges} pending`
                  : ''
              }
            </span>
          </div>
        </div>
      `
      : '';

    this.shadowRoot.innerHTML = `
      ${styles}
      <link rel="stylesheet" href="./styles.css">
      <div class="shadow-indicator ${positionClass}" data-shadow-theme="${this._config.theme}">
        <div class="shadow-indicator__status">
          <span class="${statusDotClass}"></span>
          <span class="shadow-indicator__status-text">
            ${this._isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        ${unavailableMessage}
        ${detailsSection}
      </div>
    `;

    // Attach event listener to sync button
    const syncButton = this.shadowRoot.querySelector('.shadow-indicator__sync-button');
    if (syncButton) {
      syncButton.addEventListener('click', () => this.handleSync());
    }
  }
}

// Register the custom element
if (!customElements.get('shadow-indicator')) {
  customElements.define('shadow-indicator', ShadowIndicatorElement);
}
