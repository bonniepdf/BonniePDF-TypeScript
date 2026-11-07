# Missing photography

Six examples need photographs that the asset folder does not contain yet. Each one renders now without them, but it looks unfinished. This file lists every photo they need, where to save it, its size, and a prompt for an image generator.

All the documents are fictional samples. Generated photos are fine here, as long as no image shows a real person, a real address, a brand or legible text.

## How to deliver them

- **Format.** JPEG, sRGB, quality around 80. Keep each file under 400 KB; the examples run in the browser playground, so file size matters.
- **Size.** Use the pixel size given. If the generator produces a different size, crop to the stated aspect ratio rather than stretching.
- **Location.** Save every file under `examples/assets/images/` in this repository, then copy the same files to `Examples/assets/images/` in BonniePDF-NET. Both libraries render the same documents, so they must use byte-identical files.
- **Provenance.** Add one line per file to `examples/assets/images/CREDITS.md` (for example, `property/hero.jpg: generated with Gemini, 2026-11-05`).
- **Wiring.** The examples will be updated to load the files once they are committed. Until then, nothing references these paths, so adding the files early breaks nothing.

House style for every prompt: _photorealistic, natural daylight, neutral white balance, no people, no text, no logos, no watermarks, shot on a full-frame camera at eye level._

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

## Hospitality pack (new examples)

Two of the five new hospitality documents use photography. The pack is being built now, and both documents fall back to a coloured band until the photos arrive.

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

## Checklist

| Example                           | Photos | Status  |
| --------------------------------- | ------ | ------- |
| `property-particulars`            | 4      | Waiting |
| `inventory-schedule-of-condition` | 5      | Waiting |
| `site-inspection-report`          | 3      | Waiting |
| Restaurant menu (hospitality)     | 1      | Waiting |
| Gift voucher (hospitality)        | 1      | Waiting |
| `multi-column-layouts`            | 2      | Waiting |
| **Total**                         | **16** |         |
