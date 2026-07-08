import styles from './Card.module.css';

/**
 * Card — surface container. Composable via Card.Header / Card.Body / Card.Footer.
 *
 * @param {object} props
 * @param {'default'|'flat'|'elevated'} [props.variant='default']
 * @param {'sm'|'md'|'lg'|'none'} [props.padding='md']  // legacy — prefer using Card.Body
 * @param {boolean} [props.interactive]  // hover effect + cursor pointer
 */
function Card({
  variant = 'default',
  padding = 'none',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    styles.card,
    styles[`variant-${variant}`],
    padding !== 'none' ? styles[`padding-${padding}`] : '',
    interactive ? styles.interactive : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

function CardHeader({ className = '', children, ...rest }) {
  return (
    <div className={`${styles.header} ${className}`} {...rest}>
      {children}
    </div>
  );
}

function CardTitle({ as: Tag = 'h3', className = '', children, ...rest }) {
  return (
    <Tag className={`${styles.title} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function CardBody({ className = '', children, ...rest }) {
  return (
    <div className={`${styles.body} ${className}`} {...rest}>
      {children}
    </div>
  );
}

function CardFooter({ className = '', children, ...rest }) {
  return (
    <div className={`${styles.footer} ${className}`} {...rest}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
