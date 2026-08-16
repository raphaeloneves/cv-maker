# Feature: Profile Photo Upload, Crop & Rotate

## Summary

An optional photo upload control on the Personal Information step, entered via a square "Adicionar foto" ("Add photo") placeholder tile. Clicking it opens a lightweight in-page dialog (not a full-screen page, not the browser's native file picker alone) that lets the user drag-and-drop or click-to-browse an image, then crop, zoom, and rotate it before committing it as their CV photo.

## Why this feature exists

A photo humanizes a CV and is expected on many European/LatAm CVs (it is explicitly discouraged in others, e.g. much of the US market — see the opportunity note in `01-personal-information.md`). Whatever the market norms, once a user decides to add a photo, raw uploaded photos are almost never framed correctly for a small CV headshot slot — they need cropping and often rotating (phone photos with incorrect EXIF orientation are extremely common). Doing this in-product, instead of asking the user to pre-crop the image themselves in another app, removes a real point of drop-off.

## Observed behavior

1. The placeholder tile shows a camera icon and the label "Adicionar foto."
2. Clicking it opens a modal dialog (dimmed backdrop, centered card, "×" close control) containing:
   - A dashed drop-zone with a person-silhouette icon and the text **"Clique ou arraste a sua foto para aqui, para enviar."** ("Click or drag your photo here, to upload.") and a caption listing accepted file extensions: **"(extensions: jpg, jpeg, png)."**
   - The drop-zone is backed by a real (initially hidden) `<input type="file">` element — it is not a fake control, so both click-to-browse and drag-and-drop work.
3. Once a file is selected/dropped, the dialog transitions in place to a **crop/zoom/rotate editor**: the uploaded image fills a preview frame, and three controls appear along the bottom: a **"Zoom"** slider, a **"Rodar"** ("Rotate") button, and a **"Repor"** ("Reset") button, plus a **"Guardar"** ("Save") button that is disabled/greyed out until an image has been loaded.
4. Clicking "Guardar" closes the dialog and replaces the placeholder tile with the cropped photo thumbnail.

## Functional requirements (Gherkin)

```gherkin
Feature: Profile photo upload, crop and rotate
  As a user building my CV
  I want to upload a photo and adjust its framing
  So that my CV shows a well-cropped headshot without needing external editing tools

  Background:
    Given I am on the "Personal Information" step of the CV builder

  Scenario: Opening the photo dialog
    When I click the "Add photo" placeholder tile
    Then a dialog opens showing a drop-zone with the instructions
      "Click or drag your photo here, to upload"
    And the dialog states the accepted file extensions: jpg, jpeg, png
    And a close ("×") control is available to dismiss the dialog without changes

  Scenario: Uploading via click-to-browse
    Given the photo dialog is open
    When I click the drop-zone
    Then my operating system's native file picker opens
    When I select a valid jpg/jpeg/png file
    Then the dialog transitions to the crop/zoom/rotate editor showing my image

  Scenario: Uploading via drag-and-drop
    Given the photo dialog is open
    When I drag a valid jpg/jpeg/png file from my desktop and drop it on the drop-zone
    Then the dialog transitions to the crop/zoom/rotate editor showing my image

  Scenario: Rejecting an unsupported file type
    Given the photo dialog is open
    When I attempt to upload a file that is not jpg, jpeg, or png (e.g. a .pdf or .gif)
    Then the upload is rejected
    And I remain on the drop-zone view with an indication of the accepted formats

  Scenario: Adjusting zoom
    Given I have uploaded an image and the crop editor is showing
    When I move the "Zoom" slider
    Then the image scales larger or smaller within the fixed crop frame in real time

  Scenario: Rotating the image
    Given I have uploaded an image and the crop editor is showing
    When I click "Rotate" one or more times
    Then the image rotates (in fixed increments, e.g. 90°) within the crop frame

  Scenario: Resetting adjustments
    Given I have zoomed and/or rotated the uploaded image
    When I click "Reset"
    Then zoom and rotation return to their original/default state
    And the originally uploaded image (pre-adjustment) remains loaded — I do not need to re-upload

  Scenario: Saving the cropped photo
    Given I have uploaded and optionally adjusted an image
    When I click "Save"
    Then the dialog closes
    And the "Add photo" placeholder on the Personal Information step is replaced by
      a thumbnail of my cropped photo
    And the photo is included when the CV is rendered/exported (in templates that show a photo)

  Scenario: Save is unavailable before an image is loaded
    Given the photo dialog is open and showing only the empty drop-zone
    Then the "Save" control is disabled or not present

  Scenario: Replacing an existing photo
    Given I have already saved a photo
    When I click the photo thumbnail again
    Then the same dialog opens, allowing me to upload a different image or
      re-adjust the existing one

  Scenario: Removing a photo entirely
    Given I have already saved a photo
    When I choose to remove it
    Then the tile reverts to the empty "Add photo" placeholder
    And no photo is included when the CV is rendered/exported
```

## Nuances and edge cases to design for

- **The dialog is a single reusable component with two internal states** (empty drop-zone vs. loaded crop-editor), not two separate dialogs — implement it as one modal that swaps its inner content based on whether a file is loaded, so "Reset" and re-selecting a file both feel instantaneous rather than re-opening anything.
- **Client-side crop, not server round-trip per adjustment.** Zoom/rotate/crop-frame-position should all be manipulated live in the browser (e.g., via canvas) and only the final cropped result needs to be produced (as a data URL or blob) when "Save" is clicked. Do not send an image to a server on every slider movement.
- **File-type restriction is enforced client-side at the input level** (jpg/jpeg/png only) — no PDF, GIF, WebP, HEIC, etc. Given phones increasingly capture HEIC by default, we should decide explicitly whether to support HEIC→JPEG conversion client-side or clearly document the limitation, since silently rejecting a HEIC photo with no explanation is a common source of user confusion this reference product doesn't seem to solve either (an opportunity, see below).
- **"Removing a photo" was not directly observed in this walkthrough** (the reference product's control for this wasn't explicitly tested) — it's included above as a reasonable inferred requirement (a well-formed feature must let users undo an optional field), and should be verified/adjusted once we have direct access to that specific control's exact placement (likely a small "×" on the thumbnail itself, or inside the same dialog).

## Opportunities (where we should improve on the reference)

1. **Support HEIC uploads with automatic client-side conversion to JPEG**, given how common HEIC is as the default capture format on iPhones — silently failing on it (if that's indeed the reference product's behavior) is a real drop-off point.
2. **Add an explicit, visible "Remove photo" action** distinct from re-opening the crop dialog, so users don't have to figure out whether re-uploading-then-cancelling is the way to clear a photo.
3. **Show a max file-size hint and client-side size validation** before upload (not observed/tested in the reference walkthrough) to avoid a large phone-camera photo silently bloating the saved CV data or failing at export.
