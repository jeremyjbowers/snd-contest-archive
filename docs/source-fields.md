# Source fields for the archive

A field menu for the frontend. It lists the columns that exist in the contest sources, the kind of value that shows up in each one, and which of those values already land on an archive entry.

Read from the Airtable bases on October 30, 2026 (Eastern). Counts below are from that read. Choice lists in Airtable can grow; the shapes will not.

The three bases:

- [SND Results](https://airtable.com/app8n3TfYp3wHG3Ht) — 2024 and 2025 results, plus judging math
- [Digital results](https://airtable.com/app90oaiea9w9Ifs0) — digital winners from 2010 through 2023, the historical Archive, and World's Best
- [Best of Print News Design](https://airtable.com/appiN89fFgbchQOjp) — print winners from SND42–SND46 (2020–2024), plus committee and judge rosters

Award Force is the fourth source. The 2024 and 2025 workbooks are not in the repo. The columns below are the ones the loader was written to read, including the contact columns it drops before anything is stored.

Contest number N is the season year 1978 + N. SND47 is 2025. SND42 is 2020. The digital year tables are labeled with the publication year itself (`2018`, `Work published in`).

## What an entry can show today

The page reads one `Entry`. Anything else needs a catalog change before it can appear in the UI.

| On the entry | Kind of value | Where it comes from |
| --- | --- | --- |
| Title | Short headline, sometimes a person's name on a portfolio | `Name`, `Headline`, or `Entry` |
| Publication | Newsroom or brand name | `Publication`, falling back to `Company Publication` |
| Year | Four-digit season | Table name, `Work published in`, or Award Force `Season` |
| Award | One flag: World's Best, Best in Show, Gold, Silver, Bronze, Award of Excellence, Judge's Special Recognition | `Award`, with `Tags` as a fallback |
| Awards | Every honor on the row, strongest first | Same cells, when a row carries more than one |
| Category | Subject, code stripped: "Sports", "Arts & Entertainment" | `Parent category` / `Category` / `General Category Name` |
| Subcategory | Format, when the sheet has one: "Single page", "Single URL" | `Subcategory`, or a format phrase inside the category |
| Discipline | One of six archive buckets: News design, Infographics, Art direction, Illustration & animation, Product design, Video | Derived from the category section, not a source column |
| Platform | Print, Digital, Social, Multiplatform, or Other | `Platform`, with `Platform - all` and print/digital table defaults |
| Topic | Usually the same words as category | Derived |
| Description | Entrant text, or the citation when there is no entrant text | Award Force `Descrip`, else the citation |
| Citation | Judges' prose | `Medal Notes`, `Judges Comments`, `Citation`, Award Force `World's Best description` |
| URL | One public link | The first URL-shaped column |
| Images | Work previews, served from the archive | `Attachment` or `Screenshots` |
| Credits | Name and role pairs | `Credits`, or a single `First Name` + `Last Name` on older digital rows |
| Student / non-editorial | Booleans | Derived from the category section. Award Force also has `Student or school publication` |
| Multiple awards | Boolean | More than one honor on the row |

The loader also keeps a few values on the submission that the page does not read yet: company name (separate from publication), country, organization size, emerging-designer flag, contest name (`SND47`), and the entry's status in Award Force.

## Fields worth designing against

These are the columns with real display value that the page does not treat as their own field.

### Publication and company are two names

SND47 has both `Publication` and `Company Publication`. On 1,622 rows where both are filled, 178 disagree.

| Company Publication | Publication |
| --- | --- |
| Barron's | Barron's |
| The New York Times | The New York Times Opinion |
| The New York Times | The New York Times |
| Reuters | Reuters |

Both are a single newsroom or desk name. `Company Publication` is the organization. `Publication` is the masthead or desk the work ran under. Older print tables use the same pair from SND43 on. Digital tables before 2022 have only `Publication`.

### Publication size

SND47 only. A single select:

`Micro`, `Small`, `Medium`, `Large`, `NA`

This is the Best in Show size class. The same idea shows up as two nomination checkboxes, `BIS micro/small nominated` and `BIS medium/large nominated`.

### Category is a stack, and the stack changes every few years

A 2025 row carries three related labels:

| Column | Example | What it is |
| --- | --- | --- |
| Parent category | `6. Print-specific Platforms` | Section. Eleven sections in 2025, listed below |
| Category | `6a. Newspaper: Front Page` | Subject. 128 choices in 2025. The code after the dot is the topic |
| Subcategory | `6a. Print: Single page` | Format. 307 choices in 2025. The words after the code are the format |

2025 parent categories:

1. Story Page Design
2. Infographics
3. Line of Coverage
4. Illustration
5. Use of Multimedia and Design Elements
6. Print-specific Platforms
7. News Product
8. Non-Editorial
9. Student Work
10. Portfolios
11. World's Best Designed

The subject list repeats inside each section (`1a. Breaking News`, `2a. Breaking News`). Subjects include Breaking News, International, Politics & Elections, Business, Economy & Technology, Local & Regional, Climate & Environment, Health & Science, Social Issues, Sports, Investigative, National, Opinion, Arts & Entertainment, Lifestyle, and portfolio classes such as `10c. Individual: Infographics Portfolio`.

The format list is a code plus one of: `Print: Single page`, `Print: Multiple pages`, `Digital: Single URL`, `Digital: Multiple URLs`, `Social: Single URL`, `Social: Multiple URLs`, `Multiplatform`, `In-house: Single illustration`, `Commissioned: Multiple illustrations`, and the same idea under other section numbers.

Older years use different words for the same two ideas:

| Era | Subject-like column | Format-like column | Example |
| --- | --- | --- | --- |
| 2010–2016 digital | `General Category Name` | `Specific Category Name`, `Category Number` | `Features [Single-subject project]`, number `05A` |
| 2017–2020 digital | `General Category Name` | `Category Number` | `Story Page Design – News Features or Planned Coverage` |
| Archive and World's Best | `General Category Name` | `Category Number` | `Graphics: Features and planned coverage`, number `8` |
| 2022–2023 | `Parent Category` | `Category` | Free text copied out of Award Force, still coded (`1i. Sports`) |
| Print SND42–46 | `Parent category` | `Category` | `Category 07 - Illustration` / `7G - Multiple Illustrations` |

The Archive general-category list has 175 choices. They read like `Breaking/Daily News [Planned coverage]`, `Information graphics [Breaking news]`, `Portfolios [Individual]`, `Mobile Experience`, `Tablet magazine`, `Redesign`.

Call-for-entries tables (category rules, not winning entries) use plain subject words with no code: `Investigative`, `Main front`, `Cartography`, `Photo Story Design (Single Date)`, `Special Topic: Olympics`. There are 35 of those on the SND46 call-for-entries sheet.

### Platform, coarse and specific

`Platform` is the short label. `Platform - all` is the format, and it overlaps subcategory.

SND47 `Platform`: `Print`, `Digital`, `Social`, `Multiplatform`, `Commissioned Illustration`, `In-house Illustration`.

SND47 `Platform - all`: `Digital: Single URL`, `Digital: Multiple URLs`, `Print: Single page`, `Print: Multiple pages`, `Social: Single URL`, `Social: Multiple URLs`, `Multiplatform`, `Commissioned: Single illustration`, `Commissioned: Multiple illustrations`, `In-house: Single illustration`, `In-house: Multiple illustrations`, plus two one-off labels `LaPresse: Single URL` and `LaPresse: Multiple URL`.

SND46 `Platform` is only `Print`, `Digital`, `Combo`. Its `Platform - all` mixes format with judging bins: `Cover`, `Inside page`, `Multi-page story`, `Commissioned (freelancer)`, `Original`.

The page collapses these to Print, Digital, Social, Multiplatform, and Other. `Combo` becomes multiplatform. Illustration-source labels become Other unless the category text says otherwise.

### Awards, and the messy tag cell

`Award` is the honor. It is a multi-select on 2024–2025 and a single select or a plain word on older sheets.

Shared medal vocabulary:

`Award of Excellence`, `Bronze`, `Silver`, `Gold`, `Best in Show`, `World's Best Designed`, `World's Best Designed Finalist`, `World's Best Designer`, `World's Best Emerging Designer`

On the 1,669 SND47 results rows today: 1,298 Award of Excellence, 268 Bronze, 72 Silver, 24 Gold, 7 World's Best Designed Finalist, 2 World's Best Designed. Two rows carry both a World's Best Designed honor and the Finalist honor. Best in Show, World's Best Designer, and World's Best Emerging Designer are choices on the field and are unused on this sheet.

Older cells glue honors together. 2010 `Award` includes `JSR (Overall)` and `Gold & Best in Show` as single strings. Archive uses `Judge's Special Recognition` and `World's Best-Designed™` (with the trademark).

`Tags` is a second multi-select. It mixes real honors with judging scratch:

- Honors and formats: `AOE`, `Gold`, `Silver`, `Bronze`, `Print`, `Digital`, `Cover`, `Inside page`
- Scratch: `medal-discussion`, `Out`, `Rejected`, `Duplicate`, `test`, `Round2-EntriesB`, `AF TEST`, and strings like `Michael-conflict, digital Bronze` on the 2022 sheet

The loader keeps the honor words and drops the scratch. A designer filter should use `Award`, not `Tags`.

### World's Best is its own phrase, not just a medal

On the Archive and the World's Best Winners and Finalists table, `World’s Best Designed™` is a single select, separate from `Award`:

- `Winner: Digital News Experience`
- `Finalist: Digital News Experience`
- `Runner Up: Digital News Experience`
- `Winner: Designer`

59 rows on the World's Best table have one of those set. `Award` on that table is always `World's Best-Designed™`. The 2022 digital sheet stores the same four phrases in a field called `Label` (plus a stray `Reuters` choice).

SND47 also has yes/no flags for the capstone round. Filled counts on 1,669 rows:

| Flag | Checked |
| --- | --- |
| WBED eligible | 16 |
| WBED nominated | 4 |
| WBD eligible | 0 |
| WBD nominated | 3 |
| BIS micro/small nominated | 1 |
| BIS medium/large nominated | 7 |

WBED is World's Best Emerging Designer. WBD is World's Best Designer. BIS is Best in Show. The vote-count columns next to these flags are judging math.

### Judges' text

Three shapes, all prose:

| Column | Where | Shape |
| --- | --- | --- |
| `Medal Notes` | Print tables and SND46/SND47 results | Rich text. A paragraph of what the judges said. 363 of 1,669 SND47 cells are non-empty, and some of those are only a blank line |
| `Judges Comments` | Digital 2022 and 2023 | Same idea, single-line text |
| `Citation` | Archive, and World's Best Winners and Finalists | Rich text. Often a markdown title that is also a link, then one or more paragraphs. 1 of 3,552 Archive rows has one. The World's Best table is where these citations actually live |

A medal note reads like a paraphrase: what the judges loved, how the piece behaved, a short quote. A World's Best citation reads like a short essay and starts with a linked title, for example a heading pointing at `https://pudding.cool/` followed by a paragraph. Award Force calls the entrant's own text `Descrip` and the World's Best essay `World's Best description`.

The page shows one block: entrant text if it exists, otherwise this citation. The two texts are different jobs. `Descrip` is the newsroom's description. Medal notes and citations are the jury.

### Links

URL columns are article, app, or social addresses. They are plain `https` strings. A few older `Entry` or `Headline` cells are a markdown link, `[title](https://…)`, instead of a bare title.

How many link slots the sheet has:

| Sheet | Link columns |
| --- | --- |
| Digital 2010–2021, Archive | One `URL` |
| Print SND42–45, digital 2022–2023 | `URL 1` through `URL 5` |
| SND46 | Nine links (`URL 1 Link` … `URL 9 link`) |
| SND47 | `L: Digital URL 1`–`19` and `L: Social URL 1`–`8` |

SND47 examples: a nytimes.com interactive, a reuters.com graphics page, a tiktok.com video. Most rows use the first slot. The rest of the slots are empty until the entry is a package or a portfolio.

Columns named `URL1`, `Digital URL 1`, or `Open URL` with type button are Airtable buttons that open the matching link. They are not a second copy of the address.

`Preview Image` on SND47 is one URL, separate from the attachment gallery.

`URL Links` on the 2023 digital sheet is a multiline dump of several addresses in one cell.

### Pictures

| Column | What the files are |
| --- | --- |
| `Attachment`, `Attachments`, `Screenshots` | The work. PDFs and images. Each file has a filename, a media type, a full URL, and thumbnail URLs. Airtable URLs expire in about two hours. The archive stores the preview and serves `/media/{id}/{index}` |
| `Entry` on SND42 | The work again, stored as attachments instead of a title. The title is `Headline` |
| `Social Cards` | Share images made for results posts. Same attachment shape. Not the entry |
| `Award Certificate` | The certificate image. Same attachment shape. Not the entry |
| `Attachment 1 (print)`, `Attachment (gif/mp4)`, `Attachment multiple` | Older print sheets. Sometimes a real attachment, sometimes a text note or a file id |

Award Force's file export is a download list, not a picture that lasts. Columns: `Original file name`, `Download URL`, `File size` (for example `1.2 MiB`), `File type` (for example `image/png`), `Duration`, `ID`, `Entry`, `Slug`, `Entry ID`, `Category shortcode`, `Category`, `Contest`, plus `User ID`, `Entrant`, and `Email`. The download URL expires about 48 hours after the export is generated. The loader keeps the file name, type, size, and locator, and drops the entrant identity columns.

### Credits

`Credits` is one text cell, not a table of people.

Patterns that show up:

- `Carl Godfrey, Illustrator; Lynne Tuttle, Art Director; …`
- `Marcus Yam, Photographer; Betty Chavarria, designer; Kelli Sullivan, Director of News Design`
- `Nicole Rifkin (illustrator)`
- `Design Team NRC`
- `Ashley Wu; Doug Mills; Junho Lee` — names with no roles
- A bio sentence on a portfolio row, rather than a credit line

Roles are free text: Illustrator, Art Director, Photography Director, data journalist and cartographer. Ampersands sometimes arrive as `&amp;`. The page splits on semicolons into name and role. Parentheses and missing roles need a design decision if credits become their own list.

2010–2018 digital sheets have `First Name` / `Last Name` (or `First Name1` / `Last Name1`) instead of a credit line: one person, two cells. 2018's name and country columns exist and are empty on the rows checked (0 of 450 have a country). 2010 has a country on 4 rows and a first name on 63.

### Country, organization size, emerging designer

These three are on the Award Force workbook and on the submission record. They are sparse in Airtable.

| Column | Kind of value |
| --- | --- |
| `Country` / `Country2` | A country name. Present as a column on 2010–2018 digital tables. Almost unused in 2018 |
| `Org size` | Award Force text. Not a column on the Airtable results sheets |
| `Emerging designer` | Award Force checkbox. The Airtable equivalent is the WBED eligible / nominated flags, not this column |

### Status checkboxes on the results sheets

`Published` and `Social Pubbed` are checkboxes: whether someone posted the result or the social card. `Publish` on SND43/SND44 is the same idea. They describe the results workflow. SND47 rows in the sample were checked.

`Champion?` on the medal-discussion tables is a judging checkbox.

### Category rules, on the call-for-entries sheets

These describe a category, not a winning entry. 124 rows on the SND46 call-for-entries sheet in Digital results. A sibling sheet exists on the print base.

| Column | Example |
| --- | --- |
| Category Name | `2i. Investigative` |
| Parent Category | `2. Infographics` |
| Subcategory | `Investigative` |
| Description | `For combination entries, enter one URL and one PDF` |
| Platforms Accepted | `Digital: Single URL`, `Print: Inside Page`, `Digital and Print Combination` |
| Eligible Organizations | `Newsroom`, `Student`, `Non-Editorial` |
| Fee Level | `Single URL or PDF` or `Multiple URL or PDF` |
| Single Asset Fee / Multiple Asset Fee | The same platform phrases, used as the fee tier |

`Entered`, `Accepted`, and `Resubmission` on the SND47 categories table are counts of how judging went, not copy.

## Column inventory by source

Repeated URL slots, Airtable buttons, and "from Print" lookups are listed once. A lookup column repeats a print-table value onto a digital row. A button opens a link. A formula, count, or rollup is a number or percent computed inside Airtable.

### SND Results — winning entries

[SND47 Results](https://airtable.com/app8n3TfYp3wHG3Ht/tbliZsmF6Ue2kansN) (1,669 rows) is the richest sheet. SND46 Results on this base has the shorter 2024 set.

| Column | Type | Kind of data |
| --- | --- | --- |
| Entry ID | number | Contest entry number |
| Name | long text | Headline. On a portfolio, a person's name |
| Company Publication | single select | Organization |
| Publication | single select | Masthead or desk |
| Publication Size | single select | Micro, Small, Medium, Large, NA |
| Parent category | single select | Section, `1. Story Page Design` through `11. World's Best Designed` |
| Category | single select | Coded subject, `1m. Arts & Entertainment` |
| Subcategory | single select | Coded format, `6a. Print: Single page` |
| Award | multi select | Honors, zero or more |
| Tags | multi select | Honors mixed with judging scratch |
| Platform | single select | Print, Digital, Social, Multiplatform, or an illustration source |
| Platform - all | single select | Format phrase, `Digital: Single URL` |
| Credits | long text | `Name, Role; Name, Role`, or a bio |
| Attachment | attachments | Work files |
| Attachment Link | url | A link to the work file |
| L: Digital URL 1–19 | url | Article or interactive links |
| L: Social URL 1–8 | url | Social posts |
| Medal Notes | rich text | Judges' paragraph |
| Social Cards | attachments | Share images |
| Award Certificate | attachments | Certificate |
| Preview Image | url | One preview address |
| Published | checkbox | Results have been posted |
| WBED eligible, WBED nominated, WBD eligible, WBD nominated | checkbox | Capstone eligibility and nomination |
| BIS micro/small nominated, BIS medium/large nominated | checkbox | Best in Show nomination by size |

SND46 Results on this base has Entry, Entry ID, Publication, Company Publication, Parent category, Category, Award, Tags, Platform, Platform - all, Credits, Attachment, URL 1 Link–URL 9 link, Medal Notes, Social Cards, Published. It has no publication size, subcategory, social URL split, or capstone flags. `Entry` is the title.

The same base also has SND47 Medal Discussions (a working copy: same content columns, plus `Champion?`), SND47 categories, SND47 dashboard, SND47 capstone voting, and SND47 capstone admin. Those are judging operations. Content-shaped columns on the medal-discussion copy repeat the results sheet. The rest are vote links, voter counts, percentages, judging day, table, location, and status.

Scratch tables `zzTestResults`, `zzTestCategories`, and `zzTestPubs` repeat the results columns for API tests. The loader skips them.

### Digital results — 2010 through 2023

[Digital results](https://airtable.com/app90oaiea9w9Ifs0). Year tables, plus Archive (3,552 rows) and World's Best Winners and Finalists.

2010–2016, one table per year:

| Column | Type | Kind of data |
| --- | --- | --- |
| Publication | long text | Newsroom |
| General Category Name | single select | Subject bucket, often `Topic [coverage type]` |
| Specific Category Name | long text | Narrower category |
| Category Number | single select | A code such as `05A` or `8` |
| Award | single select | A medal, or a combined string such as `Gold & Best in Show` |
| Entry | rich text | Title, or a markdown link |
| Headline | long text | Title. Sometimes a citation sentence instead |
| URL | long text | One link, sometimes more than one address in the cell |
| First Name1 | single select | One given name |
| Last Name1 | text | One family name |
| Country2 | long text | Country. Rarely filled |
| A column named with the year, such as `2010` | text | The season year again |

2017–2018 drop the year-named column and rename name/country to `First Name`, `Last Name`, `Country`, and add `Work published in` (the four-digit year). 2019–2020 drop the name and country columns. `Award` is free text until 2020, then a select. 2021 adds `Label` (the World's Best phrase) and `Attachments`.

2022:

| Column | Type | Kind of data |
| --- | --- | --- |
| Company Publication, Entry, Entry ID | text | Organization, title, contest id |
| Parent Category, Category | text | Coded section and subject |
| Tags | single select | Honor, sometimes with a conflict note glued on |
| URL 1–URL 5 | text | Links |
| Credits | text | Credit line |
| Screenshots, Attachments | attachments | Work files |
| Judges Comments | text | Judges' prose |
| Published | checkbox | Posted |
| Label | single select | World's Best phrase |

2023 (SND45) uses the same columns, with selects for publication and tags, plus Social Cards, Social Pubbed, a single `URL`, a multiline `URL Links`, and a link to the matching print row. The `… (from Print)` columns are lookups of that print row.

Archive and World's Best Winners and Finalists share one layout: Publication, General Category Name, Category Number, Award, Entry, Headline, URL, Work published in, `World’s Best Designed™`, Attachments, Citation. Types and examples are in the sections above.

Publication rollup tables (`2019 Publications`, `2020 Publications`, `2021 Publications`, `2023 Publications`) are one row per newsroom with medal counts. They are not entries. `TEST AwardForce API` is a scratch copy of the 2023 layout.

### Best of Print News Design — SND42 through SND46

[Best of Print News Design](https://airtable.com/appiN89fFgbchQOjp). SND42 is 944 rows.

| Years | Content columns |
| --- | --- |
| SND42 (2020) | Publication and Parent category as text. Headline. Entry as attachments. Category and Award as selects. Credits. URL 1–URL 5 as text. Medal Notes |
| SND43–44 | Entry as text, Entry ID as a number, Parent category, Category, Award, Publication, Company publication, Credits, URL 1–5, print attachment columns (one real attachment field and several text fields), Medal Notes, Publish checkbox |
| SND45 | Entry, Entry ID, Company Publication, Parent category, Category, Award, Credits, Attachment, URL 1–5 as real URLs, Medal Notes, Social Cards, Published, Social Pubbed |
| SND46 Results | The 2024 set: Entry, Entry ID, Publication, Company Publication, Parent category, Category, Platform, Platform - all, Award, Tags, Credits, Attachment, URL 1–9, Medal Notes, Social Cards, Published, Social Pubbed |

SND46 medal discussions repeat that content set and add `Champion?` and a hidden entry name. SND46 Call for Entries matches the category-rules columns above.

### Award Force workbook

One row per submission. The loader reads these:

| Column | Kind of data | Lands on the entry as |
| --- | --- | --- |
| Entry ID, or ID | Contest entry number | The archive id, prefixed |
| Entry | Title | Title |
| Season | Four-digit year | Year |
| Contest | `SND46`, `SND47` | Kept on the submission only |
| Publication | Masthead | Publication |
| Company publication | Organization | Publication, only when Publication is empty |
| Parent category | Section | Category, discipline, student, non-editorial |
| Category | Subject or format, depending on year | Category and subcategory |
| Platform | Print, Digital, and similar | Platform |
| Print options | A format phrase | Subcategory and platform, when the category is not already a format |
| Tags | Comma-separated words: `Print, Cover, AOE` | Awards. Format words in this cell are ignored |
| Descrip | Entrant's description | Description |
| World's Best description | Jury essay | Citation |
| Credits | `Name, Role; Name` | Credits |
| Country | Country name | Submission only |
| Org size | Organization size | Submission only |
| Emerging designer | Checkbox | Submission only |
| Student or school publication | Checkbox | Student flag |
| Entry status | `Submitted`, `In progress`, and similar | Gate. Only submitted rows can publish |
| Moderation status | `approved`, `undecided`, `rejected` | Gate. Only approved rows can publish |
| URL, URL 1, and any other column whose name contains "url" | Public link | URL and link assets |
| Columns whose names contain attachment, preview, or start with pdf | An Award Force file id, not a URL | File locator |

The workbook also carries entrant contact and paywall fields. The loader drops them and they are not archive fields: email, alternate email, mobile, phone, address, city and postal code, first name, last name, user id, entrant, pay mode, and any column whose name contains password, paywall, or instruction. Any other column in a future export is ignored until the loader is taught its name. A workbook dropped into the repo would extend this list with those headers.

### Award Force file CSV

`Original file name` (filename), `Download URL` (expiring link), `File size`, `File type`, `Duration` (video length, often blank), `ID` (file id), `Entry` (title), `Slug`, `Entry ID`, `Category shortcode`, `Category`, `Contest`. `User ID`, `Entrant`, and `Email` are on the export and are dropped.

### CSV mock and the database

`data/entries.csv` is hand-written sample copy for the UI. Its columns are the entry fields: id, title, publication, year, award, category, subcategory, discipline, platform, topic, description, url, thumbnail, images, credits, student, non_editorial, multi_winner, access. Credits in the file are `Name|Role; Name|Role`. Images are paths under `static/`.

Postgres and SQLite store that same entry, plus `source` and `source_key`. `source_submissions` stores the mapped submission (no contact fields). `source_assets` stores each link or file locator: kind, label, filename, media type, size, locator, and how many hours the locator stays valid. `entry_media` stores the preview bytes.

## Columns to leave out of the public archive

People, committee, and logistics tables hold names, email addresses, phone numbers, dietary notes, travel, hotel, and judging assignments. Tables: Competition Committee, SND45 Logistics, SND46 people. The loader refuses them.

Judging operations are counts, schedules, and tools, not the work: audit/judging sheets, dashboards, capstone voting, medal-discussion working copies, publication rollups, `Fillout link`, `Update record`, and every formula, count, rollup, and linked-record field that exists to total medals. `Tags` values such as `Out`, `Rejected`, `Duplicate`, and `test` are the same kind of scratch.

Social cards and award certificates are results-marketing files. The work image is the attachment or screenshot field.
