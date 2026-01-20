/**
 * Email templates for FeedbackFlow notifications
 * Designed to match the retro design system
 */

// Base styles for all emails
const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    background-color: #F7F5F0;
    margin: 0;
    padding: 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 2px solid #1a1a1a;
    border-radius: 4px;
    box-shadow: 4px 4px 0px 0px rgba(26,26,26,1);
  }
  .header {
    background-color: #1a1a1a;
    color: #ffffff;
    padding: 24px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .content {
    padding: 32px 24px;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge-bug {
    background-color: #FEE2E2;
    color: #E85D52;
    border: 1px solid #E85D52;
  }
  .badge-feature {
    background-color: #E0E7FF;
    color: #6B9AC4;
    border: 1px solid #6B9AC4;
  }
  .badge-comment {
    background-color: #F3E8FF;
    color: #9333EA;
    border: 1px solid #9333EA;
  }
  .badge-assignment {
    background-color: #FEF3C7;
    color: #D97706;
    border: 1px solid #D97706;
  }
  .feedback-card {
    background-color: #F7F5F0;
    border: 2px solid #1a1a1a;
    border-radius: 4px;
    padding: 16px;
    margin: 16px 0;
  }
  .feedback-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  .feedback-description {
    color: #525252;
    margin: 0;
  }
  .button {
    display: inline-block;
    background-color: #1a1a1a;
    color: #ffffff !important;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: 600;
    margin-top: 16px;
    box-shadow: 3px 3px 0px 0px #888;
  }
  .button:hover {
    background-color: #333333;
  }
  .footer {
    background-color: #F7F5F0;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #737373;
    border-top: 1px solid #e5e5e5;
  }
  .footer a {
    color: #6B9AC4;
    text-decoration: none;
  }
  .meta {
    font-size: 14px;
    color: #737373;
    margin-top: 8px;
  }
  .digest-item {
    border-bottom: 1px solid #e5e5e5;
    padding: 16px 0;
  }
  .digest-item:last-child {
    border-bottom: none;
  }
  .highlight {
    background-color: #F3C952;
    padding: 2px 6px;
    border-radius: 2px;
  }
`;

interface EmailTemplateData {
  recipientName?: string;
  feedbackTitle?: string;
  feedbackDescription?: string;
  feedbackType?: "bug" | "feature";
  projectName?: string;
  actorName?: string;
  commentPreview?: string;
  dashboardUrl: string;
  feedbackUrl?: string;
  unsubscribeUrl: string;
}

interface DigestItem {
  type: "new_feedback" | "assignment" | "comment" | "mention" | "export_complete" | "export_failed";
  title: string;
  body?: string;
  projectName?: string;
  feedbackTitle?: string;
  actorName?: string;
  feedbackUrl?: string;
}

interface DigestTemplateData {
  recipientName?: string;
  items: DigestItem[];
  period: "daily" | "weekly";
  dashboardUrl: string;
  unsubscribeUrl: string;
}

/**
 * New feedback notification email
 */
export function newFeedbackEmail(data: EmailTemplateData): { subject: string; html: string } {
  const subject = `New ${data.feedbackType || "feedback"} in ${data.projectName}: ${data.feedbackTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedbackFlow</h1>
    </div>
    <div class="content">
      <p>Hi${data.recipientName ? ` ${data.recipientName}` : ""},</p>
      <p>New feedback has been submitted to <strong>${data.projectName || "your project"}</strong>:</p>

      <div class="feedback-card">
        <span class="badge badge-${data.feedbackType === "bug" ? "bug" : "feature"}">
          ${data.feedbackType === "bug" ? "Bug" : "Feature Request"}
        </span>
        <h3 class="feedback-title" style="margin-top: 12px;">${data.feedbackTitle || "New Feedback"}</h3>
        ${data.feedbackDescription ? `<p class="feedback-description">${data.feedbackDescription}</p>` : ""}
      </div>

      <a href="${data.feedbackUrl || data.dashboardUrl}" class="button">View Feedback</a>
    </div>
    <div class="footer">
      <p>You're receiving this because you have notifications enabled for ${data.projectName || "this project"}.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe from emails</a> | <a href="${data.dashboardUrl}">View Dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Assignment notification email
 */
export function assignmentEmail(data: EmailTemplateData): { subject: string; html: string } {
  const subject = `You've been assigned to: ${data.feedbackTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedbackFlow</h1>
    </div>
    <div class="content">
      <p>Hi${data.recipientName ? ` ${data.recipientName}` : ""},</p>
      <p><strong>${data.actorName || "Someone"}</strong> assigned you to a feedback item in <strong>${data.projectName || "your project"}</strong>:</p>

      <div class="feedback-card">
        <span class="badge badge-assignment">Assigned to You</span>
        <h3 class="feedback-title" style="margin-top: 12px;">${data.feedbackTitle || "Feedback Item"}</h3>
        ${data.feedbackDescription ? `<p class="feedback-description">${data.feedbackDescription}</p>` : ""}
      </div>

      <a href="${data.feedbackUrl || data.dashboardUrl}" class="button">View Assignment</a>
    </div>
    <div class="footer">
      <p>You're receiving this because someone assigned feedback to you.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe from emails</a> | <a href="${data.dashboardUrl}">View Dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Comment notification email
 */
export function commentEmail(data: EmailTemplateData): { subject: string; html: string } {
  const subject = `New comment on: ${data.feedbackTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedbackFlow</h1>
    </div>
    <div class="content">
      <p>Hi${data.recipientName ? ` ${data.recipientName}` : ""},</p>
      <p><strong>${data.actorName || "Someone"}</strong> commented on feedback in <strong>${data.projectName || "your project"}</strong>:</p>

      <div class="feedback-card">
        <span class="badge badge-comment">New Comment</span>
        <h3 class="feedback-title" style="margin-top: 12px;">${data.feedbackTitle || "Feedback Item"}</h3>
        ${data.commentPreview ? `<p class="feedback-description">"${data.commentPreview}"</p>` : ""}
      </div>

      <a href="${data.feedbackUrl || data.dashboardUrl}" class="button">View Comment</a>
    </div>
    <div class="footer">
      <p>You're receiving this because you're following this feedback or it's assigned to you.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe from emails</a> | <a href="${data.dashboardUrl}">View Dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Mention notification email
 */
export function mentionEmail(data: EmailTemplateData): { subject: string; html: string } {
  const subject = `${data.actorName || "Someone"} mentioned you in: ${data.feedbackTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedbackFlow</h1>
    </div>
    <div class="content">
      <p>Hi${data.recipientName ? ` ${data.recipientName}` : ""},</p>
      <p><strong>${data.actorName || "Someone"}</strong> mentioned you in a comment:</p>

      <div class="feedback-card">
        <h3 class="feedback-title">${data.feedbackTitle || "Feedback Item"}</h3>
        ${data.commentPreview ? `<p class="feedback-description">"${data.commentPreview}"</p>` : ""}
        <p class="meta">in ${data.projectName || "your project"}</p>
      </div>

      <a href="${data.feedbackUrl || data.dashboardUrl}" class="button">View Mention</a>
    </div>
    <div class="footer">
      <p>You're receiving this because you were mentioned.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe from emails</a> | <a href="${data.dashboardUrl}">View Dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Export complete/failed notification email
 */
export function exportEmail(
  data: EmailTemplateData,
  status: "complete" | "failed"
): { subject: string; html: string } {
  const isSuccess = status === "complete";
  const subject = isSuccess
    ? `Export completed: ${data.feedbackTitle}`
    : `Export failed: ${data.feedbackTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedbackFlow</h1>
    </div>
    <div class="content">
      <p>Hi${data.recipientName ? ` ${data.recipientName}` : ""},</p>
      <p>Your export ${isSuccess ? "has completed successfully" : "failed"}:</p>

      <div class="feedback-card">
        <span class="badge" style="background-color: ${isSuccess ? "#D1FAE5" : "#FEE2E2"}; color: ${isSuccess ? "#059669" : "#DC2626"}; border: 1px solid ${isSuccess ? "#059669" : "#DC2626"};">
          ${isSuccess ? "Success" : "Failed"}
        </span>
        <h3 class="feedback-title" style="margin-top: 12px;">${data.feedbackTitle || "Feedback Export"}</h3>
        ${!isSuccess && data.feedbackDescription ? `<p class="feedback-description">Error: ${data.feedbackDescription}</p>` : ""}
      </div>

      <a href="${data.feedbackUrl || data.dashboardUrl}" class="button">View Details</a>
    </div>
    <div class="footer">
      <p>You're receiving this because you initiated this export.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe from emails</a> | <a href="${data.dashboardUrl}">View Dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Digest email (daily/weekly summary)
 */
export function digestEmail(data: DigestTemplateData): { subject: string; html: string } {
  const periodLabel = data.period === "daily" ? "Daily" : "Weekly";
  const subject = `Your ${periodLabel} FeedbackFlow Digest (${data.items.length} updates)`;

  const itemsHtml = data.items
    .map((item) => {
      const badgeClass = item.type === "new_feedback"
        ? "badge-feature"
        : item.type === "assignment"
        ? "badge-assignment"
        : "badge-comment";

      const typeLabel = {
        new_feedback: "New Feedback",
        assignment: "Assignment",
        comment: "Comment",
        mention: "Mention",
        export_complete: "Export Complete",
        export_failed: "Export Failed",
      }[item.type];

      return `
        <div class="digest-item">
          <span class="badge ${badgeClass}">${typeLabel}</span>
          <h4 style="margin: 8px 0 4px 0; font-size: 16px;">${item.title}</h4>
          ${item.body ? `<p style="margin: 0; color: #525252; font-size: 14px;">${item.body}</p>` : ""}
          ${item.projectName ? `<p class="meta">${item.projectName}</p>` : ""}
        </div>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FeedbackFlow</h1>
    </div>
    <div class="content">
      <p>Hi${data.recipientName ? ` ${data.recipientName}` : ""},</p>
      <p>Here's your <span class="highlight">${periodLabel.toLowerCase()} digest</span> with ${data.items.length} update${data.items.length === 1 ? "" : "s"}:</p>

      <div class="feedback-card">
        ${itemsHtml}
      </div>

      <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p>You're receiving this ${periodLabel.toLowerCase()} digest based on your notification preferences.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe from emails</a> | <a href="${data.dashboardUrl}">Manage Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
