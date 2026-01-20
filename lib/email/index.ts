/**
 * Email module exports
 */

export {
  sendNotificationEmail,
  sendDigestEmail,
  testEmailConfig,
  type NotificationType,
  type EmailNotificationData,
  type DigestEmailData,
} from "./service";

export {
  newFeedbackEmail,
  assignmentEmail,
  commentEmail,
  mentionEmail,
  exportEmail,
  digestEmail,
} from "./templates";
