export interface GymRow {
  venueId: string;
  venueName: string;
  website: string;
}

function extractDomain(url: string): string {
  const parsed = new URL(url.includes("://") ? url : `https://${url}`);
  let domain = parsed.hostname.toLowerCase();
  if (domain.startsWith("www.")) domain = domain.slice(4);
  return domain;
}

export function buildPrompt(gym: GymRow, options?: { withRadar?: boolean }): string {
  const domain = extractDomain(gym.website);

  const radarStep = options?.withRadar
    ? `

---

## Step 0: Check Radar for existing knowledge

Before visiting the website, check if Radar has any existing knowledge about this domain that could help you scrape more effectively.

1. Run this command in bash to get an overview:
   \`\`\`bash
   npx -y radar-cli context ${domain}
   \`\`\`
2. If knowledge is found, read the most relevant files (especially README, tips, gotchas, sitemap, and any flow/selectors files) using:
   \`\`\`bash
   npx -y radar-cli read ${domain} <path>
   \`\`\`
   For example: \`npx -y radar-cli read ${domain} README\`, \`npx -y radar-cli read ${domain} tips\`, etc.
3. Use any knowledge you find to inform your scraping strategy — it may contain useful information about the site's structure, schedule widget type, navigation patterns, or known gotchas.
4. If no knowledge is found, that's fine — proceed normally.
`
    : "";

  return `You are a gym schedule scraping agent. Complete all of the following steps sequentially for this gym:

Venue: ${gym.venueName}
URL: ${gym.website}
${radarStep}
---

## Step 1: Find the gym address

1. Navigate to the URL above.
   - If the URL returns 404 or "page not found", set venue_address to null and stop — return empty arrays for classes, instructors, and schedules.
   - If the website is unreachable, do the same.
2. Find the venue's street address on the website. Check in order:
   - The main page content
   - Page footer
   - Schema.org data (via JavaScript evaluation)
   - Contact or About page (last resort)
3. Never use external sources (Google, Facebook, Yelp) to find the address.
4. If no address is found on the site, set venue_address to null and continue to step 2 anyway.
5. If the venue has permanently closed, set venue_address to null and return empty arrays.

---

## Step 2: Scrape the gym schedule

1. Find the class schedule on the website. It may be in an iframe, loaded dynamically, or in a static image/PDF — use all available tools to locate it.
2. Get today's date and the venue's timezone.
3. Extract all classes for the next 7–14 days starting from today:
   - Aim for 14 days. If the widget supports navigating to a second week, do so. 7 days is acceptable if more isn't available.
   - If the venue has multiple locations, only extract classes for this venue.
   - Weekly calendar widgets often require clicking each day to load its classes — don't assume the initial view shows the full week.
   - If the schedule is in an image, read it visually via screenshot. If in a PDF or file, navigate to/download it and read the content.
   - If the calendar shows day names without dates (e.g. "Monday" not "Monday 9th"), map them using today's date.
   - If the calendar view shows a week starting before today, discard all entries before today.
4. If you found the schedule on a different URL, record it as the schedule_url.
5. If no schedule is found, return empty arrays for classes, instructors, and schedules.

---

## Step 3: Process the schedule

Apply these exclusion rules — remove classes whose names indicate they belong to any of these categories:
- Kids / youth / teen / children / juniors
- Sparring / fighting / wrestling
- Virtual / online / livestream / Zoom / Google Meet
- Free classes
- Workshops
- Personal / private training / 1:1 sessions
- Wellness / spa / massage / therapy / acupuncture / cryotherapy
- Instructor training
- Courses / sessions (unless clearly drop-in)
- Appointment only / RSVP required
- Team only / company / corporate
- Weapons / archery
- Exclusive membership / VIP
- Rental classes / Reiki only
- "DO NOT USE" in name
- Waitlisted classes

Apply exclusions regardless of website language. When a class combines excluded and non-excluded groups, exclude it (e.g. "Teen & Adult"). When in doubt, exclude.

For instructors:
- For single-name instructors, set first_name to that name and last_name to "N/A"
- If no instructor is listed, use empty strings "" for both first and last name

---

## Step 4: Return structured output

You MUST return your final answer as a single valid JSON object (no markdown fences, no extra text). The JSON must match this exact schema:

{
  "venue_address": "string or null — full venue address as displayed on the website",
  "schedule_url": "string or null — URL where schedule was found, null if same as input URL or not found",
  "classes": [
    { "name": "class name", "description": "class description, empty string if not available" }
  ],
  "instructors": [
    { "first_name": "first name", "last_name": "last name, 'N/A' if single name" }
  ],
  "schedules": [
    {
      "class_name": "must match a name in classes array",
      "start_date": "ISO 8601 with timezone offset, e.g. 2026-02-15T09:00:00-05:00",
      "duration_in_minutes": 60,
      "instructor_first_name": "first name or empty string",
      "instructor_last_name": "last name or empty string",
      "is_recurring": true,
      "recurrence_days": ["Mo", "We", "Fr"] or null
    }
  ]
}

Rules for the JSON:
- recurrence_days values must be from: Mo, Tu, We, Th, Fr, Sa, Su
- recurrence_days is null when is_recurring is false
- duration_in_minutes defaults to 60 if not shown on the website
- Use empty arrays [] for classes/instructors/schedules if none found
- Return ONLY the JSON object, nothing else`;
}
