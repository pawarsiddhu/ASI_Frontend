import { useEffect, useRef, useState } from 'react';
import { Upload, X, ImagePlus } from 'lucide-react';
import Card from '@components/Card';
import Button from '@components/Button';
import { useToast } from '@components/Toast';
import styles from './ImageUpload.module.css';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB — matches backend upload limit
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * ImageUpload — single-image picker for a record.
 *
 * State is a File instance (not base64) because the create mutation ships
 * multipart/form-data — the raw File is what needs to be appended to
 * FormData. A short-lived preview URL is generated via URL.createObjectURL
 * so the operator can see the image before saving; the URL is revoked when
 * the file changes to avoid leaks.
 *
 * Backend accepts one image per record. If the operator drops multiple
 * files, we take the first and warn about the rest — no queueing UI.
 *
 * @param {object} props
 * @param {File | null} props.image  - the current file (null = none picked)
 * @param {(file: File | null) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export default function ImageUpload({ image, onChange, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);
  const toast = useToast();

  // Refresh the preview URL whenever the file changes; revoke the previous
  // one to avoid memory leaks.
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    if (files.length > 1) {
      toast.warning('Only one image per record — using the first.');
    }
    const f = files[0];

    if (!ACCEPT.includes(f.type)) {
      toast.error(`${f.name}: unsupported type. Use PNG, JPG or WEBP.`);
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error(`${f.name}: over 5 MB.`);
      return;
    }
    onChange(f);
  };

  const clear = () => onChange(null);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          Image{' '}
          <span className={styles.count}>
            ({image ? '1 / 1' : '0 / 1'})
          </span>
        </Card.Title>
      </Card.Header>
      <Card.Body>
        {!image ? (
          <div
            className={`${styles.zone} ${dragOver ? styles.zoneOver : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <ImagePlus size={24} className={styles.zoneIcon} />
            <p className={styles.zoneTitle}>Drag & drop an image here</p>
            <p className={styles.zoneHint}>PNG · JPG · WEBP · up to 5 MB</p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload size={12} />}
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT.join(',')}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = ''; // allow re-selecting the same file
              }}
              className={styles.hiddenInput}
              aria-label="Select image"
            />
          </div>
        ) : (
          <ul className={styles.grid} aria-label="Attached image">
            <li className={styles.thumbCell}>
              {preview && (
                <img
                  src={preview}
                  alt={image.name || 'Selected'}
                  className={styles.thumb}
                />
              )}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={clear}
                disabled={disabled}
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </li>
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}
