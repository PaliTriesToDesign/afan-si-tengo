// Centralized icon choices for post-card actions — FontAwesome for
// now, swappable for pixel-art assets later without touching any
// component that uses ACTION_ICONS, same "one-file change" principle
// as the share-image branding placeholder.
import {
  faHandshake,
  faShareNodes,
  faFlag,
  faCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'

export const ACTION_ICONS = {
  helperPing: faHandshake,
  share: faShareNodes,
  report: faFlag,
  covered: faCircleCheck,
  stillNeeded: faTriangleExclamation,
}
