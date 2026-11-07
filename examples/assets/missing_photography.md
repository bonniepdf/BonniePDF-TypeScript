# Missing photography

This file lists the imagery the examples would benefit from and the asset folder does not contain yet. Every example renders without it today, but some look unfinished. Part 1 is photographs and one illustration, each with a size and a prompt for an image generator. Part 2 is vector artwork (SVG): logos, crests, a floor plan, a map and a background pattern.

It was written after a review of the first page of all 116 examples (5 November 2026). Nine already use images: `browser-download`, `tables`, `flags-of-the-world`, `images`, the three annual-report covers, `event-ticket` and `product-photo-gallery`.

All the documents are fictional samples. Generated photos are fine here, as long as no image shows a real person, a real address, a brand or legible text.

## How to deliver them

- **Format.** JPEG, sRGB, quality around 80. Keep each file under 400 KB; the examples run in the browser playground, so file size matters.
- **Size.** Use the pixel size given. If the generator produces a different size, crop to the stated aspect ratio rather than stretching.
- **Location.** Save every file under `examples/assets/images/` in this repository, then copy the same files to `Examples/assets/images/` in BonniePDF-NET. Both libraries render the same documents, so they must use byte-identical files.
- **Provenance.** Add one line per file to `examples/assets/images/CREDITS.md` (for example, `property/hero.jpg: generated with Gemini, 2026-11-05`).
- **Wiring.** The examples will be updated to load the files once they are committed. Until then, nothing references these paths, so adding the files early breaks nothing.

House style for every prompt: _photorealistic, natural daylight, neutral white balance, no people, no text, no logos, no watermarks, shot on a full-frame camera at eye level._

# Part 1: Photographs

## Property particulars (`property-particulars`)

A three-bedroom 1930s semi-detached house in an English town, with a kitchen extension fitted in 2024 and a south-facing garden of about 14 metres. The brochure needs one hero photo and a gallery strip of three.

| File                       | Size              | Use         | Prompt                                                                                                                                                                                                                                                                   |
| -------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `property/hero.jpg`        | 1600 × 1067 (3:2) | Cover photo | Front elevation of a 1930s semi-detached house in a quiet English suburb, red brick lower storey with white render above, bay window, tiled hip roof, block-paved drive for two cars, low front wall and a small lawn, soft late-morning sun, blue sky with light cloud. |
| `property/kitchen.jpg`     | 800 × 600 (4:3)   | Gallery     | Modern kitchen-diner extension in a 1930s house, matt sage-green shaker cabinets, white quartz worktop, oak floor, roof lantern, bifold doors open onto a garden.                                                                                                        |
| `property/living-room.jpg` | 800 × 600 (4:3)   | Gallery     | Rear reception room of a 1930s house, period fireplace with a wood burner, picture rail, soft grey walls, oak floorboards, French doors to the garden.                                                                                                                   |
| `property/garden.jpg`      | 800 × 600 (4:3)   | Gallery     | South-facing rear garden of an English semi-detached house, about 14 metres long, straight lawn, sandstone patio by the house, mixed borders, timber fence, a small shed at the end, summer afternoon light.                                                             |

## Inventory and schedule of condition (`inventory-schedule-of-condition`)

A check-in inventory for a rented flat. One photo per room, shown as a thumbnail beside that room's condition table. The rooms are tidy and unfurnished apart from fitted items, as on a check-in day.

| File                        | Size            | Use            | Prompt                                                                                                                                                                            |
| --------------------------- | --------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inventory/living-room.jpg` | 800 × 600 (4:3) | Room thumbnail | Empty living room in a rented UK flat on check-in day, magnolia walls, beige carpet, white radiator under a uPVC window, ceiling pendant light, wide-angle documentary photo.     |
| `inventory/kitchen.jpg`     | 800 × 600 (4:3) | Room thumbnail | Small fitted kitchen in a rented UK flat, white gloss units, laminate worktop, built-in oven and hob, stainless sink, vinyl floor, clean and empty, wide-angle documentary photo. |
| `inventory/bedroom-1.jpg`   | 800 × 600 (4:3) | Room thumbnail | Empty double bedroom in a rented UK flat, magnolia walls, grey carpet, built-in white wardrobe, radiator under the window, wide-angle documentary photo.                          |
| `inventory/bedroom-2.jpg`   | 800 × 600 (4:3) | Room thumbnail | Small empty single bedroom in a rented UK flat, magnolia walls, grey carpet, window with a roller blind, wide-angle documentary photo.                                            |
| `inventory/bathroom.jpg`    | 800 × 600 (4:3) | Room thumbnail | Bathroom in a rented UK flat, white bath with an over-bath shower and glass screen, white tiles, pedestal basin, chrome towel rail, documentary photo.                            |

## Site inspection report (`site-inspection-report`)

A level 2 snagging walk on a commercial fit-out. The three Critical defects each get a photo beside their entry, as photographic evidence. These should look like phone photos taken by an inspector: close, slightly flat lighting, no staging.

| File                                   | Size            | Use          | Prompt                                                                                                                                                                                                                                            |
| -------------------------------------- | --------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inspection/s-002-cable-tray.jpg`      | 800 × 600 (4:3) | Defect S-002 | Close-up of a galvanised cable tray in a building riser where two tray sections meet at a coupling, the green-and-yellow earth bonding strap missing across the joint, cables in the tray, fluorescent site lighting, documentary snagging photo. |
| `inspection/s-003-penetration.jpg`     | 800 × 600 (4:3) | Defect S-003 | Close-up of three electrical cables passing through a rough hole in a plasterboard corridor wall above a suspended ceiling, the gap around them unsealed with no fire-stopping, documentary snagging photo.                                       |
| `inspection/s-008-emergency-light.jpg` | 800 × 600 (4:3) | Defect S-008 | A white bulkhead emergency light on an office corridor ceiling, switched off and dark, next to a ceiling grid, documentary snagging photo.                                                                                                        |

## Restaurant menu (`restaurant-menu`) and gift voucher (`gift-voucher`)

Two of the five hospitality documents would use photography. Both look finished on a plain dark background today; a photo makes them feel like a real restaurant's.

| File                          | Size                                   | Use                     | Prompt                                                                                                                                                                                                                                            |
| ----------------------------- | -------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hospitality/menu-header.jpg` | 1400 × 560 (5:2)                       | Restaurant menu header  | Overhead view of a rustic wooden table in a modern British bistro, seasonal small plates (roasted root vegetables, a fish dish, sourdough with butter), linen napkin, warm evening light, shallow depth of field, lots of dark wood at the edges. |
| `hospitality/voucher.jpg`     | 1600 × 754 (DL landscape, about 2.1:1) | Gift voucher background | Elegant restaurant dining room at dusk, empty tables laid with white cloths and glassware, warm pendant lights, softly out of focus, dark tones on the left third so white text stays readable.                                                   |

## Multi-column layouts (`multi-column-layouts`)

The newsletter recipe currently uses gradient placeholders. Two photos make it read as a real article.

| File                              | Size             | Use                  | Prompt                                                                                                                                                |
| --------------------------------- | ---------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `newsletter/community-garden.jpg` | 1200 × 800 (3:2) | Lead article photo   | A small urban community garden in an English town in spring, raised timber vegetable beds, a greenhouse, terraced houses behind, overcast soft light. |
| `newsletter/library.jpg`          | 1200 × 800 (3:2) | Second article photo | Interior of a bright modern public library reading room, wooden shelves, large windows, empty tables and chairs, morning light.                       |

## Booking confirmation (`booking-confirmation`)

A travel booking for a trip to Lisbon. A wide destination photo across the top turns it from a form into something a traveller looks forward to.

| File                | Size             | Use           | Prompt                                                                                                                                                                                 |
| ------------------- | ---------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `travel/lisbon.jpg` | 1600 × 640 (5:2) | Header banner | View over the terracotta rooftops of Lisbon's old town towards the river at golden hour, pastel facades, church domes, warm light, clear sky, no vehicles or people in the foreground. |

## Operations review (`headers-footers`)

A quarterly board report for a logistics company, several pages of prose. A cover-style photo above the title gives the first page some weight.

| File                  | Size             | Use         | Prompt                                                                                                                                                                                        |
| --------------------- | ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logistics/depot.jpg` | 1600 × 640 (5:2) | Title image | A modern distribution depot at dawn, a row of plain white unbranded articulated trailers at loading bays, wet tarmac reflecting the sodium lights, overcast sky, wide shot from ground level. |

## Job sheet (`job-sheet`) and reactive work order (`reactive-work-order`)

Field engineers attach photos to their reports. One photo of the asset on the job sheet and one of the fault on the work order make both read as real site documents. Phone-photo style, as for the inspection report.

| File                     | Size            | Use                                    | Prompt                                                                                                                                                                                             |
| ------------------------ | --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `field-service/ahu.jpg`  | 800 × 600 (4:3) | Asset photo, beside the asset details  | A rooftop air handling unit on a commercial building, grey galvanised casing with an access panel open showing a belt-driven fan, ductwork leaving the unit, overcast daylight, documentary photo. |
| `field-service/leak.jpg` | 800 × 600 (4:3) | Fault photo, beside the reported fault | Close-up of a copper water pipe joint above an open ceiling tile in an office, water dripping from the joint onto a stained tile below, torch-lit, documentary maintenance photo.                  |

## Staff handbook (`cross-references`)

A handbook with a contents page that links to its chapters. A cover photo of the office makes the first page a proper cover.

| File                  | Size              | Use         | Prompt                                                                                                                                                                                        |
| --------------------- | ----------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handbook/office.jpg` | 1600 × 900 (16:9) | Cover photo | A bright open-plan office in a converted warehouse, exposed brick, large steel-framed windows, long oak desks with monitors, plants, empty chairs, morning light, no screens showing content. |

## Grant award letter (`grant-award-letter`)

The community fund's decision letter. It can reuse `newsletter/community-garden.jpg` from the multi-column layouts list below as a small image beside "Awarded", so it needs no new file.

## A Tale of Two Cities (`dickens-novel`)

The long-form typesetting example opens with a bare title page. Victorian editions open with an engraved frontispiece, and an illustration in that style shows images flowing in a long book.

| File                      | Size              | Use                                 | Prompt                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ----------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `novels/frontispiece.png` | 1200 × 1600 (3:4) | Frontispiece, facing the title page | Black-and-white steel-engraving illustration in the style of a 19th-century book plate: a narrow cobbled street in 18th-century Paris at dusk, tall leaning houses, a wine shop with a barrel spilled in the street, cross-hatched shading, no figures in the foreground, no text, no signature. PNG, greyscale. |

# Part 2: Vector artwork (SVG)

These are better as SVG than as photos: they stay sharp at any size, cost a few kilobytes, and show the library's SVG support. They are simple enough to draw by hand, so they can be made here rather than generated. If you would rather generate them, ask for SVG code, flat shapes only, no embedded raster images and no text converted from a real font, and save them under `examples/assets/images/svg/`.

## Fictional logos and crests

Most letterheads are plain text today ("Sample Company Ltd"). A small mark beside the name makes them look like real stationery. Each logo should be a simple geometric mark, two colours at most, in the colour the example already uses, readable at 24 points high.

| File                        | Used by                                                                                      | Mark                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `svg/sample-company.svg`    | `business-invoice`, `uk-vat-invoice`, `us-sales-invoice`, `quotation`, `financial-statement` | A rounded square with a stylised "S", slate                |
| `svg/northfield.svg`        | `large-order-invoice`, `headers-footers`, `page-break-control`                               | A compass needle pointing north, violet                    |
| `svg/atlas-homewares.svg`   | `multilingual-customer-letter`                                                               | A globe made of three arcs, teal                           |
| `svg/ardmore-house.svg`     | `guest-folio`, `banquet-event-order`                                                         | A gabled house with a single arched window, deep rose      |
| `svg/the-larder.svg`        | `restaurant-menu`, `allergen-matrix`, `gift-voucher`                                         | A wheat sheaf, amber, for use on a dark background         |
| `svg/sample-coffee.svg`     | `edge-receipt`, `long-basket-receipt`                                                        | A coffee cup in a single black line, for a thermal printer |
| `svg/sample-healthcare.svg` | `outpatient-appointment-letter`, `discharge-summary`, `lab-report`, `patient-summary`        | A cross formed from four rounded squares, teal             |
| `svg/borough-crest.svg`     | `pdf-compliance`, `public-library-membership-letter`                                         | A shield with a castle tower and a wavy river line, teal   |
| `svg/university-crest.svg`  | `uk-degree-transcript`, `course-certificate`                                                 | A shield with an open book and a star, navy and gold       |

## Property floor plan (`property-particulars`)

Estate agents' particulars always include a floor plan. A clean two-floor plan in thin black lines, with room names and dimensions that match the accommodation table in the example (living room, dining room, kitchen-diner extension, three bedrooms, bathroom).

| File                 | Size                              | Use                          |
| -------------------- | --------------------------------- | ---------------------------- |
| `svg/floor-plan.svg` | A4 width, two floors side by side | Last page of the particulars |

## Clinic map (`outpatient-appointment-letter`)

"How to find us": a simplified street map with the hospital, the clinic entrance, the car park and the bus stop marked. Flat colours, no real place names.

| File                 | Size            | Use                            |
| -------------------- | --------------- | ------------------------------ |
| `svg/clinic-map.svg` | 600 × 400 (3:2) | Beside the appointment details |

## Certificate background (`course-certificate`)

A fine guilloche pattern, the interlaced curves on banknotes and diplomas, as a pale full-page background behind the certificate's frame. It makes the certificate harder to imitate and looks the part.

| File                | Size         | Use                                  |
| ------------------- | ------------ | ------------------------------------ |
| `svg/guilloche.svg` | A4 landscape | Page background, at about 8% opacity |

## Examples that need no imagery

Charts, recipes about text, tables, barcodes and security, and most financial and legal documents read best as they are: their content is the point, and a photo would be decoration. That covers the remaining 80 or so examples.

## Checklist

| Example                           | Item                                   | Kind         | Status      |
| --------------------------------- | -------------------------------------- | ------------ | ----------- |
| `property-particulars`            | 4 photos                               | Photo        | Waiting     |
| `inventory-schedule-of-condition` | 5 photos                               | Photo        | Waiting     |
| `site-inspection-report`          | 3 photos                               | Photo        | Waiting     |
| `restaurant-menu`                 | 1 photo                                | Photo        | Waiting     |
| `gift-voucher`                    | 1 photo                                | Photo        | Waiting     |
| `multi-column-layouts`            | 2 photos                               | Photo        | Waiting     |
| `booking-confirmation`            | 1 photo                                | Photo        | Waiting     |
| `headers-footers`                 | 1 photo                                | Photo        | Waiting     |
| `job-sheet`                       | 1 photo                                | Photo        | Waiting     |
| `reactive-work-order`             | 1 photo                                | Photo        | Waiting     |
| `cross-references`                | 1 photo                                | Photo        | Waiting     |
| `grant-award-letter`              | reuses a newsletter photo              | Photo        | Waiting     |
| `dickens-novel`                   | 1 illustration                         | Illustration | Waiting     |
| Letterheads (about 25 examples)   | 9 logos and crests                     | SVG          | Not started |
| `property-particulars`            | floor plan                             | SVG          | Not started |
| `outpatient-appointment-letter`   | clinic map                             | SVG          | Not started |
| `course-certificate`              | guilloche background                   | SVG          | Not started |
| **Total**                         | **22 photos, 1 illustration, 12 SVGs** |              |             |
