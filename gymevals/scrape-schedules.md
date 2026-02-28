The agent needs to do these four things:
- Verify gym address
- Scrape the gym schedule
- Process the gym schedule
- Return the gym schedule

# Verify gym address
**Goal**

Navigate to a gym website and validate the address matches our records.

---

**Inputs**

- URL: {{.url}}
- Venue name: {{.venue_name}}
- Venue address on our records: {{.address}}
- \[Optional\] Previous execution notes: {{.previous_execution_notes}}

---

**Steps**

 1. If previous execution notes are provided, check for any tips to speed up your task
 2. Navigate to the input URL:
    - If the URL returns 404 or "page not found" handoff to failure with label: `website_not_found`
    - If the website domain exists but is unreachable, handoff to failure with label `website_unavailable`
 3. Find the venue's street address on the website. If not immediately visible, check, in order:
    - page footer
    - schema.org data (via evaluate_javascript)
    - contact or about page, as a last resort
 4. Never use external sources (such as Google, Facebook, or Yelp) to find the address
 5. If no address exists on the site, handoff to failure with label `address_not_found`
 6. If the venue has permanently closed, handoff to failure with label `venue_permanently_closed`
 7. Compare to our records using lenient matching rules (see below)
 8. Record the verified venue address to scratchpad
 9. If the site was complex (e.g. iframe navigation, tricky address location, challenging cookie dismissal) record execution notes to scratchpad, keeping them under 400 characters. Describe the site structure, not click-by-click steps. Skip this step for straightforward sites.
10. Handoff execution
    - If the address matches handoff to Scrape gym schedule and pass the address as you found it on the website as an output variable called `verified_venue_address`. **Not passing it will cause a catastrophic failure.**
    - If the address doesn't match, handoff to output with label `address_mismatch`

---

**Address lenient matching rules**

- Abbreviations, formatting, punctuation, and capitalization differences are a match (e.g. St/Street, Ste/Suite, etc.)

- A vague address on our records (e.g. city + ZIP only) matches if the listed address is in that area

- When in doubt, match: a false match is less harmful than a false reject

- Only reject if the street name, number, or city is **clearly** different

# Scrape gym schedule
**Goal**

Scrape the class schedule from the gym website.

---

**Inputs**

- URL: {{.url}}
- \[Optional\] Schedule URL hint: {{.schedule_url}}
- \[Optional\] Previous execution notes: {{.previous_execution_notes}}

---

**Steps**

 1. If previous execution notes are provided, check for any tips to speed up your task
 2. Verify that the execution data you received contains a verified address for the venue. If not, check the scratchpad
 3. Navigate to the schedule URL hint if provided, otherwise to the venue URL if you're not there already
 4. Find the class schedule on the website. It may be in an iframe, loaded dynamically, or in a static image/PDF — use all available tools to locate it
 5. Use `get_datetime` to get today's date in the venue's timezone
 6. Extract all classes for the next 7–14 days starting from today, according to the scraping rules below
 7. Record the scraped schedule to scratchpad:
    - Do not omit or alter any information from the website.
    - Format the schedule as a list, with each entry as: \
      `* Class: [name]. Date: [full_date_iso_8601_with_timezone_offset]. Time: [time]. Duration: [duration_in_mins]. Is recurring: [true/false]. Recurrence days: [recurrence_days]. Instructor: [instructor_name]. Description: [description].`
    - Use `not shown` for details that are not listed
 8. If the site was complex (e.g. iframe navigation, tricky address location, challenging cookie dismissal) record execution notes to scratchpad, keeping them under 400 characters. Describe the site structure, not click-by-click steps. Skip this step for straightforward sites
 9. If you found the schedule to be on a different URL than the ones provided in input, record it to scratchpad as "schedule URL: ..."
10. If successful, handoff to "Process gym schedule" and
    - Pass the schedule as an output variable called `scraped_schedule` in the `handoff_execution` tool. **Not passing it will cause a catastrophic failure.** Use a single string to represent the whole list.
11. Otherwise, handoff to output with the appropriate label from:
    - `no_schedules_available` — schedule not found anywhere on site
    - `requires_authentication` — schedule is behind a login wall
    - `virtual_only` — only virtual/online classes available
    - `schedule_not_visible` — schedule exists but is unreadable even visually
    - `file_parse_error` — schedule is in a PDF/file that can't be read

---

**Schedule scraping rules**

- Aim for 14 days. If the widget supports navigating to a second week, do so. 7 days is acceptable if more isn't available
- If the venue has multiple locations, only extract classes for the input address
- Weekly calendar widgets often require clicking each day to load its classes — don't assume the initial view shows the full week
- If the schedule is in an image, read it visually via screenshot. If in a PDF or file, navigate to/download it and read the content
- If the calendar shows day names without dates (e.g. "Monday" not "Monday 9th"), map them using today's date
- If the calendar view shows a week starting before today, discard all entries before today

# Process gym schedule
**Goal**

Process the class schedule from the gym website and prepare it for output.

---

**Inputs**

- Existing class names (JSON array): {{.existing_class_names}}
- Existing instructor names (JSON array): {{.existing_instructor_names}}

---

**Steps**

1. Ensure you've received the scraped gym schedule as part of the execution data. If not, check the scratchpad
2. Identify which schedule entries to keep and which to exclude according to the class exclusion rules below
3. Establish whether there are classes spanning at least 7 days that pass the exclusion step. If they span 6 or less, handoff to failure with label `insufficient_days`
4. Compare the scraped schedule with the one on our record and identify class and instructor matches according to the name matching rules below
5. Record the processed class names, instructor names, and schedules to scratchpad:
   - The class names should be a list with each entry being:\
     `* Class name: [name]. Description: [description].` Use `Description: not shown` if not listed
   - The instructor names should be a list with each entry being:\
     `* First name: [first_name]. Last name: [last_name].` If one of them is empty say `not shown`. If neither of them is available, skip the entry.
   - The scheduled classes should be a list with:\
     `* Class: [name]. Date: [full_date_iso_8601_with_timezone_offset]. Time: [time]. Duration: [duration_in_mins]. Is recurring: [true/false]. Recurrence days: [recurrence_days]. Instructor: [instructor_name]. Description: [description].` Use `not shown` for details that are not listed.
6. Handoff to the output node. If you've succeeded at your task, the output label should be `success`

---

**Class exclusion rules**

Remove classes whose names indicate they belong to any of these categories:

- Kids / youth / teen / children / juniors
- Sparring / fighting / wrestling
- Virtual / online / livestream / Zoom / Google Meet
- Free classes
- Workshops
- Personal / private training / 1:1 sessions
- Wellness / spa / massage / therapy / acupuncture / cryotherapy
- Instructor training
- Courses / sessions (unless they're clearly drop-in)
- Appointment only / RSVP required
- Team only / company / corporate
- Weapons / archery
- Exclusive membership / VIP
- Rental classes / Reiki only
- "DO NOT USE" in name
- Waitlisted classes

Apply these exclusions regardless of the language of the website. If a class name in any language indicates it belongs to an excluded category, exclude it. When a class combines an excluded and non-excluded group, exclude it (e.g. "Teen & Adult"). When in doubt, exclude.

---

**Name matching rules**

- Classes: if a scraped class name matches an existing class name entry (even with minor spelling differences), use the EXACT existing name we have on record.. Only use the website's spelling for genuinely new classes
- Instructors: if a scraped instructor matches an existing instructor name entry, use the EXACT existing name we have on record. For new instructors, use the name as shown. For single-name instructors, set first_name to that name and last name to N/A
- If no instructor is listed use empty strings "" for both instructor_first_name and instructor_last_name. An empty instructor name is perfectly valid and not a failure

# Return gym schedule
Return the gym schedule:
{
  "additionalProperties": false,
  "properties": {
    "classes": {
      "description": "All classes found on the schedule after exclusion filtering. Empty array if none listed.",
      "items": {
        "additionalProperties": false,
        "properties": {
          "description": {
            "description": "Class description. Empty string if not available.",
            "type": "string"
          },
          "name": {
            "description": "Class name as shown on the website (or matched to existing_class_names).",
            "type": "string"
          }
        },
        "required": [
          "name",
          "description"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "execution_notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "description": "Brief notes on site structure, including tips for finding the address or schedule faster if either was difficult. Null if straightforward."
    },
    "instructors": {
      "description": "Instructors found on the schedule. Empty array if none listed.",
      "items": {
        "additionalProperties": false,
        "properties": {
          "first_name": {
            "description": "Instructor first name.",
            "type": "string"
          },
          "last_name": {
            "description": "Instructor last name. 'N/A' if only one name shown.",
            "type": "string"
          }
        },
        "required": [
          "first_name",
          "last_name"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "schedule_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "description": "URL where the schedule was found. Null if not found."
    },
    "schedules": {
      "description": "Schedule entries for the next 7-14 days. Empty array if none listed.",
      "items": {
        "additionalProperties": false,
        "properties": {
          "class_name": {
            "description": "Must exactly match a name in the classes array.",
            "type": "string"
          },
          "duration_in_minutes": {
            "description": "Class duration in minutes. Default 60 if not shown.",
            "minimum": 1,
            "type": "integer"
          },
          "instructor_first_name": {
            "description": "Instructor first name, or empty string if none listed.",
            "type": "string"
          },
          "instructor_last_name": {
            "description": "Instructor last name, or empty string if none listed.",
            "type": "string"
          },
          "is_recurring": {
            "description": "Whether this class recurs weekly.",
            "type": "boolean"
          },
          "recurrence_days": {
            "anyOf": [
              {
                "items": {
                  "enum": [
                    "Mo",
                    "Tu",
                    "We",
                    "Th",
                    "Fr",
                    "Sa",
                    "Su"
                  ],
                  "type": "string"
                },
                "minItems": 1,
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "description": "Days of week this class recurs. Null if not recurring."
          },
          "start_date": {
            "description": "ISO 8601 with timezone offset, e.g. 2026-02-15T09:00:00-05:00.",
            "format": "date-time",
            "type": "string"
          }
        },
        "required": [
          "class_name",
          "instructor_first_name",
          "instructor_last_name",
          "start_date",
          "duration_in_minutes",
          "is_recurring",
          "recurrence_days"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "venue_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "description": "Full venue address as displayed on the website. Null if not found.",
      "type": "string"
    }
  },
  "required": [
    "venue_address",
    "execution_notes",
    "schedule_url",
    "classes",
    "instructors",
    "schedules"
  ],
  "type": "object"
}