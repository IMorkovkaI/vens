# Vensight UI system

Source: https://www.figma.com/design/wOXLGgu5YyhEwYI2pfYyHM/?node-id=211-1582

## Foundations

UKO dashboard `211:1582`: primary #2940D3, page #F0F0F0, surface #FFFFFF, text #3A3C40, muted #82868C, borders #E3E6EB; accent/status source colors #2CC5BD and #FFD54F. Card radius 8px; layout gap 24px; card shadow 0 7px 20px rgba(40,41,61,0.08).

Button `3610:44712`: 46px high, 4px radius, 20px horizontal padding, 13px semibold. Input `3576:42306`: 46px high, 8px radius, #82868C border, 13px text.

Typography uses locally hosted Geist in place of the source's Montserrat. The scale is 12px labels, 13px controls, 14px/21px body, 18px section titles, 21px subheadings, and 28px page titles. Weights 400 and 600; letter spacing zero. No italics, gradients, or viewport-scaled typography.

## Components and Layout

Public pages use horizontal navigation. Authenticated workspace routes use the UKO sidebar pattern with role-aware links, a compact toolbar, and responsive mobile disclosure. Sidebar width 240px corresponds to the source's navigation section; the separate 80px icon rail is omitted for Vensight's smaller route set.

Cards are for individual company profiles and framed forms/tools. Sections and prose remain unframed. Lists use rules, spacing, and aligned actions. Forms and statuses share one vocabulary. Use responsive content grids rather than fixed Figma positioning.

## Adaptations

- Source Grey/500 is used for small secondary text to meet contrast requirements.
- Visible focus outlines and adequate target sizes extend the kit for accessibility.
- Hover underlines/shadows and 150ms transitions communicate interaction; reduced-motion disables transitions.
- Menu (30px) and search (40px) icons are local exports from navigation `3631:44625` and sidebar `3631:44571`.
- Approved brand mark: white Geist semibold V on #2940D3, 41px square with 8px radius. The same artwork is used for the UI logo and browser favicon; there is no remaining golden brand exception. Asset provenance is in `public/brand/README.md`.
- Actual directory content replaces sample charts and fabricated profile scores. No API or data model changes are part of the redesign.

## Release

The approved UKO system replaces the old frontend across existing production URLs. Temporary preview routes and review artifacts have been removed. This frontend change requires no Supabase migration; the API remains on Northflank.
