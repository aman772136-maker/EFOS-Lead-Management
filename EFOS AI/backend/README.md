# Automated Follow-Up Engine (Module 5)

This module implements an n8n-based automated lead follow-up system that handles multi-step nurturing campaigns for new leads.

## Overview

The n8n workflow automates the entire lead nurturing process:
- Day 1: Welcome message
- Day 3: Program details (if lead is still "New" or "Contacted")
- Day 5: Success stories
- Day 7: Reminder
- Day 10: Final follow-up, auto-rejects if unresponsive

**Short-circuit Logic:** If lead status becomes "Interested" OR score > 80, immediately triggers Module 6 (counselor assignment).

## Key Features

1. **Webhook Integration** - Receives lead creation events from backend
2. **Scheduled Messages** - Sends automated follow-ups on specific days
3. **Smart Status Checking** - Dynamically adjusts based on lead status and score
4. **Auto-Reject** - Updates unresponsive leads to "Rejected" status
5. **Escalation to Counselor** - Routes qualified leads to human counselors

## n8n Workflow

See `n8n-workflow-automated-follow-up.json` for the complete importable workflow JSON.

## Backend API Integration

### Lead Creation Webhook (POST /api/leads)

```javascript
// When a lead is created, the backend automatically calls n8n webhook:
{
  "event": "lead.created",
  "lead": { /* lead data */ }
}
```

### Generate Message (GET /api/leads/:id/generate-message)

```javascript
// Creates personalized messages using OpenAI
GET /api/leads/123/generate-message?channel=whatsapp
```

### Update Status (PUT /api/leads/:id)

```javascript
// Used for auto-rejecting unresponsive leads
PUT /api/leads/123

{
  "status": "Rejected"
}
```

### Get Lead Details (GET /api/leads/:id)

```javascript
// Used to check current status during workflow
GET /api/leads/123
```

## Workflow Nodes

1. **Webhook Trigger** - Listens for lead.created events
2. **Set Workflow Data** - Prepares lead data and schedules
3. **Wait Until Day 1** - Delays welcome message
4. **Generate Welcome Message** - Calls message generator API
5. **Wait Until Day 3** - Delays program details
6. **Check Lead Status Day 3** - Verifies if lead is still active
7. **Check Status Day 3** - Decides whether to continue
8. **Generate Program Details** - Creates detailed info message
9. **Wait Until Day 5** - Delays success stories
10. **Send Success Stories** - Sends social proof message
11. **Wait Until Day 7** - Delays reminder
12. **Send Reminder** - Sends follow-up reminder
13. **Wait Until Day 10** - Delays final follow-up
14. **Final Follow-Up** - Sends last message
15. **Check Lead Status Day 10** - Last status verification
16. **Check Status Day 10** - Decides on rejection
17. **Update Lead Status to Rejected** - Auto-rejects if needed
18. **If Status Interested or Score > 80** - Routes qualified leads
19. **Module 6 - Counselor Assignment** - Escalates to human counselors
20. **Success** - Workflow completion handler
21. **Error Handler** - Catches failures
22. **Error Response** - Returns webhook error response

## Testing

To test the workflow locally:

1. Start the backend server
2. Import the `n8n-workflow-automated-follow-up.json` file into n8n
3. Ensure the n8n webhook URL is configured in the backend environment:

```env
N8N_WEBHOOK_URL=https://safescript.app.n8n.cloud/webhook-test/c65f8ea8-c700-4c97-8477-0a5eb3fdf89a
```

4. Create a test lead via the API
5. Monitor the n8n workflow execution logs

## Dependencies

- n8n (nodes: webhookTrigger, httpRequest, waitUntil, if, merge, function, endWorkflow, errorTrigger, respondToWebhook)
- Backend Node.js server with Express
- MongoDB for lead storage
- OpenAI API for message generation

## Configuration

For production deployment, configure these environment variables:

```env
N8N_WEBHOOK_URL=<your-n8n-webhook-url>
PORT=5000
OPENAI_API_KEY=<your-openai-key>
FRONTEND_URL=<your-frontend-url>
```
