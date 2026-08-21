# Front Matter Schema

Every published post should use consistent metadata so the site can stay simple in
storage while remaining strong in taxonomy and presentation.

## Required fields

- `title`
- `date`
- `category`
- `subcategories`
- `tags`
- `type`
- `summary`
- `featured`

## Optional fields

- `series`
- `last_modified_at`
- `toc`
- `image`
- `draft`
- `pin`

## Rules

- `category` must contain exactly one primary category.
- `subcategories` should contain 1 to 3 controlled values.
- `tags` should stay useful and reusable rather than noisy.
- `type` should describe content value, not topic area.
- `summary` should be short, concrete, and readable.
- `featured` must be a boolean.
- `pin` should be used sparingly for the strongest identity-defining posts.
- `last_modified_at` should record a meaningful content update using the same timestamp format as `date`; do not change it for trivial formatting edits.

## Preferred starting categories

- `homelab`
- `automation`
- `cybersecurity`
- `reverse-engineering`
- `infrastructure`
- `systems`

## Preferred starting types

- `project-story`
- `technical-breakdown`
- `lesson-learned`
- `experiment-log`
- `case-study`
