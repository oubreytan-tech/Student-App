import type { SupportTicket, TicketComment, TicketStatus } from '../types';

export interface SupportTimelineEvent {
  id: string;
  status: TicketStatus;
  title: string;
  description?: string;
  timestamp: string;
  formattedTime: string;
  actor?: string;
  isCurrent: boolean;
}

export interface SupportRequestEvent {
  id: string;
  ticketId: string;
  externalTicketId?: string;
  timestamp: string;
  providerStatus?: string;
  status: TicketStatus;
  assignedTo?: string;
  assignedEmail?: string;
  supportGroup?: string;
  priorityCode?: string;
  priorityLabel?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  solution?: string;
  humanMessage?: string;
  surveyUrl?: string;
  reopenUrl?: string;
  isAutomated: boolean;
  rawSource?: string;
}

export interface RequestViewModel extends SupportTicket {
  observedTimeline: SupportTimelineEvent[];
  latestHumanMessage?: string;
  actionRequired: boolean;
  priorityCode?: string;
  priorityLabel?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Format timestamp in Africa/Johannesburg timezone for student display.
 * e.g. "16 Sep 2026, 11:35"
 */
export function formatSupportDate(isoDateString?: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  if (Number.isNaN(date.getTime())) return isoDateString;
  try {
    return new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Format relative / short time.
 * e.g. "11:35" or "16 Sep 11:35"
 */
export function formatSupportTime(isoDateString?: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  if (Number.isNaN(date.getTime())) return isoDateString;
  try {
    return new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Clean "none", "N/A", null, undefined strings into undefined
 */
export function cleanAbsentString(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (['none', 'n/a', 'null', 'undefined', '-', ''].includes(lower)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Central status normalization function.
 * Maps provider status variations and assignment presence into canonical application statuses.
 */
export function normalizeSupportStatus(rawStatus?: string, assignedTo?: string): TicketStatus {
  const statusStr = (rawStatus || '').toLowerCase().trim();
  const hasAssignee = Boolean(cleanAbsentString(assignedTo));

  // Resolved / Completed variations
  if (
    statusStr.includes('complet') ||
    statusStr.includes('resolv') ||
    statusStr.includes('fixed') ||
    statusStr.includes('solution provided')
  ) {
    return 'Resolved';
  }

  // Closed
  if (statusStr.includes('closed') || statusStr.includes('finalized')) {
    return 'Closed';
  }

  // Waiting for student / user
  if (
    statusStr.includes('wait') ||
    statusStr.includes('pending') ||
    statusStr.includes('hold') ||
    statusStr.includes('need information') ||
    statusStr.includes('more info') ||
    statusStr.includes('student respond') ||
    statusStr.includes('user respond') ||
    statusStr.includes('awaiting customer') ||
    statusStr.includes('awaiting user')
  ) {
    return 'Waiting for Student';
  }

  // In Progress variations
  if (
    statusStr.includes('in progress') ||
    statusStr.includes('work in progress') ||
    statusStr.includes('investigating') ||
    statusStr.includes('processing') ||
    statusStr.includes('under investigation')
  ) {
    return 'In Progress';
  }

  // Escalated
  if (statusStr.includes('escalat')) {
    return 'Escalated';
  }

  // Assigned / Allocated
  if (statusStr.includes('assigned') || statusStr.includes('allocated')) {
    return 'Assigned';
  }

  // New / Received variations
  if (
    statusStr.includes('new') ||
    statusStr.includes('received') ||
    statusStr.includes('logged') ||
    statusStr.includes('registered') ||
    statusStr.includes('created') ||
    statusStr.includes('open')
  ) {
    // If assignee is present even though status says "New", normalize to Assigned
    return hasAssignee ? 'Assigned' : 'Received';
  }

  // Fallback: if assignee is present, Assigned, otherwise Received
  return hasAssignee ? 'Assigned' : 'Received';
}

/**
 * Normalize priority string like "P4 - Normal" or "P5 - Low"
 */
export function normalizePriority(raw?: string): { code?: string; label: 'Low' | 'Medium' | 'High' | 'Urgent'; display: string } {
  if (!raw) return { label: 'Medium', display: 'Medium' };
  const trimmed = raw.trim();
  const codeMatch = trimmed.match(/\b(P\d)\b/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : undefined;

  const lower = trimmed.toLowerCase();
  if (lower.includes('critical') || lower.includes('urgent')) {
    return { code, label: 'Urgent', display: 'Urgent' };
  }
  if (lower.includes('high')) {
    return { code, label: 'High', display: 'High' };
  }
  if (lower.includes('normal')) {
    return { code, label: 'Medium', display: 'Normal' };
  }
  if (lower.includes('low')) {
    return { code, label: 'Low', display: 'Low' };
  }
  return { code, label: 'Medium', display: 'Medium' };
}

export interface CleanedSupportMessage {
  type: 'human' | 'system' | 'automated';
  cleanText: string;
  senderName?: string;
  senderRole?: string;
  timestamp?: string;
  detectedRequestId?: string;
  detectedAppReference?: string;
  providerStatus?: string;
  links: {
    surveyUrl?: string;
    reopenUrl?: string;
    legitimateUrls: string[];
  };
}

/**
 * Clean support message: separates legitimate human technician communication from
 * SysAid/Outlook automated templates, machine references, repeated subjects, and URLs.
 */
export function cleanSupportMessage(raw: string, ticketTitle = ''): CleanedSupportMessage {
  if (!raw || typeof raw !== 'string') {
    return {
      type: 'automated',
      cleanText: '',
      links: { legitimateUrls: [] },
    };
  }

  // 1. Separate legitimate links from SysAid system links
  const urlRegex = /(?:https?:)?\/\/[^\s>"]+/gi;
  const rawUrls = raw.match(urlRegex) || [];
  const legitimateUrls: string[] = [];
  let surveyUrl: string | undefined;
  let reopenUrl: string | undefined;

  for (const u of rawUrls) {
    const fullUrl = u.startsWith('//') ? `https:${u}` : u;
    const cleanUrl = fullUrl.replace(/>.*$/, '');
    let decoded = cleanUrl;
    try {
      decoded = decodeURIComponent(cleanUrl);
    } catch {
      // ignore
    }
    const lowerDecoded = decoded.toLowerCase();
    const lowerClean = cleanUrl.toLowerCase();
    if (lowerDecoded.includes('submitsurvey') || lowerDecoded.includes('fillsurvey')) {
      surveyUrl = cleanUrl;
    } else if (lowerDecoded.includes('reopensr') || lowerClean.includes('reopensr') || lowerDecoded.includes('reopen this service record')) {
      reopenUrl = cleanUrl;
    } else if (
      !lowerClean.includes('sysaidit.com') &&
      !lowerClean.includes('sysaid.com') &&
      !lowerClean.includes('univen-logo') &&
      !lowerClean.match(/\.(png|jpg|jpeg|gif|svg)$/i)
    ) {
      legitimateUrls.push(cleanUrl);
    }
  }

  const bracketSurvey = raw.match(/(?:Fill survey|submitSurvey)[^<]*<([^>]+)>/i);
  if (bracketSurvey) surveyUrl = bracketSurvey[1];
  const bracketReopen = raw.match(/(?:Reopen SR|reopen this service record)[^<]*<([^>]+)>/i);
  if (bracketReopen) reopenUrl = bracketReopen[1];

  // 2. Identify template boundary
  // Any occurrence of:
  // - //...sysaidit.com or https://...sysaidit.com
  // - Service Desk Notification
  // - Here are the details regarding
  // - you submitted / You submitted
  // - [APP-2026-...]
  // - -----Original Message----- / From: ... Sent: ...
  // - Reopen SR / reopen this service record
  const templateBoundaryRegex = /(?:(?:https?:)?\/\/[^\s>]*sysaidit\.com|<https?:\/\/[^>]*sysaidit\.com|Service Desk Notification|Here are the details regarding|you submitted|You submitted|\[APP-\d{4}-[0-9a-f-]{36}\]|-----Original Message-----|From:\s+[\s\S]*?Sent:|Click here if you would like to reopen|Reopen SR)/i;

  const match = raw.match(templateBoundaryRegex);
  let humanCandidate = '';

  if (match && match.index !== undefined && match.index > 0) {
    const candidate = raw.slice(0, match.index).trim();
    // If the candidate before template is only a logo or empty, ignore it
    const candidateWithoutLogo = candidate.replace(/\[https?:\/\/[^\]]+\]/gi, '').trim();
    if (candidateWithoutLogo.length > 0) {
      humanCandidate = candidate;
    }
  } else if (!match) {
    humanCandidate = raw.trim();
  }

  // Check if technician note was placed after the template (e.g. after Help Desk Software by SysAid or under ICT Support)
  if (!humanCandidate) {
    const noteMatch = raw.match(/ICT Support\s*\n+none\s*\n+([^\n\r]+)/i);
    if (noteMatch && !noteMatch[1].toLowerCase().includes('sysaidit.com') && !noteMatch[1].toLowerCase().includes('univen-logo')) {
      humanCandidate = noteMatch[1].trim();
    } else if (raw.includes('Help Desk Software by SysAid')) {
      const parts = raw.split(/Help Desk Software by SysAid[^\n\r]*/i);
      for (let i = 1; i < parts.length; i++) {
        const seg = parts[i];
        const segMatch = seg.match(/ICT Support\s*\n+none\s*\n+([^\n\r]+)/i);
        if (segMatch && !segMatch[1].toLowerCase().includes('sysaidit.com') && !segMatch[1].toLowerCase().includes('univen-logo')) {
          humanCandidate = segMatch[1].trim();
          break;
        }
        const cleanedSeg = seg.replace(/\[https?:\/\/[^\]]+\]/gi, '').trim();
        if (cleanedSeg && !cleanedSeg.toLowerCase().includes('sysaidit.com') && cleanedSeg.length > 3) {
          humanCandidate = cleanedSeg;
          break;
        }
      }
    }
  }

  // 3. Clean up human candidate
  let cleaned = humanCandidate
    .replace(/^ICT Support\s*\n+none\s*/gi, '')
    .replace(/\[APP-\d{4}-[0-9a-f-]{36}\]/gi, '')
    .replace(/\bAPP-\d{4}-[0-9a-f-]{36}\b/gi, '')
    .replace(/(?:https?:)?\/\/[^\s>]*sysaidit\.com\S*/gi, '')
    .replace(/<https?:\/\/[^>]+>/gi, '')
    .replace(/you submitted/gi, '')
    .replace(/Service Desk Notification/gi, '')
    .replace(/Help Desk Software by SysAid/gi, '')
    .replace(/\[https?:\/\/[^\]]+\]/gi, '');

  // Remove repeated ticket title
  if (ticketTitle && ticketTitle.trim()) {
    const escaped = ticketTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped, 'gi'), '');
  }

  // Remove quoted thread headers
  cleaned = cleaned.replace(/(?:-----Original Message-----|On\s+.+wrote:|From:\s+[\s\S]*?Sent:)[\s\S]*/gi, '');

  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(line => {
    if (!line) return false;
    const lower = line.toLowerCase();
    if (lower === 'none' || lower === 'ict support' || lower === 'description') return false;
    if (/^\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}/i.test(lower)) return false;
    if (lower.startsWith('admin group') || lower.startsWith('assigned to') || lower.startsWith('request user')) return false;
    if (lower.startsWith('request time') || lower.startsWith('submit user') || lower.startsWith('urgency')) return false;
    if (lower.startsWith('category') || lower.startsWith('sub category') || lower.startsWith('status') || lower.startsWith('priority')) return false;
    if (lower.startsWith('solution') || lower.startsWith('the user was assisted') || lower.startsWith('please fill out this survey') || lower.startsWith('fill survey')) return false;
    if (lower.includes('reopen this service record') || lower.includes('reopen sr') || lower.startsWith('click here')) return false;
    return true;
  });

  const resultText = lines.join('\n').trim();
  const isHuman = resultText.length >= 2 && !resultText.toLowerCase().includes('sysaidit.com');

  return {
    type: isHuman ? 'human' : 'automated',
    cleanText: isHuman ? resultText : '',
    links: {
      surveyUrl,
      reopenUrl,
      legitimateUrls,
    },
  };
}

export function extractHumanReply(body: string, ticketTitle = ''): string | undefined {
  const cleaned = cleanSupportMessage(body, ticketTitle);
  return cleaned.type === 'human' && cleaned.cleanText ? cleaned.cleanText : undefined;
}

/**
 * Parse an email into a structured SupportRequestEvent.
 */
export function parseServiceDeskEmail(
  body: string,
  subject = '',
  timestamp = new Date().toISOString(),
  messageId = `msg-${Date.now()}`
): SupportRequestEvent {
  const combined = `${subject}\n${body}`;

  // Extract Request/Incident ID (e.g. Incident #32857 or Request #32857)
  const idMatch =
    combined.match(/(?:Incident|Ticket|Call|Case|Request|Ref(?:erence)?)\s*(?:Number|No\.?|#|ID|ref)\s*[:\s#]*([A-Za-z0-9,\-_/]{3,25})/i) ||
    combined.match(/(?:Incident|Ticket|Call|Case|Request|Ref(?:erence)?)\s*[:#]\s*([A-Za-z0-9,\-_/]{3,25})/i) ||
    combined.match(/(?:Incident|Ticket|Call|Case|Request|Ref(?:erence)?)\s+([0-9]{4,10})/i) ||
    combined.match(/\b((?:INC|REQ|TKT|CAS|CALL|HD|SD|IT)[-_]?[0-9]{4,10})\b/i) ||
    combined.match(/#([0-9]{4,10})\b/);

  let externalTicketId: string | undefined;
  if (idMatch) {
    const cleanId = idMatch[1].replace(/^[#:]+/, '').replace(/,/g, '').trim();
    if (/request/i.test(idMatch[0])) {
      externalTicketId = `Request #${cleanId.replace(/^#/, '')}`;
    } else {
      externalTicketId = /^incident/i.test(cleanId) ? cleanId : `Incident #${cleanId.replace(/^#/, '')}`;
    }
  }

  // App reference (e.g. APP-2026-e7850a5b-cdcd-4089-9cbf-05152f53bda6)
  const appRefMatch = combined.match(/\b(APP-\d{4}-[0-9a-f-]{36})\b/i);
  const ticketId = appRefMatch ? appRefMatch[1] : '';

  // Assigned specialist
  const assignedMatch = combined.match(
    /(?:Assigned\s*to|Technician|Consultant|Agent|Owner|Resolver)\s*[:\s-]\s*([A-Za-z0-9,.\s@-]+?)(?=\s+(?:Priority|Status|Urgency|Department|Admin|Date|Request)|\n|\r|$)/i
  );
  let assignedTo: string | undefined;
  let assignedEmail: string | undefined;
  if (assignedMatch && cleanAbsentString(assignedMatch[1])) {
    const rawVal = assignedMatch[1].trim();
    const emailMatch = rawVal.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) assignedEmail = emailMatch[1];

    const rawName = rawVal.split('-')[0].trim();
    const commaParts = rawName.split(',').map(s => s.trim());
    if (commaParts.length === 2 && commaParts[0] && commaParts[1]) {
      assignedTo = `${commaParts[1]} ${commaParts[0]}`;
    } else {
      assignedTo = rawName;
    }
    assignedTo = cleanAbsentString(assignedTo);
  }

  // Admin group / Support department
  const adminMatch = combined.match(
    /(?:Admin\s*group|Department|Assigned\s*group|Support\s*group|Queue|Team)\s*[:\s-]\s*([A-Za-z0-9\s/&-]+?)(?=\s+(?:Status|Assigned|Priority|Urgency|Date|Time)|\n|\r|$)/i
  );
  const supportGroup = adminMatch ? cleanAbsentString(adminMatch[1]) : undefined;

  // Raw status
  const changeMatch = combined.match(/(?:has been )?changed to\s+([A-Za-z\s-]+?)(?=\.|\n|\r|$)/i);
  const statusMatch = changeMatch || combined.match(
    /(?:Status|State)\s*[:\s-]\s*([^\n\r\t]+?)(?=\s+(?:Priority|Urgency|Severity|Admin|Assigned|Category|Date|Time|Solution)|\n|\r|$)/i
  );
  const providerStatus = statusMatch ? statusMatch[1].trim() : undefined;
  const status = normalizeSupportStatus(providerStatus, assignedTo);

  // Priority
  const priorityMatch = combined.match(/(?:Priority|Urgency|Severity)\s*[:\s-]\s*(?:P\d\s*[-:]\s*)?(Low|Medium|High|Urgent|Critical|Normal)/i);
  const rawPriority = priorityMatch ? priorityMatch[0] : undefined;
  const priorityParsed = normalizePriority(rawPriority);

  // Category
  const catMatch = combined.match(/Category\s*[:\s-]\s*([A-Za-z0-9\s/&-]+?)(?=\s+(?:Sub category|Urgency|Status|\n|\r|$))/i);
  const category = catMatch ? cleanAbsentString(catMatch[1]) : undefined;

  const subCatMatch = combined.match(/Sub category\s*[:\s-]\s*([A-Za-z0-9\s/&-]+?)(?=\s+(?:Description|Urgency|Status|\n|\r|$))/i);
  const subcategory = subCatMatch ? cleanAbsentString(subCatMatch[1]) : undefined;

  // Solution
  let solution: string | undefined;
  const solMatch = body.match(/Solution\s*\n+([\s\S]+?)(?=(?:Please fill out this Survey|How would you rate|Fill survey|Click here|Help Desk Software|$))/i);
  if (solMatch && solMatch[1].trim()) {
    solution = cleanAbsentString(solMatch[1].trim());
  }

  // Survey URL
  const surveyMatch = body.match(/(?:Fill survey|submitSurvey)[^<]*<(https:\/\/[^>]+)>/i);
  const surveyUrl = surveyMatch ? surveyMatch[1] : undefined;

  // Reopen URL
  const reopenMatch = body.match(/(?:Reopen SR|reopen this service record)[^<]*<(https:\/\/[^>]+)>/i);
  const reopenUrl = reopenMatch ? reopenMatch[1] : undefined;

  // Human message
  const humanMessage = extractHumanReply(body);

  const isAutomated = Boolean(
    combined.includes('Service Desk Notification') ||
    combined.includes('Help Desk Software by SysAid') ||
    combined.includes('Here are the details regarding')
  );

  return {
    id: messageId,
    ticketId,
    externalTicketId,
    timestamp,
    providerStatus,
    status,
    assignedTo,
    assignedEmail,
    supportGroup,
    priorityCode: priorityParsed.code,
    priorityLabel: priorityParsed.display,
    category,
    subcategory,
    solution,
    humanMessage,
    surveyUrl,
    reopenUrl,
    isAutomated,
    rawSource: body,
  };
}

/**
 * Aggregates chronological support events into a single, cohesive RequestViewModel.
 * Ensures the newest valid event defines the current state without regressing.
 */
export function aggregateRequestEvents(
  initialTicket: SupportTicket,
  events: SupportRequestEvent[]
): RequestViewModel {
  // 1. Sort events chronologically by timestamp ascending
  const sorted = [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  // 2. Initialize accumulator with base ticket properties
  let currentStatus: TicketStatus = initialTicket.status || 'Submitted';
  let currentExternalId = initialTicket.externalTicketId;
  let currentAssignedTo = cleanAbsentString(initialTicket.assignedTo);
  let currentDepartment = cleanAbsentString(initialTicket.assignedDepartment);
  let currentPriority: 'Low' | 'Medium' | 'High' | 'Urgent' = initialTicket.priority || 'Medium';
  let currentPriorityCode: string | undefined;
  let currentPriorityLabel: string = initialTicket.priority || 'Medium';
  let currentSolution = initialTicket.solution;
  let currentSurveyUrl = initialTicket.surveyUrl;
  let currentReopenUrl = initialTicket.reopenUrl;
  let latestHumanMsg: string | undefined;
  let latestUpdateIso = initialTicket.createdAt;

  // 3. Observed timeline stages tracking (Submitted is always stage 0)
  const observedMap = new Map<TicketStatus, { timestamp: string; label: string; description?: string; actor?: string }>();
  observedMap.set('Submitted', {
    timestamp: initialTicket.createdAt,
    label: 'Request Submitted',
    description: 'Your request was successfully submitted by you.',
  });

  // Track comments list
  const comments: TicketComment[] = [...(initialTicket.comments || [])];
  const existingCommentIds = new Set(comments.map(c => c.id));

  // 4. Replay sorted events in chronological order
  for (const event of sorted) {
    if (event.timestamp) {
      latestUpdateIso = event.timestamp;
    }

    if (event.externalTicketId) {
      currentExternalId = event.externalTicketId;
    }
    if (event.assignedTo) {
      currentAssignedTo = event.assignedTo;
    }
    if (event.supportGroup) {
      currentDepartment = event.supportGroup;
    }
    if (event.priorityCode) {
      currentPriorityCode = event.priorityCode;
    }
    if (event.priorityLabel) {
      currentPriorityLabel = event.priorityLabel;
      const prio = normalizePriority(event.priorityLabel);
      currentPriority = prio.label;
    }
    if (event.solution) {
      currentSolution = event.solution;
    }
    if (event.surveyUrl) {
      currentSurveyUrl = event.surveyUrl;
    }
    if (event.reopenUrl) {
      currentReopenUrl = event.reopenUrl;
    }

    // Determine status progression:
    // Once resolved/completed, an older or non-completion event must not regress the status
    if (event.status) {
      const isCurrentResolved = currentStatus === 'Resolved' || currentStatus === 'Closed';
      const isEventResolved = event.status === 'Resolved' || event.status === 'Closed';
      if (!isCurrentResolved || isEventResolved) {
        currentStatus = event.status;
      }
    }

    // Record observed timeline stage
    if (currentStatus === 'Received' && !observedMap.has('Received')) {
      observedMap.set('Received', {
        timestamp: event.timestamp,
        label: 'Request Received',
        description: 'ICT Support acknowledged and logged your ticket.',
        actor: currentDepartment || 'ICT Services',
      });
    } else if (currentStatus === 'Assigned' && !observedMap.has('Assigned')) {
      observedMap.set('Assigned', {
        timestamp: event.timestamp,
        label: currentAssignedTo ? `Assigned to ${currentAssignedTo}` : 'Assigned to ICT Support',
        description: currentAssignedTo ? `Assigned to ${currentAssignedTo}.` : 'Assigned to ICT specialist team.',
        actor: currentAssignedTo || 'ICT Support',
      });
    } else if (currentStatus === 'In Progress' && !observedMap.has('In Progress')) {
      observedMap.set('In Progress', {
        timestamp: event.timestamp,
        label: 'In Progress',
        description: 'ICT Support is actively investigating and working on your issue.',
        actor: currentAssignedTo || 'ICT Support',
      });
    } else if (currentStatus === 'Waiting for Student' && !observedMap.has('Waiting for Student')) {
      observedMap.set('Waiting for Student', {
        timestamp: event.timestamp,
        label: 'Waiting for Your Response',
        description: 'ICT Support is awaiting additional details or verification from you.',
        actor: currentAssignedTo || 'ICT Support',
      });
    } else if ((currentStatus === 'Resolved' || currentStatus === 'Closed') && !observedMap.has('Resolved')) {
      observedMap.set('Resolved', {
        timestamp: event.timestamp,
        label: 'Request Completed',
        description: currentSolution ? `Resolved: ${currentSolution}` : 'Support call completed.',
        actor: currentAssignedTo || 'ICT Support',
      });
    }

    // Add human technician message to conversation if present
    if (event.humanMessage) {
      latestHumanMsg = event.humanMessage;
      const commentId = `human-${event.id}`;
      if (!existingCommentIds.has(commentId)) {
        existingCommentIds.add(commentId);
        comments.push({
          id: commentId,
          sender: 'technician',
          senderName: currentAssignedTo || 'ICT Support',
          senderRole: currentDepartment || 'ICT Support',
          text: event.humanMessage,
          timestamp: event.timestamp,
        });
      }
    }

    // Add concise system event into comments if it changed state meaningfully
    if (event.isAutomated) {
      let eventText: string | undefined;
      if (event.status === 'Resolved' || event.status === 'Closed') {
        eventText = currentSolution
          ? `✅ Request completed. Solution: ${currentSolution}`
          : `✅ Request completed by ICT Support.`;
      } else if (event.status === 'Assigned' && event.assignedTo) {
        eventText = `👷 Assigned to ${event.assignedTo}`;
      } else if (event.status === 'Received') {
        eventText = `📨 ICT Support received your request${currentExternalId ? ` (${currentExternalId})` : ''}`;
      } else if (event.status === 'Waiting for Student') {
        eventText = `⏳ ICT Support requested more information from you`;
      } else if (event.status === 'In Progress') {
        eventText = `🔧 ICT Support is working on your request`;
      }

      const systemCommentId = `system-${event.id}`;
      if (eventText && !existingCommentIds.has(systemCommentId)) {
        existingCommentIds.add(systemCommentId);
        comments.push({
          id: systemCommentId,
          sender: 'system',
          senderName: 'ICT System',
          senderRole: 'Automated Update',
          text: eventText,
          timestamp: event.timestamp,
        });
      }
    }
  }

  // Deduplicate and sort comments chronologically
  comments.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  // Build the observed timeline array in natural lifecycle order
  const naturalOrder: TicketStatus[] = [
    'Submitted',
    'Received',
    'Assigned',
    'In Progress',
    'Waiting for Student',
    'Escalated',
    'Resolved',
    'Closed',
  ];

  const observedTimeline: SupportTimelineEvent[] = [];
  for (const st of naturalOrder) {
    const item = observedMap.get(st);
    if (item) {
      const isCurrent = currentStatus === st || (st === 'Resolved' && currentStatus === 'Closed');
      observedTimeline.push({
        id: `stage-${st}`,
        status: st,
        title: item.label,
        description: item.description,
        timestamp: item.timestamp,
        formattedTime: formatSupportTime(item.timestamp),
        actor: item.actor,
        isCurrent,
      });
    }
  }

  // If the latest status hasn't been added to timeline, append it
  if (!observedTimeline.some(t => t.status === currentStatus)) {
    observedTimeline.push({
      id: `stage-${currentStatus}`,
      status: currentStatus,
      title: currentStatus,
      timestamp: latestUpdateIso,
      formattedTime: formatSupportTime(latestUpdateIso),
      isCurrent: true,
    });
  }

  // Ensure current flag is set on the last active stage
  const lastIndex = observedTimeline.length - 1;
  observedTimeline.forEach((t, i) => {
    t.isCurrent = i === lastIndex;
  });

  return {
    ...initialTicket,
    status: currentStatus,
    externalTicketId: currentExternalId,
    assignedTo: currentAssignedTo,
    assignedDepartment: currentDepartment,
    priority: currentPriority,
    priorityCode: currentPriorityCode,
    priorityLabel: currentPriorityLabel,
    solution: currentSolution,
    surveyUrl: currentSurveyUrl,
    reopenUrl: currentReopenUrl,
    comments,
    updatedAt: latestUpdateIso,
    observedTimeline,
    latestHumanMessage: latestHumanMsg,
    actionRequired: currentStatus === 'Waiting for Student',
    formattedCreatedAt: formatSupportDate(initialTicket.createdAt),
    formattedUpdatedAt: formatSupportDate(latestUpdateIso),
  };
}

/**
 * Normalizes an existing SupportTicket, inspecting its comments and metadata to rebuild
 * the authoritative RequestViewModel, stripping raw SysAid emails and reconstructing
 * observed events, clean conversation, and current status.
 */
export function normalizeTicket(ticket: SupportTicket): RequestViewModel {
  const events: SupportRequestEvent[] = [];
  const cleanComments: TicketComment[] = [];

  for (const comment of ticket.comments || []) {
    // If it's from a student, keep it as a clean student comment
    if (comment.sender === 'student') {
      cleanComments.push(comment);
      continue;
    }

    // For technician/system comments, run through cleanSupportMessage
    const cleaned = cleanSupportMessage(comment.text, ticket.title);
    const hasSysAidMarker =
      comment.text.includes('sysaidit.com') ||
      comment.text.includes('Service Desk Notification') ||
      comment.text.includes('Help Desk Software by SysAid') ||
      comment.text.includes('Here are the details regarding') ||
      comment.text.includes('Admin group') ||
      comment.text.includes('you submitted');

    if (hasSysAidMarker) {
      const parsedEvent = parseServiceDeskEmail(comment.text, '', comment.timestamp, comment.id);
      if (!parsedEvent.assignedTo && comment.senderName && comment.senderName !== 'ICT Support') {
        parsedEvent.assignedTo = comment.senderName;
      }
      if (!parsedEvent.supportGroup && comment.senderRole) {
        parsedEvent.supportGroup = comment.senderRole;
      }
      events.push(parsedEvent);
    } else if (cleaned.type === 'human' && cleaned.cleanText) {
      cleanComments.push({
        ...comment,
        text: cleaned.cleanText,
      });
    } else if (comment.sender === 'system') {
      cleanComments.push(comment);
    }
  }

  if (events.length === 0) {
    events.push({
      id: `prop-${ticket.id}`,
      ticketId: ticket.id,
      externalTicketId: ticket.externalTicketId,
      timestamp: ticket.updatedAt || ticket.createdAt,
      status: ticket.status || 'Submitted',
      assignedTo: cleanAbsentString(ticket.assignedTo),
      supportGroup: cleanAbsentString(ticket.assignedDepartment),
      priorityLabel: ticket.priority,
      solution: ticket.solution,
      surveyUrl: ticket.surveyUrl,
      reopenUrl: ticket.reopenUrl,
      isAutomated: false,
    });
  }

  const baseTicket: SupportTicket = {
    ...ticket,
    comments: cleanComments,
  };

  return aggregateRequestEvents(baseTicket, events);
}

