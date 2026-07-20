import { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  X,
} from 'lucide-react';

import { fmtDateTime } from '../detailConfig';
import { formatRelative } from '@utils/formatRelative';
import { useLazyVerifyRecordQuery } from '../antiquitiesApi';
import styles from './TrustAnchorCard.module.css';

/**
 * TrustAnchorCard — the ledger-relationship card in the right column of the
 * antiquity detail page. Shown only for records that have been anchored on
 * Fabric (blockchain_tx set).
 *
 * Two things live here:
 *   1. A read of the ledger metadata: transaction id (mono, click to copy)
 *      and anchored time.
 *   2. The Verify action: recomputes content + image hashes and compares
 *      with what's on the ledger. Result renders in-place: success (both
 *      match), drift (per-field callout), unavailable (with reason).
 *
 * Visual treatment matches the mockup — a thin gold accent bar across the
 * top, a shield-lock icon in the header, and the whole card feels quiet
 * until the reader engages it.
 */
export default function TrustAnchorCard({ record }) {
  const txId = record?.blockchain_tx;
  if (!txId) return null;

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked — user can select via tooltip */ }
  };

  const short = shortTx(txId);
  const anchoredAt = record.updated_at;

  return (
    <div className={styles.card}>
      <div className={styles.accent} aria-hidden="true" />
      <div className={styles.head}>
        <ShieldCheck size={15} className={styles.headIcon} aria-hidden="true" />
        <span className={styles.eyebrow}>Ledger anchor</span>
      </div>

      <div className={styles.txLabel}>Transaction</div>
      <button
        type="button"
        className={styles.txRow}
        onClick={copy}
        title={txId}
        aria-label={copied ? 'Transaction id copied' : 'Copy transaction id'}
      >
        <code className={styles.txValue}>{short}</code>
        {copied ? (
          <Check size={13} className={styles.txCopiedIcon} />
        ) : (
          <Copy size={13} className={styles.txCopyIcon} />
        )}
      </button>

      {anchoredAt && (
        <div className={styles.anchoredRow}>
          <span className={styles.metaLabel}>Anchored</span>
          <span
            className={styles.metaValue}
            title={fmtDateTime(anchoredAt)}
          >
            {formatRelative(anchoredAt, true)}
          </span>
        </div>
      )}

      <VerifyPanel recordId={record.id} />
    </div>
  );
}

/* Format the tx id as first 6…last 6 for the button label. */
function shortTx(tx) {
  if (!tx) return '';
  if (tx.length <= 14) return tx;
  return `${tx.slice(0, 6)}…${tx.slice(-6)}`;
}

// ---------------------------------------------------------------------------
// VerifyPanel — one button in the idle state, four possible result states
// ---------------------------------------------------------------------------

function VerifyPanel({ recordId }) {
  const [triggerVerify, { data, error, isFetching, isUninitialized }] =
    useLazyVerifyRecordQuery();

  const runVerify = () => triggerVerify(recordId, false);

  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const wasFetchingRef = useRef(false);
  useEffect(() => {
    if (wasFetchingRef.current && !isFetching) {
      setLastCheckedAt(new Date().toISOString());
    }
    wasFetchingRef.current = isFetching;
  }, [isFetching]);

  // --- Idle: never been verified in this session ---
  if (isUninitialized && !isFetching) {
    return (
      <button
        type="button"
        className={styles.verifyBtn}
        onClick={runVerify}
      >
        <Search size={13} />
        <span>Verify against ledger</span>
      </button>
    );
  }

  // --- Loading ---
  if (isFetching) {
    return (
      <div className={styles.verifyLoading}>
        <Loader2 size={13} className={styles.spin} />
        <span>Verifying…</span>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    const isUnreachable = error.status === 503;
    return (
      <ResultBlock
        tone="warn"
        icon={<AlertTriangle size={14} />}
        title={isUnreachable ? 'Ledger unreachable' : 'Verification failed'}
        message={
          isUnreachable
            ? 'The gateway is not responding. Please try again shortly.'
            : error?.data?.message || 'Verification could not complete.'
        }
        lastCheckedAt={lastCheckedAt}
        onRetry={runVerify}
      />
    );
  }

  // --- Success: branch on `reason` first ---
  if (data?.reason) {
    return (
      <ResultBlock
        tone="warn"
        icon={<ShieldOff size={14} />}
        title="Verification unavailable"
        message={
          data.reason === 'NOT_ANCHORED'
            ? 'Record is marked published but was not anchored on the ledger.'
            : 'The ledger holds no asset for this record\u2019s key.'
        }
        lastCheckedAt={lastCheckedAt}
        onRetry={runVerify}
      />
    );
  }

  const contentOk = data?.contentMatch === true;
  const imageOk = data?.imageMatch === true;
  if (contentOk && imageOk) {
    return (
      <ResultBlock
        tone="ok"
        icon={<ShieldCheck size={14} />}
        title="Verified against ledger"
        message="Record content and image both match what was anchored."
        lastCheckedAt={lastCheckedAt}
        onRetry={runVerify}
      />
    );
  }

  return (
    <ResultBlock
      tone="bad"
      icon={<ShieldAlert size={14} />}
      title="Verification failed"
      message={
        !contentOk && !imageOk
          ? 'Both the record content and its image differ from what was anchored.'
          : !contentOk
          ? 'The record content differs from what was anchored.'
          : 'The image bytes differ from what was anchored.'
      }
      matches={{ content: contentOk, image: imageOk }}
      lastCheckedAt={lastCheckedAt}
      onRetry={runVerify}
    />
  );
}

function ResultBlock({ tone, icon, title, message, matches, lastCheckedAt, onRetry }) {
  return (
    <div className={styles.result} data-tone={tone}>
      <div className={styles.resultHead}>
        <span className={styles.resultIcon}>{icon}</span>
        <span className={styles.resultTitle}>{title}</span>
      </div>
      <p className={styles.resultMsg}>{message}</p>
      {matches && (
        <div className={styles.matches}>
          <MatchChip label="Content" ok={matches.content} />
          <MatchChip label="Image" ok={matches.image} />
        </div>
      )}
      <div className={styles.resultFoot}>
        {lastCheckedAt && (
          <span className={styles.resultTs}>
            {formatRelative(lastCheckedAt, true)}
          </span>
        )}
        <button
          type="button"
          className={styles.resultRetry}
          onClick={onRetry}
        >
          <RefreshCw size={11} />
          <span>Verify again</span>
        </button>
      </div>
    </div>
  );
}

function MatchChip({ label, ok }) {
  return (
    <span className={`${styles.matchChip} ${ok ? styles.matchOk : styles.matchBad}`}>
      {ok ? <Check size={11} /> : <X size={11} />}
      <span>{label}</span>
    </span>
  );
}
