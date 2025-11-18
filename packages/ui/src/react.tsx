import React, { useEffect } from 'react';
import type { ShadowUIProps } from './types';
import './styles.css';

export function ShadowIndicator(props: ShadowUIProps): JSX.Element {
  const {
    isOnline,
    cacheStatus,
    syncStatus,
    onSync,
    config = { theme: 'auto', position: 'corner', showDetails: true },
    contentMetadata,
    isContentCached = true,
  } = props;

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-shadow-theme', config.theme);
  }, [config.theme]);

  // Apply shadow theme class when offline
  useEffect(() => {
    if (!isOnline) {
      document.body.classList.add('shadow-theme');
    } else {
      document.body.classList.remove('shadow-theme');
    }
    return () => {
      document.body.classList.remove('shadow-theme');
    };
  }, [isOnline]);

  const positionClass = `shadow-indicator--${config.position}`;
  const statusDotClass = isOnline
    ? 'shadow-indicator__status-dot'
    : 'shadow-indicator__status-dot shadow-indicator__status-dot--offline';

  const formatAge = (timestamp: number): string => {
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    if (ageDays > 0) return `${ageDays}d ago`;
    if (ageHours > 0) return `${ageHours}h ago`;
    if (ageMinutes > 0) return `${ageMinutes}m ago`;
    return 'just now';
  };

  const isStale = (metadata: typeof contentMetadata): boolean => {
    if (!metadata || !metadata.expiresAt) return false;
    return Date.now() > metadata.expiresAt;
  };

  return (
    <div className={`shadow-indicator ${positionClass}`} data-shadow-theme={config.theme}>
      <div className="shadow-indicator__status">
        <span className={statusDotClass}></span>
        <span className="shadow-indicator__status-text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {!isOnline && !isContentCached && (
        <div className="shadow-indicator__message shadow-indicator__message--error">
          This content is not available offline
        </div>
      )}

      {config.showDetails && (
        <div className="shadow-indicator__details">
          <div className="shadow-indicator__metadata">
            <div className="shadow-indicator__metadata-item">
              <span className="shadow-indicator__metadata-label">Cached:</span>
              <span className="shadow-indicator__metadata-value">
                {cacheStatus.cachedResourceCount} resources
              </span>
            </div>
            <div className="shadow-indicator__metadata-item">
              <span className="shadow-indicator__metadata-label">Storage:</span>
              <span className="shadow-indicator__metadata-value">
                {Math.round(cacheStatus.storageUsage / 1024 / 1024)}MB
              </span>
            </div>
            {contentMetadata && (
              <>
                <div className="shadow-indicator__metadata-item">
                  <span className="shadow-indicator__metadata-label">Age:</span>
                  <span
                    className={
                      isStale(contentMetadata)
                        ? 'shadow-indicator__metadata-value shadow-indicator__metadata-value--stale'
                        : 'shadow-indicator__metadata-value'
                    }
                  >
                    {formatAge(contentMetadata.cachedAt)}
                    {isStale(contentMetadata) ? ' (stale)' : ''}
                  </span>
                </div>
                <div className="shadow-indicator__metadata-item">
                  <span className="shadow-indicator__metadata-label">Priority:</span>
                  <span className="shadow-indicator__metadata-value">
                    {contentMetadata.priority}/10
                  </span>
                </div>
              </>
            )}
          </div>

          {syncStatus && (
            <div className="shadow-indicator__sync">
              <button
                className="shadow-indicator__sync-button"
                onClick={onSync}
                disabled={syncStatus.syncing || !isOnline}
              >
                {syncStatus.syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <span className="shadow-indicator__sync-status">
                {syncStatus.pendingChanges > 0 &&
                  `${syncStatus.pendingChanges} pending`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
